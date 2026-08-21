document.addEventListener("DOMContentLoaded", function () {


    /*
    =====================================================
    GLOBAL CART
    =====================================================
    */

    const CART_KEY = "saiGraphicCart";


    /*
    =====================================================
    CART ELEMENTS
    =====================================================
    */

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


    /*
    =====================================================
    GET CART
    =====================================================
    */

    function getCart() {

        try {

            const saved =
                localStorage.getItem(CART_KEY);


            if (!saved) {

                return [];

            }


            const cart =
                JSON.parse(saved);


            return Array.isArray(cart)
                ? cart
                : [];

        } catch (error) {

            console.error(
                "Cart loading error:",
                error
            );

            return [];

        }

    }


    /*
    =====================================================
    SAVE CART
    =====================================================
    */

    function saveCart(cart) {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    }


    /*
    =====================================================
    PRICE CONVERTER
    =====================================================
    */

    function normalizePrice(price) {

        /*
        Supports:

        1000
        "1000"
        "₹1000"
        "₹1,000"
        */

        const cleaned =
            String(price ?? "")
                .replace(/[₹,\s]/g, "");


        const number =
            Number(cleaned);


        return isNaN(number)
            ? null
            : number;

    }


    /*
    =====================================================
    FORMAT PRICE
    =====================================================
    */

    function formatPrice(price) {

        const numericPrice =
            normalizePrice(price);


        return "₹" +
            Number(
                numericPrice || 0
            ).toLocaleString("en-IN");

    }


    /*
    =====================================================
    ESCAPE HTML
    =====================================================
    */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /*
    =====================================================
    UPDATE CART
    =====================================================
    */

    function updateCart() {

        const cart =
            getCart();


        /*
        CART BADGE
        */

        if (cartBadge) {

            cartBadge.textContent =
                cart.length;

        }


        /*
        CART CONTENT
        */

        if (!cartItemsList) {

            return;

        }


        cartItemsList.innerHTML = "";


        /*
        EMPTY CART
        */

        if (cart.length === 0) {

            cartItemsList.innerHTML = `

                <div class="empty-cart">

                    <p>
                        <strong>
                            Your cart is empty.
                        </strong>
                    </p>

                    <p>
                        Choose a service or template
                        to start your order.
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


        /*
        =================================================
        CART ITEMS
        =================================================
        */

        let total = 0;


        cart.forEach(function (item, index) {


            const price =
                normalizePrice(item.price);


            /*
            If price is invalid,
            do not silently turn it into ₹0.
            */

            const safePrice =
                price === null
                    ? 0
                    : price;


            total += safePrice;


            /*
            ITEM
            */

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

                        ${formatPrice(safePrice)}

                    </div>

                </div>


                <button
                    type="button"
                    class="cart-remove"
                    data-index="${index}"
                    aria-label="Remove ${escapeHTML(item.name)}">

                    ×

                </button>

            `;


            cartItemsList.appendChild(
                itemElement
            );

        });


        /*
        TOTAL
        */

        if (cartTotalVal) {

            cartTotalVal.textContent =
                formatPrice(total);

        }


        /*
        ENABLE CHECKOUT
        */

        if (cartCheckout) {

            cartCheckout.disabled =
                false;

        }

    }


    /*
    =====================================================
    OPEN CART
    =====================================================
    */

    function openCart() {

        updateCart();


        if (cartDrawer) {

            cartDrawer.classList.add(
                "active"
            );

            cartDrawer.setAttribute(
                "aria-hidden",
                "false"
            );

        }


        if (cartOverlay) {

            cartOverlay.classList.add(
                "active"
            );

            cartOverlay.setAttribute(
                "aria-hidden",
                "false"
            );

        }


        document.body.style.overflow =
            "hidden";

    }


    /*
    =====================================================
    CLOSE CART
    =====================================================
    */

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


        document.body.style.overflow =
            "";

    }


    /*
    =====================================================
    MAKE CART FUNCTIONS GLOBAL
    =====================================================
    */

    window.openCart =
        openCart;

    window.closeCart =
        closeCart;


    /*
    =====================================================
    CART BUTTON
    =====================================================
    */

    if (cartToggle) {

        cartToggle.addEventListener(
            "click",
            function () {

                openCart();

            }
        );

    }


    /*
    =====================================================
    CLOSE BUTTON
    =====================================================
    */

    if (cartClose) {

        cartClose.addEventListener(
            "click",
            function () {

                closeCart();

            }
        );

    }


    /*
    =====================================================
    OVERLAY
    =====================================================
    */

    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            function () {

                closeCart();

            }
        );

    }


    /*
    =====================================================
    ESCAPE KEY
    =====================================================
    */

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


    /*
    =====================================================
    REMOVE ITEM
    =====================================================
    */

    if (cartItemsList) {

        cartItemsList.addEventListener(
            "click",
            function (event) {


                const button =
                    event.target.closest(
                        ".cart-remove"
                    );


                if (!button) {

                    return;

                }


                const index =
                    Number(
                        button.dataset.index
                    );


                const cart =
                    getCart();


                if (
                    Number.isInteger(index) &&
                    index >= 0 &&
                    index < cart.length
                ) {

                    cart.splice(
                        index,
                        1
                    );


                    saveCart(cart);

                    updateCart();

                }

            }
        );

    }


    /*
    =====================================================
    ADD SERVICE
    =====================================================
    */
