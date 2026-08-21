document.addEventListener("DOMContentLoaded", function () {

    const CART_KEY = "saiGraphicCart";

    /* =====================================================
       CART ELEMENTS
    ===================================================== */

    const cartToggle = document.getElementById("cartToggle");
    const cartBadge = document.getElementById("cartBadge");

    const cartOverlay = document.getElementById("cartOverlay");
    const cartDrawer = document.getElementById("cartDrawer");

    const cartClose = document.getElementById("cartClose");

    const cartItemsList = document.getElementById("cartItemsList");
    const cartTotalVal = document.getElementById("cartTotalVal");

    const checkoutBtn = document.getElementById("checkoutBtn");


    /* =====================================================
       GET CART
    ===================================================== */

    function getCart() {

        try {

            const savedCart = localStorage.getItem(CART_KEY);

            if (!savedCart) {
                return [];
            }

            const cart = JSON.parse(savedCart);

            return Array.isArray(cart) ? cart : [];

        } catch (error) {

            console.error("Cart loading error:", error);

            return [];

        }

    }


    /* =====================================================
       SAVE CART
    ===================================================== */

    function saveCart(cart) {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    }


    /* =====================================================
       FORMAT PRICE
    ===================================================== */

    function formatPrice(price) {

        return "₹" + Number(price || 0).toLocaleString("en-IN");

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       UPDATE BADGE
    ===================================================== */

    function updateCartBadge() {

        const cart = getCart();

        if (cartBadge) {

            cartBadge.textContent = cart.length;

        }

    }


    /* =====================================================
       RENDER CART
    ===================================================== */

    function updateGlobalCart() {

        const cart = getCart();

        updateCartBadge();


        if (!cartItemsList) {
            return;
        }


        cartItemsList.innerHTML = "";


        /* =================================================
           EMPTY CART
        ================================================= */

        if (cart.length === 0) {

            cartItemsList.innerHTML = `

                <div class="empty-cart">

                    <p>
                        <strong>Your cart is empty.</strong>
                    </p>

                    <p>
                        Choose a service or template
                        to start your order.
                    </p>

                </div>

            `;


            if (cartTotalVal) {

                cartTotalVal.textContent = "₹0";

            }


            if (checkoutBtn) {

                checkoutBtn.disabled = true;

            }

            return;

        }


        /* =================================================
           CART ITEMS
        ================================================= */

        let total = 0;


        cart.forEach(function (item, index) {

            const price = Number(item.price) || 0;

            total += price;


            const itemElement =
                document.createElement("div");

            itemElement.className = "cart-item";


            itemElement.innerHTML = `

                <div class="cart-item-info">

                    <strong>
                        ${escapeHTML(item.name)}
                    </strong>

                    <span>
                        ${formatPrice(price)}
                    </span>

                </div>


                <button
                    type="button"
                    class="cart-remove"
                    data-index="${index}"
                    aria-label="Remove ${escapeHTML(item.name)}"
                >
                    ×
                </button>

            `;


            cartItemsList.appendChild(itemElement);

        });


        /* =================================================
           TOTAL
        ================================================= */

        if (cartTotalVal) {

            cartTotalVal.textContent =
                formatPrice(total);

        }


        if (checkoutBtn) {

            checkoutBtn.disabled = false;

        }

    }


    /* =====================================================
       OPEN CART
    ===================================================== */

    function openGlobalCart() {

        updateGlobalCart();


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


    /* =====================================================
       CLOSE CART
    ===================================================== */

    function closeGlobalCart() {

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


    /* =====================================================
       MAKE FUNCTIONS GLOBAL
    ===================================================== */

    window.openGlobalCart =
        openGlobalCart;

    window.closeGlobalCart =
        closeGlobalCart;


    /* =====================================================
       HEADER CART BUTTON
    ===================================================== */

    if (cartToggle) {

        cartToggle.addEventListener(
            "click",
            function () {

                openGlobalCart();

            }
        );

    }


    /* =====================================================
       CLOSE BUTTON
    ===================================================== */

    if (cartClose) {

        cartClose.addEventListener(
            "click",
            function () {

                closeGlobalCart();

            }
        );

    }


    /* =====================================================
       OVERLAY
    ===================================================== */

    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            function () {

                closeGlobalCart();

            }
        );

    }


    /* =====================================================
       ESC KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeGlobalCart();

            }

        }
    );


    /* =====================================================
       REMOVE ITEM
    ===================================================== */

    if (cartItemsList) {

        cartItemsList.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(".cart-remove");


                if (!button) {
                    return;
                }


                const index =
                    Number(button.dataset.index);


                const cart = getCart();


                if (
                    Number.isInteger(index) &&
                    index >= 0 &&
                    index < cart.length
                ) {

                    cart.splice(index, 1);

                    saveCart(cart);

                    updateGlobalCart();

                }

            }
        );

    }


    /* =====================================================
       ADD SERVICE
       USED BY customizer.html
    ===================================================== */

    window.addServiceToGlobalCart =
        function (serviceName, price) {

            const cart = getCart();


            const numericPrice =
                Number(
                    String(price)
                        .replace(/,/g, "")
                ) || 0;


            /* CHECK DUPLICATE */

            const alreadyExists =
                cart.some(function (item) {

                    return item.name === serviceName;

                });


            if (alreadyExists) {

                alert(
                    serviceName +
                    " is already in your order."
                );

                openGlobalCart();

                return;

            }


            /* ADD SERVICE */

            cart.push({

                name: serviceName,

                price: numericPrice,

                type: "service"

            });


            saveCart(cart);

            updateGlobalCart();

            openGlobalCart();

        };


    /* =====================================================
       ADD TEMPLATE
       USED BY shop.html
    ===================================================== */

    window.addTemplate =
        function (templateName, price) {

            const cart = getCart();


            const numericPrice =
                Number(
                    String(price)
                        .replace(/,/g, "")
                ) || 0;


            /* CHECK DUPLICATE */

            const alreadyExists =
                cart.some(function (item) {

                    return item.name === templateName;

                });


            if (alreadyExists) {

                alert(
                    templateName +
                    " is already in your order."
                );

                openGlobalCart();

                return;

            }


            /* ADD TEMPLATE */

            cart.push({

                name: templateName,

                price: numericPrice,

                type: "template"

            });


            saveCart(cart);

            updateGlobalCart();

            openGlobalCart();

        };


    /* =====================================================
       WHATSAPP CHECKOUT
       SERVICES + TEMPLATES
    ===================================================== */

    function sendGlobalOrder() {

        const cart = getCart();


        if (cart.length === 0) {

            alert(
                "Your order is empty. Please add a service or template first."
            );

            return;

        }


        let total = 0;


        const products =
            cart.map(function (item, index) {

                const price =
                    Number(item.price) || 0;


                total += price;


                const type =
                    item.type === "template"
                        ? "Template"
                        : "Service";


                return (
                    (index + 1) +
                    ". " +
                    item.name +
                    " (" +
                    type +
                    ") - " +
                    formatPrice(price)
                );

            }).join("\n");


        const message =
`Hello Sai Graphic Designs 👋

I would like to place an order.

━━━━━━━━━━━━━━━━━━
SELECTED ITEMS
━━━━━━━━━━━━━━━━━━

${products}

━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━

Total Items: ${cart.length}

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

    }


    /* =====================================================
       CHECKOUT BUTTON
    ===================================================== */

    if (checkoutBtn) {

        checkoutBtn.addEventListener(
            "click",
            function () {

                sendGlobalOrder();

            }
        );

    }


    /* =====================================================
       MAKE CHECKOUT AVAILABLE GLOBALLY
    ===================================================== */

    window.sendGlobalOrder =
        sendGlobalOrder;


    /* =====================================================
       UPDATE IF ANOTHER PAGE CHANGES CART
    ===================================================== */

    window.addEventListener(
        "storage",
        function (event) {

            if (event.key === CART_KEY) {

                updateGlobalCart();

            }

        }
    );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    updateGlobalCart();

});
