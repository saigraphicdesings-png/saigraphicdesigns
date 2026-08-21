/* =====================================
   SAI GRAPHIC DESIGNS
   TEMPLATE SHOP
===================================== */

let templateCart =
    JSON.parse(localStorage.getItem("saiTemplateCart")) || [];


/* =====================================
   PRODUCTS
===================================== */

const socialProducts = [
    ["Premium Social Media Poster #01", 99],
    ["Premium Social Media Poster #02", 99],
    ["Premium Social Media Poster #03", 99],
    ["Premium Social Media Poster #04", 99],
    ["Premium Social Media Poster #05", 99],

    ["5 Social Media Poster Bundle #01", 250],
    ["5 Social Media Poster Bundle #02", 250],
    ["5 Social Media Poster Bundle #03", 250],
    ["5 Social Media Poster Bundle #04", 250],
    ["5 Social Media Poster Bundle #05", 250]
];


const packagingProducts = [
    ["Box Design #01", 250],
    ["Box Design #02", 250],
    ["Box Design #03", 250],
    ["Box Design #04", 250],
    ["Box Design #05", 250],

    ["Premium Box Design #01", 500],
    ["Premium Box Design #02", 500],
    ["Premium Box Design #03", 500],
    ["Premium Box Design #04", 500],
    ["Premium Box Design #05", 500],

    ["Pouch Design #01", 250],
    ["Pouch Design #02", 250],
    ["Pouch Design #03", 250],
    ["Pouch Design #04", 250],
    ["Pouch Design #05", 250],

    ["Premium Pouch Design #01", 500],
    ["Premium Pouch Design #02", 500],
    ["Premium Pouch Design #03", 500],
    ["Premium Pouch Design #04", 500],
    ["Premium Pouch Design #05", 500],

    ["Label Design #01", 150],
    ["Label Design #02", 150],
    ["Label Design #03", 150],
    ["Label Design #04", 150],
    ["Label Design #05", 150],

    ["Premium Label Design #01", 300],
    ["Premium Label Design #02", 300],
    ["Premium Label Design #03", 300],
    ["Premium Label Design #04", 300],
    ["Premium Label Design #05", 300]
];


const iconProducts = [
    ["Premium Icon #01", 99],
    ["Premium Icon #02", 99],
    ["Premium Icon #03", 99],
    ["Premium Icon #04", 99],
    ["Premium Icon #05", 99],
    ["Premium Icon #06", 99],
    ["Premium Icon #07", 99],
    ["Premium Icon #08", 99],
    ["Premium Icon #09", 99],
    ["Premium Icon #10", 99]
];


/* =====================================
   PRODUCT CARD GENERATOR
===================================== */

function createProductCard(name, price, imageName) {

    return `
        <div class="template-card">

            <img
                src="Images/shop/${imageName}"
                alt="${name}"
                onerror="this.src='Images/logo.png'"
            >

            <h4>${name}</h4>

            <p>₹${price}</p>

            <button
                onclick="addTemplate('${name.replace(/'/g, "\\'")}', ${price})">
                Add to Cart
            </button>

        </div>
    `;
}


/* =====================================
   LOAD SOCIAL PRODUCTS
===================================== */

function loadSocialProducts() {

    const container =
        document.getElementById("socialProducts");

    if (!container) return;

    let html = "";

    socialProducts.forEach((product, index) => {

        const image =
            `social-poster-${String(index + 1).padStart(2, "0")}.jpg`;

        html += createProductCard(
            product[0],
            product[1],
            image
        );

    });

    container.innerHTML = html;
}


/* =====================================
   LOAD PACKAGING
===================================== */

function loadPackagingProducts() {

    const container =
        document.getElementById("packagingProducts");

    if (!container) return;

    let html = "";

    packagingProducts.forEach((product, index) => {

        const image =
            `packaging-${String(index + 1).padStart(2, "0")}.jpg`;

        html += createProductCard(
            product[0],
            product[1],
            image
        );

    });

    container.innerHTML = html;
}


