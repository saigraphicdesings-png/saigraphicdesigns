/* =========================================================
   SAI GRAPHIC DESIGNS - MAIN JAVASCRIPT
   ONE SHARED CART FOR ALL PAGES
   Home / About / Services / Shop / Contact
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
                distance / (1000 * 60 * 60 * 24)
            );

            const hours = Math.floor(
                (distance % (1000 * 60 * 60 * 24)) /
                (1000 * 60 * 60)
            );

            const minutes = Math.floor(
                (distance % (1000 * 60 * 60)) /
                (1000 * 60)
            );

            const seconds = Math.floor(
                (distance % (1000 * 60)) /
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
       2. GLOBAL SHOPPING CART
       SAME CART ON EVERY PAGE
    ===================================================== */

    // Cart behavior is provided by each page's unified saiGraphicCart module.


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
                     * USE SAME GLOBAL CART
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

                    }

                }
            );

        }

    }


    /* =====================================================
       4. TOAST
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
       5. SHARED RESPONSIVE NAVIGATION
       One menu behavior across every public page.
    ===================================================== */

    function initMobileMenu() {

        const mobileMenuToggle =
            document.getElementById("mobileMenuBtn") ||
            document.getElementById("mobileMenuToggle");

        const mainNav =
            document.getElementById("mainNav");

        if (!mobileMenuToggle || !mainNav) {
            return;
        }

        /* Prevent duplicate initialization. */
        if (mobileMenuToggle.dataset.menuInitialized === "true") {
            return;
        }

        mobileMenuToggle.dataset.menuInitialized = "true";

        function closeMenu() {
            mainNav.classList.remove("mobile-open", "mobile-menu-open");
            document.body.classList.remove("mobile-nav-open");
            mobileMenuToggle.setAttribute("aria-expanded", "false");
            mobileMenuToggle.setAttribute("aria-label", "Open navigation menu");
            mobileMenuToggle.innerHTML = "☰";
        }

        function openMenu() {
            mainNav.classList.add("mobile-open", "mobile-menu-open");
            document.body.classList.add("mobile-nav-open");
            mobileMenuToggle.setAttribute("aria-expanded", "true");
            mobileMenuToggle.setAttribute("aria-label", "Close navigation menu");
            mobileMenuToggle.innerHTML = "✕";
        }

        mobileMenuToggle.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (mainNav.classList.contains("mobile-open")) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        mainNav.querySelectorAll(".nav-link").forEach(function (link) {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("click", function (event) {
            if (
                !mainNav.contains(event.target) &&
                !mobileMenuToggle.contains(event.target)
            ) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

        /* Highlight the current page consistently on desktop + mobile. */
        const currentPage =
            window.location.pathname.split("/").pop() || "index.html";

        mainNav.querySelectorAll(".nav-link").forEach(function (link) {
            const linkPage =
                link.getAttribute("href").split("/").pop().split("#")[0] ||
                "index.html";

            link.classList.toggle(
                "active",
                linkPage === currentPage
            );
        });
    }
    /* =====================================================
       INITIALIZE EVERYTHING
    ===================================================== */

    initCountdown();

    initCustomizer();

    initMobileMenu();

});
