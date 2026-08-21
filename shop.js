document.addEventListener("DOMContentLoaded", function () {

    const CART_KEY = "saiGraphicCart";

    const cartToggle = document.getElementById("cartToggle");
    const cartBadge = document.getElementById("cartBadge");

    const shopCart = document.getElementById("shopCart");
    const shopCartOverlay = document.getElementById("shopCartOverlay");
    const shopCartItems = document.getElementById("shopCartItems");
    const shopCartTotal = document.getElementById("shopCartTotal");



    /* ==========================================
       LOAD CART
    ========================================== */

    function getCart() {

        try {

            const saved = localStorage.getItem(CART_KEY);

            if (!saved) {
                return [];
            }

            const cart = JSON.parse(saved);

            return Array.isArray(cart) ? cart : [];

        } catch (error) {

            console.error("Cart loading error:", error);

            return [];

        }

    }



    /* ==========================================
       SAVE CART
    ========================================== */

    function saveCart(cart) {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    }



    /* ==========================================
       PRICE
    ========================================== */

    function formatPrice(price) {

        return "₹" + Number(price || 0)
            .toLocaleString("en-IN");

    }



    /* ==========================================
       ESCAPE HTML
    ========================================== */

    function escapeHTML(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }



    /* ==========================================
       UPDATE CART BADGE
    ========================================== */

    function updateCartBadge() {

        const cart = getCart();

        if (cartBadge) {

            cartBadge.textContent = cart.length;

        }

    }



    /* ==========================================
       UPDATE SHOP CART
    ========================================== */

    function updateShopCart() {

        const cart = getCart();

        updateCartBadge();


        if (!shopCartItems) {
            return;
        }


        shopCartItems.innerHTML = "";


        /* EMPTY CART */

        if (cart.length === 0) {

            shopCartItems.innerHTML = `

                <div class="empty-cart">

                    <p>
                        <strong>Your cart is empty.</strong>
                    </p>

                    <p>
                        Select a template and click
                        "Add to Cart".
                    </p>

                </div>

            `;

            if (shopCartTotal) {

                shopCartTotal.textContent = "₹0";

            }

            return;

        }



        /* CART ITEMS */

        let total = 0;


        cart.forEach(function (item, index) {

            const price =
                Number(item.price) || 0;

            total += price;


            const itemElement =
                document.createElement("div");

            itemElement.className =
                "shop-cart-item";


            itemElement.innerHTML = `

                <div class="shop-cart-item-info">

                    <strong>
                        ${escapeHTML(item.name)}
                    </strong>

                    <span>
                        ${formatPrice(price)}
                    </span>

                </div>


                <button
                    type="button"
                    class="shop-cart-remove"
                    data-index="${index}"
                    aria-label="Remove item">

                    ×

                </button>

            `;


            shopCartItems.appendChild(
                itemElement
            );

        });



        /* TOTAL */

        if (shopCartTotal) {

            shopCartTotal.textContent =
                formatPrice(total);

        }

    }



    /* ==========================================
       OPEN SHOP CART
    ========================================== */

    function openShopCart() {

        updateShopCart();


        if (shopCart) {

            shopCart.classList.add("active");

        }


        if (shopCartOverlay) {

            shopCartOverlay.classList.add("active");

        }


        document.body.style.overflow = "hidden";

    }



    /* ==========================================
       CLOSE SHOP CART
    ========================================== */

    function closeShopCart() {

        if (shopCart) {

            shopCart.classList.remove("active");

        }


        if (shopCartOverlay) {

            shopCartOverlay.classList.remove("active");

        }


        document.body.style.overflow = "";

    }



    /* ==========================================
       MAKE FUNCTIONS AVAILABLE TO HTML
    ========================================== */

    window.openShopCart =
        openShopCart;

    window.closeShopCart =
        closeShopCart;



    /* ==========================================
       HEADER CART BUTTON
    ========================================== */

    if (cartToggle) {

        cartToggle.addEventListener(
            "click",
            function () {

                openShopCart();

            }
        );

    }



    /* ==========================================
       OVERLAY
    ========================================== */

    if (shopCartOverlay) {

        shopCartOverlay.addEventListener(
            "click",
            function () {

                closeShopCart();

            }
        );

    }



    /* ==========================================
       ESC KEY
    ========================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeShopCart();

            }

        }
    );



    /* ==========================================
       REMOVE CART ITEM
    ========================================== */

    if (shopCartItems) {

        shopCartItems.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".shop-cart-remove"
                    );


                if (!button) {
                    return;
                }


                const index =
                    Number(button.dataset.index);


                const cart =
                    getCart();


                if (
                    Number.isInteger(index) &&
                    index >= 0 &&
                    index < cart.length
                ) {

                    cart.splice(index, 1);

                    saveCart(cart);

                    updateShopCart();

                }

            }
        );

    }



    /* ==========================================
       ADD TEMPLATE
    ========================================== */

    window.addTemplate =
        function (
            templateName,
            price
        ) {

            const cart =
                getCart();


            /* CHECK DUPLICATE */

            const alreadyExists =
                cart.some(function (item) {

                    return item.name ===
                        templateName;

                });


            if (alreadyExists) {

                alert(
                    templateName +
                    " is already in your cart."
                );

                openShopCart();

                return;

            }



            /* ADD ITEM */

            cart.push({

                name: templateName,

                price: Number(price) || 0

            });


            /* SAVE */

            saveCart(cart);


            /* UPDATE */

            updateShopCart();


            /* OPEN CART */

            openShopCart();

        };



    /* ==========================================
       WHATSAPP ORDER
    ========================================== */

    window.sendTemplateOrder =
        function () {

            const cart =
                getCart();


            if (cart.length === 0) {

                alert(
                    "Your cart is empty. Please add a template first."
                );

                return;

            }



            let total = 0;


            const products =
                cart.map(
                    function (item, index) {

                        const price =
                            Number(item.price) || 0;


                        total += price;


                        return (
                            (index + 1) +
                            ". " +
                            item.name +
                            " - " +
                            formatPrice(price)
                        );

                    }
                ).join("\n");



            const message =
`Hello Sai Graphic Designs 👋

I would like to order the following design templates:

━━━━━━━━━━━━━━━━━━
SELECTED TEMPLATES
━━━━━━━━━━━━━━━━━━

${products}

━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━

Number of Templates: ${cart.length}

Estimated Total: ${formatPrice(total)}

Please contact me to confirm the order, payment and delivery details.

Thank you!
Sai Graphic Designs Website`;



            const whatsappURL =
                "https://wa.me/916381128781?text=" +
                encodeURIComponent(message);


            window.open(
                whatsappURL,
                "_blank",
                "noopener,noreferrer"
            );

        };



    /* ==========================================
       UPDATE WHEN OTHER PAGE CHANGES CART
    ========================================== */

    window.addEventListener(
        "storage",
        function (event) {

            if (event.key === CART_KEY) {

                updateShopCart();

            }

        }
    );



    /* ==========================================
       INITIALIZE
    ========================================== */

    updateShopCart();

});
