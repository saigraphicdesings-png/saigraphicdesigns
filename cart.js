/* ==========================================
   SAI GRAPHIC DESIGNS - CART SYSTEM
========================================== */

let cart = JSON.parse(localStorage.getItem("saiCart")) || [];


/* ==========================================
   SAVE CART
========================================== */

function saveCart() {
    localStorage.setItem("saiCart", JSON.stringify(cart));
}


/* ==========================================
   ADD SERVICE TO CART
========================================== */

function addToCart(name, price, icon = "🎨") {

    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        cart.push({
            name: name,
            price: Number(price),
            icon: icon,
            quantity: 1
        });

    }

    saveCart();
    renderCart();
}


/* ==========================================
   REMOVE ITEM
========================================== */

function removeFromCart(index) {

    cart.splice(index, 1);

    saveCart();
    renderCart();

}


/* ==========================================
   UPDATE QUANTITY
========================================== */

function changeQuantity(index, amount) {

    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }

    saveCart();
    renderCart();

}


/* ==========================================
   RENDER CART
========================================== */

function renderCart() {

    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const cartBadge = document.querySelector(".cart-badge");

    if (!cartItems) return;


    /* EMPTY CART */

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div style="
                text-align:center;
                padding:3rem 1rem;
                color:var(--dark-muted);
            ">

                <div style="font-size:3rem;">
                    🛒
                </div>

                <h4 style="
                    margin-top:1rem;
                    color:var(--dark);
                ">
                    Your cart is empty
                </h4>

                <p style="
                    margin-top:.5rem;
                    font-size:.9rem;
                ">
                    Select a service to add it to your cart.
                </p>

            </div>
        `;

        if (cartTotal) {
            cartTotal.textContent = "₹0";
        }

        if (cartBadge) {
            cartBadge.textContent = "0";
        }

        return;
    }


    /* CART ITEMS */

    cartItems.innerHTML = "";


    let total = 0;
    let quantityTotal = 0;


    cart.forEach((item, index) => {

        const itemTotal =
            item.price * item.quantity;

        total += itemTotal;
        quantityTotal += item.quantity;


        const cartItem =
            document.createElement("div");

        cartItem.style.cssText = `
            border:1px solid var(--border);
            border-radius:12px;
            padding:1rem;
            background:var(--light);
        `;


        cartItem.innerHTML = `

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:10px;
            ">

                <div style="
                    display:flex;
                    gap:10px;
                    align-items:center;
                ">

                    <div style="
                        font-size:1.8rem;
                    ">
                        ${item.icon}
                    </div>

                    <div>

                        <div style="
                            font-weight:800;
                            color:var(--dark);
                        ">
                            ${item.name}
                        </div>

                        <div style="
                            color:var(--primary);
                            font-weight:700;
                            font-size:.85rem;
                        ">
                            ₹${item.price.toLocaleString("en-IN")}
                        </div>

                    </div>

                </div>


                <button
                    onclick="removeFromCart(${index})"
                    style="
                        border:none;
                        background:none;
                        cursor:pointer;
                        font-size:1.2rem;
                        color:#ef4444;
                    "
                    title="Remove"
                >
                    ×
                </button>

            </div>


            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-top:1rem;
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:.5rem;
                ">

                    <button
                        onclick="changeQuantity(${index}, -1)"
                        style="
                            width:30px;
                            height:30px;
                            border:1px solid var(--border);
                            background:var(--white);
                            border-radius:6px;
                            cursor:pointer;
                        "
                    >
                        −
                    </button>

                    <strong>
                        ${item.quantity}
                    </strong>

                    <button
                        onclick="changeQuantity(${index}, 1)"
                        style="
                            width:30px;
                            height:30px;
                            border:1px solid var(--border);
                            background:var(--white);
                            border-radius:6px;
                            cursor:pointer;
                        "
                    >
                        +
                    </button>

                </div>


                <strong style="
                    color:var(--dark);
                ">
                    ₹${itemTotal.toLocaleString("en-IN")}
                </strong>

            </div>

        `;


        cartItems.appendChild(cartItem);

    });


    /* TOTAL */

    if (cartTotal) {

        cartTotal.textContent =
            "₹" + total.toLocaleString("en-IN");

    }


    /* BADGE */

    if (cartBadge) {

        cartBadge.textContent =
            quantityTotal;

    }

}


/* ==========================================
   OPEN / CLOSE CART
========================================== */

function setupCart() {

    const cartToggle =
        document.getElementById("cartToggle");

    const cartDrawer =
        document.getElementById("cartDrawer");

    const cartClose =
        document.getElementById("cartClose");


    if (cartToggle && cartDrawer) {

        cartToggle.addEventListener(
            "click",
            function(e) {

                e.preventDefault();

                cartDrawer.classList.add("open");

                renderCart();

            }
        );

    }


    if (cartClose && cartDrawer) {

        cartClose.addEventListener(
            "click",
            function() {

                cartDrawer.classList.remove("open");

            }
        );

    }

}


/* ==========================================
   INITIALIZE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        renderCart();

        setupCart();

    }
);
