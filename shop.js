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
            type: "business-card",
            formats: ["cdr", "png"],
            description:
                "Premium business card template suitable for travel agency businesses. Editable CDR file.",
            images: [
                "Images/Shop/business-card-01/3.jpg",
                "Images/Shop/business-card-01/1.jpg",
                "Images/Shop/business-card-01/2.jpg"
            ]
        },

        {
            id: "business-card-02",
            name: "Premium Business Card 02",
            price: 99,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr", "png"],
            description:
                "Modern premium business card template suitable for makeup studio businesses. Editable CDR file.",
            images: [
                "Images/Shop/business-card-02/1.jpg",
                "Images/Shop/business-card-02/2.jpg",
                "Images/Shop/business-card-02/3.jpg"
            ]
        },

        {
            id: "business-card-03",
            name: "Premium Business Card 03",
            price: 99,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr", "png"],
            description:
                "Creative professional business card template suitable for hotel businesses. Editable CDR file.",
            images: [
                "Images/Shop/business-card-03/1.jpg",
                "Images/Shop/business-card-03/2.jpg",
                "Images/Shop/business-card-03/3.jpg"
            ]
        },

        {
            id: "business-card-04",
            name: "Premium Business Card 04",
            price: 99,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr", "png"],
            description:
                "Elegant editable business card template suitable for international travel businesses. Editable CDR file.",
            images: [
                "Images/Shop/business-card-04/1.jpg",
                "Images/Shop/business-card-04/2.jpg",
                "Images/Shop/business-card-04/3.jpg"
            ]
        },

        {
            id: "business-card-05",
            name: "Premium Business Card 05",
            price: 99,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr", "png"],
            description:
                "Premium creative business card template suitable for hospital and clinic businesses. Editable CDR file.",
            images: [
                "Images/Shop/business-card-05/1.jpg",
                "Images/Shop/business-card-05/2.jpg",
                "Images/Shop/business-card-05/3.jpg"
            ]
        },

        {
            id: "business-card-Bundle-01",
            name: "4 Business Card Bundle 01",
            price: 199,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr", "png"],
            description:
                "Professional collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/business-card-Bundel-01/1.jpg",
                "Images/Shop/business-card-Bundel-01/2.jpg",
                "Images/Shop/business-card-Bundel-01/3.jpg",
                "Images/Shop/business-card-Bundel-01/4.jpg",
                "Images/Shop/business-card-Bundel-01/5.jpg"
            ]
        },

        {
            id: "business-card-Bundle-02",
            name: "4 Business Card Bundle 02",
            price: 199,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr", "png"],
            description:
                "Professional collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/business-card-Bundel-02/1.jpg",
                "Images/Shop/business-card-Bundel-02/2.jpg",
                "Images/Shop/business-card-Bundel-02/3.jpg",
                "Images/Shop/business-card-Bundel-02/4.jpg",
                "Images/Shop/business-card-Bundel-02/5.jpg"
            ]
        },

        {
            id: "business-card-Bundle-03",
            name: "4 Business Card Bundle 03",
            price: 0,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr", "png"],
            description:
                "Free collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/business-card-Bundel-03/1.jpg",
                "Images/Shop/business-card-Bundel-03/2.jpg",
                "Images/Shop/business-card-Bundel-03/3.jpg",
                "Images/Shop/business-card-Bundel-03/4.jpg",
                "Images/Shop/business-card-Bundel-03/5.jpg"
            ]
        },

        {
            id: "business-card-Bundle-04",
            name: "4 Business Card Bundle 04",
            price: 199,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr", "png"],
            description:
                "Professional collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/business-card-Bundel-04/1.jpg",
                "Images/Shop/business-card-Bundel-04/2.jpg",
                "Images/Shop/business-card-Bundel-04/3.jpg",
                "Images/Shop/business-card-Bundel-04/4.jpg",
                "Images/Shop/business-card-Bundel-04/5.jpg"
            ]
        },

        {
            id: "business-card-Bundle-05",
            name: "4 Business Card Bundle 05",
            price: 199,
            category: "Printing Designs",
            type: "business-card",
            formats: ["cdr", "png"],
            description:
                "Professional collection of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/business-card-Bundel-05/1.jpg",
                "Images/Shop/business-card-Bundel-05/2.jpg",
                "Images/Shop/business-card-Bundel-05/3.jpg",
                "Images/Shop/business-card-Bundel-05/4.jpg",
                "Images/Shop/business-card-Bundel-05/5.jpg"
            ]
        },


        /* =================================================
           DIGITAL & SOCIAL MEDIA DESIGNS
        ================================================= */

        {
            id: "social-media-01",
            name: "Premium Social Media Design 01",
            price: 99,
            category: "Digital & Social Media Designs",
            type: "social-media",
            formats: ["psd", "png"],
            description:
                "Premium editable social media poster template for digital marketing.",
            images: [
                "Images/Shop/social-media-01/1.jpg",
                "Images/Shop/social-media-01/2.jpg",
                "Images/Shop/social-media-01/3.jpg",
                "Images/Shop/social-media-01/4.jpg",
                "Images/Shop/social-media-01/5.jpg"
            ]
        },

        {
            id: "social-media-02",
            name: "Premium Social Media Design 02",
            price: 99,
            category: "Digital & Social Media Designs",
            type: "social-media",
            formats: ["psd", "png"],
            description:
                "Creative social media design template for businesses and promotions.",
            images: [
                "Images/Shop/social-media-02/1.jpg",
                "Images/Shop/social-media-02/2.jpg",
                "Images/Shop/social-media-02/3.jpg",
                "Images/Shop/social-media-02/4.jpg",
                "Images/Shop/social-media-02/5.jpg"
            ]
        },

        {
            id: "social-media-03",
            name: "Premium Social Media Design 03",
            price: 99,
            category: "Digital & Social Media Designs",
            type: "social-media",
            formats: ["psd", "png"],
            description:
                "Professional editable social media marketing design.",
            images: [
                "Images/Shop/social-media-03/1.jpg",
                "Images/Shop/social-media-03/2.jpg",
                "Images/Shop/social-media-03/3.jpg",
                "Images/Shop/social-media-03/4.jpg",
                "Images/Shop/social-media-03/5.jpg"
            ]
        },

        {
            id: "social-media-04",
            name: "Premium Social Media Design 04",
            price: 99,
            category: "Digital & Social Media Designs",
            type: "social-media",
            formats: ["psd", "png"],
            description:
                "Modern premium social media poster template.",
            images: [
                "Images/Shop/social-media-04/1.jpg",
                "Images/Shop/social-media-04/2.jpg",
                "Images/Shop/social-media-04/3.jpg",
                "Images/Shop/social-media-04/4.jpg",
                "Images/Shop/social-media-04/5.jpg"
            ]
        },

        {
            id: "social-media-05",
            name: "Premium Social Media Design 05",
            price: 99,
            category: "Digital & Social Media Designs",
            type: "social-media",
            formats: ["psd", "png"],
            description:
                "Premium editable digital marketing design template.",
            images: [
                "Images/Shop/social-media-05/1.jpg",
                "Images/Shop/social-media-05/2.jpg",
                "Images/Shop/social-media-05/3.jpg",
                "Images/Shop/social-media-05/4.jpg",
                "Images/Shop/social-media-05/5.jpg"
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
            type: "packaging",
            formats: ["cdr", "png"],
            description:
                "Professional editable packaging template for product branding.",
            images: [
                "Images/Shop/packaging-01/1.jpg",
                "Images/Shop/packaging-01/2.jpg",
                "Images/Shop/packaging-01/3.jpg",
                "Images/Shop/packaging-01/4.jpg",
                "Images/Shop/packaging-01/5.jpg"
            ]
        },

        {
            id: "packaging-02",
            name: "Premium Packaging Design 02",
            price: 250,
            category: "Packaging Designs",
            type: "packaging",
            formats: ["cdr", "png"],
            description:
                "Creative editable packaging design suitable for commercial products.",
            images: [
                "Images/Shop/packaging-02/1.jpg",
                "Images/Shop/packaging-02/2.jpg",
                "Images/Shop/packaging-02/3.jpg",
                "Images/Shop/packaging-02/4.jpg",
                "Images/Shop/packaging-02/5.jpg"
            ]
        },

        {
            id: "packaging-03",
            name: "Premium Packaging Design 03",
            price: 300,
            category: "Packaging Designs",
            type: "packaging",
            formats: ["cdr", "png"],
            description:
                "Premium product packaging template with professional presentation.",
            images: [
                "Images/Shop/packaging-03/1.jpg",
                "Images/Shop/packaging-03/2.jpg",
                "Images/Shop/packaging-03/3.jpg",
                "Images/Shop/packaging-03/4.jpg",
                "Images/Shop/packaging-03/5.jpg"
            ]
        },

        {
            id: "packaging-04",
            name: "Premium Packaging Design 04",
            price: 300,
            category: "Packaging Designs",
            type: "packaging",
            formats: ["cdr", "png"],
            description:
                "Editable premium packaging template for modern brands.",
            images: [
                "Images/Shop/packaging-04/1.jpg",
                "Images/Shop/packaging-04/2.jpg",
                "Images/Shop/packaging-04/3.jpg",
                "Images/Shop/packaging-04/4.jpg",
                "Images/Shop/packaging-04/5.jpg"
            ]
        },

        {
            id: "packaging-05",
            name: "Premium Packaging Design 05",
            price: 500,
            category: "Packaging Designs",
            type: "packaging",
            formats: ["cdr", "png"],
            description:
                "High-quality editable packaging design for premium products.",
            images: [
                "Images/Shop/packaging-05/1.jpg",
                "Images/Shop/packaging-05/2.jpg",
                "Images/Shop/packaging-05/3.jpg",
                "Images/Shop/packaging-05/4.jpg",
                "Images/Shop/packaging-05/5.jpg"
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
       FILTERS
    ===================================================== */

    const shopFilters =
        document.getElementById("shopFilters");

    const filterButtons =
        shopFilters
            ? shopFilters.querySelectorAll(".shop-filter")
            : [];

    let activeFilter = "all";


    /* =====================================================
       CART
    ===================================================== */

    let cart = [];

    try {

        const savedCart =
            localStorage.getItem(CART_KEY);

        if (savedCart) {

            const parsedCart =
                JSON.parse(savedCart);

            if (Array.isArray(parsedCart)) {
                cart = parsedCart;
            }

        }

    } catch (error) {

        console.error(
            "Unable to load cart:",
            error
        );

        cart = [];

    }


    /* =====================================================
       CURRENT PRODUCT
    ===================================================== */

    let currentProduct = null;
    let currentImageIndex = 0;


    /* =====================================================
       PRICE FORMAT
    ===================================================== */

    function formatPrice(price) {

        const numericPrice =
            Number(price);

        if (
            !Number.isFinite(numericPrice) ||
            numericPrice === 0
        ) {
            return "FREE";
        }

        return (
            "₹" +
            numericPrice.toLocaleString("en-IN")
        );

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       NORMALIZE FILTER VALUE
    ===================================================== */

    function normalizeValue(value) {

        return String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/[_\s]+/g, "-");

    }


    /* =====================================================
       SAVE CART
    ===================================================== */

    function saveCart() {

        try {

            localStorage.setItem(
                CART_KEY,
                JSON.stringify(cart)
            );

        } catch (error) {

            console.error(
                "Unable to save cart:",
                error
            );

        }

    }


    /* =====================================================
       GET PRODUCT
    ===================================================== */

    function getProductById(id) {

        return products.find(
            product => product.id === id
        );

    }


    /* =====================================================
       FILTER LOGIC
    ===================================================== */

    function productMatchesFilter(product, filter) {

        if (!product) {
            return false;
        }


        if (!filter || filter === "all") {
            return true;
        }


        /* PAID */

        if (filter === "paid") {

            return Number(product.price) > 0;

        }


        /* FREE */

        if (filter === "free") {

            return Number(product.price) === 0;

        }


        /* FORMAT FILTER */

        if (
            ["cdr", "psd", "png", "svg"]
                .includes(filter)
        ) {

            const formats =
                Array.isArray(product.formats)
                    ? product.formats.map(
                        normalizeValue
                    )
                    : [];

            return formats.includes(filter);

        }


        /* DESIGN TYPE */

        const productType =
            normalizeValue(product.type);

        return productType === filter;

    }


    /* =====================================================
       GET FILTERED PRODUCTS
    ===================================================== */

    function getFilteredProducts() {

        return products.filter(
            product =>
                productMatchesFilter(
                    product,
                    activeFilter
                )
        );

    }


    /* =====================================================
       SETUP FILTERS
    ===================================================== */

    function setupFilters() {

        if (!filterButtons.length) {
            return;
        }


        filterButtons.forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    activeFilter =
                        normalizeValue(
                            this.dataset.filter
                        );


                    filterButtons.forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                        btn.setAttribute(
                            "aria-pressed",
                            "false"
                        );

                    });


                    this.classList.add(
                        "active"
                    );

                    this.setAttribute(
                        "aria-pressed",
                        "true"
                    );


                    renderProducts();

                }
            );

        });

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


        /* CLEAR */

        Object.values(categoryContainers)
            .forEach(container => {

                if (container) {
                    container.innerHTML = "";
                }

            });


        const filteredProducts =
            getFilteredProducts();


        /* =================================================
           NO RESULTS
        ================================================= */

        if (filteredProducts.length === 0) {

            Object.values(categoryContainers)
                .forEach(container => {

                    if (!container) {
                        return;
                    }


                    const empty =
                        document.createElement("div");

                    empty.className =
                        "shop-filter-empty";


                    empty.innerHTML = `

                        <div class="filter-empty-icon">
                            🔍
                        </div>

                        <h3>
                            No designs found
                        </h3>

                        <p>
                            No products match the selected filter.
                        </p>

                    `;


                    container.appendChild(empty);

                });


            return;

        }


        /* =================================================
           CREATE PRODUCT CARDS
        ================================================= */

        filteredProducts.forEach(product => {

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


            const isFree =
                Number(product.price) === 0;


            const formats =
                Array.isArray(product.formats)
                    ? product.formats
                    : [];


            /* =================================================
               PRODUCT CARD HTML
            ================================================= */

            card.innerHTML = `

                <div class="product-preview">

                    ${
                        isFree
                            ? `
                                <span
                                    class="free-ribbon"
                                    aria-label="Free product">

                                    <span class="free-ribbon-main">
                                        FREE
                                    </span>

                                    <span class="free-ribbon-sub">
                                        DOWNLOAD
                                    </span>

                                </span>
                              `
                            : ""
                    }

                    <img
                        src="${escapeHTML(
                            product.images?.[0] || ""
                        )}"
                        alt="${escapeHTML(
                            product.name
                        )}"
                        loading="lazy">

                </div>


                <div class="product-info">


                    <span class="product-category">
                        ${escapeHTML(
                            product.category
                        )}
                    </span>


                    <h3>
                        ${escapeHTML(
                            product.name
                        )}
                    </h3>


                    <p>
                        ${escapeHTML(
                            product.description
                        )}
                    </p>


                    ${
                        formats.length
                            ? `
                                <div class="product-formats">

                                    ${formats
                                        .map(
                                            format => `
                                                <span>
                                                    ${escapeHTML(
                                                        format.toUpperCase()
                                                    )}
                                                </span>
                                            `
                                        )
                                        .join("")}

                                </div>
                              `
                            : ""
                    }


                    <div class="product-bottom">


                        <strong
                            class="${
                                isFree
                                    ? "free-price"
                                    : ""
                            }">

                            ${formatPrice(
                                product.price
                            )}

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


            /* =================================================
               IMAGE ERROR
            ================================================= */

            const productImage =
                card.querySelector(
                    ".product-preview img"
                );


            if (productImage) {

                productImage.addEventListener(
                    "error",
                    function () {

                        this.style.display =
                            "none";


                        const preview =
                            this.parentElement;


                        if (
                            !preview.querySelector(
                                ".image-error"
                            )
                        ) {

                            const errorMessage =
                                document.createElement(
                                    "div"
                                );


                            errorMessage.className =
                                "image-error";


                            errorMessage.textContent =
                                "Preview unavailable";


                            preview.appendChild(
                                errorMessage
                            );

                        }

                    }
                );

            }


            /* =================================================
               OPEN PRODUCT
            ================================================= */

            card.addEventListener(
                "click",
                function () {

                    openProductModal(
                        product
                    );

                }
            );


            /* =================================================
               ADD TO CART
            ================================================= */

            const addButton =
                card.querySelector(
                    ".add-product-btn"
                );


            if (addButton) {

                addButton.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();
                        event.stopPropagation();

                        addProductToCart(
                            product
                        );

                    }
                );

            }

        });

    }


    /* =====================================================
       OPEN PRODUCT MODAL
    ===================================================== */

    function openProductModal(product) {

        if (!product || !productModal) {
            return;
        }


        currentProduct =
            product;

        currentImageIndex =
            0;


        if (modalProductName) {

            modalProductName.textContent =
                product.name;

        }


        if (modalProductDescription) {

            modalProductDescription.textContent =
                product.description;

        }


        if (modalProductPrice) {

            modalProductPrice.textContent =
                formatPrice(
                    product.price
                );


            modalProductPrice.classList.toggle(
                "free-price",
                Number(product.price) === 0
            );

        }


        if (modalProductCategory) {

            modalProductCategory.textContent =
                product.category;

        }


        renderProductImages();


        productModal.classList.add(
            "active"
        );


        productModal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";

    }


    /* =====================================================
       PRODUCT IMAGES
    ===================================================== */

    function renderProductImages() {

        if (
            !currentProduct ||
            !mainProductImage
        ) {
            return;
        }


        const images =
            Array.isArray(
                currentProduct.images
            )
                ? currentProduct.images
                : [];


        if (images.length === 0) {

            mainProductImage.removeAttribute(
                "src"
            );


            if (productThumbnails) {

                productThumbnails.innerHTML =
                    "";

            }

            return;

        }


        if (
            currentImageIndex < 0 ||
            currentImageIndex >= images.length
        ) {

            currentImageIndex =
                0;

        }


        mainProductImage.src =
            images[currentImageIndex];


        mainProductImage.alt =
            currentProduct.name +
            " preview " +
            (currentImageIndex + 1);


        if (!productThumbnails) {
            return;
        }


        productThumbnails.innerHTML =
            "";


        images.forEach(
            function (image, index) {

                const thumbnail =
                    document.createElement(
                        "button"
                    );


                thumbnail.type =
                    "button";


                thumbnail.className =
                    "product-thumbnail";


                thumbnail.setAttribute(
                    "aria-label",
                    "View image " +
                    (index + 1)
                );


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
                        src="${escapeHTML(image)}"
                        alt="Preview ${index + 1}"
                        loading="lazy">

                `;


                thumbnail.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

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

        if (
            !currentProduct ||
            !Array.isArray(
                currentProduct.images
            )
        ) {
            return;
        }


        const imageCount =
            currentProduct.images.length;


        if (imageCount <= 1) {
            return;
        }


        currentImageIndex =
            (
                currentImageIndex + 1
            ) % imageCount;


        renderProductImages();

    }


    /* =====================================================
       PREVIOUS IMAGE
    ===================================================== */

    function previousImage() {

        if (
            !currentProduct ||
            !Array.isArray(
                currentProduct.images
            )
        ) {
            return;
        }


        const imageCount =
            currentProduct.images.length;


        if (imageCount <= 1) {
            return;
        }


        currentImageIndex =
            (
                currentImageIndex -
                1 +
                imageCount
            ) % imageCount;


        renderProductImages();

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeProductModal() {

        if (!productModal) {
            return;
        }


        productModal.classList.remove(
            "active"
        );


        productModal.setAttribute(
            "aria-hidden",
            "true"
        );


        currentProduct =
            null;

        currentImageIndex =
            0;


        if (
            !cartDrawer ||
            !cartDrawer.classList.contains(
                "active"
            )
        ) {

            document.body.style.overflow =
                "";

        }

    }


    /* =====================================================
       ADD PRODUCT TO CART
    ===================================================== */

    function addProductToCart(product) {

        if (!product) {
            return;
        }


        const existing =
            cart.find(
                item =>
                    item.id === product.id
            );


        if (existing) {

            showCartMessage(
                product.name +
                " is already in your cart."
            );

            updateCart();
            openCart();

            return;

        }


        cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                Number(product.price) || 0,

            category:
                product.category,

            image:
                Array.isArray(product.images) &&
                product.images.length
                    ? product.images[0]
                    : ""

        });


        saveCart();
        updateCart();

        closeProductModal();
        openCart();

    }


    /* =====================================================
       CART MESSAGE
    ===================================================== */

    function showCartMessage(message) {

        alert(message);

    }


    /* =====================================================
       REMOVE FROM CART
    ===================================================== */

    function removeFromCart(id) {

        cart =
            cart.filter(
                item =>
                    item.id !== id
            );


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
                        Number(item.price) ||
                        0
                    );

            },
            0
        );

    }


    /* =====================================================
       GROUP CART ITEMS
    ===================================================== */

    function groupCartItems() {

        const groups = {};


        cart.forEach(item => {

            const category =
                item.category ||
                "Design Templates";


            if (!groups[category]) {

                groups[category] = [];

            }


            groups[category].push(
                item
            );

        });


        return groups;

    }


    /* =====================================================
       UPDATE CART
    ===================================================== */

    function updateCart() {

        if (!cartItemsList) {
            return;
        }


        cartItemsList.innerHTML =
            "";


        /* EMPTY CART */

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


            if (cartBadge) {
                cartBadge.textContent = "0";
            }


            if (cartTotalVal) {
                cartTotalVal.textContent = "₹0";
            }


            if (cartCheckout) {
                cartCheckout.disabled = true;
            }


            return;

        }


        const groups =
            groupCartItems();


        Object.keys(groups)
            .forEach(category => {


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
                    .forEach(item => {


                        const itemElement =
                            document.createElement(
                                "div"
                            );


                        itemElement.className =
                            "cart-item";


                        const isFree =
                            Number(item.price) === 0;


                        itemElement.innerHTML = `

                            <div class="cart-item-image">

                                <img
                                    src="${escapeHTML(
                                        item.image || ""
                                    )}"
                                    alt="${escapeHTML(
                                        item.name
                                    )}">

                            </div>


                            <div class="cart-item-info">

                                <div class="cart-item-name">

                                    ${escapeHTML(
                                        item.name
                                    )}

                                </div>


                                <div
                                    class="
                                        cart-item-price
                                        ${
                                            isFree
                                                ? "free-price"
                                                : ""
                                        }
                                    ">

                                    ${formatPrice(
                                        item.price
                                    )}

                                </div>

                            </div>


                            <button
                                type="button"
                                class="cart-remove"
                                data-id="${escapeHTML(
                                    item.id
                                )}"
                                aria-label="Remove ${escapeHTML(
                                    item.name
                                )}">

                                ×

                            </button>

                        `;


                        cartItemsList.appendChild(
                            itemElement
                        );

                    });

            });


        /* CART BADGE */

        if (cartBadge) {

            cartBadge.textContent =
                cart.length;

        }


        /* CART TOTAL */

        if (cartTotalVal) {

            const total =
                getCartTotal();


            cartTotalVal.textContent =
                total === 0
                    ? "FREE"
                    : formatPrice(total);

        }


        /* CHECKOUT */

        if (cartCheckout) {

            cartCheckout.disabled =
                false;

        }


        /* REMOVE BUTTONS */

        cartItemsList
            .querySelectorAll(
                ".cart-remove"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();
                        event.stopPropagation();

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

        if (
            !cartDrawer ||
            !cartOverlay
        ) {
            return;
        }


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

        if (
            !cartDrawer ||
            !cartOverlay
        ) {
            return;
        }


        cartDrawer.classList.remove(
            "active"
        );


        cartOverlay.classList.remove(
            "active"
        );


        if (
            !productModal ||
            !productModal.classList.contains(
                "active"
            )
        ) {

            document.body.style.overflow =
                "";

        }

    }


    /* =====================================================
       WHATSAPP CHECKOUT
    ===================================================== */

    function checkoutWhatsApp() {

        if (
            !cart ||
            cart.length === 0
        ) {
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
            .forEach(category => {

                message +=
`
------------------------------
${category.toUpperCase()}
------------------------------

`;


                groups[category]
                    .forEach(item => {

                        message +=
`${itemNumber}. ${item.name}
Price: ${formatPrice(item.price)}

`;

                        itemNumber++;

                    });

            });


        const total =
            getCartTotal();


        message +=
`------------------------------
ORDER SUMMARY
------------------------------

Total Items: ${cart.length}

Estimated Total: ${
    total === 0
        ? "FREE"
        : formatPrice(total)
}

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
            "_blank",
            "noopener,noreferrer"
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

            if (event.key === "Escape") {


                if (
                    productModal &&
                    productModal.classList.contains(
                        "active"
                    )
                ) {

                    closeProductModal();

                }


                if (
                    cartDrawer &&
                    cartDrawer.classList.contains(
                        "active"
                    )
                ) {

                    closeCart();

                }

            }


            /* PRODUCT IMAGE NAVIGATION */

            if (
                productModal &&
                productModal.classList.contains(
                    "active"
                )
            ) {


                if (
                    event.key === "ArrowRight"
                ) {

                    event.preventDefault();

                    nextImage();

                }


                if (
                    event.key === "ArrowLeft"
                ) {

                    event.preventDefault();

                    previousImage();

                }

            }

        }
    );


    /* =====================================================
       TOUCH / SWIPE
    ===================================================== */

    let touchStartX = 0;
    let touchEndX = 0;


    if (mainProductImage) {


        mainProductImage.addEventListener(
            "touchstart",
            function (event) {

                if (
                    event.touches &&
                    event.touches.length
                ) {

                    touchStartX =
                        event.touches[0].clientX;

                }

            },
            {
                passive: true
            }
        );


        mainProductImage.addEventListener(
            "touchend",
            function (event) {

                if (
                    event.changedTouches &&
                    event.changedTouches.length
                ) {

                    touchEndX =
                        event.changedTouches[0].clientX;

                }


                const difference =
                    touchStartX -
                    touchEndX;


                /* SWIPE LEFT */

                if (difference > 50) {

                    nextImage();

                }


                /* SWIPE RIGHT */

                if (difference < -50) {

                    previousImage();

                }

            },
            {
                passive: true
            }
        );

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    setupFilters();

    renderProducts();

    updateCart();


    /* =====================================================
       DEBUG
    ===================================================== */

    console.log(
        "Sai Graphic Designs Shop loaded successfully."
    );

    console.log(
        "Products:",
        products.length
    );

    console.log(
        "Active Filter:",
        activeFilter
    );

});
