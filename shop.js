document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       SETTINGS
    ===================================================== */

    const CART_KEY = "saiGraphicCart";

    const WHATSAPP_NUMBER = "916381128781";


    /*
       =====================================================
       IMPORTANT

       Your product images should be placed inside:

       images/shop/

       Example:

       Images/Shop/business-card-01/1.jpg
       Images/Shop/business-card-01/2.jpg
       Images/Shop/business-card-01/3.jpg


       You can change the filenames below.
    */


    /* =====================================================
       PRODUCT DATA
    ===================================================== */

    const products = [

        /* =================================================
           PRINTING DESIGNS
        ================================================= */

        {
            id: "business-card-01",

            name: "Premium Business Card 01",

            price: 99,

            category: "Printing Designs",

            description:
                "Premium business card template suitable for Travel agency businesses editable CDR Files.",

            images: [
                "Images/Shop/business-card-01/3.jpg",
                "Images/Shop/business-card-01/1.jpg",
                "Images/Shop/business-card-01/2.jpg",

            ]
        },


        {
            id: "business-card-02",

            name: "Premium Business Card 02",

            price: 99,

            category: "Printing Designs",

            description:
                "Modern premium business card template suitable for Mackup Studio businesses editable CDR Files.",

            images: [
                "Images/Shop/business-card-02/1.jpg",
                "Images/Shop/business-card-02/2.jpg",
                "Images/Shop/business-card-02/3.jpg",

            ]
        },


        {
            id: "business-card-03",

            name: "Premium Business Card 03",

            price: 99,

            category: "Printing Designs",

            description:
                "Creative professional business card template suitable for Hotel businesses editable CDR Files.",

            images: [
                "Images/Shop/business-card-03/1.jpg",
                "Images/Shop/business-card-03/2.jpg",
                "Images/Shop/business-card-03/3.jpg",

            ]
        },


        {
            id: "business-card-04",

            name: "Premium Business Card 04",

            price: 99,

            category: "Printing Designs",

            description:
                "Elegant editable business card template suitable for International Travel businesses editable CDR Files.",

            images: [
                "Images/Shop/business-card-04/1.jpg",
                "Images/Shop/business-card-04/2.jpg",
                "Images/Shop/business-card-04/3.jpg",

            ]
        },


        {
            id: "business-card-05",

            name: "Premium Business Card 05",

            price: 99,

            category: "Printing Designs",

            description:
                "Premium creative business card template suitable for Hospital/Clinic businesses editable CDR Files",

            images: [
                "Images/Shop/business-card-05/1.jpg",
                "Images/Shop/business-card-05/2.jpg",
                "Images/Shop/business-card-05/3.jpg",

            ]
        },
        {
            id: "business-card-Bundle-01",

            name: "4 Business Card Bundle 01",

            price: 199,

            category: "Printing Designs",

            description:
                "4 Business card templateeditable CDR Files.",

            images: [
                "Images/Shop/business-card-Bundel-01/1.jpg",
                "Images/Shop/business-card-Bundel-01/2.jpg",
                "Images/Shop/business-card-Bundel-01/3.jpg",
                "Images/Shop/business-card-Bundel-01/4.jpg",
                "Images/Shop/business-card-Bundel-01/5.jpg",

            ]
        },
        {
            id: "business-card-Bundle-02",

            name: "4 Business Card Bundle 02",

            price: 199,

            category: "Printing Designs",

            description:
                "4 Business card templateeditable CDR Files.",

            images: [
                "Images/Shop/business-card-Bundel-02/1.jpg",
                "Images/Shop/business-card-Bundel-02/2.jpg",
                "Images/Shop/business-card-Bundel-02/3.jpg",
                "Images/Shop/business-card-Bundel-02/4.jpg",
                "Images/Shop/business-card-Bundel-02/5.jpg",

            ]
        },
        {
            id: "business-card-Bundle-03",

            name: "4 Business Card Bundle 03",

            price: 199,

            category: "Printing Designs",

            description:
                "4 Business card templateeditable CDR Files.",

            images: [
                "Images/Shop/business-card-Bundel-03/1.jpg",
                "Images/Shop/business-card-Bundel-03/2.jpg",
                "Images/Shop/business-card-Bundel-03/3.jpg",
                "Images/Shop/business-card-Bundel-03/4.jpg",
                "Images/Shop/business-card-Bundel-03/5.jpg",

            ]
        },
        {
            id: "business-card-Bundle-04",

            name: "4 Business Card Bundle 04",

            price: 199,

            category: "Printing Designs",

            description:
                "4 Business card templateeditable CDR Files.",

            images: [
                "Images/Shop/business-card-Bundel-04/1.jpg",
                "Images/Shop/business-card-Bundel-04/2.jpg",
                "Images/Shop/business-card-Bundel-04/3.jpg",
                "Images/Shop/business-card-Bundel-04/4.jpg",
                "Images/Shop/business-card-Bundel-041/5.jpg",

            ]
        },
        {
            id: "business-card-Bundle-05",

            name: "4 Business Card Bundle 05",

            price: 199,

            category: "Printing Designs",

            description:
                "4 Business card templateeditable CDR Files.",

            images: [
                "Images/Shop/business-card-Bundel-05/1.jpg",
                "Images/Shop/business-card-Bundel-05/2.jpg",
                "Images/Shop/business-card-Bundel-05/3.jpg",
                "Images/Shop/business-card-Bundel-05/4.jpg",
                "Images/Shop/business-card-Bundel-05/5.jpg",

            ]
        },
        
     {
            id: "brochure-01",

            name: "Premium Corporate Brochure 01",

            price: 200,

            category: "Printing Designs",
         
            type: "brochure",
         
            description:
                "Premium editable corporate brochure template in CDR format.",

             pages: [
                "Images/Shop/brochure-01/cover.jpg",
                "Images/Shop/brochure-01/page-2.jpg",
                "Images/Shop/brochure-01/page-3.jpg",
                "Images/Shop/brochure-01/page-4.jpg",
                "Images/Shop/brochure-01/page-5.jpg",
                "Images/Shop/brochure-01/page-6.jpg",
                "Images/Shop/brochure-01/back.jpg"
                ]
            }

        /* =================================================
           DIGITAL & SOCIAL MEDIA
        ================================================= */

        {
            id: "social-media-01",

            name: "Premium Social Media Design 01",

            price: 99,

            category: "Digital & Social Media Designs",

            description:
                "Premium editable social media poster template for digital marketing.",

            images: [
                "images/shop/social-media-01/1.jpg",
                "images/shop/social-media-01/2.jpg",
                "images/shop/social-media-01/3.jpg",
                "images/shop/social-media-01/4.jpg",
                "images/shop/social-media-01/5.jpg"
            ]
        },


        {
            id: "social-media-02",

            name: "Premium Social Media Design 02",

            price: 99,

            category: "Digital & Social Media Designs",

            description:
                "Creative social media design template for businesses and promotions.",

            images: [
                "images/shop/social-media-02/1.jpg",
                "images/shop/social-media-02/2.jpg",
                "images/shop/social-media-02/3.jpg",
                "images/shop/social-media-02/4.jpg",
                "images/shop/social-media-02/5.jpg"
            ]
        },


        {
            id: "social-media-03",

            name: "Premium Social Media Design 03",

            price: 99,

            category: "Digital & Social Media Designs",

            description:
                "Professional editable social media marketing design.",

            images: [
                "images/shop/social-media-03/1.jpg",
                "images/shop/social-media-03/2.jpg",
                "images/shop/social-media-03/3.jpg",
                "images/shop/social-media-03/4.jpg",
                "images/shop/social-media-03/5.jpg"
            ]
        },


        {
            id: "social-media-04",

            name: "Premium Social Media Design 04",

            price: 99,

            category: "Digital & Social Media Designs",

            description:
                "Modern premium social media poster template.",

            images: [
                "images/shop/social-media-04/1.jpg",
                "images/shop/social-media-04/2.jpg",
                "images/shop/social-media-04/3.jpg",
                "images/shop/social-media-04/4.jpg",
                "images/shop/social-media-04/5.jpg"
            ]
        },


        {
            id: "social-media-05",

            name: "Premium Social Media Design 05",

            price: 99,

            category: "Digital & Social Media Designs",

            description:
                "Premium editable digital marketing design template.",

            images: [
                "images/shop/social-media-05/1.jpg",
                "images/shop/social-media-05/2.jpg",
                "images/shop/social-media-05/3.jpg",
                "images/shop/social-media-05/4.jpg",
                "images/shop/social-media-05/5.jpg"
            ]
        },


        /* =================================================
           PACKAGING DESIGNS
        ================================================= */

        {
            id: "packaging-01",

            name: "Premium Packaging Design 01",

            price: 250,

            category: "Packaging Designs",

            description:
                "Professional editable packaging template for product branding.",

            images: [
                "images/shop/packaging-01/1.jpg",
                "images/shop/packaging-01/2.jpg",
                "images/shop/packaging-01/3.jpg",
                "images/shop/packaging-01/4.jpg",
                "images/shop/packaging-01/5.jpg"
            ]
        },


        {
            id: "packaging-02",

            name: "Premium Packaging Design 02",

            price: 250,

            category: "Packaging Designs",

            description:
                "Creative editable packaging design suitable for commercial products.",

            images: [
                "images/shop/packaging-02/1.jpg",
                "images/shop/packaging-02/2.jpg",
                "images/shop/packaging-02/3.jpg",
                "images/shop/packaging-02/4.jpg",
                "images/shop/packaging-02/5.jpg"
            ]
        },


        {
            id: "packaging-03",

            name: "Premium Packaging Design 03",

            price: 300,

            category: "Packaging Designs",

            description:
                "Premium product packaging template with professional presentation.",

            images: [
                "images/shop/packaging-03/1.jpg",
                "images/shop/packaging-03/2.jpg",
                "images/shop/packaging-03/3.jpg",
                "images/shop/packaging-03/4.jpg",
                "images/shop/packaging-03/5.jpg"
            ]
        },


        {
            id: "packaging-04",

            name: "Premium Packaging Design 04",

            price: 300,

            category: "Packaging Designs",

            description:
                "Editable premium packaging template for modern brands.",

            images: [
                "images/shop/packaging-04/1.jpg",
                "images/shop/packaging-04/2.jpg",
                "images/shop/packaging-04/3.jpg",
                "images/shop/packaging-04/4.jpg",
                "images/shop/packaging-04/5.jpg"
            ]
        },


        {
            id: "packaging-05",

            name: "Premium Packaging Design 05",

            price: 500,

            category: "Packaging Designs",

            description:
                "High-quality editable packaging design for premium products.",

            images: [
                "images/shop/packaging-05/1.jpg",
                "images/shop/packaging-05/2.jpg",
                "images/shop/packaging-05/3.jpg",
                "images/shop/packaging-05/4.jpg",
                "images/shop/packaging-05/5.jpg"
            ]
        }

    ];



    /* =====================================================
       ELEMENTS
    ===================================================== */

    const printingProducts =
        document.getElementById("printingProducts");

    const digitalProducts =
        document.getElementById("digitalProducts");

    const packagingProducts =
        document.getElementById("packagingProducts");


    const productModal =
        document.getElementById("productModal");

    const productModalClose =
        document.getElementById("productModalClose");

    const productModalOverlay =
        document.getElementById("productModalOverlay");


    const mainProductImage =
        document.getElementById("mainProductImage");

    const productThumbnails =
        document.getElementById("productThumbnails");


    const modalProductName =
        document.getElementById("modalProductName");

    const modalProductDescription =
        document.getElementById("modalProductDescription");

    const modalProductPrice =
        document.getElementById("modalProductPrice");

    const modalProductCategory =
        document.getElementById("modalProductCategory");

    const modalAddCart =
        document.getElementById("modalAddCart");


    const viewerPrev =
        document.getElementById("viewerPrev");

    const viewerNext =
        document.getElementById("viewerNext");


    const cartToggle =
        document.getElementById("cartToggle");

    const cartClose =
        document.getElementById("cartClose");

    const cartOverlay =
        document.getElementById("cartOverlay");

    const cartDrawer =
        document.getElementById("cartDrawer");

    const cartBadge =
        document.getElementById("cartBadge");

    const cartItemsList =
        document.getElementById("cartItemsList");

    const cartTotalVal =
        document.getElementById("cartTotalVal");

    const cartCheckout =
        document.getElementById("cartCheckout");



    /* =====================================================
       CART
    ===================================================== */

    let cart = [];

    try {

        cart =
            JSON.parse(
                localStorage.getItem(CART_KEY)
            ) || [];

    } catch (error) {

        cart = [];

    }



    /* =====================================================
       CURRENT PRODUCT
    ===================================================== */

    let currentProduct = null;

    let currentImageIndex = 0;



    /* =====================================================
       PRICE
    ===================================================== */

    function formatPrice(price) {

        return "₹" +
            Number(price).toLocaleString("en-IN");

    }



    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(value)

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }



    /* =====================================================
       RENDER PRODUCTS
    ===================================================== */

    function renderProducts() {


        const categoryContainers = {

            "Printing Designs":
                printingProducts,

            "Digital & Social Media Designs":
                digitalProducts,

            "Packaging Designs":
                packagingProducts

        };


        Object.keys(categoryContainers)
            .forEach(function (category) {

                categoryContainers[category]
                    .innerHTML = "";

            });


        products.forEach(function (product) {


            const container =
                categoryContainers[
                    product.category
                ];


            if (!container) {

                return;

            }


            const card =
                document.createElement("article");


            card.className =
                "shop-product";


            card.dataset.id =
                product.id;


            card.innerHTML = `

                <div class="product-preview">

                    <img
                        src="${product.images[0]}"
                        alt="${escapeHTML(product.name)}"
                        loading="lazy">

                </div>


                <div class="product-info">

                    <h3>
                        ${escapeHTML(product.name)}
                    </h3>


                    <p>
                        ${escapeHTML(product.description)}
                    </p>


                    <div class="product-bottom">

                        <strong>
                            ${formatPrice(product.price)}
                        </strong>


                        <button
                            type="button"
                            class="add-product-btn">

                            Add to Cart

                        </button>

                    </div>

                </div>

            `;


            container.appendChild(card);


            /* ---------------------------------------------
               OPEN PRODUCT
            --------------------------------------------- */

            card.addEventListener(
                "click",
                function () {

                    openProductModal(product);

                }
            );


            /* ---------------------------------------------
               ADD TO CART
            --------------------------------------------- */

            const addButton =
                card.querySelector(
                    ".add-product-btn"
                );


            addButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    addProductToCart(product);

                }
            );

        });

    }



    /* =====================================================
       OPEN PRODUCT MODAL
    ===================================================== */

    function openProductModal(product) {


        currentProduct = product;

        currentImageIndex = 0;


        modalProductName.textContent =
            product.name;


        modalProductDescription.textContent =
            product.description;


        modalProductPrice.textContent =
            formatPrice(product.price);


        modalProductCategory.textContent =
            product.category;


        renderProductImages();


        productModal.classList.add("active");

        productModal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";

    }



    /* =====================================================
       RENDER PRODUCT IMAGES
    ===================================================== */

    function renderProductImages() {


        if (!currentProduct) {

            return;

        }


        const images =
            currentProduct.images;


        if (!images.length) {

            return;

        }


        mainProductImage.src =
            images[currentImageIndex];


        mainProductImage.alt =
            currentProduct.name +
            " preview " +
            (currentImageIndex + 1);


        productThumbnails.innerHTML = "";


        images.forEach(
            function (image, index) {


                const thumbnail =
                    document.createElement("button");


                thumbnail.type =
                    "button";


                thumbnail.className =
                    "product-thumbnail";


                if (
                    index ===
                    currentImageIndex
                ) {

                    thumbnail.classList.add(
                        "active"
                    );

                }


                thumbnail.innerHTML = `

                    <img
                        src="${image}"
                        alt="Preview ${index + 1}"
                        loading="lazy">

                `;


                thumbnail.addEventListener(
                    "click",
                    function () {

                        currentImageIndex =
                            index;

                        renderProductImages();

                    }
                );


                productThumbnails.appendChild(
                    thumbnail
                );

            }
        );

    }



    /* =====================================================
       NEXT IMAGE
    ===================================================== */

    function nextImage() {


        if (!currentProduct) {

            return;

        }


        currentImageIndex++;


        if (
            currentImageIndex >=
            currentProduct.images.length
        ) {

            currentImageIndex = 0;

        }


        renderProductImages();

    }



    /* =====================================================
       PREVIOUS IMAGE
    ===================================================== */

    function previousImage() {


        if (!currentProduct) {

            return;

        }


        currentImageIndex--;


        if (currentImageIndex < 0) {

            currentImageIndex =
                currentProduct.images.length - 1;

        }


        renderProductImages();

    }



    /* =====================================================
       CLOSE PRODUCT MODAL
    ===================================================== */

    function closeProductModal() {


        productModal.classList.remove(
            "active"
        );


        productModal.setAttribute(
            "aria-hidden",
            "true"
        );


        currentProduct = null;


        document.body.style.overflow = "";

    }



    /* =====================================================
       SAVE CART
    ===================================================== */

    function saveCart() {

        localStorage.setItem(
            CART_KEY,
            JSON.stringify(cart)
        );

    }



    /* =====================================================
       ADD TO CART
    ===================================================== */

    function addProductToCart(product) {


        const existing =
            cart.find(function (item) {

                return item.id === product.id;

            });


        if (existing) {

            alert(
                product.name +
                " is already in your cart."
            );


            updateCart();

            openCart();

            return;

        }


        cart.push({

            id: product.id,

            name: product.name,

            price: Number(product.price),

            category: product.category,

            image: product.images[0]

        });


        saveCart();

        updateCart();

        closeProductModal();

        openCart();

    }



    /* =====================================================
       REMOVE CART ITEM
    ===================================================== */

    function removeFromCart(id) {


        cart =
            cart.filter(function (item) {

                return item.id !== id;

            });


        saveCart();

        updateCart();

    }



    /* =====================================================
       CART TOTAL
    ===================================================== */

    function getCartTotal() {

        return cart.reduce(
            function (total, item) {

                return total +
                    Number(item.price);

            },
            0
        );

    }



    /* =====================================================
       GROUP CART
    ===================================================== */

    function groupCartItems() {


        const groups = {};


        cart.forEach(function (item) {


            if (
                !groups[item.category]
            ) {

                groups[item.category] = [];

            }


            groups[item.category].push(
                item
            );

        });


        return groups;

    }



    /* =====================================================
       UPDATE CART
    ===================================================== */

    function updateCart() {


        cartItemsList.innerHTML = "";


        /* ---------------------------------------------
           EMPTY CART
        --------------------------------------------- */

        if (cart.length === 0) {


            cartItemsList.innerHTML = `

                <div class="empty-cart">

                    <div class="empty-cart-icon">
                        🛒
                    </div>


                    <h3>
                        Your cart is empty
                    </h3>


                    <p>
                        Add your favourite
                        design templates
                        to your cart.
                    </p>

                </div>

            `;


            cartBadge.textContent =
                "0";


            cartTotalVal.textContent =
                "₹0";


            cartCheckout.disabled =
                true;


            return;

        }



        /* ---------------------------------------------
           GROUP PRODUCTS
        --------------------------------------------- */

        const groups =
            groupCartItems();


        Object.keys(groups)
            .forEach(function (category) {


                const title =
                    document.createElement(
                        "div"
                    );


                title.className =
                    "cart-category-title";


                title.textContent =
                    category;


                cartItemsList.appendChild(
                    title
                );


                groups[category]
                    .forEach(function (item) {


                        const itemElement =
                            document.createElement(
                                "div"
                            );


                        itemElement.className =
                            "cart-item";


                        itemElement.innerHTML = `

                            <div class="cart-item-image">

                                <img
                                    src="${item.image}"
                                    alt="${escapeHTML(item.name)}">

                            </div>


                            <div class="cart-item-info">

                                <div class="cart-item-name">

                                    ${escapeHTML(item.name)}

                                </div>


                                <div class="cart-item-price">

                                    ${formatPrice(item.price)}

                                </div>

                            </div>


                            <button
                                type="button"
                                class="cart-remove"
                                data-id="${item.id}"
                                aria-label="Remove item">

                                ×

                            </button>

                        `;


                        cartItemsList.appendChild(
                            itemElement
                        );

                    });

            });



        /* ---------------------------------------------
           TOTAL
        --------------------------------------------- */

        cartBadge.textContent =
            cart.length;


        cartTotalVal.textContent =
            formatPrice(
                getCartTotal()
            );


        cartCheckout.disabled =
            false;



        /* ---------------------------------------------
           REMOVE BUTTONS
        --------------------------------------------- */

        cartItemsList
            .querySelectorAll(
                ".cart-remove"
            )
            .forEach(function (button) {


                button.addEventListener(
                    "click",
                    function () {

                        removeFromCart(
                            this.dataset.id
                        );

                    }
                );

            });

    }



    /* =====================================================
       OPEN CART
    ===================================================== */

    function openCart() {


        updateCart();


        cartDrawer.classList.add(
            "active"
        );


        cartOverlay.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";

    }



    /* =====================================================
       CLOSE CART
    ===================================================== */

    function closeCart() {


        cartDrawer.classList.remove(
            "active"
        );


        cartOverlay.classList.remove(
            "active"
        );


        document.body.style.overflow =
            "";

    }



    /* =====================================================
       WHATSAPP CHECKOUT
    ===================================================== */

    function checkoutWhatsApp() {


        if (cart.length === 0) {

            return;

        }


        const groups =
            groupCartItems();


        let message =

`Hello Sai Graphic Designs 👋

I would like to order the following design templates:

`;



        let itemNumber = 1;



        Object.keys(groups)
            .forEach(function (category) {


                message +=
`
------------------------------
${category.toUpperCase()}
------------------------------

`;


                groups[category]
                    .forEach(function (item) {


                        message +=

`${itemNumber}. ${item.name}
Price: ${formatPrice(item.price)}

`;


                        itemNumber++;

                    });

            });



        message +=

`------------------------------
ORDER SUMMARY
------------------------------

Total Items: ${cart.length}

Estimated Total: ${formatPrice(
            getCartTotal()
        )}

Please contact me regarding payment,
file delivery and other details.

Thank you!`;



        const whatsappURL =

            "https://wa.me/" +
            WHATSAPP_NUMBER +
            "?text=" +
            encodeURIComponent(
                message
            );



        window.open(
            whatsappURL,
            "_blank"
        );

    }



    /* =====================================================
       MODAL EVENTS
    ===================================================== */

    productModalClose.addEventListener(
        "click",
        closeProductModal
    );


    productModalOverlay.addEventListener(
        "click",
        closeProductModal
    );


    viewerNext.addEventListener(
        "click",
        nextImage
    );


    viewerPrev.addEventListener(
        "click",
        previousImage
    );


    modalAddCart.addEventListener(
        "click",
        function () {


            if (!currentProduct) {

                return;

            }


            addProductToCart(
                currentProduct
            );

        }
    );



    /* =====================================================
       CART EVENTS
    ===================================================== */

    cartToggle.addEventListener(
        "click",
        openCart
    );


    cartClose.addEventListener(
        "click",
        closeCart
    );


    cartOverlay.addEventListener(
        "click",
        closeCart
    );


    cartCheckout.addEventListener(
        "click",
        checkoutWhatsApp
    );



    /* =====================================================
       KEYBOARD CONTROLS
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {


            if (
                event.key ===
                "Escape"
            ) {


                if (
                    productModal.classList
                        .contains("active")
                ) {

                    closeProductModal();

                }


                if (
                    cartDrawer.classList
                        .contains("active")
                ) {

                    closeCart();

                }

            }



            if (
                productModal.classList
                    .contains("active")
            ) {


                if (
                    event.key === "ArrowRight"
                ) {

                    nextImage();

                }


                if (
                    event.key === "ArrowLeft"
                ) {

                    previousImage();

                }

            }

        }
    );



    /* =====================================================
       INITIALIZE
    ===================================================== */

    renderProducts();

    updateCart();

});
