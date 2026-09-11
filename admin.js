(function(){"use strict";
const tokenKey="saiShopAdminToken";let token=sessionStorage.getItem(tokenKey)||"";let products=[];
const builtInProducts=[

        /* =================================================
           PRINTING DESIGNS
        ================================================= */

        {
            id: "business-card-01",
            name: "Premium Business Card 01",
            price: 99,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr"],
            description:
                "Premium business card template suitable for travel agency businesses. Editable CDR file.",
            images: [
                "Images/Shop/business-card-01/3.jpg",
                "Images/Shop/business-card-01/1.jpg",
                "Images/Shop/business-card-01/2.jpg"
            ]
        },

        {
            id: "business-card-02",
            name: "Premium Business Card 02",
            price: 99,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr"],
            description:
                "Modern premium business card template suitable for makeup studio businesses. Editable CDR file.",
            images: [
                "Images/Shop/business-card-02/1.jpg",
                "Images/Shop/business-card-02/2.jpg",
                "Images/Shop/business-card-02/3.jpg"
            ]
        },

        {
            id: "business-card-03",
            name: "Premium Business Card 03",
            price: 99,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr"],
            description:
                "Creative professional business card template suitable for hotel businesses. Editable CDR file.",
            images: [
                "Images/Shop/business-card-03/1.jpg",
                "Images/Shop/business-card-03/2.jpg",
                "Images/Shop/business-card-03/3.jpg"
            ]
        },

        {
            id: "business-card-04",
            name: "Premium Business Card 04",
            price: 99,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr"],
            description:
                "Elegant editable business card template suitable for international travel businesses. Editable CDR file.",
            images: [
                "Images/Shop/business-card-04/1.jpg",
                "Images/Shop/business-card-04/2.jpg",
                "Images/Shop/business-card-04/3.jpg"
            ]
        },

        {
            id: "business-card-05",
            name: "Premium Business Card 05",
            price: 99,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr"],
            description:
                "Free collection of Premium creative business card template suitable for hospital and clinic businesses. Editable CDR file.",
            images: [
                "Images/Shop/business-card-05/1.jpg",
                "Images/Shop/business-card-05/2.jpg",
                "Images/Shop/business-card-05/3.jpg"
            ]
        },

        {
            id: "business-card-Bundle-01",
            name: "4 Business Card Bundle 01",
            price: 0,
            downloadUrl: "https://drive.google.com/file/d/1OR4JnPjFzQgT0BNh1MFFVV21HdG8ybNT/view?usp=sharing",
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr"],
            description:
                "Free collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/business-card-Bundel-01/1.jpg",
                "Images/Shop/business-card-Bundel-01/2.jpg",
                "Images/Shop/business-card-Bundel-01/3.jpg",
                "Images/Shop/business-card-Bundel-01/4.jpg",
                "Images/Shop/business-card-Bundel-01/5.jpg"
            ]
        },

        {
            id: "business-card-Bundle-02",
            name: "4 Business Card Bundle 02",
            price: 0,
            downloadUrl: "https://drive.google.com/file/d/1OR4JnPjFzQgT0BNh1MFFVV21HdG8ybNT/view?usp=sharing",
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr"],
            description:
                "Free collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/business-card-Bundel-02/1.jpg",
                "Images/Shop/business-card-Bundel-02/2.jpg",
                "Images/Shop/business-card-Bundel-02/3.jpg",
                "Images/Shop/business-card-Bundel-02/4.jpg",
                "Images/Shop/business-card-Bundel-02/5.jpg"
            ]
        },

        {
            id: "business-card-Bundle-03",
            name: "4 Business Card Bundle 03",
            price: 0,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr"],
            description:
                "Free collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/business-card-Bundel-03/1.jpg",
                "Images/Shop/business-card-Bundel-03/2.jpg",
                "Images/Shop/business-card-Bundel-03/3.jpg",
                "Images/Shop/business-card-Bundel-03/4.jpg",
                "Images/Shop/business-card-Bundel-03/5.jpg"
            ]
        },

        {
            id: "business-card-Bundle-04",
            name: "4 Business Card Bundle 04",
            price: 0,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr"],
            description:
                "Professional collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/business-card-Bundel-04/1.jpg",
                "Images/Shop/business-card-Bundel-04/2.jpg",
                "Images/Shop/business-card-Bundel-04/3.jpg",
                "Images/Shop/business-card-Bundel-04/4.jpg",
                "Images/Shop/business-card-Bundel-04/5.jpg"
            ]
        },

        {
            id: "letterhead-01",
            name: "Letterhead Template 01",
            price: 0,
            category: "Printing Designs",
            type: "letter-head",
            formats: ["cdr"],
            description:
                "Professional collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/Letter-head-01/1.jpg",
            ]
        },

        {
            id: "letterhead-02",
            name: "Letterhead Template 02",
            price: 0,
            category: "Printing Designs",
            type: "letter-head",
            formats: ["cdr"],
            description:
                "Professional collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/Letter-head-02/1.jpg",
            ]
        },
        {
            id: "letterhead-03",
            name: "Letterhead Template 03",
            price: 0,
            category: "Printing Designs",
            type: "letter-head",
            formats: ["cdr"],
            description:
                "Professional collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/Letter-head-03/1.jpg",
            ]
        },
        {
            id: "letterhead-04",
            name: "Letterhead Template 04",
            price: 0,
            category: "Printing Designs",
            type: "letter-head",
            formats: ["cdr"],
            description:
                "Professional collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/Letter-head-04/1.jpg",
            ]
        },

        {
            id: "letterhead-05",
            name: "Letterhead Template 05",
            price: 0,
            category: "Printing Designs",
            type: "letter-head",
            formats: ["cdr"],
            description:
                "Professional collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/Letter-head-05/1.jpg",
            ]
        },

        /* =================================================
           DIGITAL & SOCIAL MEDIA DESIGNS
        ================================================= */

        {
            id: "social-media-01",
            name: "Premium Social Media Design 01",
            price: 99,
            category: "Digital & Social Media Designs",
            type: "social-media",
            formats: ["psd", "png"],
            description:
                "Premium editable social media poster template for digital marketing.",
            images: [
                "Images/Shop/social-media-01/1.jpg",
                "Images/Shop/social-media-01/2.jpg",
                "Images/Shop/social-media-01/3.jpg",
                "Images/Shop/social-media-01/4.jpg",
                "Images/Shop/social-media-01/5.jpg"
            ]
        },

        {
            id: "social-media-02",
            name: "Premium Social Media Design 02",
            price: 99,
            category: "Digital & Social Media Designs",
            type: "social-media",
            formats: ["psd", "png"],
            description:
                "Creative social media design template for businesses and promotions.",
            images: [
                "Images/Shop/social-media-02/1.jpg",
                "Images/Shop/social-media-02/2.jpg",
                "Images/Shop/social-media-02/3.jpg",
                "Images/Shop/social-media-02/4.jpg",
                "Images/Shop/social-media-02/5.jpg"
            ]
        },

        {
            id: "social-media-03",
            name: "Premium Social Media Design 03",
            price: 99,
            category: "Digital & Social Media Designs",
            type: "social-media",
            formats: ["psd", "png"],
            description:
                "Professional editable social media marketing design.",
            images: [
                "Images/Shop/social-media-03/1.jpg",
                "Images/Shop/social-media-03/2.jpg",
                "Images/Shop/social-media-03/3.jpg",
                "Images/Shop/social-media-03/4.jpg",
                "Images/Shop/social-media-03/5.jpg"
            ]
        },

        {
            id: "social-media-04",
            name: "Premium Social Media Design 04",
            price: 99,
            category: "Digital & Social Media Designs",
            type: "social-media",
            formats: ["psd", "png"],
            description:
                "Modern premium social media poster template.",
            images: [
                "Images/Shop/social-media-04/1.jpg",
                "Images/Shop/social-media-04/2.jpg",
                "Images/Shop/social-media-04/3.jpg",
                "Images/Shop/social-media-04/4.jpg",
                "Images/Shop/social-media-04/5.jpg"
            ]
        },

        {
            id: "social-media-05",
            name: "Premium Social Media Design 05",
            price: 99,
            category: "Digital & Social Media Designs",
            type: "social-media",
            formats: ["psd", "png"],
            description:
                "Premium editable digital marketing design template.",
            images: [
                "Images/Shop/social-media-05/1.jpg",
                "Images/Shop/social-media-05/2.jpg",
                "Images/Shop/social-media-05/3.jpg",
                "Images/Shop/social-media-05/4.jpg",
                "Images/Shop/social-media-05/5.jpg"
            ]
        },


        /* =================================================
           PACKAGING DESIGNS
        ================================================= */

        {
            id: "packaging-01",
            name: "Premium Packaging Design 01",
            price: 250,
            category: "Packaging Designs",
            type: "packaging",
            formats: ["cdr", "png"],
            description:
                "Professional editable packaging template for product branding.",
            images: [
                "Images/Shop/packaging-01/1.jpg",
                "Images/Shop/packaging-01/2.jpg",
                "Images/Shop/packaging-01/3.jpg",
                "Images/Shop/packaging-01/4.jpg",
                "Images/Shop/packaging-01/5.jpg"
            ]
        },

        {
            id: "packaging-02",
            name: "Premium Packaging Design 02",
            price: 250,
            category: "Packaging Designs",
            type: "packaging",
            formats: ["cdr", "png"],
            description:
                "Creative editable packaging design suitable for commercial products.",
            images: [
                "Images/Shop/packaging-02/1.jpg",
                "Images/Shop/packaging-02/2.jpg",
                "Images/Shop/packaging-02/3.jpg",
                "Images/Shop/packaging-02/4.jpg",
                "Images/Shop/packaging-02/5.jpg"
            ]
        },

        {
            id: "packaging-03",
            name: "Premium Packaging Design 03",
            price: 300,
            category: "Packaging Designs",
            type: "packaging",
            formats: ["cdr", "png"],
            description:
                "Premium product packaging template with professional presentation.",
            images: [
                "Images/Shop/packaging-03/1.jpg",
                "Images/Shop/packaging-03/2.jpg",
                "Images/Shop/packaging-03/3.jpg",
                "Images/Shop/packaging-03/4.jpg",
                "Images/Shop/packaging-03/5.jpg"
            ]
        },

        {
            id: "packaging-04",
            name: "Premium Packaging Design 04",
            price: 300,
            category: "Packaging Designs",
            type: "packaging",
            formats: ["cdr", "png"],
            description:
                "Editable premium packaging template for modern brands.",
            images: [
                "Images/Shop/packaging-04/1.jpg",
                "Images/Shop/packaging-04/2.jpg",
                "Images/Shop/packaging-04/3.jpg",
                "Images/Shop/packaging-04/4.jpg",
                "Images/Shop/packaging-04/5.jpg"
            ]
        },

        {
            id: "packaging-05",
            name: "Premium Packaging Design 05",
            price: 500,
            category: "Packaging Designs",
            type: "packaging",
            formats: ["cdr", "png"],
            description:
                "High-quality editable packaging design for premium products.",
            images: [
                "Images/Shop/packaging-05/1.jpg",
                "Images/Shop/packaging-05/2.jpg",
                "Images/Shop/packaging-05/3.jpg",
                "Images/Shop/packaging-05/4.jpg",
                "Images/Shop/packaging-05/5.jpg"
            ]
        }

    ];
