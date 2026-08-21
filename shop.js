document.addEventListener("DOMContentLoaded", function () {

    /*
     * SHOP USES THE SAME CART AS SERVICES
     *
     * Cart storage:
     * saiGraphicCart
     *
     * The actual cart drawer, remove buttons,
     * total and WhatsApp checkout are controlled
     * by your existing service cart JavaScript.
     */


    /* =====================================================
       ADD SHOP TEMPLATE TO SAME CART
    ===================================================== */

    window.addTemplate = function (templateName, price) {

        const finalPrice = Number(price) || 0;


        /*
         * Use the existing service cart function.
         */

        if (
            typeof window.addServiceToGlobalCart === "function"
        ) {

            window.addServiceToGlobalCart(
                templateName,
                finalPrice
            );

            return;
        }


        /*
         * If this appears, main.js/cart.js is not loaded
         * before shop.js.
         */

        console.error(
            "addServiceToGlobalCart() is not available."
        );

        alert(
            "Cart is not available. Please refresh the page."
        );

    };


});
