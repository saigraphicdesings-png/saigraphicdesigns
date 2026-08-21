/*
=====================================================
SHOP TEMPLATE SYSTEM
USES THE SAME CART AS SERVICES
=====================================================
*/

window.addTemplate = function (templateName, price) {

    /*
    Convert price safely.

    Examples:
    99
    "99"
    "₹99"
    "₹1,299"
    */

    const numericPrice = Number(
        String(price ?? "")
            .replace(/[₹,\s]/g, "")
    );


    /*
    Validate template name
    */

    if (!templateName) {

        console.error(
            "Template name is missing."
        );

        return;

    }


    /*
    Validate price
    */

    if (
        price === undefined ||
        price === null ||
        isNaN(numericPrice)
    ) {

        console.error(
            "Invalid template price:",
            templateName,
            price
        );

        alert(
            "Unable to add this template because its price is invalid."
        );

        return;

    }


    /*
    IMPORTANT:

    Use the SAME function used by Services.

    This means:

    Shop
       ↓
    addTemplate()
       ↓
    addServiceToGlobalCart()
       ↓
    saiGraphicCart
       ↓
    SAME CART DRAWER
    */

    if (
        typeof window.addServiceToGlobalCart !==
        "function"
    ) {

        console.error(
            "Shared cart is not loaded."
        );

        alert(
            "Cart system could not be loaded. Please refresh the page."
        );

        return;

    }


    window.addServiceToGlobalCart(
        templateName,
        numericPrice
    );

};
