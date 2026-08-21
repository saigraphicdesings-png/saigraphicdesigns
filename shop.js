/* =====================================================
   SAI GRAPHIC DESIGNS
   SHOP TEMPLATE CART CONNECTION
   Uses the SAME cart as Services
===================================================== */


document.addEventListener("DOMContentLoaded", function () {


    /* =================================================
       ADD SHOP TEMPLATE TO SAME GLOBAL CART
    ================================================= */

    window.addTemplate = function (templateName, price) {

        /*
         * Your existing service cart already provides:
         *
         * addServiceToGlobalCart()
         *
         * We simply send the shop template to it.
         */

        if (
            typeof window.addServiceToGlobalCart ===
            "function"
        ) {

            window.addServiceToGlobalCart(
                templateName,
                Number(price) || 0
            );

            return;
        }


        /*
         * Safety fallback.
         * This only happens if main.js/cart.js
         * was not loaded correctly.
         */

        console.error(
            "addServiceToGlobalCart() was not found."
        );

        alert(
            "Cart could not be loaded. Please refresh the page."
        );

    };


});
