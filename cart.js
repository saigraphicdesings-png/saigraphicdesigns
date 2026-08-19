document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       CART STORAGE
    ===================================================== */

    const CART_KEY = "saiGraphicCart";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const cartToggle =
        document.getElementById("cartToggle");

    const cartBadge =
        document.getElementById("cartBadge");

    const cartOverlay =
        document.getElementById("cartOverlay");

    const cartDrawer =
        document.getElementById("cartDrawer");

    const cartClose =
        document.getElementById("cartClose");

    const cartItemsList =
        document.getElementById("cartItemsList");

    const cartTotalVal =
        document.getElementById("cartTotalVal");

    const cartCheckout =
        document.getElementById("cartCheckout");


    /* =====================================================
       LOAD CART
    ===================================================== */

    let cart = loadCart();


    function loadCart() {

        try {

            return JSON.parse(
                localStorage.getItem(CART_KEY)
            ) || [];

        } catch (error) {

            console.error(
                "Cart loading error:",
                error
            );

            return [];

        }

    }


    /* =====================================================
       SAVE CART
    ===================================================== */

    function saveCart() {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    }


    /* =====================================================
       PRICE FORMAT
    ===================================================== */

    function formatPrice(price) {

        return "₹" +
            Number(price || 0)
                .toLocaleString("en-IN");

    }


    /* =====================================================
       UPDATE CART
    ===================================================== */

    function updateCart() {

        cart = loadCart();


        /* ---------------------------------------------
           BADGE
        --------------------------------------------- */

        if (cartBadge) {

            cartBadge.textContent =
                cart.length;

        }


        /* ---------------------------------------------
           CART CONTENT
        --------------------------------------------- */

        if (!cartItemsList) {

            return;

        }


        cartItemsList.innerHTML = "";


        /* ---------------------------------------------
           EMPTY CART
        --------------------------------------------- */

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

                cartCheckout.disabled =
                    true;

            }


            return;

        }


        /* ---------------------------------------------
           CALCULATE TOTAL
        --------------------------------------------- */

        let total = 0;


        /* ---------------------------------------------
           CART ITEMS
        --------------------------------------------- */

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
                    data-index="${index}"
                    aria-label="Remove service">

                    ×

                </button>

            `;


            cartItemsList.appendChild(
                itemElement
            );

        });


        /* ---------------------------------------------
           TOTAL
        --------------------------------------------- */

        if (cartTotalVal) {

            cartTotalVal.textContent =
                formatPrice(total);

        }


        /* ---------------------------------------------
           CHECKOUT
        --------------------------------------------- */

        if (cartCheckout) {

            cartCheckout.disabled =
                false;

        }

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(value)

            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       OPEN CART
    ===================================================== */

    function openCart() {

        if (!cartDrawer) {
            return;
        }


        updateCart();


        cartDrawer.classList.add(
            "active"
        );


        if (cartOverlay) {

            cartOverlay.classList.add(
                "active"
            );

        }


        cartDrawer.setAttribute(
            "aria-hidden",
            "false"
        );


        if (cartOverlay) {

            cartOverlay.setAttribute(
                "aria-hidden",
                "false"
            );

        }


        document.body.style.overflow =
            "hidden";

    }


    /* =====================================================
       CLOSE CART
    ===================================================== */

    function closeCart() {

        if (!cartDrawer) {
            return;
        }


        cartDrawer.classList.remove(
            "active"
        );


        if (cartOverlay) {

            cartOverlay.classList.remove(
                "active"
            );

        }


        cartDrawer.setAttribute(
            "aria-hidden",
            "true"
        );


        if (cartOverlay) {

            cartOverlay.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        document.body.style.overflow =
            "";

    }


    /* =====================================================
       CART TOGGLE
    ===================================================== */

    if (cartToggle) {

        cartToggle.addEventListener(
            "click",
            function () {

                openCart();

            }
        );

    }


    /* =====================================================
       CLOSE BUTTON
    ===================================================== */

    if (cartClose) {

        cartClose.addEventListener(
            "click",
            closeCart
        );

    }


    /* =====================================================
       OVERLAY
    ===================================================== */

    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCart
        );

    }


    /* =====================================================
       ESC KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeCart();

            }

        }
    );


    /* =====================================================
       REMOVE CART ITEM
    ===================================================== */

    if (cartItemsList) {

        cartItemsList.addEventListener(
            "click",
            function (event) {

                const removeButton =
                    event.target.closest(
                        ".cart-remove"
                    );


                if (!removeButton) {

                    return;

                }


                const index =
                    Number(
                        removeButton.dataset.index
                    );


                if (
                    Number.isInteger(index) &&
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


    /* =====================================================
       CHECKOUT → WHATSAPP
    ===================================================== */

    if (cartCheckout) {

        cartCheckout.addEventListener(
            "click",
            function () {

                cart = loadCart();


                if (
                    cart.length === 0
                ) {

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


                const serviceList =
                    cart
                        .map(
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
                        )
                        .join("\n");


                const message =
`Hello Sai Graphic Designs 👋

I would like to order the following services:

━━━━━━━━━━━━━━━━━━
SELECTED SERVICES
━━━━━━━━━━━━━━━━━━

${serviceList}

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
                    encodeURIComponent(
                        message
                    );


                window.open(
                    whatsappURL,
                    "_blank",
                    "noopener,noreferrer"
                );

            }
        );

    }


    /* =====================================================
       STORAGE CHANGE
       Keeps cart synchronized between browser tabs/windows
    ===================================================== */

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


    /* =====================================================
       INITIALIZE
    ===================================================== */

    updateCart();


    /* =====================================================
       MAKE CART FUNCTIONS AVAILABLE
       For customizer.html
    ===================================================== */

    window.SaiGraphicCart = {

        add: function (
            serviceName,
            price
        ) {

            cart = loadCart();


            const existing =
                cart.find(
                    function (item) {

                        return item.name ===
                            serviceName;

                    }
                );


            if (existing) {

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


            saveCart();

            updateCart();

            openCart();

        },


        update: updateCart,

        open: openCart,

        close: closeCart

    };

});
