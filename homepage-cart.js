document.addEventListener("DOMContentLoaded", function () {

    const CART_KEY = "saiGraphicCart";

    let cart = loadCart();


    /* =========================================
       LOAD CART
    ========================================= */

    function loadCart() {

        try {

            const savedCart =
                localStorage.getItem(CART_KEY);

            if (!savedCart) {
                return [];
            }

            const parsed =
                JSON.parse(savedCart);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error("Cart loading error:", error);

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
       FORMAT PRICE
    ========================================= */

    function formatPrice(price) {

        return "₹" +
            Number(price || 0)
                .toLocaleString("en-IN");

    }


    /* =========================================
       ELEMENTS
    ========================================= */

    const cartToggle =
        document.getElementById("cartToggle");

    const cartClose =
        document.getElementById("cartClose");

    const cartDrawer =
        document.getElementById("cartDrawer");

    const cartOverlay =
        document.getElementById("cartOverlay");

    const cartBadge =
        document.getElementById("cartBadge");

    const cartItemsList =
        document.getElementById("cartItemsList");

    const cartTotalVal =
        document.getElementById("cartTotalVal");

    const checkoutBtn =
        document.getElementById("cartCheckout");

    let lastFocusedElement = null;

    function getFocusableElements() {
        if (!cartDrawer) return [];
        return Array.from(cartDrawer.querySelectorAll(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(function (element) {
            return !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true";
        });
    }


    /* =========================================
       OPEN CART
    ========================================= */

    function openCart() {

        updateCart();
        lastFocusedElement = document.activeElement;

        if (cartDrawer) {

            cartDrawer.classList.add("active");

            cartDrawer.setAttribute(
                "aria-hidden",
                "false"
            );

            window.requestAnimationFrame(function () {
                const focusable = getFocusableElements();
                (focusable[0] || cartDrawer).focus();
            });

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


    /* =========================================
       CLOSE CART
    ========================================= */

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

        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }

        lastFocusedElement = null;

    }


    /* =========================================
       ESCAPE HTML
    ========================================= */

    function escapeHTML(value) {

        return String(value ?? "")

            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =========================================
       UPDATE CART
    ========================================= */

    function updateCart() {

        /* Reload latest cart */

        cart = loadCart();


        /* Safety check */

        if (!cartItemsList) {
            return;
        }


        cartItemsList.innerHTML = "";


        let total = 0;


        /* =========================================
           EMPTY CART
        ========================================= */

        if (cart.length === 0) {

            cartItemsList.innerHTML = `

                <div class="empty-cart">

                    <div class="empty-cart-icon">
                        🛒
                    </div>

                    <p>
                        <strong>
                            Your cart is empty.
                        </strong>
                    </p>

                    <p>
                        Choose a service and click
                        "Add to Order".
                    </p>

                </div>

            `;


            if (cartBadge) {

                cartBadge.textContent = "0";
                cartBadge.setAttribute("aria-label", "0 items in cart");

            }


            if (cartTotalVal) {

                cartTotalVal.textContent = "₹0";

            }


            if (checkoutBtn) {

                checkoutBtn.disabled = true;

            }


            return;

        }


        /* =========================================
           CART ITEMS
        ========================================= */

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
                        ${escapeHTML(item.name || "Service")}
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


        /* =========================================
           BADGE
        ========================================= */

        if (cartBadge) {

            cartBadge.textContent =
                cart.length;
            cartBadge.setAttribute(
                "aria-label",
                cart.length + (cart.length === 1 ? " item in cart" : " items in cart")
            );

        }


        /* =========================================
           TOTAL
        ========================================= */

        if (cartTotalVal) {

            cartTotalVal.textContent =
                formatPrice(total);

        }


        /* =========================================
           CHECKOUT
        ========================================= */

        if (checkoutBtn) {

            checkoutBtn.disabled = false;

        }


        /* =========================================
           REMOVE BUTTONS
        ========================================= */

        cartItemsList
            .querySelectorAll(".cart-remove")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                this.dataset.index
                            );


                        if (
                            Number.isInteger(index) &&
                            index >= 0 &&
                            index < cart.length
                        ) {

                            cart.splice(index, 1);

                            saveCart();

                            updateCart();

                        }

                    }
                );

            });

    }


    /* =========================================
       CART OPEN BUTTON
    ========================================= */

    if (cartToggle) {

        cartToggle.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                openCart();

            }
        );

    } else {

        console.warn(
            "Cart button #cartToggle was not found."
        );

    }


    /* =========================================
       CLOSE BUTTON
    ========================================= */

    if (cartClose) {

        cartClose.addEventListener(
            "click",
            closeCart
        );

    }


    /* =========================================
       OVERLAY
    ========================================= */

    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCart
        );

    }


    /* =========================================
       ESC KEY
    ========================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeCart();

            }

            if (
                event.key === "Tab" &&
                cartDrawer &&
                cartDrawer.classList.contains("active")
            ) {
                const focusable = getFocusableElements();
                if (!focusable.length) {
                    event.preventDefault();
                    cartDrawer.focus();
                    return;
                }

                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }

        }
    );


    /* =========================================
       CHECKOUT / WHATSAPP
    ========================================= */

    if (checkoutBtn) {

        checkoutBtn.addEventListener(
            "click",
            function () {

                cart = loadCart();


                if (cart.length === 0) {

                    return;

                }


                let total = 0;


                const serviceList =
                    cart
                        .map(function (item, index) {

                            const price =
                                Number(item.price) || 0;


                            total += price;


                            return (
                                (index + 1) +
                                ". " +
                                (item.name || "Service") +
                                " - " +
                                formatPrice(price)
                            );

                        })
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

Thank you!`;


                const whatsappURL =
                    "https://wa.me/916381128781?text=" +
                    encodeURIComponent(message);


                if (window.SaiAnalytics) window.SaiAnalytics.trackEvent("whatsapp_click");


                window.open(
                    whatsappURL,
                    "_blank",
                    "noopener,noreferrer"
                );

            }
        );

    }


    /* =========================================
       LISTEN FOR STORAGE CHANGES
       (moved into this closure so CART_KEY
       and updateCart are actually in scope)
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
