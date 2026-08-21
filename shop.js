document.addEventListener("DOMContentLoaded", function () {

    /*
    =====================================================
    SHOP → SAME CART AS SERVICES
    =====================================================
    */

    window.addTemplate = function (templateName, price) {

        // Make sure price is a real number
        const numericPrice = Number(
            String(price).replace(/[₹,\s]/g, "")
        );

        if (!templateName) {
            console.error("Template name is missing.");
            return;
        }

        if (isNaN(numericPrice)) {
            console.error(
                "Invalid template price:",
                price
            );
            return;
        }

        /*
        Use the EXISTING SERVICE CART function.

        This is the important part.
        Shop templates are added to the same
        saiGraphicCart used by Services.
        */

        if (
            typeof window.addServiceToGlobalCart ===
            "function"
        ) {

            window.addServiceToGlobalCart(
                templateName,
                numericPrice
            );

        } else {

            console.error(
                "addServiceToGlobalCart() is not available. Make sure cart.js is loaded."
            );

        }

    };

});
