document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       SETTINGS
    ===================================================== */

    const CART_KEY = "saiGraphicCart";
    const WHATSAPP_NUMBER = "916381128781";


    /* =====================================================
       PRODUCT DATA
    ===================================================== */

    // The admin database is the source of truth, including an empty catalog.
    let products = [];
    let catalogStatus = "loading";



    /* =====================================================
       ELEMENTS
    ===================================================== */

    const allProducts =
        document.getElementById("allProducts");

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

                const mergedItems = new Map();

                parsedCart.forEach(item => {

                    const key =
                        String(
                            item.name ||
                            item.id ||
                            ""
                        ).trim().toLowerCase();

                    if (!key) {
                        return;
                    }

                    if (mergedItems.has(key)) {

                        const existing =
                            mergedItems.get(key);

                        existing.qty =
                            Math.max(
                                Number(existing.qty) || 1,
                                Number(item.qty) || 1
                            );

                    } else {

                        mergedItems.set(
                            key,
                            {
                                ...item,
                                qty: Number(item.qty) || 1
                            }
                        );

                    }

                });

                cart =
                    Array.from(
                        mergedItems.values()
                    );

                localStorage.setItem(
                    CART_KEY,
                    JSON.stringify(cart)
                );

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
       (single flat grid — no category grouping; the
       filter bar above controls what's shown, and each
       card still displays its category as a small label)
    ===================================================== */

    function renderProducts() {

        if (!allProducts) {
            return;
        }


        /* CLEAR */

        allProducts.innerHTML = "";

        if (catalogStatus !== "ready") {
            const status = document.createElement("div");
            status.className = "shop-filter-empty";
            status.setAttribute("role", "status");
            status.textContent = catalogStatus === "loading"
                ? "Loading designs…"
                : "Unable to load designs. Please refresh to try again.";
            allProducts.appendChild(status);
            return;
        }

        const filteredProducts =
            getFilteredProducts();


        /* =================================================
           NO RESULTS
        ================================================= */

        if (filteredProducts.length === 0) {

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


            allProducts.appendChild(empty);


            return;

        }


        /* =================================================
           CREATE PRODUCT CARDS
        ================================================= */

        filteredProducts.forEach(product => {

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

                   ${isFree ? `
    <span class="free-ribbon" aria-label="Free">
        <span class="free-ribbon-main">FREE</span>
    </span>
` : ""}

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

                            ${isFree ? "Get Free" : "Add to Cart"}

                        </button>


                    </div>


                </div>

            `;


            allProducts.appendChild(card);


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

                        this.onerror = null;
                        this.src = "Images/placeholder.svg";
                        this.alt = product.name + " preview coming soon";

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

                        if (Number(product.price) === 0) {
                            requestFreeProductWhatsApp(product, addButton);
                        } else {
                            addProductToCart(product);
                        }

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


        if (modalAddCart) {
            modalAddCart.dataset.downloadReady = "";
            modalAddCart.textContent =
                Number(product.price) === 0
                    ? "Get Free on WhatsApp"
                    : "Add to Cart";
        }


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
       REQUEST FREE PRODUCT ON WHATSAPP
    ===================================================== */

    function requestFreeProductWhatsApp(product, actionButton) {

        if (!product) {
            return;
        }

        if (
            product.downloadUrl &&
            actionButton &&
            actionButton.dataset.downloadReady === "true"
        ) {
            window.open(
                product.downloadUrl,
                "_blank",
                "noopener,noreferrer"
            );
            return;
        }

        const message =
`Hello Sai Graphic Designs 👋

✅ FREE DOWNLOAD:
${product.downloadUrl || "Please send me the Google Drive download link."}

Template: ${product.name}
Category: ${product.category || "Design Template"}

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

        if (product.downloadUrl && actionButton) {
            actionButton.dataset.downloadReady = "true";
            actionButton.textContent = "Download File";
            actionButton.setAttribute(
                "aria-label",
                "Download " + product.name
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
                item =>
                    item.id === product.id
            );


        if (existing) {

            existing.qty =
                (Number(existing.qty) || 1) + 1;

            saveCart();
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
                    : "",

            qty: 1

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

    function removeFromCart(id, cartIndex) {

        const index =
            Number(cartIndex);

        /*
         * Service items created on other pages may not have an id.
         * Remove by their actual cart position first, with id as a
         * compatibility fallback for normal Shop products.
         */
        if (
            Number.isInteger(index) &&
            index >= 0 &&
            index < cart.length
        ) {

            cart.splice(index, 1);

        } else {

            cart =
                cart.filter(
                    item =>
                        String(item.id || "") !==
                        String(id || "")
                );

        }


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
                        (Number(item.price) || 0) *
                        (Number(item.qty) || 1)
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
                "Services";


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


                        const cartIndex =
                            cart.indexOf(item);


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
                                        item.image ||
                                        "Images/favicon.png"
                                    )}"
                                    alt="${escapeHTML(
                                        item.name
                                    )}"
                                    onerror="this.onerror=null;this.src='Images/placeholder.svg';">

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
                                        (Number(item.price) || 0) *
                                        (Number(item.qty) || 1)
                                    )}

                                </div>

                                <div class="cart-quantity"
                                     aria-label="Quantity controls">
                                    <button type="button"
                                            class="cart-qty-btn"
                                            data-action="decrease"
                                            data-cart-index="${cartIndex}"
                                            aria-label="Decrease quantity">−</button>
                                    <span class="cart-qty-value">${Number(item.qty) || 1}</span>
                                    <button type="button"
                                            class="cart-qty-btn"
                                            data-action="increase"
                                            data-cart-index="${cartIndex}"
                                            aria-label="Increase quantity">+</button>
                                </div>

                            </div>


                            <button
                                type="button"
                                class="cart-remove"
                                data-id="${escapeHTML(
                                    item.id || ""
                                )}"
                                data-cart-index="${cartIndex}"
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
                cart.reduce(
                    (count, item) =>
                        count + (Number(item.qty) || 1),
                    0
                );

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


        /* QUANTITY BUTTONS */

        cartItemsList
            .querySelectorAll(".cart-qty-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();
                        event.stopPropagation();

                        const index =
                            Number(this.dataset.cartIndex);

                        if (
                            !Number.isInteger(index) ||
                            !cart[index]
                        ) {
                            return;
                        }

                        const currentQty =
                            Number(cart[index].qty) || 1;

                        cart[index].qty =
                            this.dataset.action === "increase"
                                ? currentQty + 1
                                : Math.max(1, currentQty - 1);

                        saveCart();
                        updateCart();

                    }
                );

            });


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
                            this.dataset.id,
                            this.dataset.cartIndex
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