window.addServiceToGlobalCart = function (serviceName, price) {

    const cart = getCart();

    const numericPrice = Number(
        String(price).replace(/,/g, "")
    ) || 0;


    /* ==========================================
       CHECK IF ITEM ALREADY EXISTS
    ========================================== */

    const existingIndex = cart.findIndex(function (item) {

        return item.name === serviceName;

    });


    /* ==========================================
       ITEM ALREADY EXISTS
    ========================================== */

    if (existingIndex !== -1) {

        /*
         * IMPORTANT:
         * If old cart contains ₹0,
         * replace it with the correct price.
         */

        if (
            Number(cart[existingIndex].price) === 0 &&
            numericPrice > 0
        ) {

            cart[existingIndex].price =
                numericPrice;

            cart[existingIndex].type =
                "service";

            saveCart(cart);

            updateGlobalCart();

            openGlobalCart();

            return;

        }


        alert(
            serviceName +
            " is already in your order."
        );

        openGlobalCart();

        return;

    }


    /* ==========================================
       ADD NEW SERVICE
    ========================================== */

    cart.push({

        name: serviceName,

        price: numericPrice,

        type: "service"

    });


    saveCart(cart);

    updateGlobalCart();

    openGlobalCart();

};

            /*
            LOAD CART
            */

            const cart =
                getCart();


            /*
            DUPLICATE CHECK
            */

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


            /*
            ADD ITEM
            */

            cart.push({

                name:
                    serviceName,

                price:
                    numericPrice

            });


            /*
            SAVE
            */

            saveCart(cart);


            /*
            UPDATE
            */

            updateCart();


            /*
            OPEN SAME CART
            */

            openCart();

        };


    /*
    =====================================================
    WHATSAPP CHECKOUT
    =====================================================
    */

    if (cartCheckout) {

        cartCheckout.addEventListener(
            "click",
            function () {


                const cart =
                    getCart();


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
                                normalizePrice(
                                    item.price
                                );


                            const safePrice =
                                price === null
                                    ? 0
                                    : price;


                            total +=
                                safePrice;


                            return (
                                (index + 1) +
                                ". " +
                                item.name +
                                " - " +
                                formatPrice(
                                    safePrice
                                )
                            );

                        }
                    ).join("\n");


                /*
                WHATSAPP MESSAGE
                */

                const message =
`Hello Sai Graphic Designs 👋

I would like to order the following services/templates:

━━━━━━━━━━━━━━━━━━
SELECTED ITEMS
━━━━━━━━━━━━━━━━━━

${items}

━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━

Number of Items: ${cart.length}

Estimated Total: ${formatPrice(total)}

Please contact me to confirm the order, payment and delivery details.

Thank you!
Sai Graphic Designs Website`;


                /*
                CORRECT WHATSAPP URL
                */

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


    /*
    =====================================================
    UPDATE CART WHEN RETURNING TO PAGE
    =====================================================
    */

    window.addEventListener(
        "pageshow",
        function () {

            updateCart();

        }
    );


    /*
    =====================================================
    UPDATE CART WHEN OTHER PAGE CHANGES IT
    =====================================================
    */

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


    /*
    =====================================================
    INITIAL LOAD
    =====================================================
    */

    updateCart();

});
