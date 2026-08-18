document.addEventListener('DOMContentLoaded', () => {
    // 1. Promo Sale Countdown Timer
    const initCountdown = () => {
        const daysEl = document.getElementById('promoDays');
        const hoursEl = document.getElementById('promoHours');
        const minutesEl = document.getElementById('promoMinutes');
        const secondsEl = document.getElementById('promoSeconds');

        if (!daysEl) return;

        let targetDate = localStorage.getItem('print_countdown_target');
        if (!targetDate) {
            targetDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).getTime();
            localStorage.setItem('print_countdown_target', targetDate);
        } else {
            targetDate = parseInt(targetDate);
        }

        const updateClock = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                const newTarget = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).getTime();
                localStorage.setItem('print_countdown_target', newTarget);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            daysEl.innerText = days < 10 ? '0' + days : days;
            hoursEl.innerText = hours < 10 ? '0' + hours : hours;
            minutesEl.innerText = minutes < 10 ? '0' + minutes : minutes;
            secondsEl.innerText = seconds < 10 ? '0' + seconds : seconds;
        };

        updateClock();
        setInterval(updateClock, 1000);
    };

    initCountdown();

    // 2. Fictional Shopping Cart Logic
    const initCart = () => {
        let cart = JSON.parse(localStorage.getItem('printmax_cart') || '[]');

        const updateCartUI = () => {
            const count = cart.reduce((total, item) => total + item.qty, 0);
            const totalCost = cart.reduce((total, item) => total + (item.price * item.qty), 0);

            const badges = document.querySelectorAll('.cart-badge');
            badges.forEach(b => b.innerText = count);

            const totalCostEl = document.getElementById('cartTotalVal');
            if (totalCostEl) totalCostEl.innerText = '$' + totalCost.toFixed(2);

            const listContainer = document.getElementById('cartItemsList');
            if (listContainer) {
                if (cart.length === 0) {
                    listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-muted); margin-top: 2rem;">Your cart is empty</p>';
                } else {
                    listContainer.innerHTML = cart.map(item => `
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
                            <div>
                                <h5 style="font-weight: 700; color: var(--dark);">${item.name}</h5>
                                <p style="font-size: 0.85rem; color: var(--dark-muted);">${item.qty} x $${item.price.toFixed(2)}</p>
                                ${item.customText ? `<p style="font-size: 0.75rem; color: var(--primary); font-style: italic;">Print: "${item.customText}"</p>` : ''}
                            </div>
                            <button class="cart-remove-btn" data-id="${item.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: 600;">Remove</button>
                        </div>
                    `).join('');

                    listContainer.querySelectorAll('.cart-remove-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-id');
                            cart = cart.filter(item => item.id !== id);
                            localStorage.setItem('printmax_cart', JSON.stringify(cart));
                            updateCartUI();
                        });
                    });
                }
            }
        };

        // Add to Cart buttons (Products)
        const addToCartBtns = document.querySelectorAll('.btn-add-cart');
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const name = btn.getAttribute('data-name');
                const price = parseFloat(btn.getAttribute('data-price'));
                const id = 'prod_' + Date.now() + Math.random().toString(36).substr(2, 4);

                const existingItem = cart.find(item => item.name === name && !item.customText);
                if (existingItem) {
                    existingItem.qty += 1;
                } else {
                    cart.push({ id, name, price, qty: 1 });
                }

                localStorage.setItem('printmax_cart', JSON.stringify(cart));
                updateCartUI();
                showToast(`Added ${name} to cart!`);
            });
        });

        // Cart toggle triggers
        const cartToggle = document.getElementById('cartToggle');
        const cartDrawer = document.getElementById('cartDrawer');
        const cartClose = document.getElementById('cartClose');

        if (cartToggle && cartDrawer) {
            cartToggle.addEventListener('click', (e) => {
                e.preventDefault();
                cartDrawer.classList.add('open');
            });
        }

        if (cartClose && cartDrawer) {
            cartClose.addEventListener('click', () => {
                cartDrawer.classList.remove('open');
            });
        }

        updateCartUI();
        window.cartState = { cart, updateCartUI };
    };

    initCart();

    // 3. Customizer Preview Logic
    const initCustomizer = () => {
        const textInput = document.getElementById('customTextVal');
        const previewText = document.getElementById('previewTextEl');
        const colorBtns = document.querySelectorAll('.color-option-btn');
        const tshirtPath = document.getElementById('tshirtPathEl');
        const customizerForm = document.getElementById('customizerForm');

        if (!textInput) return;

        // Customizer input text change
        textInput.addEventListener('input', (e) => {
            const text = e.target.value;
            previewText.textContent = text || 'Your Design';
        });

        // Customizer fabric color circle change
        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const colorCode = btn.getAttribute('data-color');
                tshirtPath.style.fill = colorCode;

                // Adjust text contrast color
                if (colorCode === '#ffffff' || colorCode === '#f3f4f6') {
                    previewText.style.color = '#111827';
                } else {
                    previewText.style.color = '#ffffff';
                }
            });
        });

        // Customizer Add to Cart submit
        customizerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = textInput.value || 'Your Design';
            const activeColorBtn = document.querySelector('.color-option-btn.active');
            const colorName = activeColorBtn ? activeColorBtn.getAttribute('title') : 'White';
            
            const item = {
                id: 'custom_' + Date.now(),
                name: `Custom Custom T-Shirt (${colorName})`,
                price: 35.00,
                qty: 1,
                customText: text
            };

            const cartState = window.cartState;
            if (cartState) {
                cartState.cart.push(item);
                localStorage.setItem('printmax_cart', JSON.stringify(cartState.cart));
                cartState.updateCartUI();
                showToast(`Added custom T-Shirt to cart!`);
                textInput.value = '';
                previewText.textContent = 'Your Design';
            }
        });
    };

    initCustomizer();

    // 4. Toast notification alert
    function showToast(text) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = `<span class="toast-text"></span>`;
            document.body.appendChild(toast);
        }
        toast.querySelector('.toast-text').innerText = text;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
});
