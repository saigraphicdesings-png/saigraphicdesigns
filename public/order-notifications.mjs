// One notification per order, updated whenever its latest status or delivery details change.
export function orderNotifications(orders){
 return orders.map(order=>{
  const history=Array.isArray(order.history)?order.history:[],latest=history.at(-1)||{};
  const when=latest.date||order.date;
  return {key:JSON.stringify([order.id,order.stage,history.length,when,latest.note||order.note||'',order.payment||'',order.tracking||'',order.shippingConfirmed,order.shipping]),orderId:order.id,stage:order.stage,when,note:latest.note||order.note||'Your order has been updated.',payment:order.payment||''};
 }).sort((a,b)=>(Date.parse(b.when)||0)-(Date.parse(a.when)||0));
}
export function unreadNotifications(items,seen){return items.filter(item=>!seen.has(item.key))}
