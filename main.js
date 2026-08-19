/* =========================================================
   SAI GRAPHIC DESIGNS - MAIN JAVASCRIPT
   Works on:
   Home
   About
   Services / Customizer
   Contact
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       1. PROMO SALE COUNTDOWN
    ===================================================== */

    function initCountdown() {

        const daysEl = document.getElementById("promoDays");
        const hoursEl = document.getElementById("promoHours");
        const minutesEl = document.getElementById("promoMinutes");
        const secondsEl = document.getElementById("promoSeconds");

        // Countdown does not exist on this page
        if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
            return;
        }

        let targetDate = localStorage.getItem("print_countdown_target");

        if (!targetDate) {

            targetDate =
                Date.now() +
                (10 * 24 * 60 * 60 * 1000);

            localStorage.setItem(
                "print_countdown_target",
                targetDate
            );

        } else {

            targetDate = parseInt(targetDate, 10);

        }


        function updateClock() {

            const now = Date.now();
            const distance = targetDate - now;

            if (distance <= 0) {

                targetDate =
                    Date.now() +
                    (10 * 24 * 60 * 60 * 1000);

                localStorage.setItem(
                    "print_countdown_target",
                    targetDate
                );

                return;
            }


            const days = Math.floor(
                distance /
                (1000 * 60 * 60 * 24)
            );

            const hours = Math.floor(
                (distance %
                    (1000 * 60 * 60 * 24)) /
                (1000 * 60 * 60)
            );

            const minutes = Math.floor(
                (distance %
                    (1000 * 60 * 60)) /
                (1000 * 60)
            );

            const seconds = Math.floor(
                (distance %
                    (1000 * 60)) /
                1000
            );


            daysEl.textContent =
                String(days).padStart(2, "0");

            hoursEl.textContent =
                String(hours).padStart(2, "0");

            minutesEl.textContent =
                String(minutes).padStart(2, "0");

            secondsEl.textContent =
                String(seconds).padStart(2, "0");
        }


        updateClock();

        setInterval(updateClock, 1000);
    }



    /* =====================================================
       2. SHOPPING CART
       Shared between ALL pages using localStorage
    ===================================================== */

    function initCart() {

        const CART_KEY = "printmax_cart";

        let cart = [];


        /* =================================================
           LOAD CART SAFELY
        ================================================= */

        function loadCart() {

            try {

                const savedCart =
                    localStorage.getItem(CART_KEY);

                if (!savedCart) {
                    cart = [];
                    return;
                }

                const parsedCart =
                    JSON.parse(savedCart);

                if (Array.isArray(parsedCart)) {

                    cart = parsedCart;

                } else {

                    cart = [];

                }

            } catch (error) {

                console.error(
                    "Could not load cart:",
                    error
                );

                cart = [];
            }
        }


        /* =================================================
           SAVE CART
        ================================================= */

        function saveCart() {

            try {

                localStorage.setItem(
                    CART_KEY,
                    JSON.stringify(cart)
                );

            } catch (error) {

                console.error(
                    "Could not save cart:",
                    error
                );

            }
        }


        /* =================================================
           UPDATE CART UI
        ================================================= */

        function updateCartUI() {

            /* ---------------------------------------------
               CART COUNT
            --------------------------------------------- */

            const count = cart.reduce(
                function (total, item) {

                    return total +
                        (Number(item.qty) || 0);

                },
                0
            );


            /* ---------------------------------------------
               CART TOTAL
            --------------------------------------------- */

            const totalCost = cart.reduce(
                function (total, item) {

                    const price =
                        Number(item.price) || 0;

                    const qty =
                        Number(item.qty) || 0;

                    return total +
                        (price * qty);

                },
                0
            );


            /* ---------------------------------------------
               UPDATE ALL CART BADGES
            --------------------------------------------- */

            const badges =
                document.querySelectorAll(
                    ".cart-badge"
                );

            badges.forEach(function (badge) {

                badge.textContent = count;

            });


            /* ---------------------------------------------
               UPDATE TOTAL
            --------------------------------------------- */

            const totalCostEl =
                document.getElementById(
                    "cartTotalVal"
                );

            if (totalCostEl) {

                totalCostEl.textContent =
                    "₹" + totalCost.toFixed(2);

            }


            /* ---------------------------------------------
               CART ITEMS
            --------------------------------------------- */

            const listContainer =
                document.getElementById(
                    "cartItemsList"
                );

            if (!listContainer) {
                return;
            }


            /* ---------------------------------------------
               EMPTY CART
            --------------------------------------------- */

            if (cart.length === 0) {

                listContainer.innerHTML = `
                    <p
                        style="
                            text-align:center;
                            color:var(--dark-muted);
                            margin-top:2rem;
                        "
                    >
                        Your cart is empty
                    </p>
                `;

                return;
            }


            /* ---------------------------------------------
               CART ITEMS HTML
            --------------------------------------------- */

            listContainer.innerHTML =
                cart.map(function (item) {

                    const price =
                        Number(item.price) || 0;

                    const qty =
                        Number(item.qty) || 0;


                    return `
                        <div
                            class="cart-item"
                            style="
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                                gap:1rem;
                                border-bottom:1px solid var(--border);
                                padding:0.75rem 0;
                            "
                        >

                            <div
                                style="
                                    min-width:0;
                                    flex:1;
                                "
                            >

                                <h5
                                    style="
                                        font-weight:700;
                                        color:var(--dark);
                                        margin:0 0 0.25rem;
                                    "
                                >
                                    ${escapeHTML(item.name)}
                                </h5>

                                <p
                                    style="
                                        font-size:0.85rem;
                                        color:var(--dark-muted);
                                        margin:0;
                                    "
                                >
                                    ${qty} × ₹${price.toFixed(2)}
                                </p>

                                ${
                                    item.customText
                                        ? `
                                            <p
                                                style="
                                                    font-size:0.75rem;
                                                    color:var(--primary);
                                                    font-style:italic;
                                                    margin-top:0.25rem;
                                                "
                                            >
                                                Print:
                                                "${escapeHTML(item.customText)}"
                                            </p>
                                        `
                                        : ""
                                }

                            </div>


                            <button
                                type="button"
                                class="cart-remove-btn"
                                data-id="${escapeHTML(String(item.id))}"
                                style="
                                    background:none;
                                    border:none;
                                    color:#ef4444;
                                    cursor:pointer;
                                    font-weight:600;
                                    flex-shrink:0;
                                "
                            >
                                Remove
                            </button>

                        </div>
                    `;

                }).join("");


            /* ---------------------------------------------
               REMOVE BUTTONS
            --------------------------------------------- */

            listContainer
                .querySelectorAll(".cart-remove-btn")
                .forEach(function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const id =
                                button.getAttribute(
                                    "data-id"
                                );

                            cart =
                                cart.filter(
                                    function (item) {

                                        return String(item.id) !==
                                            String(id);

                                    }
                                );

                            saveCart();

                            updateCartUI();

                        }
                    );

                });

        }


        /* =================================================
           ESCAPE HTML
        ================================================= */

        function escapeHTML(value) {

            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }


        /* =================================================
           ADD PRODUCT TO CART
        ================================================= */

        function initAddToCartButtons() {

            const buttons =
                document.querySelectorAll(
                    ".btn-add-cart"
                );


            buttons.forEach(function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        const name =
                            button.getAttribute(
                                "data-name"
                            ) || "Service";


                        const price =
                            parseFloat(
                                button.getAttribute(
                                    "data-price"
                                )
                            ) || 0;


                        /*
                         * Use an existing product if
                         * the same service already exists.
                         */

                        const existingItem =
                            cart.find(
                                function (item) {

                                    return (
                                        item.name === name &&
                                        !item.customText
                                    );

                                }
                            );


                        if (existingItem) {

                            existingItem.qty =
                                (Number(existingItem.qty) || 0) + 1;

                        } else {

                            cart.push({

                                id:
                                    "prod_" +
                                    Date.now() +
                                    "_" +
                                    Math.random()
                                        .toString(36)
                                        .substring(2, 8),

                                name: name,

                                price: price,

                                qty: 1

                            });

                        }


                        saveCart();

                        updateCartUI();

                        showToast(
                            "Added " +
                            name +
                            " to cart!"
                        );

                    }
                );

            });

        }


        /* =================================================
           CART OPEN / CLOSE
        ================================================= */

        function initCartButtons() {

            const cartToggle =
                document.getElementById(
                    "cartToggle"
                );

            const cartDrawer =
                document.getElementById(
                    "cartDrawer"
                );

            const cartClose =
                document.getElementById(
                    "cartClose"
                );


            /* ---------------------------------------------
               OPEN CART
            --------------------------------------------- */

            if (cartToggle && cartDrawer) {

                cartToggle.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        cartDrawer.classList.add(
                            "open"
                        );

                    }
                );

            }


            /* ---------------------------------------------
               CLOSE CART
            --------------------------------------------- */

            if (cartClose && cartDrawer) {

                cartClose.addEventListener(
                    "click",
                    function () {

                        cartDrawer.classList.remove(
                            "open"
                        );

                    }
                );

            }


            /* ---------------------------------------------
               CLOSE CART WITH ESC
            --------------------------------------------- */

            document.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Escape" &&
                        cartDrawer
                    ) {

                        cartDrawer.classList.remove(
                            "open"
                        );

                    }

                }
            );


            /* ---------------------------------------------
               CLOSE WHEN CLICKING OUTSIDE
            --------------------------------------------- */

            document.addEventListener(
                "click",
                function (event) {

                    if (
                        !cartDrawer ||
                        !cartDrawer.classList.contains("open")
                    ) {
                        return;
                    }


                    if (
                        !cartDrawer.contains(event.target) &&
                        !cartToggle?.contains(event.target)
                    ) {

                        cartDrawer.classList.remove(
                            "open"
                        );

                    }

                }
            );

        }


        /* =================================================
           INITIALIZE CART
        ================================================= */

        loadCart();

        initAddToCartButtons();

        initCartButtons();

        updateCartUI();


        /* =================================================
           GLOBAL CART STATE
           Used by customizer
        ================================================= */

        window.cartState = {

            get cart() {
                return cart;
            },

            set cart(value) {

                if (Array.isArray(value)) {
                    cart = value;
                }

            },

            updateCartUI: updateCartUI,

            saveCart: saveCart,

            addItem: function (item) {

                cart.push(item);

                saveCart();

                updateCartUI();

            }

        };


        /* =================================================
           UPDATE CART IF ANOTHER TAB/PAGE CHANGES IT
        ================================================= */

        window.addEventListener(
            "storage",
            function (event) {

                if (event.key === CART_KEY) {

                    loadCart();

                    updateCartUI();

                }

            }
        );

    }



    /* =====================================================
       3. CUSTOMIZER
    ===================================================== */

    function initCustomizer() {

        const textInput =
            document.getElementById(
                "customTextVal"
            );

        const previewText =
            document.getElementById(
                "previewTextEl"
            );

        const colorBtns =
            document.querySelectorAll(
                ".color-option-btn"
            );

        const tshirtPath =
            document.getElementById(
                "tshirtPathEl"
            );

        const customizerForm =
            document.getElementById(
                "customizerForm"
            );


        /*
         * IMPORTANT:
         * If this is not the Services page,
         * simply stop here.
         */

        if (!textInput) {
            return;
        }


        /* =================================================
           TEXT PREVIEW
        ================================================= */

        if (previewText) {

            textInput.addEventListener(
                "input",
                function (event) {

                    previewText.textContent =
                        event.target.value ||
                        "Your Design";

                }
            );

        }


        /* =================================================
           COLOR OPTIONS
        ================================================= */

        colorBtns.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        colorBtns.forEach(
                            function (btn) {

                                btn.classList.remove(
                                    "active"
                                );

                            }
                        );


                        button.classList.add(
                            "active"
                        );


                        const colorCode =
                            button.getAttribute(
                                "data-color"
                            );


                        if (
                            tshirtPath &&
                            colorCode
                        ) {

                            tshirtPath.style.fill =
                                colorCode;

                        }


                        if (previewText) {

                            if (
                                colorCode.toLowerCase() ===
                                    "#ffffff" ||
                                colorCode.toLowerCase() ===
                                    "#f3f4f6"
                            ) {

                                previewText.style.color =
                                    "#111827";

                            } else {

                                previewText.style.color =
                                    "#ffffff";

                            }

                        }

                    }
                );

            }
        );


        /* =================================================
           CUSTOMIZER ADD TO CART
        ================================================= */

        if (customizerForm) {

            customizerForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();


                    const text =
                        textInput.value.trim() ||
                        "Your Design";


                    const activeColorBtn =
                        document.querySelector(
                            ".color-option-btn.active"
                        );


                    const colorName =
                        activeColorBtn
                            ? (
                                activeColorBtn.getAttribute(
                                    "title"
                                ) || "White"
                            )
                            : "White";


                    const item = {

                        id:
                            "custom_" +
                            Date.now() +
                            "_" +
                            Math.random()
                                .toString(36)
                                .substring(2, 8),

                        name:
                            `Custom T-Shirt (${colorName})`,

                        price: 35.00,

                        qty: 1,

                        customText: text

                    };


                    /*
                     * Add through global cart state.
                     */

                    if (window.cartState) {

                        window.cartState.addItem(
                            item
                        );

                        showToast(
                            "Added custom T-Shirt to cart!"
                        );


                        textInput.value = "";


                        if (previewText) {

                            previewText.textContent =
                                "Your Design";

                        }

                    } else {

                        /*
                         * Safety fallback.
                         */

                        let savedCart =
                            JSON.parse(
                                localStorage.getItem(
                                    "printmax_cart"
                                ) || "[]"
                            );


                        savedCart.push(item);


                        localStorage.setItem(
                            "printmax_cart",
                            JSON.stringify(
                                savedCart
                            )
                        );


                        showToast(
                            "Added custom T-Shirt to cart!"
                        );

                    }

                }
            );

        }

    }



    /* =====================================================
       4. TOAST MESSAGE
    ===================================================== */

    function showToast(text) {

        let toast =
            document.querySelector(
                ".toast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );

            toast.className =
                "toast";

            toast.innerHTML = `
                <span class="toast-text"></span>
            `;

            document.body.appendChild(
                toast
            );

        }


        const toastText =
            toast.querySelector(
                ".toast-text"
            );


        if (toastText) {

            toastText.textContent =
                text;

        }


        toast.classList.add(
            "show"
        );


        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            4000
        );

    }



    /* =====================================================
       5. MOBILE MENU
    ===================================================== */

    function initMobileMenu() {

        const mobileMenuBtn =
            document.getElementById(
                "mobileMenuBtn"
            );

        const mainNav =
            document.getElementById(
                "mainNav"
            );


        /*
         * Some pages may not have the mobile menu.
         * Do not stop other JavaScript.
         */

        if (!mobileMenuBtn || !mainNav) {
            return;
        }


        /* =================================================
           CLOSE MENU
        ================================================= */

        function closeMobileMenu() {

            mainNav.classList.remove(
                "mobile-menu-open"
            );


            mobileMenuBtn.setAttribute(
                "aria-expanded",
                "false"
            );


            mobileMenuBtn.setAttribute(
                "aria-label",
                "Open navigation menu"
            );


            mobileMenuBtn.innerHTML =
                "☰";

        }


        /* =================================================
           OPEN / CLOSE
        ================================================= */

        mobileMenuBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                const isOpen =
                    mainNav.classList.toggle(
                        "mobile-menu-open"
                    );


                mobileMenuBtn.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );


                if (isOpen) {

                    mobileMenuBtn.setAttribute(
                        "aria-label",
                        "Close navigation menu"
                    );

                    mobileMenuBtn.innerHTML =
                        "✕";

                } else {

                    closeMobileMenu();

                }

            }
        );


        /* =================================================
           NAVIGATION LINKS
        ================================================= */

        const navLinks =
            mainNav.querySelectorAll(
                ".nav-link"
            );


        navLinks.forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        closeMobileMenu();

                    }
                );

            }
        );


        /* =================================================
           CLICK OUTSIDE
        ================================================= */

        document.addEventListener(
            "click",
            function (event) {

                if (
                    !mainNav.contains(event.target) &&
                    !mobileMenuBtn.contains(event.target)
                ) {

                    closeMobileMenu();

                }

            }
        );


        /* =================================================
           ESC KEY
        ================================================= */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    closeMobileMenu();

                }

            }
        );


        /* =================================================
           DESKTOP RESET
        ================================================= */

        window.addEventListener(
            "resize",
            function () {

                if (
                    window.innerWidth > 900
                ) {

                    closeMobileMenu();

                }

            }
        );

    }



    /* =====================================================
       INITIALIZE EVERYTHING
    ===================================================== */

    initCountdown();

    initCart();

    initCustomizer();

    initMobileMenu();

});