/* =====================================
   LOAD ICONS
===================================== */

function loadIcons() {

    const container =
        document.getElementById("iconProducts");

    if (!container) return;

    let html = "";

    iconProducts.forEach((product, index) => {

        const image =
            `icon-${String(index + 1).padStart(2, "0")}.jpg`;

        html += createProductCard(
            product[0],
            product[1],
            image
        );

    });

    container.innerHTML = html;
}


/* =====================================
   ADD TO CART
===================================== */

function addTemplate(name, price) {

    templateCart.push({
        name: name,
        price: price
    });

    saveTemplateCart();

    updateTemplateCart();

    openShopCart();

}


/* =====================================
   REMOVE
===================================== */

function removeTemplate(index) {

    templateCart.splice(index, 1);

    saveTemplateCart();

    updateTemplateCart();

}


/* =====================================
   SAVE
===================================== */

function saveTemplateCart() {

    localStorage.setItem(
        "saiTemplateCart",
        JSON.stringify(templateCart)
    );

}


/* =====================================
   UPDATE CART
===================================== */

function updateTemplateCart() {

    const items =
        document.getElementById("shopCartItems");

    const count =
        document.getElementById("shopCartCount");

    const totalElement =
        document.getElementById("shopCartTotal");


    if (!items) return;


    items.innerHTML = "";


    let total = 0;


    templateCart.forEach((item, index) => {

        total += Number(item.price);


        items.innerHTML += `

            <div class="cart-template-item">

                <strong>
                    ${item.name}
                </strong>

                <span>
                    ₹${item.price}
                </span>

                <button
                    onclick="removeTemplate(${index})">
                    Remove
                </button>

            </div>

        `;

    });


    if (templateCart.length === 0) {

        items.innerHTML = `
            <p>Your template cart is empty.</p>
        `;

    }


    count.textContent =
        templateCart.length;


    totalElement.textContent =
        `₹${total}`;

}


/* =====================================
   OPEN CART
===================================== */

function openShopCart() {

    document
        .getElementById("shopCart")
        .classList.add("show");

    document
        .getElementById("shopCartOverlay")
        .classList.add("show");

}


/* =====================================
   CLOSE CART
===================================== */

function closeShopCart() {

    document
        .getElementById("shopCart")
        .classList.remove("show");

    document
        .getElementById("shopCartOverlay")
        .classList.remove("show");

}


/* =====================================
   WHATSAPP TEMPLATE MESSAGE
===================================== */

function sendTemplateOrder() {

    if (templateCart.length === 0) {

        alert("Please add a template to your cart first.");

        return;

    }


    /*
       CHANGE THIS TO YOUR WHATSAPP NUMBER

       Example:
       919876543210

       Do NOT use + or spaces.
    */

    const whatsappNumber =
        "919999999999";


    let total = 0;


    let message =
        `🛍️ NEW TEMPLATE ORDER\n` +
        `━━━━━━━━━━━━━━━━━━\n\n`;


    message +=
        `📦 Selected Templates:\n\n`;


    templateCart.forEach((item, index) => {

        total += Number(item.price);

        message +=
            `${index + 1}. ${item.name} — ₹${item.price}\n`;

    });


    message +=
        `\n━━━━━━━━━━━━━━━━━━\n` +
        `💰 TOTAL: ₹${total}\n\n`;


    message +=
        `📌 Order Type: Template Shop\n\n`;


    message +=
        `Please confirm my template order.`;


    const whatsappURL =
        `https://wa.me/${whatsappNumber}?text=` +
        encodeURIComponent(message);


    window.open(
        whatsappURL,
        "_blank"
    );

}


/* =====================================
   START
===================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadSocialProducts();

        loadPackagingProducts();

        loadIcons();

        updateTemplateCart();

    }
);
