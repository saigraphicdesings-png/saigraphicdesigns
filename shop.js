document.addEventListener("DOMContentLoaded", function () {

    const CART_KEY = "saiGraphicCart";

    const WHATSAPP_NUMBER = "916381128781";

    let cart = loadCart();


    /* =========================================
       LOAD CART
    ========================================= */

    function loadCart() {

        try {

            const saved =
                localStorage.getItem(CART_KEY);

            if (!saved) {
                return [];
            }

            const parsed =
                JSON.parse(saved);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Cart loading error:",
                error
            );

            return [];

        }

    }


    /* =========================================
       SAVE CART
    ========================================= */

    function saveCart() {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    }


    /* =========================================
       PRODUCT CREATOR
    ========================================= */

    function createProducts(
        containerId,
        category,
        productName,
        price,
        imagePrefix,
        count = 5
    ) {

        const container =
            document.getElementById(containerId);

        if (!container) {
            return;
        }

        container.innerHTML = "";


        for (let i = 1; i <= count; i++) {

            const number =
                String(i).padStart(2, "0");

            const name =
                `${productName} #${number}`;

            const image =
                `Images/shop/${imagePrefix}-${number}.jpg`;


            const card =
                document.createElement("article");

            card.className =
                "template-card";


            card.innerHTML = `

                <div class="template-image-wrap">

                    <img
                        src="${image}"
                        alt="${name}"
                        loading="lazy"
                        onerror="this.src='Images/shop/placeholder.jpg';">

                </div>


                <div class="template-card-content">

                    <div class="template-category">
                        ${category}
                    </div>

                    <h4>
                        ${name}
                    </h4>

                    <div class="template-price">
                        ₹${price}
                    </div>

                    <button
                        class="add-template-button"
                        type="button">

                        Add to Order

                    </button>

                </div>

            `;


            const button =
                card.querySelector(
                    ".add-template-button"
                );


            button.addEventListener(
                "click",
                function () {

                    addTemplate(
                        name,
                        price,
                        category,
                        image
                    );

                }
            );


            container.appendChild(card);

        }

    }


    /* =========================================
       CREATE ALL PRODUCTS
    ========================================= */

    // PRINTING DESIGNS

    createProducts(
        "premiumVisitingCards",
        "Printing Designs",
        "Premium Visiting Card",
        99,
        "visiting-card",
        10
    );


    createProducts(
        "businessCards",
        "Printing Designs",
        "Business Card Bundle",
        150,
        "business-card",
        5
    );


    createProducts(
        "letterheads",
        "Printing Designs",
        "Letterhead Bundle",
        150,
        "letterhead",
        5
    );


    createProducts(
        "envelopes",
        "Printing Designs",
        "Envelope Bundle",
        150,
        "envelope",
        5
    );


    createProducts(
        "fullBranding",
        "Printing Designs",
        "Full Branding",
        200,
        "full-branding",
        5
    );


    createProducts(
        "brochures",
        "Printing Designs",
        "Brochure",
        500,
        "brochure",
        5
    );


    createProducts(
        "flyers",
        "Printing Designs",
        "Flyer",
        200,
        "flyer",
        5
    );


    createProducts(
        "premiumPhotoFrames",
        "Printing Designs",
        "Premium Photo Frame",
        99,
        "photo-frame",
        5
    );


    createProducts(
        "twoPhotoFrames",
        "Printing Designs",
        "2 Premium Photo Frame Bundle",
        150,
        "photo-frame-2",
        5
    );


    createProducts(
        "fivePhotoFrames",
        "Printing Designs",
        "5 Photo Frame Bundle",
        250,
        "photo-frame-5",
        5
    );


    // DIGITAL & SOCIAL MEDIA

    createProducts(
        "premiumSocialPosters",
        "Digital & Social Media Designs",
        "Premium Social Media Poster",
        99,
        "social-poster",
        5
    );


    createProducts(
        "fiveSocialPosters",
        "Digital & Social Media Designs",
        "5 Social Media Poster Bundle",
        250,
        "social-poster-bundle",
        5
    );


    // PACKAGING

    createProducts(
        "boxDesigns",
        "Packaging Designs",
        "Box Design",
        250,
        "box-design",
        5
    );


    createProducts(
        "premiumBoxDesigns",
        "Packaging Designs",
        "Premium Box Design",
        500,
        "premium-box",
        5
    );


    createProducts(
        "pouchDesigns",
        "Packaging Designs",
        "Pouch Design",
        250,
        "pouch-design",
        5
    );


    createProducts(
        "premiumPouchDesigns",
        "Packaging Designs",
        "Premium Pouch Design",
        500,
        "premium-pouch",
        5
    );


    createProducts(
        "labelDesigns",
        "Packaging Designs",
        "Label Design",
        150,
        "label-design",
        5
    );


    createProducts(
        "premiumLabelDesigns",
        "Packaging Designs",
        "Premium Label Design",
        300,
        "premium-label",
        5
    );


    // ICONS — EXACTLY 10

    createProducts(
        "iconProducts",
        "Icons",
        "Premium Icon",
        99,
        "icon",
        10
    );


    /* =========================================
       ADD TEMPLATE
    ========================================= */

    window.addTemplate =
        function (
            name,
            price,
            category,
            image
        ) {

            cart = loadCart();


            const item = {

                id:
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .substring(2, 8),

                name: name,

                price: Number(price),

                category: category,

                type: "template",

                image: image

            };


            cart.push(item);

            saveCart();

            updateCart();

            openShopCart();

        };


    /* =========================================
       CART ELEMENTS
    ========================================= */

    const cartButton =
        document.getElementById(
            "shopCartButton"
        );

    const cart =
        document.getElementById(
            "shopCart"
        );

    const overlay =
        document.getElementById(
            "shopCartOverlay"
        );

    const closeButton =
        document.getElementById(
            "closeShopCart"
        );

    const cartItems =
        document.getElementById(
            "shopCartItems"
        );

    const cartTotal =
        document.getElementById(
            "shopCartTotal"
        );

    const cartCount =
        document.getElementById(
            "shopCartCount"
        );

    const whatsappButton =
        document.getElementById(
            "whatsappOrder"
        );


    /* =========================================
       OPEN CART
    ========================================= */

    function openShopCart() {

        cart.classList.add("active");

        overlay.classList.add("active");

        document.body.style.overflow =
            "hidden";

    }

    window.openShopCart =
        openShopCart;


    /* =========================================
       CLOSE CART
    ========================================= */

    function closeShopCart() {

        cart.classList.remove("active");

        overlay.classList.remove("active");

        document.body.style.overflow =
            "";

    }

    window.closeShopCart =
        closeShopCart;


    /* =========================================
       UPDATE CART
    ========================================= */

    function updateCart() {

        cart = loadCart();

        cartItems.innerHTML = "";


        if (cart.length === 0) {

            cartItems.innerHTML = `

                <div class="empty-shop-cart">

                    <div class="empty-cart-icon">
                        🛒
                    </div>

                    <h3>
                        Your cart is empty
                    </h3>

                    <p>
                        Select a template to add it
                        to your order.
                    </p>

                </div>

            `;


            cartTotal.textContent =
                "₹0";

            cartCount.textContent =
                "0";

            whatsappButton.disabled =
                true;

            return;

        }


        let total = 0;


        cart.forEach(
            function (item, index) {

                const price =
                    Number(item.price) || 0;

                total += price;


                const itemElement =
                    document.createElement("div");

                itemElement.className =
                    "shop-cart-item";


                itemElement.innerHTML = `

                    <div class="shop-cart-item-info">

                        <span class="shop-cart-item-category">
                            ${escapeHTML(
                                item.category ||
                                "Template"
                            )}
                        </span>

                        <strong>
                            ${escapeHTML(
                                item.name
                            )}
                        </strong>

                        <span>
                            ₹${price.toLocaleString("en-IN")}
                        </span>

                    </div>


                    <button
                        type="button"
                        class="remove-cart-item"
                        data-index="${index}">

                        ×

                    </button>

                `;


                cartItems.appendChild(
                    itemElement
                );

            }
        );


        cartTotal.textContent =
            "₹" +
            total.toLocaleString("en-IN");


        cartCount.textContent =
            cart.length;


        whatsappButton.disabled =
            false;


        cartItems
            .querySelectorAll(
                ".remove-cart-item"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(
                                    this.dataset.index
                                );


                            if (
                                index >= 0 &&
                                index < cart.length
                            ) {

                                cart.splice(
                                    index,
                                    1
                                );

                                saveCart();

                                updateCart();

                            }

                        }
                    );

                }
            );

    }


    /* =========================================
       ESCAPE HTML
    ========================================= */

    function escapeHTML(value) {

        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =========================================
       WHATSAPP ORDER
    ========================================= */

    function sendTemplateOrder() {

        cart = loadCart();


        if (cart.length === 0) {
            return;
        }


        let total = 0;


        const items =
            cart.map(
                function (item, index) {

                    const price =
                        Number(item.price) || 0;

                    total += price;


                    return (

                        `${index + 1}. ` +

                        `${item.name}` +

                        ` — ₹` +

                        `${price.toLocaleString("en-IN")}`

                    );

                }
            ).join("\n");


        const message =

`Hello Sai Graphic Designs 👋

I would like to order the following template designs:

━━━━━━━━━━━━━━━━━━
SELECTED TEMPLATES
━━━━━━━━━━━━━━━━━━

${items}

━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━

Number of Templates: ${cart.length}
Estimated Total: ₹${total.toLocaleString("en-IN")}

Please send me the payment details and let me know the next steps for receiving the selected templates.

Thank you!
Sai Graphic Designs`;


        const whatsappURL =
            "https://wa.me/" +
            WHATSAPP_NUMBER +
            "?text=" +
            encodeURIComponent(
                message
            );


        window.open(
            whatsappURL,
            "_blank",
            "noopener,noreferrer"
        );

    }


    /* =========================================
       DIFFERENT MESSAGE FOR DESIGN SERVICES
       Can be used later from Services page
    ========================================= */

    window.sendDesignServiceMessage =
        function (
            serviceName,
            category = "Design Services"
        ) {

            const message =

`Hello Sai Graphic Designs 👋

I would like to enquire about your design service.

━━━━━━━━━━━━━━━━━━
SERVICE DETAILS
━━━━━━━━━━━━━━━━━━

Service: ${serviceName}
Category: ${category}

Please contact me to discuss the project requirements, pricing and delivery time.

Thank you!`;


            const whatsappURL =
                "https://wa.me/" +
                WHATSAPP_NUMBER +
                "?text=" +
                encodeURIComponent(
                    message
                );


            window.open(
                whatsappURL,
                "_blank",
                "noopener,noreferrer"
            );

        };


    /* =========================================
       BUTTON EVENTS
    ========================================= */

    cartButton.addEventListener(
        "click",
        function () {

            updateCart();

            openShopCart();

        }
    );


    closeButton.addEventListener(
        "click",
        closeShopCart
    );


    overlay.addEventListener(
        "click",
        closeShopCart
    );


    whatsappButton.addEventListener(
        "click",
        sendTemplateOrder
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeShopCart();

            }

        }
    );


    /* =========================================
       INITIALIZE
    ========================================= */

    updateCart();

});