Please contact me regarding:
• Payment details
• File delivery
• Download/access details
• Any other requirements

Thank you! 😊`;


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


                if (Number(currentProduct.price) === 0) {
                    requestFreeProductWhatsApp(currentProduct, modalAddCart);
                } else {
                    addProductToCart(currentProduct);
                }

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

    let catalogRequest = 0;

    async function loadManagedProducts() {
        const requestId = ++catalogRequest;
        try {
            const response = await fetch("/api/products", {
                cache: "no-store",
                headers: { "Accept": "application/json" }
            });
            if (!response.ok) {
                throw new Error("Product request failed: " + response.status);
            }
            const data = await response.json();
            if (!Array.isArray(data.products)) {
                throw new Error("Invalid product response.");
            }
            if (requestId !== catalogRequest) return;

            products = data.products.slice().sort(function (first, second) {
                return (Number(first.sort_order) || 0) -
                    (Number(second.sort_order) || 0);
            });
            catalogStatus = "ready";
        } catch (error) {
            if (requestId !== catalogRequest) return;
            products = [];
            catalogStatus = "error";
            console.warn("Unable to load the shop catalog.", error);
        }
        renderProducts();
    }

    // Refresh after visiting the admin tab or restoring a cached shop page.
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") loadManagedProducts();
    });
    window.addEventListener("pageshow", function (event) {
        if (event.persisted) loadManagedProducts();
    });

    setupFilters();

    renderProducts();

    updateCart();

    loadManagedProducts();


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


    /* =====================================================
       INTERACTIVE 3D PRODUCT PREVIEW
       Enhances the existing product modal image viewer
    ===================================================== */

    if (mainProductImage) {

        const previewFrame =
            mainProductImage.closest(
                ".main-product-image"
            );

        if (previewFrame) {

            let previewDragging = false;
            let previewStartX = 0;
            let previewStartY = 0;
            let previewRotateX = 0;
            let previewRotateY = 0;

            previewFrame.classList.add(
                "interactive-3d-preview"
            );

            previewFrame.setAttribute(
                "aria-label",
                "Interactive 3D product preview. Move or drag to rotate."
            );

            function applyProduct3D() {

                mainProductImage.style.transform =
                    "rotateX(" +
                    previewRotateX +
                    "deg) rotateY(" +
                    previewRotateY +
                    "deg)";

            }

            function resetProduct3D() {

                previewRotateX = 0;
                previewRotateY = 0;

                previewFrame.classList.remove(
                    "is-dragging"
                );

                applyProduct3D();

            }

            previewFrame.addEventListener(
                "pointerdown",
                function (event) {

                    previewDragging = true;
                    previewStartX = event.clientX;
                    previewStartY = event.clientY;

                    previewFrame.classList.add(
                        "is-dragging"
                    );

                    if (
                        previewFrame.setPointerCapture
                    ) {

                        previewFrame.setPointerCapture(
                            event.pointerId
                        );

                    }

                }
            );

            previewFrame.addEventListener(
                "pointermove",
                function (event) {

                    const rect =
                        previewFrame.getBoundingClientRect();

                    if (previewDragging) {

                        previewRotateY +=
                            (
                                event.clientX -
                                previewStartX
                            ) * 0.32;

                        previewRotateX -=
                            (
                                event.clientY -
                                previewStartY
                            ) * 0.24;

                        previewRotateX =
                            Math.max(
                                -50,
                                Math.min(
                                    50,
                                    previewRotateX
                                )
                            );

                        previewStartX =
                            event.clientX;

                        previewStartY =
                            event.clientY;

                    } else {

                        previewRotateY =
                            (
                                (
                                    event.clientX -
                                    rect.left
                                ) /
                                rect.width -
                                0.5
                            ) * 22;

                        previewRotateX =
                            -(
                                (
                                    event.clientY -
                                    rect.top
                                ) /
                                rect.height -
                                0.5
                            ) * 16;

                    }

                    applyProduct3D();

                }
            );

            function stopProduct3DDrag(
                event
            ) {

                previewDragging = false;

                previewFrame.classList.remove(
                    "is-dragging"
                );

                if (
                    event &&
                    previewFrame.hasPointerCapture &&
                    previewFrame.hasPointerCapture(
                        event.pointerId
                    )
                ) {

                    previewFrame.releasePointerCapture(
                        event.pointerId
                    );

                }

            }

            previewFrame.addEventListener(
                "pointerup",
                stopProduct3DDrag
            );

            previewFrame.addEventListener(
                "pointercancel",
                stopProduct3DDrag
            );

            previewFrame.addEventListener(
                "pointerleave",
                function () {

                    if (!previewDragging) {

                        resetProduct3D();

                    }

                }
            );

            previewFrame.addEventListener(
                "dblclick",
                resetProduct3D
            );

            mainProductImage.addEventListener(
                "load",
                resetProduct3D
            );

            const modalObserver =
                new MutationObserver(
                    function () {

                        if (
                            productModal &&
                            productModal.classList.contains(
                                "active"
                            )
                        ) {

                            resetProduct3D();

                        }

                    }
                );

            if (productModal) {

                modalObserver.observe(
                    productModal,
                    {
                        attributes: true,
                        attributeFilter: [
                            "class"
                        ]
                    }
                );

            }

        }

    }

});
