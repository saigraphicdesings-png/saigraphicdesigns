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
            description:
                "Premium business card template suitable for Travel Agency businesses. Editable CDR file.",
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
            description:
                "Modern premium business card template suitable for Makeup Studio businesses. Editable CDR file.",
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
            description:
                "Creative professional business card template suitable for Hotel businesses. Editable CDR file.",
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
            description:
                "Elegant editable business card template suitable for International Travel businesses. Editable CDR file.",
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
            description:
                "Premium creative business card template suitable for Hospital and Clinic businesses. Editable CDR file.",
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
            description:
                "Bundle of 4 premium business card templates. Editable CDR files.",
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
            description:
                "Bundle of 4 premium business card templates. Editable CDR files.",
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
            price: 199,
            category: "Printing Designs",
            description:
                "Bundle of 4 premium business card templates. Editable CDR files.",
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
            description:
                "Bundle of 4 premium business card templates. Editable CDR files.",
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
            description:
                "Bundle of 4 premium business card templates. Editable CDR files.",
            images: [
                "Images/Shop/business-card-Bundel-05/1.jpg",
                "Images/Shop/business-card-Bundel-05/2.jpg",
                "Images/Shop/business-card-Bundel-05/3.jpg",
                "Images/Shop/business-card-Bundel-05/4.jpg",
                "Images/Shop/business-card-Bundel-05/5.jpg"
            ]
        },


        /* =================================================
           BROCHURE
        ================================================= */

        {
            id: "brochure-01",

            name: "Premium Corporate Brochure 01",

            price: 200,

            category: "Printing Designs",

            type: "brochure",

            description:
                "Premium editable corporate brochure template in CDR format.",

            images: [
                "Images/Shop/brochure-01/cover.jpg"
            ],

            pages: [
                "Images/Shop/brochure-01/cover.jpg",
                "Images/Shop/brochure-01/page-2.jpg",
                "Images/Shop/brochure-01/page-3.jpg",
                "Images/Shop/brochure-01/page-4.jpg",
                "Images/Shop/brochure-01/page-5.jpg",
                "Images/Shop/brochure-01/page-6.jpg",
                "Images/Shop/brochure-01/page-7.jpg",
                "Images/Shop/brochure-01/page-8.jpg",
                "Images/Shop/brochure-01/page-9.jpg",
                "Images/Shop/brochure-01/back.jpg"
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

    const productViewer =
    document.querySelector(".product-viewer");
    
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


    /* =====================================================
       BROCHURE FLIPBOOK ELEMENTS
    ===================================================== */

    const brochureViewer =
        document.getElementById("brochureViewer");

    const flipbookBook =
        document.getElementById("flipbookBook");

    const flipbookLeft =
        document.getElementById("flipbookLeft");

    const flipbookRight =
        document.getElementById("flipbookRight");

    const flipbookTurningPage =
        document.getElementById("flipbookTurningPage");

    const flipbookFront =
        flipbookTurningPage
            ? flipbookTurningPage.querySelector(".flipbook-front")
            : null;

    const flipbookBack =
        flipbookTurningPage
            ? flipbookTurningPage.querySelector(".flipbook-back")
            : null;

    const flipbookPrev =
        document.getElementById("flipbookPrev");

    const flipbookNext =
        document.getElementById("flipbookNext");

    const flipbookCounter =
        document.getElementById("flipbookCounter");

    const flipbookFullscreen =
        document.getElementById("flipbookFullscreen");


    /* =====================================================
       CART ELEMENTS
    ===================================================== */

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
       FLIPBOOK STATE
    ===================================================== */

    let flipbookSpread = 0;
    let flipbookAnimating = false;


    /* =====================================================
       PRICE FORMAT
    ===================================================== */

    function formatPrice(price) {

        return "₹" +
            Number(price || 0).toLocaleString("en-IN");

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
       GET PRODUCT BY ID
    ===================================================== */

    function getProductById(id) {

        return products.find(function (product) {

            return product.id === id;

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


        Object.keys(categoryContainers).forEach(
            function (category) {

                const container =
                    categoryContainers[category];

                if (container) {
                    container.innerHTML = "";
                }

            }
        );


        products.forEach(function (product) {

            const container =
                categoryContainers[product.category];

            if (!container) {
                return;
            }


            if (
                !Array.isArray(product.images) ||
                product.images.length === 0
            ) {
                console.warn(
                    "No images found for:",
                    product.name
                );

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
                        src="${escapeHTML(product.images[0])}"
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


            /* Open product */

            card.addEventListener(
                "click",
                function () {

                    openProductModal(product);

                }
            );


            /* Add to cart */

            const addButton =
                card.querySelector(
                    ".add-product-btn"
                );


            if (addButton) {

                addButton.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        addProductToCart(product);

                    }
                );

            }


            /* Image error */

            const productImage =
                card.querySelector(
                    ".product-preview img"
                );


            if (productImage) {

                productImage.addEventListener(
                    "error",
                    function () {

                        console.error(
                            "Image not found:",
                            product.images[0]
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

    if (!product) {
        return;
    }

    currentProduct = product;
    currentImageIndex = 0;

    // Product name
    if (modalProductName) {
        modalProductName.textContent = product.name;
    }

    // Description
    if (modalProductDescription) {
        modalProductDescription.textContent =
            product.description || "";
    }

    // Price
    if (modalProductPrice) {
        modalProductPrice.textContent =
            formatPrice(product.price);
    }

    // Category
    if (modalProductCategory) {
        modalProductCategory.textContent =
            product.category;
    }

    // ==========================================
    // BROCHURE
    // ==========================================

    if (
        product.type === "brochure" &&
        Array.isArray(product.pages) &&
        product.pages.length > 0
    ) {

        console.log("Opening brochure:", product.name);
        console.log("Brochure pages:", product.pages);

        // Hide normal product viewer
       if (productViewer) {
    productViewer.style.display = "";
    }

        // Hide thumbnails
        if (productThumbnails) {
            productThumbnails.style.display = "none";
        }

        // Open flipbook
        openBrochureFlipbook();

    }

    // ==========================================
    // NORMAL PRODUCT
    // ==========================================

    else {

        closeBrochureFlipbook();

        if (productViewer) {
            productViewer.style.display = "";
        }

        if (productThumbnails) {
            productThumbnails.style.display = "";
        }

        renderProductImages();
    }

    // ==========================================
    // SHOW MODAL
    // ==========================================

    if (productModal) {

        productModal.classList.add("active");

        productModal.setAttribute(
            "aria-hidden",
            "false"
        );
    }

    // Prevent background scrolling
    document.body.style.overflow = "hidden";
}
    /* =====================================================
       RENDER PRODUCT IMAGES
    ===================================================== */

    function renderProductImages() {

        if (!currentProduct) {
            return;
        }


        const images =
            Array.isArray(currentProduct.images)
                ? currentProduct.images
                : [];


        if (
            !mainProductImage ||
            !productThumbnails
        ) {
            return;
        }


        if (images.length === 0) {

            mainProductImage.removeAttribute("src");

            productThumbnails.innerHTML = "";

            return;

        }


        if (
            currentImageIndex < 0 ||
            currentImageIndex >= images.length
        ) {

            currentImageIndex = 0;

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
                    index === currentImageIndex
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

                        event.stopPropagation();

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


        const images =
            currentProduct.images || [];


        if (images.length <= 1) {
            return;
        }


        currentImageIndex++;


        if (
            currentImageIndex >=
            images.length
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


        const images =
            currentProduct.images || [];


        if (images.length <= 1) {
            return;
        }


        currentImageIndex--;


        if (currentImageIndex < 0) {

            currentImageIndex =
                images.length - 1;

        }


        renderProductImages();

    }


    /* =====================================================
       CLOSE PRODUCT MODAL
    ===================================================== */

    function closeProductModal() {

        closeBrochureFlipbook();


        if (productModal) {

            productModal.classList.remove(
                "active"
            );

            productModal.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        currentProduct = null;
        currentImageIndex = 0;


        document.body.style.overflow = "";

    }


    /* =====================================================
       BROCHURE PAGES
    ===================================================== */

    function getBrochurePages() {

        if (
            !currentProduct ||
            currentProduct.type !== "brochure" ||
            !Array.isArray(currentProduct.pages)
        ) {
            return [];
        }


        const pages =
            [...currentProduct.pages];


        /*
            If odd number of pages,
            add blank page.
        */

        if (pages.length % 2 !== 0) {

            pages.push(null);

        }


        return pages;

    }


    /* =====================================================
       SET FLIPBOOK PAGE
    ===================================================== */

    function setFlipbookPage(element, image) {

        if (!element) {
            return;
        }


        element.innerHTML = "";


        if (!image) {
            return;
        }


        const img =
            document.createElement("img");

        img.src =
            image;

        img.alt =
            "Brochure page";


        element.appendChild(img);

    }


    /* =====================================================
       SET FLIPBOOK FACE
    ===================================================== */

    function setFlipbookFace(element, image) {

        if (!element) {
            return;
        }


        element.innerHTML = "";


        if (!image) {
            return;
        }


        const img =
            document.createElement("img");

        img.src =
            image;

        img.alt =
            "Brochure page";


        element.appendChild(img);

    }


    /* =====================================================
       RENDER FLIPBOOK SPREAD
    ===================================================== */

    function renderFlipbookSpread() {

    if (!currentProduct) {
        return;
    }

    const pages = currentProduct.pages;

    if (!pages || pages.length === 0) {
        return;
    }

    const leftIndex = flipbookSpread * 2;
    const rightIndex = leftIndex + 1;

    const leftPage = pages[leftIndex];
    const rightPage = pages[rightIndex];

    // LEFT PAGE
    if (flipbookLeft) {

        if (leftPage) {

            flipbookLeft.innerHTML = `
                <img
                    src="${leftPage}"
                    alt="Brochure Page ${leftIndex + 1}"
                    draggable="false"
                >
            `;

        } else {

            flipbookLeft.innerHTML = "";

        }
    }

    // RIGHT PAGE
    if (flipbookRight) {

        if (rightPage) {

            flipbookRight.innerHTML = `
                <img
                    src="${rightPage}"
                    alt="Brochure Page ${rightIndex + 1}"
                    draggable="false"
                >
            `;

        } else {

            flipbookRight.innerHTML = "";

        }
    }

    // PAGE COUNTER
    if (flipbookCounter) {

        if (rightPage) {

            flipbookCounter.textContent =
                `${leftIndex + 1}–${rightIndex + 1} / ${pages.length}`;

        } else {

            flipbookCounter.textContent =
                `${leftIndex + 1} / ${pages.length}`;

        }
    }

    // PREVIOUS BUTTON
    if (flipbookPrev) {

        flipbookPrev.disabled =
            flipbookSpread <= 0;

    }

    // NEXT BUTTON
    if (flipbookNext) {

        flipbookNext.disabled =
            rightIndex >= pages.length - 1;

    }
}

    /* =====================================================
       RESET TURNING PAGE
    ===================================================== */

    function resetTurningPage() {

        if (!flipbookTurningPage) {
            return;
        }


        flipbookTurningPage.className =
            "flipbook-turning-page";


        flipbookTurningPage.style.visibility =
            "hidden";


        flipbookTurningPage.style.left =
            "";

        flipbookTurningPage.style.right =
            "";


        flipbookAnimating = false;

    }


    /* =====================================================
       NEXT BROCHURE PAGE
    ===================================================== */

    function nextBrochurePage() {

        const pages =
            getBrochurePages();


        if (
            !pages.length ||
            flipbookAnimating ||
            flipbookSpread + 2 >= pages.length
        ) {
            return;
        }


        const currentRight =
            pages[flipbookSpread + 1];

        const nextLeft =
            pages[flipbookSpread + 2];


        setFlipbookFace(
            flipbookFront,
            currentRight
        );


        setFlipbookFace(
            flipbookBack,
            nextLeft
        );


        flipbookAnimating = true;


        if (!flipbookTurningPage) {

            flipbookSpread += 2;

            renderFlipbookSpread();

            flipbookAnimating = false;

            return;

        }


        flipbookTurningPage.className =
            "flipbook-turning-page turn-next";


        flipbookTurningPage.style.visibility =
            "visible";


        void flipbookTurningPage.offsetWidth;


        requestAnimationFrame(
            function () {

                flipbookTurningPage.classList.add(
                    "is-flipping"
                );

            }
        );


        setTimeout(
            function () {

                flipbookSpread += 2;

                renderFlipbookSpread();

                resetTurningPage();

            },
            680
        );

    }


    /* =====================================================
       PREVIOUS BROCHURE PAGE
    ===================================================== */

    function previousBrochurePage() {

        const pages =
            getBrochurePages();


        if (
            !pages.length ||
            flipbookAnimating ||
            flipbookSpread <= 0
        ) {
            return;
        }


        const currentLeft =
            pages[flipbookSpread];

        const previousRight =
            pages[flipbookSpread - 1];


        setFlipbookFace(
            flipbookFront,
            currentLeft
        );


        setFlipbookFace(
            flipbookBack,
            previousRight
        );


        flipbookAnimating = true;


        if (!flipbookTurningPage) {

            flipbookSpread -= 2;

            renderFlipbookSpread();

            flipbookAnimating = false;

            return;

        }


        flipbookTurningPage.className =
            "flipbook-turning-page turn-prev";


        flipbookTurningPage.style.visibility =
            "visible";


        void flipbookTurningPage.offsetWidth;


        requestAnimationFrame(
            function () {

                flipbookTurningPage.classList.add(
                    "is-flipping"
                );

            }
        );


        setTimeout(
            function () {

                flipbookSpread -= 2;

                renderFlipbookSpread();

                resetTurningPage();

            },
            680
        );

    }


    /* =====================================================
       OPEN BROCHURE FLIPBOOK
    ===================================================== */

    function openBrochureFlipbook() {

    if (!brochureViewer) {
        console.error(
            "ERROR: #brochureViewer was not found in shop.html"
        );
        return;
    }

    if (!currentProduct) {
        console.error(
            "ERROR: currentProduct is empty"
        );
        return;
    }

    if (
        !currentProduct.pages ||
        !Array.isArray(currentProduct.pages) ||
        currentProduct.pages.length === 0
    ) {
        console.error(
            "ERROR: No brochure pages found",
            currentProduct
        );
        return;
    }

    console.log(
        "Opening Flipbook:",
        currentProduct.pages
    );

    // Show flipbook
    brochureViewer.style.display = "flex";
    brochureViewer.classList.add("active");

    // Reset spread
    flipbookSpread = 0;
    flipbookAnimating = false;

    // Render first two pages
    renderFlipbookSpread();

    // Hide animation layer initially
    if (flipbookTurningPage) {
        flipbookTurningPage.style.display = "none";
        flipbookTurningPage.classList.remove("turning");
    }
}


    /* =====================================================
       CLOSE BROCHURE FLIPBOOK
    ===================================================== */

    function closeBrochureFlipbook() {

        if (!brochureViewer) {
            return;
        }


        brochureViewer.classList.remove(
            "active"
        );


        brochureViewer.setAttribute(
            "aria-hidden",
            "true"
        );


        const normalViewer =
            document.querySelector(".product-viewer");


        if (normalViewer) {

            normalViewer.style.display =
                "";

        }


        if (productThumbnails) {

            productThumbnails.style.display =
                "";

        }


        resetTurningPage();

    }


    /* =====================================================
       FULLSCREEN FLIPBOOK
    ===================================================== */

    async function toggleFlipbookFullscreen() {

        if (!brochureViewer) {
            return;
        }


        try {

            if (!document.fullscreenElement) {

                if (
                    brochureViewer.requestFullscreen
                ) {

                    await brochureViewer.requestFullscreen();

                }

            } else {

                if (document.exitFullscreen) {

                    await document.exitFullscreen();

                }

            }

        } catch (error) {

            console.error(
                "Fullscreen error:",
                error
            );

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
                function (item) {

                    return item.id === product.id;

                }
            );


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

            price: Number(product.price) || 0,

            category: product.category,

            image:
                product.images &&
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
       REMOVE CART ITEM
    ===================================================== */

    function removeFromCart(id) {

        cart =
            cart.filter(
                function (item) {

                    return item.id !== id;

                }
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
                    (Number(item.price) || 0);

            },
            0
        );

    }


    /* =====================================================
       GROUP CART
    ===================================================== */

    function groupCartItems() {

        const groups = {};


        cart.forEach(
            function (item) {

                const category =
                    item.category ||
                    "Other";


                if (!groups[category]) {

                    groups[category] = [];

                }


                groups[category].push(item);

            }
        );


        return groups;

    }


    /* =====================================================
       UPDATE CART
    ===================================================== */

    function updateCart() {

        if (
            !cartItemsList ||
            !cartBadge ||
            !cartTotalVal ||
            !cartCheckout
        ) {
            return;
        }


        cartItemsList.innerHTML = "";


        /* =================================================
           EMPTY CART
        ================================================= */

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


        /* =================================================
           GROUP PRODUCTS
        ================================================= */

        const groups =
            groupCartItems();


        Object.keys(groups).forEach(
            function (category) {

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


                groups[category].forEach(
                    function (item) {

                        const itemElement =
                            document.createElement(
                                "div"
                            );


                        itemElement.className =
                            "cart-item";


                        itemElement.innerHTML = `

                            <div class="cart-item-image">

                                <img
                                    src="${escapeHTML(item.image || "")}"
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
                                data-id="${escapeHTML(item.id)}"
                                aria-label="Remove item">

                                ×

                            </button>

                        `;


                        cartItemsList.appendChild(
                            itemElement
                        );

                    }
                );

            }
        );


        /* =================================================
           TOTAL
        ================================================= */

        cartBadge.textContent =
            cart.length;


        cartTotalVal.textContent =
            formatPrice(
                getCartTotal()
            );


        cartCheckout.disabled =
            false;


        /* =================================================
           REMOVE BUTTONS
        ================================================= */

        cartItemsList
            .querySelectorAll(
                ".cart-remove"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            removeFromCart(
                                this.dataset.id
                            );

                        }
                    );

                }
            );

    }


    /* =====================================================
       OPEN CART
    ===================================================== */

    function openCart() {

        updateCart();


        if (cartDrawer) {

            cartDrawer.classList.add(
                "active"
            );

        }


        if (cartOverlay) {

            cartOverlay.classList.add(
                "active"
            );

        }


        document.body.style.overflow =
            "hidden";

    }


    /* =====================================================
       CLOSE CART
    ===================================================== */

    function closeCart() {

        if (cartDrawer) {

            cartDrawer.classList.remove(
                "active"
            );

        }


        if (cartOverlay) {

            cartOverlay.classList.remove(
                "active"
            );

        }


        document.body.style.overflow =
            "";

    }


    /* =====================================================
       WHATSAPP CHECKOUT
    ===================================================== */

    function checkoutWhatsApp() {

        if (
            !cart.length ||
            !WHATSAPP_NUMBER
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


        Object.keys(groups).forEach(
            function (category) {

                message +=
`
------------------------------
${category.toUpperCase()}
------------------------------

`;


                groups[category].forEach(
                    function (item) {

                        message +=
`${itemNumber}. ${item.name}
Price: ${formatPrice(item.price)}

`;

                        itemNumber++;

                    }
                );

            }
        );


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
            encodeURIComponent(message);


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


    /* =====================================================
       FLIPBOOK EVENTS
    ===================================================== */

    if (flipbookNext) {

        flipbookNext.addEventListener(
            "click",
            nextBrochurePage
        );

    }


    if (flipbookPrev) {

        flipbookPrev.addEventListener(
            "click",
            previousBrochurePage
        );

    }


    /* =====================================================
       FULLSCREEN EVENT
    ===================================================== */

    if (flipbookFullscreen) {

        flipbookFullscreen.addEventListener(
            "click",
            toggleFlipbookFullscreen
        );

    }


    /* =====================================================
       ADD TO CART FROM MODAL
    ===================================================== */

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

            /* Escape */

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


            /* Product viewer keyboard navigation */

            if (
                productModal &&
                productModal.classList.contains(
                    "active"
                )
            ) {

                if (
                    event.key === "ArrowRight"
                ) {

                    if (
                        currentProduct &&
                        currentProduct.type ===
                            "brochure"
                    ) {

                        nextBrochurePage();

                    } else {

                        nextImage();

                    }

                }


                if (
                    event.key === "ArrowLeft"
                ) {

                    if (
                        currentProduct &&
                        currentProduct.type ===
                            "brochure"
                    ) {

                        previousBrochurePage();

                    } else {

                        previousImage();

                    }

                }

            }

        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    renderProducts();

    updateCart();


    console.log(
        "Sai Graphic Designs Shop initialized successfully."
    );

    console.log(
        "Products loaded:",
        products.length
    );

});
