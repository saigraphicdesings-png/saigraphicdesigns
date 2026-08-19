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
            Number(price || 0)
                .toLocaleString("en-IN");

    }


    /* ==========================================
       UPDATE CART
    ========================================== */

    function updateCart() {

        const cart = getCart();


        /* CART BADGE */

        if (cartBadge) {

            cartBadge.textContent =
                cart.length;

        }


        /* CART CONTENT */

        if (!cartItemsList) {

            return;

        }


        cartItemsList.innerHTML = "";


        /* EMPTY */

        if (cart.length === 0) {

            cartItemsList.innerHTML = `

                <div class="empty-cart">

                    <p>
                        <strong>
                            No services selected yet.
                        </strong>
                    </p>

                    <p>
                        Choose a service and click
                        "Add to Order".
                    </p>

                </div>

            `;


            if (cartTotalVal) {

                cartTotalVal.textContent =
                    "₹0";

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

            itemElement.className =
                "cart-item";


            itemElement.innerHTML = `

                <div class="cart-item-info">

                    <div class="cart-item-name">
                        ${escapeHTML(item.name)}
                    </div>

                    <div class="cart-item-price">
                        ${formatPrice(price)}
                    </div>

                </div>

                <button
                    type="button"
                    class="cart-remove"
                    data-index="${index}">
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


        document.body.style.overflow =
            "hidden";

    }


    /* ==========================================
       CLOSE CART
    ========================================== */

    function closeCart() {

        if (cartDrawer) {

            cartDrawer.classList.remove(
                "active"
            );

            cartDrawer.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        if (cartOverlay) {

            cartOverlay.classList.remove(
                "active"
            );

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
       CLOSE
    ========================================== */

    if (cartClose) {

        cartClose.addEventListener(
            "click",
            closeCart
        );

    }


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
                        function (
                            sum,
                            item
                        ) {

                            return sum +
                                Number(
                                    item.price
                                );

                        },
                        0
                    );


                const services =
                    cart.map(
                        function (
                            item,
                            index
                        ) {

                            return (
                                (index + 1) +
                                ". " +
                                item.name +
                                " - " +
                                formatPrice(
                                    item.price
                                )
                            );

                        }
                    ).join("\n");


                const message =
`Hello Sai Graphic Designs 👋

I would like to order the following services:

━━━━━━━━━━━━━━━━━━
SELECTED SERVICES
━━━━━━━━━━━━━━━━━━

${services}

━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━

Number of Services: ${cart.length}

Estimated Total: ${formatPrice(total)}

Please contact me to discuss the project details and payment.

Thank you!
Sai Graphic Designs Website`;


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
       UPDATE WHEN RETURNING TO PAGE
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
       SERVICE ADD FUNCTION
    ========================================== */

    window.addServiceToGlobalCart =
        function (
            serviceName,
            price
        ) {

            const cart = getCart();


            const exists =
                cart.some(
                    function (item) {

                        return item.name ===
                            serviceName;

                    }
                );


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

                price: Number(price)

            });


            saveCart(cart);

            updateCart();

            openCart();

        };

});
