export const groups = ['customers','catalog','invoices','payments','cash'];
const total = i => i.items.reduce((sum,x)=>sum+Math.round(x.qty*x.rate),0)-i.discount;
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
// Keep only removed IDs so an offline device cannot resurrect erased record contents.
export function purgeRecord(book, group, id) {
  if (!groups.includes(group)) throw new Error('Invalid record type.');
  const record = book[group].find(row => row.id === id);
  if (!record?.deleted) throw new Error('Only records in the Recycle Bin can be permanently deleted.');
  if (group === 'customers' && [...book.invoices,...book.payments].some(row => row.customerId === id)) throw new Error('Delete this customer’s linked invoices and payments from the Recycle Bin first.');
  const linked = group === 'invoices' ? book.payments.filter(row => row.invoiceId === id) : [];
  if (linked.some(row => !row.deleted)) throw new Error('Move linked payments to the Recycle Bin first.');
  book.purged ||= {};
  const remove = (type, ids) => {
    book.purged[type] = [...new Set([...(book.purged[type] || []),...ids])];
    book[type] = book[type].filter(row => !ids.includes(row.id));
  };
  if (linked.length) remove('payments', linked.map(row => row.id));
  remove(group, [id]);
  return validateBackup({format:'sai-billing-backup',book});
}
// Three-way merge: untouched records follow the server; independent additions survive.
// Concurrent edits to the same record stop instead of silently overwriting either copy.
export function mergeBooks(base, local, remote) {
  const merged = structuredClone(remote);
  if (local.purged || remote.purged) merged.purged = {};
  for (const group of groups) {
    const removed = new Set([...(local.purged?.[group] || []),...(remote.purged?.[group] || [])]);
    if (merged.purged) merged.purged[group] = [...removed];
    const before = new Map((base?.[group] || []).map(row => [row.id,row]));
    const current = new Map(remote[group].filter(row => !removed.has(row.id)).map(row => [row.id,row]));
    for (const row of local[group]) {
      if (removed.has(row.id)) continue;
      const old = before.get(row.id), other = current.get(row.id);
      if (same(row,old) || same(row,other)) continue;
      if (other && !same(other,old)) throw new Error('Sync conflict in '+group+'. Export Backup to keep this device’s records, then resolve the conflicting record.');
      current.set(row.id,structuredClone(row));
    }
    merged[group] = [...current.values()];
  }
  if (!base) {
    if (!groups.some(g=>remote[g].length)) merged.settings = structuredClone(local.settings);
  } else if (!same(local.settings,base.settings)) {
    if (!same(remote.settings,base.settings) && !same(remote.settings,local.settings)) throw new Error('Business settings changed on another device. Export Backup before resolving.');
    merged.settings = structuredClone(local.settings);
  }
  return validateBackup({format:'sai-billing-backup',book:merged});
}
export function validateBackup(data){const b=data.book;if(data.format!=='sai-billing-backup'||b?.version!==1)throw new Error('Select a Sai Billing backup.');const groups=['customers','catalog','invoices','payments','cash'];if(b.purged!==undefined){if(!b.purged||typeof b.purged!=='object'||Array.isArray(b.purged))throw new Error('Invalid permanent deletion records.');for(const [g,ids] of Object.entries(b.purged)){if(!groups.includes(g)||!Array.isArray(ids)||ids.length>50000||ids.some(id=>typeof id!=='string'||!id||id.length>2000)||new Set(ids).size!==ids.length||b[g].some(r=>ids.includes(r.id)))throw new Error('Invalid permanent deletion records.');}}for(const g of groups){if(!Array.isArray(b[g])||b[g].length>50000)throw new Error('Invalid backup entries.');const seen=new Set();for(const r of b[g]){if(!r||typeof r.id!=='string'||!r.id||seen.has(r.id))throw new Error('Invalid or duplicate record ID.');seen.add(r.id);if(r.deleted!==undefined&&typeof r.deleted!=='boolean')throw new Error('Invalid deleted state.');}}const text=v=>typeof v==='string'&&v.length<=2000;const integer=v=>Number.isSafeInteger(v)&&v>=0&&v<=1e14;const date=v=>text(v)&&/^\d{4}-\d{2}-\d{2}$/.test(v);for(const c of b.customers)if(!text(c.name)||!c.name.trim()||!text(c.phone)||!text(c.address))throw new Error('Invalid customer.');for(const c of b.catalog)if(!text(c.name)||!text(c.unit)||!integer(c.rate))throw new Error('Invalid catalog record.');for(const i of b.invoices){if(!['draft','issued','quotation'].includes(i.status)||!text(i.number)||!text(i.customerId)||!date(i.date)||!text(i.createdAt)||!text(i.note)||!text(i.customer?.name)||!text(i.customer?.phone)||!text(i.customer?.address)||!integer(i.discount)||!Array.isArray(i.items)||!i.items.length||i.items.length>500)throw new Error('Invalid invoice.');for(const x of i.items)if(!text(x.name)||!text(x.unit)||!Number.isFinite(x.qty)||x.qty<=0||x.qty>1e6||!integer(x.rate))throw new Error('Invalid invoice item.');if(total(i)<0)throw new Error('Invalid invoice discount.');if(i.customerId&&!b.customers.some(c=>c.id===i.customerId))throw new Error('Invoice customer missing.');}
    for(const p of [...b.payments,...b.cash])if(!integer(p.amount)||!p.amount||!date(p.date)||!['Cash','UPI','Bank','Card'].includes(p.method)||!text(p.note))throw new Error('Invalid payment or cash entry.');for(const c of b.cash)if(!['income','expense'].includes(c.type))throw new Error('Invalid cash entry type.');for(const p of b.payments)if(!text(p.customerId)||!text(p.invoiceId)||(p.customerId&&!b.customers.some(c=>c.id===p.customerId))||(p.invoiceId&&!b.invoices.some(i=>i.id===p.invoiceId&&i.customerId===p.customerId)))throw new Error('Payment reference missing.');for(const i of b.invoices){const receipts=b.payments.filter(p=>p.invoiceId===i.id&&!p.deleted);if(receipts.length&&(i.deleted||i.status!=='issued'))throw new Error('Payment belongs to an inactive invoice.');if(receipts.reduce((s,p)=>s+p.amount,0)>total(i))throw new Error('Invoice payments exceed its total.');}for(const k of ['name','phone','address','note'])if(!text(b.settings?.[k]))throw new Error('Invalid settings.');return b;}
