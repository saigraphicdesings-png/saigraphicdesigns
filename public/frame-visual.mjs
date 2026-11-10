const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function frameVisual(product,source=product.image){
 const image=`<img src="${escape(source)}" alt="${escape(product.name||'Frame mockup preview')}" loading="lazy">`;
 if(product.productImage)return image.replace('<img ','<img class="catalog-product-photo" ');
 const colour=/^#[a-f0-9]{6}$/i.test(product.color||'')?product.color:'#b18a5b';
 return `<span class="frame-preview" style="--frame-color:${colour}">${image}</span>`;
}
