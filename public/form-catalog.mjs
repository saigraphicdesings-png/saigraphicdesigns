export const prices = [
['4 × 4',250],['4 × 6',300],['5 × 7',350],['6 × 8',400],['8 × 8',450],['8 × 10',500],
['8 × 12',550,700],['10 × 10',550,750],['10 × 12',600,800],['10 × 15',700,925],
['12 × 12',700,900],['12 × 15',800,1050],['12 × 18',900,1200,1500],['12 × 16',850,1100,1400],
['14 × 18',1050,1350,1700],['16 × 20',1250,1650,2025],['16 × 24',1450,1900,2350],
['18 × 24',1600,2100,2600],['20 × 24',1800,2300,2850],['20 × 30',2150,2800,3450],['24 × 30',2700,3300,4100]
];
export const combos = [
{price:1999,sizes:[['8 × 12',1],['6 × 8',4],['4 × 6',6]]},
{price:2099,sizes:[['4 × 6',14]]},
{price:999,sizes:[['6 × 8',8],['6 × 6',1]]},
{price:1750,sizes:[['8 × 12',1],['6 × 8',4],['4 × 6',4]]},
{price:1050,sizes:[['8 × 12',1],['6 × 8',2],['4 × 6',2]]},
{price:1999,sizes:[['12 × 12',1],['8 × 12',3],['6 × 8',2]]}
];
export function selection(input) {
  const qty=Number(input.qty);
  if(!Number.isInteger(qty)||qty<1||qty>10)throw Error('Choose a quantity from 1 to 10.');
  if(input.type==='Combo'){
    const combo=combos[Number(input.combo)];
    if(!combo)throw Error('Choose a combo.');
    return {id:'form-combo-'+input.combo,name:'Combo '+(Number(input.combo)+1),material:'Combo',finish:'As shown in combo poster',size:combo.sizes.map(([s,n])=>n+' × '+s+' in').join(' · '),qty,price:combo.price};
  }
  if(!['Wooden','PVC'].includes(input.type))throw Error('Choose a frame type.');
  const row=prices.find(r=>r[0]===input.size);
  const index={'1':1,'1.5':2,'2':3}[input.thickness];
  if(!row||!index||!row[index])throw Error('This size and thickness combination is unavailable.');
  if(input.type==='PVC')throw Error('PVC prices are awaiting confirmation. Please choose Wooden or Combo.');
  return {id:'form-wooden',name:'Wooden photo frame',material:'Wooden',finish:input.thickness+' inch',size:row[0]+' in',qty,price:row[index]};
}
