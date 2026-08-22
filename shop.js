document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       SETTINGS
    ===================================================== */

    const CART_KEY = "saiGraphicCart";

    const WHATSAPP_NUMBER = "916381128781";


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
            badge: "Premium",
            formats: ["CDR", "PSD"],
            type: "Editable Template",

            description:
                "Premium editable business card design suitable for professional businesses and brands.",

            images: [
                "images/shop/business-card-01/1.jpg",
                "images/shop/business-card-01/2.jpg",
                "images/shop/business-card-01/3.jpg",
                "images/shop/business-card-01/4.jpg",
                "images/shop/business-card-01/5.jpg"
            ]
        },

        {
            id: "business-card-02",
            name: "Premium Business Card 02",
            price: 99,
            category: "Printing Designs",
            badge: "Premium",
            formats: ["CDR", "PSD"],
            type: "Editable Template",

            description:
                "Modern premium business card template with editable CDR and PSD files.",

            images: [
                "images/shop/business-card-02/1.jpg",
                "images/shop/business-card-02/2.jpg",
                "images/shop/business-card-02/3.jpg",
                "images/shop/business-card-02/4.jpg",
                "images/shop/business-card-02/5.jpg"
            ]
        },

        {
            id: "business-card-03",
            name: "Premium Business Card 03",
            price: 99,
            category: "Printing Designs",
            badge: "Premium",
            formats: ["CDR", "PSD"],
            type: "Editable Template",

            description:
                "Creative professional business card template ready for editing and printing.",

            images: [
                "images/shop/business-card-03/1.jpg",
                "images/shop/business-card-03/2.jpg",
                "images/shop/business-card-03/3.jpg",
                "images/shop/business-card-03/4.jpg",
                "images/shop/business-card-03/5.jpg"
            ]
        },

        {
            id: "business-card-04",
            name: "Premium Business Card 04",
            price: 99,
            category: "Printing Designs",
            badge: "Premium",
            formats: ["CDR", "PSD"],
            type: "Editable Template",

            description:
                "Elegant editable business card design for corporate and professional use.",

            images: [
                "images/shop/business-card-04/1.jpg",
                "images/shop/business-card-04/2.jpg",
                "images/shop/business-card-04/3.jpg",
                "images/shop/business-card-04/4.jpg",
                "images/shop/business-card-04/5.jpg"
            ]
        },

        {
            id: "business-card-05",
            name: "Premium Business Card 05",
            price: 99,
            category: "Printing Designs",
            badge: "Premium",
            formats: ["CDR", "PSD"],
            type: "Editable Template",

            description:
                "Premium creative business card template with multiple preview designs.",

            images: [
                "images/shop/business-card-05/1.jpg",
                "images/shop/business-card-05/2.jpg",
                "images/shop/business-card-05/3.jpg",
                "images/shop/business-card-05/4.jpg",
                "images/shop/business-card-05/5.jpg"
            ]
        },


        /* =================================================
           DIGITAL & SOCIAL MEDIA
        ================================================= */

        {
            id: "social-media-01",
            name: "Premium Social Media Design 01",
            price: 99,
            category: "Digital & Social Media Designs",
            badge: "Premium",
            formats: ["PSD", "AI"],
            type: "Editable Template",

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
            badge: "Premium",
            formats: ["PSD", "AI"],
            type: "Editable Template",

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
            badge: "Premium",
            formats: ["PSD", "AI"],
            type: "Editable Template",

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
            badge: "Premium",
            formats: ["PSD", "AI"],
            type: "Editable Template",

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
            badge: "Premium",
            formats: ["PSD", "AI"],
            type: "Editable Template",

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
            badge: "Premium",
            formats: ["CDR", "AI"],
            type: "Editable Template",

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
            badge: "Premium",
            formats: ["CDR", "AI"],
            type: "Editable Template",

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
            badge: "Premium",
            formats: ["CDR", "AI"],
            type: "Editable Template",

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
            badge: "Premium",
            formats: ["CDR", "AI"],
            type: "Editable Template",

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
            badge: "Premium",
            formats: ["CDR", "AI"],
            type: "Editable Template",

            description:
                "High-quality editable packaging design for premium products.",

            images: [
                "images/shop/packaging-05/1.jpg",
                "images/shop/packaging-05/2.jpg",
                "images/shop/packaging-05/3.jpg",
                "images/shop/packaging-05/4.jpg",
                "images/shop/packaging-05/5.jpg"
            ]
        },


        /* =================================================
           ICONS
           
           ADD / CHANGE THESE IMAGE PATHS
           TO MATCH YOUR ACTUAL ICON FILES.
        ================================================= */

        {
            id: "icon-01",
            name: "Business Icons Pack 01",
            price: 99,
            category: "Icons",
            badge: "Premium",
            formats: ["AI", "SVG"],
            type: "Icon Pack",

            description:
                "Premium business icon collection for branding, websites and creative projects.",

            images: [
                "images/shop/icons/icon-01/1.jpg",
                "images/shop/icons/icon-01/2.jpg",
                "images/shop/icons/icon-01/3.jpg",
                "images/shop/icons/icon-01/4.jpg",
                "images/shop/icons/icon-01/5.jpg"
            ]
        },

        {
            id: "icon-02",
            name: "Business Icons Pack 02",
            price: 99,
            category: "Icons",
            badge: "Premium",
            formats: ["AI", "SVG"],
            type: "Icon Pack",

            description:
                "Professional editable icon collection for business and digital designs.",

            images: [
                "images/shop/icons/icon-02/1.jpg",
                "images/shop/icons/icon-02/2.jpg",
                "images/shop/icons/icon-02/3.jpg",
                "images/shop/icons/icon-02/4.jpg",
                "images/shop/icons/icon-02/5.jpg"
            ]
        },

        {
            id: "icon-03",
            name: "Social Media Icons Pack",
            price: 99,
            category: "Icons",
            badge: "Premium",
            formats: ["AI", "SVG"],
            type: "Icon Pack",

            description:
                "Modern social media icon collection for posts, websites and branding.",

            images: [
                "images/shop/icons/icon-03/1.jpg",
                "images/shop/icons/icon-03/2.jpg",
                "images/shop/icons/icon-03/3.jpg",
                "images/shop/icons/icon-03/4.jpg",
                "images/shop/icons/icon-03/5.jpg"
            ]
        },

        {
            id: "icon-04",
            name: "Food Icons Pack",
            price: 99,
            category: "Icons",
            badge: "Premium",
            formats: ["AI", "SVG"],
            type: "Icon Pack",

            description:
                "Creative food and restaurant icon collection for menus and promotional designs.",

            images: [
                "images/shop/icons/icon-04/1.jpg",
                "images/shop/icons/icon-04/2.jpg",
                "images/shop/icons/icon-04/3.jpg",
                "images/shop/icons/icon-04/4.jpg",
                "images/shop/icons/icon-04/5.jpg"
            ]
        },

        {
            id: "icon-05",
            name: "Medical Icons Pack",
            price: 99,
            category: "Icons",
            badge: "Premium",
            formats: ["AI", "SVG"],
            type: "Icon Pack",

            description:
                "Professional medical and healthcare icon collection.",

            images: [
                "images/shop/icons/icon-05/1.jpg",
                "images/shop/icons/icon-05/2.jpg",
                "images/shop/icons/icon-05/3.jpg",
                "images/shop/icons/icon-05/4.jpg",
                "images/shop/icons/icon-05/5.jpg"
            ]
        },

        {
            id: "icon-06",
            name: "Education Icons Pack",
            price: 99,
            category: "Icons",
            badge: "Premium",
            formats: ["AI", "SVG"],
            type: "Icon Pack",

            description:
                "Education and learning icon collection for schools, institutes and digital content.",

            images: [
                "images/shop/icons/icon-06/1.jpg",
                "images/shop/icons/icon-06/2.jpg",
                "images/shop/icons/icon-06/3.jpg",
                "images/shop/icons/icon-06/4.jpg",
                "images/shop/icons/icon-06/5.jpg"
            ]
        },

        {
            id: "icon-07",
            name: "Technology Icons Pack",
            price: 99,
            category: "Icons",
            badge: "Premium",
            formats: ["AI", "SVG"],
            type: "Icon Pack",

            description:
                "Modern technology and digital service icon collection.",

            images: [
                "images/shop/icons/icon-07/1.jpg",
                "images/shop/icons/icon-07/2.jpg",
                "images/shop/icons/icon-07/3.jpg",
                "images/shop/icons/icon-07/4.jpg",
                "images/shop/icons/icon-07/5.jpg"
            ]
        },

        {
            id: "icon-08",
            name: "Travel Icons Pack",
            price: 99,
            category: "Icons",
            badge: "Premium",
            formats: ["AI", "SVG"],
            type: "Icon Pack",

            description:
                "Travel and tourism icon collection for posters, websites and promotional designs.",

            images: [
                "images/shop/icons/icon-08/1.jpg",
                "images/shop/icons/icon-08/2.jpg",
                "images/shop/icons/icon-08/3.jpg",
                "images/shop/icons/icon-08/4.jpg",
                "images/shop/icons/icon-08/5.jpg"
            ]
        },

        {
            id: "icon-09",
            name: "Business Services Icons",
            price: 99,
            category: "Icons",
            badge: "Premium",
            formats: ["AI", "SVG"],
            type: "Icon Pack",

            description:
                "Professional service and business icon collection.",

            images: [
                "images/shop/icons/icon-09/1.jpg",
                "images/shop/icons/icon-09/2.jpg",
                "images/shop/icons/icon-09/3.jpg",
                "images/shop/icons/icon-09/4.jpg",
                "images/shop/icons/icon-09/5.jpg"
            ]
        },

        {
            id: "icon-10",
            name: "Creative Icons Pack",
            price: 99,
            category: "Icons",
            badge: "Premium",
            formats: ["AI", "SVG"],
            type: "Icon Pack",

            description:
                "Creative multipurpose icon collection for graphic designers and digital creators.",

            images: [
                "images/shop/icons/icon-10/1.jpg",
                "images/shop/icons/icon-10/2.jpg",
                "images/shop/icons/icon-10/3.jpg",
                "images/shop/icons/icon-10/4.jpg",
                "images/shop/icons/icon-10/5.jpg"
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

    const iconProducts =
        document.getElementById("iconProducts");


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

    const modalProductFeatures =
        document.getElementById("modalProductFeatures");

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


    const filterButtons =
        document.querySelectorAll(".shop-filter-btn");


    const categorySections =
        document.querySelectorAll(".shop-category");


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


    /*
       Convert old cart items into
       the new quantity format.
    */

    cart = cart.map(function (item) {

        return {
            ...item,
            quantity:
                Number(item.quantity) > 0
                    ? Number(item.quantity)
                    : 1
        };

    });


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
       GET PRODUCT
    ===================================================== */

    function getProductById(id) {

        return products.find(function (product) {

            return product.id === id;

        });

    }


    /* =====================================================
       RENDER PRODUCT FORMATS
    ===================================================== */

    function renderFormats(product) {

        if (!product.formats) {

            return "";

        }

        return product.formats.map(function (format) {

            return `
                <span class="product-format">
                    ${escapeHTML(format)}
                </span>
            `;

        }).join("");

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
                packagingProducts,

            "Icons":
                iconProducts

        };


        Object.keys(categoryContainers)
            .forEach(function (category) {

                if (categoryContainers[category]) {

                    categoryContainers[category]
                        .innerHTML = "";

                }

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


            card.dataset.category =
                product.category;


            card.innerHTML = `

                <div class="product-preview">

                    <img
                        src="${product.images[0]}"
                        alt="${escapeHTML(product.name)}"
                        loading="lazy">

                    <span class="product-badge">
                        ${escapeHTML(product.badge || "Premium")}
                    </span>

                </div>


                <div class="product-info">

                    <h3>
                        ${escapeHTML(product.name)}
                    </h3>


                    <div class="product-meta">

                        <span>
                            ${escapeHTML(product.type)}
                        </span>

                    </div>


                    <div class="product-formats">

                        ${renderFormats(product)}

                        <span class="editable-badge">
                            Editable
                        </span>

                    </div>


                    <div class="product-bottom">

                        <strong>
                            ${formatPrice(product.price)}
                        </strong>


                        <button
                            type="button"
                            class="preview-product-btn">

                            Preview

                        </button>

                    </div>


                    <button
                        type="button"
                        class="add-product-btn">

                        Add to Cart

                    </button>

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
               PREVIEW BUTTON
            --------------------------------------------- */

            const previewButton =
                card.querySelector(
                    ".preview-product-btn"
                );


            previewButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

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
       CATEGORY FILTER
    ===================================================== */

    function filterProducts(category) {

        categorySections.forEach(function (section) {

            const sectionCategory =
                section.dataset.category;


            if (
                category === "all" ||
                sectionCategory === category
            ) {

                section.style.display = "";

            } else {

                section.style.display = "none";

            }

        });


        filterButtons.forEach(function (button) {

            button.classList.toggle(
                "active",
                button.dataset.filter === category
            );

        });


        /*
           Scroll to products when
           a category is selected.
        */

        if (category !== "all") {

            const target =
                document.querySelector(
                    `.shop-category[data-category="${CSS.escape(category)}"]`
                );


            if (target) {

                setTimeout(function () {

                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }, 50);

            }

        }

    }


    filterButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                filterProducts(
                    this.dataset.filter
                );

            }
        );

    });


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


        if (modalProductFeatures) {

            modalProductFeatures.innerHTML = `

                <span>
                    ${escapeHTML(product.type)}
                </span>

                ${renderFormats(product)}

                <span>
                    Editable
                </span>

                <span>
                    Premium
                </span>

            `;

        }


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


        if (
            !images ||
            images.length === 0
        ) {

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
                        alt="${escapeHTML(currentProduct.name)} preview ${index + 1}"
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
       ADD PRODUCT TO CART
    ===================================================== */

    function addProductToCart(product) {

        const existing =
            cart.find(function (item) {

                return item.id === product.id;

            });


        if (existing) {

            existing.quantity =
                Number(existing.quantity || 1) + 1;

        } else {

            cart.push({

                id: product.id,

                name: product.name,

                price: Number(product.price),

                category: product.category,

                image: product.images[0],

                quantity: 1

            });

        }


        saveCart();

        updateCart();

        closeProductModal();

        openCart();

    }


    /* =====================================================
       CHANGE QUANTITY
    ===================================================== */

    function changeQuantity(id, amount) {

        const item =
            cart.find(function (cartItem) {

                return cartItem.id === id;

            });


        if (!item) {

            return;

        }


        item.quantity =
            Number(item.quantity || 1) + amount;


        if (item.quantity <= 0) {

            removeFromCart(id);

            return;

        }


        saveCart();

        updateCart();

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
                    (
                        Number(item.price) *
                        Number(item.quantity || 1)
                    );

            },
            0
        );

    }


    /* =====================================================
       CART ITEM COUNT
    ===================================================== */

    function getCartItemCount() {

        return cart.reduce(
            function (total, item) {

                return total +
                    Number(item.quantity || 1);

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
                    document.createElement("div");


                title.className =
                    "cart-category-title";


                title.textContent =
                    category;


                cartItemsList.appendChild(
                    title
                );


                groups[category]
                    .forEach(function (item) {


                        const quantity =
                            Number(item.quantity || 1);


                        const subtotal =
                            Number(item.price) *
                            quantity;


                        const itemElement =
                            document.createElement("div");


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
                                    each

                                </div>


                                <div class="cart-item-quantity">

                                    <button
                                        type="button"
                                        class="quantity-btn quantity-minus"
                                        data-id="${item.id}"
                                        aria-label="Decrease quantity">

                                        −

                                    </button>


                                    <span class="quantity-value">

                                        ${quantity}

                                    </span>


                                    <button
                                        type="button"
                                        class="quantity-btn quantity-plus"
                                        data-id="${item.id}"
                                        aria-label="Increase quantity">

                                        +

                                    </button>

                                </div>


                                <div class="cart-item-subtotal">

                                    Subtotal:
                                    ${formatPrice(subtotal)}

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
            getCartItemCount();


        cartTotalVal.textContent =
            formatPrice(
                getCartTotal()
            );


        cartCheckout.disabled =
            false;


        /* ---------------------------------------------
           QUANTITY BUTTONS
        --------------------------------------------- */

        cartItemsList
            .querySelectorAll(".quantity-minus")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        changeQuantity(
                            this.dataset.id,
                            -1
                        );

                    }
                );

            });


        cartItemsList
            .querySelectorAll(".quantity-plus")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        changeQuantity(
                            this.dataset.id,
                            1
                        );

                    }
                );

            });


        /* ---------------------------------------------
           REMOVE BUTTONS
        --------------------------------------------- */

        cartItemsList
            .querySelectorAll(".cart-remove")
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
       WHATSAPP MESSAGE
    ===================================================== */

    function getProductOrderMessage(item) {

        const quantity =
            Number(item.quantity || 1);


        const subtotal =
            Number(item.price) * quantity;


        if (
            item.category ===
            "Printing Designs"
        ) {

            return `Product: ${item.name}
Type: Printing Design
Quantity: ${quantity}
Price: ${formatPrice(item.price)}
Subtotal: ${formatPrice(subtotal)}`;

        }


        if (
            item.category ===
            "Digital & Social Media Designs"
        ) {

            return `Product: ${item.name}
Type: Digital & Social Media Design
Quantity: ${quantity}
Price: ${formatPrice(item.price)}
Subtotal: ${formatPrice(subtotal)}`;

        }


        if (
            item.category ===
            "Packaging Designs"
        ) {

            return `Product: ${item.name}
Type: Packaging Design
Quantity: ${quantity}
Price: ${formatPrice(item.price)}
Subtotal: ${formatPrice(subtotal)}`;

        }


        if (
            item.category === "Icons"
        ) {

            return `Product: ${item.name}
Type: Icon Pack
Quantity: ${quantity}
Price: ${formatPrice(item.price)}
Subtotal: ${formatPrice(subtotal)}`;

        }


        return `Product: ${item.name}
Quantity: ${quantity}
Price: ${formatPrice(item.price)}
Subtotal: ${formatPrice(subtotal)}`;

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

I would like to order the following design products:

`;


        let itemNumber = 1;


        Object.keys(groups)
            .forEach(function (category) {


                message +=

`
━━━━━━━━━━━━━━━━━━━━
${category.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━

`;


                groups[category]
                    .forEach(function (item) {


                        message +=

`${itemNumber}. ${getProductOrderMessage(item)}

`;


                        itemNumber++;

                    });

            });


        message +=

`━━━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━━━

Total Products: ${cart.length}
Total Quantity: ${getCartItemCount()}

Estimated Total:
${formatPrice(getCartTotal())}

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

    if (productModalClose) {

        productModalClose.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (productModalOverlay) {

        productModalOverlay.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (viewerNext) {

        viewerNext.addEventListener(
            "click",
            nextImage
        );

    }


    if (viewerPrev) {

        viewerPrev.addEventListener(
            "click",
            previousImage
        );

    }


    if (modalAddCart) {

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

    }


    /* =====================================================
       CART EVENTS
    ===================================================== */

    if (cartToggle) {

        cartToggle.addEventListener(
            "click",
            openCart
        );

    }


    if (cartClose) {

        cartClose.addEventListener(
            "click",
            closeCart
        );

    }


    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCart
        );

    }


    if (cartCheckout) {

        cartCheckout.addEventListener(
            "click",
            checkoutWhatsApp
        );

    }


    /* =====================================================
       KEYBOARD CONTROLS
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {


            /* ESC */

            if (
                event.key === "Escape"
            ) {

                if (
                    productModal &&
                    productModal.classList.contains("active")
                ) {

                    closeProductModal();

                }


                if (
                    cartDrawer &&
                    cartDrawer.classList.contains("active")
                ) {

                    closeCart();

                }

            }


            /* NEXT IMAGE */

            if (
                productModal &&
                productModal.classList.contains("active") &&
                event.key === "ArrowRight"
            ) {

                nextImage();

            }


            /* PREVIOUS IMAGE */

            if (
                productModal &&
                productModal.classList.contains("active") &&
                event.key === "ArrowLeft"
            ) {

                previousImage();

            }

        }
    );


    /* =====================================================
       TOUCH / SWIPE SUPPORT
    ===================================================== */

    let touchStartX = 0;

    let touchEndX = 0;


    if (mainProductImage) {

        mainProductImage.addEventListener(
            "touchstart",
            function (event) {

                touchStartX =
                    event.changedTouches[0].screenX;

            },
            {
                passive: true
            }
        );


        mainProductImage.addEventListener(
            "touchend",
            function (event) {

                touchEndX =
                    event.changedTouches[0].screenX;


                const difference =
                    touchStartX - touchEndX;


                if (Math.abs(difference) < 50) {

                    return;

                }


                if (difference > 0) {

                    nextImage();

                } else {

                    previousImage();

                }

            },
            {
                passive: true
            }
        );

    }


    /* =====================================================
       IMAGE ERROR HANDLING
    ===================================================== */

    document.addEventListener(
        "error",
        function (event) {

            if (
                event.target &&
                event.target.tagName === "IMG"
            ) {

                event.target.classList.add(
                    "image-load-error"
                );

            }

        },
        true
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    renderProducts();

    updateCart();

    filterProducts("all");

});
