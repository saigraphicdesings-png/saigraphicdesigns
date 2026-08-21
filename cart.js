document.addEventListener("DOMContentLoaded", function () {

    const CART_KEY = "saiGraphicCart";

    const cartToggle = document.getElementById("cartToggle");
    const cartBadge = document.getElementById("cartBadge");
    const cartOverlay = document.getElementById("cartOverlay");
    const cartDrawer = document.getElementById("cartDrawer");
    const cartClose = document.getElementById("cartClose");
    const cartItemsList = document.getElementById("cartItemsList");
    const cartTotalVal = document.getElementById("cartTotalVal");
    const cartCheckout = document.getElementById("cartCheckout");


    /* ==========================================
       LOAD CART
    ========================================== */

    function getCart() {

        try {

            return JSON.parse(
                localStorage.getItem(CART_KEY)
            ) || [];

        } catch (error) {

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
       FORMAT PRICE
    ========================================== */

    function formatPrice(price) {

        return "₹" +
            Number(price || 0).toLocaleString("en-IN");

    }


    /* ==========================================
       ESCAPE HTML
    ========================================== */

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* ==========================================
       UPDATE CART
    ========================================== */

    function updateCart() {

        const cart = getCart();


        /* CART BADGE */

        if (cartBadge) {

            cartBadge.textContent = cart.length;

        }


        if (!cartItemsList) {

            return;

        }


        cartItemsList.innerHTML = "";


        /* EMPTY CART */

        if (cart.length === 0) {

            cartItemsList.innerHTML = `

                <div class="empty-cart">

                    <p>
                        <strong>
                            No items selected yet.
                        </strong>
                    </p>

                    <p>
                        Choose a service or template
                        and add it to your order.
                    </p>

                </div>

            `;


            if (cartTotalVal) {

                cartTotalVal.textContent = "₹0";

            }


            if (cartCheckout) {

                cartCheckout.disabled = true;

            }


            return;

        }


        /* TOTAL */

        let total = 0;


        /* ITEMS */

        cart.forEach(function (item, index) {

            const price =
                Number(item.price) || 0;

            total += price;


            const itemElement =
                document.createElement("div");

            itemElement.className = "cart-item";


            /*
                SERVICE OR TEMPLATE LABEL
            */

            const itemType =
                item.type === "template"
                    ? "Template"
                    : "Service";


            itemElement.innerHTML = `

                <div class="cart-item-info">

                    <div class="cart-item-name">

                        ${escapeHTML(item.name)}

                    </div>

                    <div class="cart-item-price">

                        ${formatPrice(price)}

                    </div>

                    <div
                        style="
                            font-size:10px;
                            opacity:.65;
                            margin-top:3px;
                        "
                    >

                        ${itemType}

                    </div>

                </div>


                <button
                    type="button"
                    class="cart-remove"
                    data-index="${index}"
                    aria-label="Remove item"
                >
                    ×
                </button>

            `;


            cartItemsList.appendChild(
                itemElement
            );

        });


        /* TOTAL */

        if (cartTotalVal) {

            cartTotalVal.textContent =
                formatPrice(total);

        }


        /* ENABLE CHECKOUT */

        if (cartCheckout) {

            cartCheckout.disabled = false;

        }

    }


    /* ==========================================
       OPEN CART
    ========================================== */

    function openCart() {

        updateCart();


        if (cartDrawer) {

            cartDrawer.classList.add("active");

            cartDrawer.setAttribute(
                "aria-hidden",
                "false"
            );

        }


        if (cartOverlay) {

            cartOverlay.classList.add("active");

            cartOverlay.setAttribute(
                "aria-hidden",
                "false"
            );

        }


        document.body.style.overflow = "hidden";

    }


    /* ==========================================
       CLOSE CART
    ========================================== */

    function closeCart() {

        if (cartDrawer) {

            cartDrawer.classList.remove("active");

            cartDrawer.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        if (cartOverlay) {

            cartOverlay.classList.remove("active");

            cartOverlay.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        document.body.style.overflow = "";

    }


    /* ==========================================
       CART BUTTON
    ========================================== */

    if (cartToggle) {

        cartToggle.addEventListener(
            "click",
            openCart
        );

    }


    /* ==========================================
       CLOSE BUTTON
    ========================================== */

    if (cartClose) {

        cartClose.addEventListener(
            "click",
            closeCart
        );

    }


    /* ==========================================
       OVERLAY
    ========================================== */

    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCart
        );

    }


    /* ==========================================
       ESCAPE KEY
    ========================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeCart();

            }

        }
    );


    /* ==========================================
       REMOVE ITEM
    ========================================== */

    if (cartItemsList) {

        cartItemsList.addEventListener(
            "click",
            function (event) {

                if (
                    !event.target.classList.contains(
                        "cart-remove"
                    )
                ) {

                    return;

                }


                const index =
                    Number(
                        event.target.dataset.index
                    );


                const cart = getCart();


                cart.splice(
                    index,
                    1
                );


                saveCart(cart);

                updateCart();

            }
        );

    }


    /* ==========================================
       CHECKOUT → WHATSAPP
    ========================================== */

    if (cartCheckout) {

        cartCheckout.addEventListener(
            "click",
            function () {

                const cart = getCart();


                if (cart.length === 0) {

                    return;

                }


                const total =
                    cart.reduce(
                        function (sum, item) {

                            return sum +
                                Number(item.price || 0);

                        },
                        0
                    );


                /*
                    CHECK WHETHER CART CONTAINS
                    SERVICES OR TEMPLATES
                */

                const templates =
                    cart.filter(function (item) {

                        return item.type === "template";

                    });


                const services =
                    cart.filter(function (item) {

                        return item.type !== "template";

                    });


                let message = "";


                /* =================================
                   TEMPLATE ORDER
                ================================= */

                if (
                    templates.length > 0 &&
                    services.length === 0
                ) {

                    message =
`Hello Sai Graphic Designs 👋

I would like to order the following templates:

━━━━━━━━━━━━━━━━━━
SELECTED TEMPLATES
━━━━━━━━━━━━━━━━━━

${templates.map(function (item, index) {

    return (
        (index + 1) +
        ". " +
        item.name +
        " - " +
        formatPrice(item.price)
    );

}).join("\n")}

━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━

Number of Templates: ${templates.length}

Estimated Total: ${formatPrice(total)}

Please contact me to confirm the template order and payment.

Thank you!
Sai Graphic Designs Website`;


                }


                /* =================================
                   SERVICE ORDER
                ================================= */

                else if (
                    services.length > 0 &&
                    templates.length === 0
                ) {

                    message =
`Hello Sai Graphic Designs 👋

I would like to order the following services:

━━━━━━━━━━━━━━━━━━
SELECTED SERVICES
━━━━━━━━━━━━━━━━━━

${services.map(function (item, index) {

    return (
        (index + 1) +
        ". " +
        item.name +
        " - " +
        formatPrice(item.price)
    );

}).join("\n")}

━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━

Number of Services: ${services.length}

Estimated Total: ${formatPrice(total)}

Please contact me to discuss the project details and payment.

Thank you!
Sai Graphic Designs Website`;


                }


                /* =================================
                   MIXED ORDER
                ================================= */

                else {

                    message =
`Hello Sai Graphic Designs 👋

I would like to place an order.

━━━━━━━━━━━━━━━━━━
SELECTED SERVICES
━━━━━━━━━━━━━━━━━━

${services.map(function (item, index) {

    return (
        (index + 1) +
        ". " +
        item.name +
        " - " +
        formatPrice(item.price)
    );

}).join("\n")}

━━━━━━━━━━━━━━━━━━
SELECTED TEMPLATES
━━━━━━━━━━━━━━━━━━

${templates.map(function (item, index) {

    return (
        (index + 1) +
        ". " +
        item.name +
        " - " +
        formatPrice(item.price)
    );

}).join("\n")}

━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━

Total Items: ${cart.length}

Estimated Total: ${formatPrice(total)}

Please contact me to confirm the order.

Thank you!
Sai Graphic Designs Website`;

                }


                const whatsappURL =
                    "https://wa.me/916381128781?text=" +
                    encodeURIComponent(message);


                window.open(
                    whatsappURL,
                    "_blank"
                );

            }
        );

    }


    /* ==========================================
       UPDATE WHEN RETURNING
    ========================================== */

    window.addEventListener(
        "pageshow",
        function () {

            updateCart();

        }
    );


    /* ==========================================
       INITIAL LOAD
    ========================================== */

    updateCart();


    /* ==========================================
       EXISTING SERVICE FUNCTION
    ========================================== */

    window.addServiceToGlobalCart =
        function (
            serviceName,
            price
        ) {

            const cart = getCart();


            const exists =
                cart.some(function (item) {

                    return (
                        item.name === serviceName &&
                        item.type !== "template"
                    );

                });


            if (exists) {

                alert(
                    serviceName +
                    " is already in your cart."
                );

                openCart();

                return;

            }


            cart.push({

                name: serviceName,

                price: Number(price),

                type: "service"

            });


            saveCart(cart);

            updateCart();

            openCart();

        };


    /* ==========================================
       NEW TEMPLATE FUNCTION
    ========================================== */

    window.addTemplateToGlobalCart =
        function (
            templateName,
            price
        ) {

            const cart = getCart();


            /*
                Allow the same design only once
            */

            const exists =
                cart.some(function (item) {

                    return (
                        item.name === templateName &&
                        item.type === "template"
                    );

                });


            if (exists) {

                alert(
                    templateName +
                    " is already in your cart."
                );

                openCart();

                return;

            }


            cart.push({

                name: templateName,

                price: Number(price),

                type: "template"

            });


            saveCart(cart);

            updateCart();

            openCart();

        };

});