const $=id=>document.getElementById(id);
const loginCard=$("loginCard"),dashboard=$("dashboard"),loginForm=$("loginForm"),loginError=$("loginError"),form=$("productForm"),list=$("productList"),message=$("formMessage");
function authHeaders(json){const h={Authorization:"Bearer "+token};if(json)h["Content-Type"]="application/json";return h}
async function api(path,options={}){const response=await fetch(path,{...options,headers:{...authHeaders(Boolean(options.body)),...(options.headers||{})}});const data=await response.json().catch(()=>({}));if(response.status===401){logout();throw new Error("Invalid or expired admin token.");}if(!response.ok)throw new Error(data.error||"Request failed.");return data}
function showDashboard(){loginCard.hidden=true;dashboard.hidden=false;loadProducts()}
function logout(){token="";sessionStorage.removeItem(tokenKey);dashboard.hidden=true;loginCard.hidden=false;$("adminToken").value="";loginError.textContent=""}
loginForm.addEventListener("submit",async e=>{e.preventDefault();token=$("adminToken").value.trim();loginError.textContent="";try{await api("/api/admin/products");sessionStorage.setItem(tokenKey,token);showDashboard()}catch(err){loginError.textContent=err.message}})
async function loadProducts(){list.innerHTML='<p class="empty">Loading products…</p>';try{const data=await api("/api/admin/products");products=data.products||[];render()}catch(err){list.innerHTML='<p class="empty">'+escapeHTML(err.message)+'</p>'}}
function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(v){return Number(v)===0?"FREE":"₹"+Number(v).toLocaleString("en-IN")}
function render(){const q=$("productSearch").value.trim().toLowerCase();const shown=products.filter(p=>(p.name+" "+p.category+" "+p.id).toLowerCase().includes(q));$("totalCount").textContent=products.length;$("activeCount").textContent=products.filter(p=>p.active).length;$("freeCount").textContent=products.filter(p=>Number(p.price)===0).length;if(!shown.length){list.innerHTML='<p class="empty">No products found.</p>';return}list.innerHTML=shown.map(p=>'<article class="product-row"><img src="'+escapeHTML((p.images||[])[0]||"Images/favicon.png")+'" alt=""><div><h3>'+escapeHTML(p.name)+'</h3><p>'+escapeHTML(p.category)+' · '+money(p.price)+'</p><span class="badge '+(p.active?"":"hidden")+'">'+(p.active?"Visible":"Hidden")+'</span></div><div class="row-actions"><button class="edit-btn" data-edit="'+escapeHTML(p.id)+'">Edit</button><button class="hide-btn" data-toggle="'+escapeHTML(p.id)+'">'+(p.active?"Hide":"Show")+'</button><button class="delete-btn" data-delete="'+escapeHTML(p.id)+'">Delete</button></div></article>').join("")}
list.addEventListener("click",async e=>{const edit=e.target.closest("[data-edit]"),toggle=e.target.closest("[data-toggle]"),remove=e.target.closest("[data-delete]");if(remove){const p=products.find(x=>x.id===remove.dataset.delete);if(!p||!confirm("Permanently delete "+p.name+"?"))return;try{await api("/api/admin/products/"+encodeURIComponent(p.id),{method:"DELETE"});message.style.color="#047857";message.textContent="Product deleted.";await loadProducts()}catch(err){message.style.color="#dc2626";message.textContent=err.message}return}if(edit){fill(products.find(p=>p.id===edit.dataset.edit));return}if(toggle){const p=products.find(x=>x.id===toggle.dataset.toggle);if(!p)return;try{await save({...p,active:!p.active});await loadProducts()}catch(err){message.textContent=err.message}}})
function fill(p){if(!p)return;$("formTitle").textContent="Edit Product";$("originalId").value=p.id;$("productId").value=p.id;$("productName").value=p.name;$("productPrice").value=p.price;$("sortOrder").value=p.sort_order||0;$("productCategory").value=p.category;$("productType").value=p.type;Array.from($("productFormats").options).forEach(option=>{option.selected=(p.formats||[]).map(String).map(x=>x.toLowerCase()).includes(option.value)});$("productImages").value=(p.images||[]).join("\n");$("productDescription").value=p.description||"";$("downloadUrl").value=p.downloadUrl||"";$("productActive").checked=Boolean(p.active);form.scrollIntoView({behavior:"smooth",block:"start"})}
function reset(){form.reset();$("originalId").value="";$("productPrice").value="0";$("sortOrder").value="0";$("productActive").checked=true;$("formTitle").textContent="Add Product";message.textContent=""}
function payload(){return{id:$("productId").value.trim(),originalId:$("originalId").value.trim(),name:$("productName").value.trim(),price:Number($("productPrice").value)||0,sort_order:Number($("sortOrder").value)||0,category:$("productCategory").value.trim(),type:$("productType").value.trim(),formats:Array.from($("productFormats").selectedOptions).map(option=>option.value),images:$("productImages").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),description:$("productDescription").value.trim(),downloadUrl:$("downloadUrl").value.trim(),active:$("productActive").checked}}
async function save(p){return api("/api/admin/products",{method:"POST",body:JSON.stringify(p)})}
form.addEventListener("submit",async e=>{e.preventDefault();message.textContent="Saving…";try{await save(payload());message.style.color="#047857";message.textContent="Product saved successfully.";reset();await loadProducts()}catch(err){message.style.color="#dc2626";message.textContent=err.message}})
$("importBtn").addEventListener("click",async()=>{const button=$("importBtn");button.disabled=true;button.textContent="Importing…";message.textContent="Importing existing products…";try{for(const product of builtInProducts){await save({...product,originalId:product.id,active:true,sort_order:0})}message.style.color="#047857";message.textContent=builtInProducts.length+" existing products added successfully. Use Delete on the empty test product.";reset();await loadProducts()}catch(err){message.style.color="#dc2626";message.textContent=err.message}finally{button.disabled=false;button.textContent="Import Existing Products"}});$("resetBtn").addEventListener("click",reset);$("refreshBtn").addEventListener("click",loadProducts);$("logoutBtn").addEventListener("click",logout);$("productSearch").addEventListener("input",render);
if(token)showDashboard();
})();