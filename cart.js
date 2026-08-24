document.addEventListener("DOMContentLoaded", function () {

    const CART_KEY = "saiGraphicCart";

    const serviceOptions =
        document.querySelectorAll(".service-option");

    const selectedService =
        document.getElementById("selectedService");

    const mockupTitle =
        document.getElementById("mockupTitle");

    const mockupDescription =
        document.getElementById("mockupDescription");

    const mockupIcon =
        document.getElementById("mockupIcon");

    const servicePrice =
        document.getElementById("servicePrice");


    let selectedServiceData = {

        id: "logo-design",

        name: "Logo Design",

        price: 1000,

        icon: "✏️",

        category: "Services",

        description:
            "Professional logo design created according to your brand identity."

    };


    function formatPrice(price) {

        return "₹" +
            Number(price).toLocaleString("en-IN");

    }


    function selectService(option) {

        serviceOptions.forEach(function (item) {

            item.classList.remove("active");

        });


        option.classList.add("active");


        selectedServiceData = {

            id:
                "service-" +
                option.dataset.service
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-"),

            name:
                option.dataset.service,

            price:
                Number(option.dataset.price),

            icon:
                option.dataset.icon,

            category:
                "Services",

            description:
                option.dataset.description

        };


        selectedService.textContent =
            selectedServiceData.name;


        mockupTitle.textContent =
            selectedServiceData.name;


        mockupIcon.textContent =
            selectedServiceData.icon;


        mockupDescription.textContent =
            selectedServiceData.description;


        servicePrice.textContent =
            formatPrice(
                selectedServiceData.price
            );

    }


    serviceOptions.forEach(function (option) {

        option.addEventListener(
            "click",
            function (event) {

                if (
                    event.target.closest(
                        ".add-service-btn"
                    )
                ) {

                    return;

                }


                selectService(option);

            }
        );


        const addButton =
            option.querySelector(
                ".add-service-btn"
            );


        if (addButton) {

           addButton.addEventListener("click", function (event) {

    event.stopPropagation();

    selectService(option);

    let cart = JSON.parse(
        localStorage.getItem(CART_KEY)
    ) || [];

    const itemIndex = cart.findIndex(function (item) {
        return item.id === selectedServiceData.id;
    });

    if (itemIndex !== -1) {

        alert(
            selectedServiceData.name +
            " is already in your cart."
        );

        return;
    }

    const newItem = {
        id: selectedServiceData.id,
        name: selectedServiceData.name,
        price: selectedServiceData.price,
        category: "Services",
        type: "Service",
        icon: selectedServiceData.icon
    };

    cart.push(newItem);

    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );

    if (typeof updateCart === "function") {
        updateCart();
    }

    if (typeof openCart === "function") {
        openCart();
    }

});


                    localStorage.setItem(
                        CART_KEY,
                        JSON.stringify(cart)
                    );


                    if (
                        typeof updateCart ===
                        "function"
                    ) {

                        updateCart();

                    }


                    if (
                        typeof openCart ===
                        "function"
                    ) {

                        openCart();

                    }

                }
            );

        }

    });

});
