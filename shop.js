document.addEventListener("DOMContentLoaded", function () {

    "use strict";


    /* =========================================
       CART STORAGE
    ========================================= */

    const CART_KEY = "saiGraphicShopCart";

    let cart = loadCart();


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
                "Unable to load shop cart:",
                error
            );

            return [];

        }

    }


    function saveCart() {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    }


    /* =========================================
       ELEMENTS
    ========================================= */

    const cartToggle =
        document.getElementById(
            "shopCartToggle"
        );

    const cartBadge =
        document.getElementById(
            "shopCartBadge"
        );

    const cartDrawer =
        document.getElementById(
            "shopCart"
        );

    const cartOverlay =
        document.getElementById(
            "shopCartOverlay"
        );

    const cartClose =
        document.getElementById(
            "shopCartClose"
        );

    const cartItems =
        document.getElementById(
            "shopCartItems"
        );

    const cartTotal =
        document.getElementById(
            "shopCartTotal"
        );

    const whatsappOrder =
        document.getElementById(
            "shopWhatsappOrder"
        );


    /* =========================================
       ESCAPE HTML
    ========================================= */

    function escapeHTML(value) {

        return String(value)

            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =========================================
       OPEN CART
    ========================================= */

    function openShopCart() {

        if (!cartDrawer) {
            return;
        }

        updateCart();

        cartDrawer.classList.add("active");

        cartOverlay.classList.add("active");

        cartDrawer.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "shop-cart-open"
        );

    }


    /* =========================================
       CLOSE CART
    ========================================= */

    function closeShopCart() {

        if (!cartDrawer) {
            return;
        }

        cartDrawer.classList.remove(
            "active"
        );

        cartOverlay.classList.remove(
            "active"
        );

        cartDrawer.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "shop-cart-open"
        );

    }


    /* =========================================
       ADD TEMPLATE
    ========================================= */

    window.addTemplate =
        function (name, price) {

            const product = {

                id:
                    name
                        .toLowerCase()
                        .replace(
                            /[^a-z0-9]+/g,
                            "-"
                        ),

                name: name,

                price: Number(price) || 0

            };


            /*
             * Allow the same product only once.
             */

            const existing =
                cart.find(
                    function (item) {

                        return item.id === product.id;

                    }
                );


            if (existing) {

                alert(
                    product.name +
                    " is already in your cart."
                );

                openShopCart();

                return;

            }


            cart.push(product);

            saveCart();

            updateCart();

            openShopCart();

        };


    /* =========================================
       REMOVE TEMPLATE
    ========================================= */

    function removeTemplate(index) {

        if (
            index < 0 ||
            index >= cart.length
        ) {

            return;

        }


        cart.splice(index, 1);

        saveCart();

        updateCart();

    }


    /* =========================================
       UPDATE CART
    ========================================= */

    function updateCart() {

        cart =
            loadCart();


        if (!cartItems) {
            return;
        }


        cartItems.innerHTML = "";


        /* EMPTY CART */

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
                        Add a design template to
                        your cart to place an order.
                    </p>

                </div>

            `;


            if (cartBadge) {
                cartBadge.textContent = "0";
            }


            if (cartTotal) {
                cartTotal.textContent = "₹0";
            }


            if (whatsappOrder) {
                whatsappOrder.disabled = true;
            }


            return;

        }


        /* CART HAS ITEMS */

        let total = 0;


        cart.forEach(
            function (item, index) {

                const price =
                    Number(item.price) || 0;

                total += price;


                const itemElement =
                    document.createElement(
                        "div"
                    );


                itemElement.className =
                    "shop-cart-item";


                itemElement.innerHTML = `

                    <div class="shop-cart-item-info">

                        <h4>
                            ${escapeHTML(
                                item.name
                            )}
                        </h4>

                        <strong>
                            ₹${price.toLocaleString(
                                "en-IN"
                            )}
                        </strong>

                    </div>


                    <button
                        type="button"
                        class="shop-cart-remove"
                        data-index="${index}"
                        aria-label="Remove item">

                        ×

                    </button>

                `;


                cartItems.appendChild(
                    itemElement
                );

            }
        );


        /* CART COUNT */

        if (cartBadge) {

            cartBadge.textContent =
                cart.length;

        }


        /* TOTAL */

        if (cartTotal) {

            cartTotal.textContent =
                "₹" +
                total.toLocaleString(
                    "en-IN"
                );

        }


        /* ENABLE ORDER */

        if (whatsappOrder) {

            whatsappOrder.disabled =
                false;

        }


        /* REMOVE BUTTONS */

        const removeButtons =
            cartItems.querySelectorAll(
                ".shop-cart-remove"
            );


        removeButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                this.dataset.index
                            );

                        removeTemplate(index);

                    }
                );

            }
        );

    }


    /* =========================================
       CART TOGGLE
    ========================================= */

    if (cartToggle) {

        cartToggle.addEventListener(
            "click",
            function () {

                if (
                    cartDrawer.classList.contains(
                        "active"
                    )
                ) {

                    closeShopCart();

                } else {

                    openShopCart();

                }

            }
        );

    }


    /* =========================================
       CLOSE BUTTON
    ========================================= */

    if (cartClose) {

        cartClose.addEventListener(
            "click",
            closeShopCart
        );

    }


    /* =========================================
       OVERLAY
    ========================================= */

    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeShopCart
        );

    }


    /* =========================================
       ESC KEY
    ========================================= */

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
       WHATSAPP ORDER
    ========================================= */

    if (whatsappOrder) {

        whatsappOrder.addEventListener(
            "click",
            function () {

                cart =
                    loadCart();


                if (
                    cart.length === 0
                ) {

                    return;

                }


                let total = 0;


                const items =
                    cart.map(
                        function (
                            item,
                            index
                        ) {

                            const price =
                                Number(
                                    item.price
                                ) || 0;


                            total += price;


                            return (
                                (index + 1) +
                                ". " +
                                item.name +
                                " - ₹" +
                                price.toLocaleString(
                                    "en-IN"
                                )
                            );

                        }
                    );


                const message =
                    `Hello Sai Graphic Designs 👋

I would like to order the following design templates:

━━━━━━━━━━━━━━━━━━
SELECTED TEMPLATES
━━━━━━━━━━━━━━━━━━

${items.join("\n")}

━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━

Number of Templates: ${cart.length}

Total: ₹${total.toLocaleString(
                        "en-IN"
                    )}

Please contact me to confirm the order and payment.

Thank you!`;


                const whatsappURL =
                    "https://wa.me/916381128781?text=" +
                    encodeURIComponent(
                        message
                    );


                window.open(
                    whatsappURL,
                    "_blank"
                );

            }
        );

    }


    /* =========================================
       STORAGE CHANGE
    ========================================= */

    window.addEventListener(
        "storage",
        function (event) {

            if (
                event.key === CART_KEY
            ) {

                updateCart();

            }

        }
    );


    /* =========================================
       INITIALIZE
    ========================================= */

    updateCart();

});
