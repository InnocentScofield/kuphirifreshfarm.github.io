// app.js
import { db } from './auth.js';
import { collection, getDocs, doc, setDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const initialProducts = [
    {
        id: 1,
        name: "Farm Fresh Tomatoes",
        price: 4.99,
        category: "Vegetables",
        image: "images/farm_tomatoes_1777580257986.png",
        unit: "per kg"
    },
    {
        id: 2,
        name: "Sweet Corn (Maize)",
        price: 3.50,
        category: "Grains",
        image: "images/farm_maize_1777580271818.png",
        unit: "per dozen"
    },
    {
        id: 3,
        name: "Mikologwe Fertilized Eggs",
        price: 30.000,
        category: "Dairy & Eggs",
        image: "images/farm_eggs_1777580295921.png",
        unit: "per tray"
    },
    {
        id: 4,
        name: "Mikolongwe Chicks",
        price: 2.500,
        category: "Poultry",
        image: "images/farm_chicks_1777580416227.png",
        unit: "each"
    },
    {
        id: 5,
        name: "Free Range Chicken",
        price: 12.00,
        category: "Poultry",
        image: "images/farm_chickens_1777580444193.png",
        unit: "whole"
    },
    {
        id: 6,
        name: "Earthy Potatoes",
        price: 6.50,
        category: "Vegetables",
        image: "images/farm_potatoes_1777580457984.png",
        unit: "per 5kg sack"
    }
];

let products = [];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    // State
    let cart = [];

    // Expose cartItems for auth.js to check
    window.cartItems = cart;

    // DOM Elements
    const productGrid = document.getElementById('product-grid');
    const cartToggle = document.getElementById('cart-toggle');
    const closeCartBtn = document.getElementById('close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // 1. Render Products
    async function loadProducts() {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));

            // Seed products if collection is empty
            if (querySnapshot.empty) {
                console.log("No products found in Firestore. Seeding initial products...");
                for (const p of initialProducts) {
                    await setDoc(doc(db, "products", p.id.toString()), p);
                }
                products = [...initialProducts];
            } else {
                products = [];
                querySnapshot.forEach((doc) => {
                    products.push({ id: parseInt(doc.id), ...doc.data() });
                });
            }
            renderProductsUI();
        } catch (error) {
            console.error("Error fetching products: ", error);
        }
    }

    function renderProductsUI() {
        productGrid.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)} <span style="font-size:0.8rem;color:var(--text-muted);font-weight:normal">${product.unit}</span></div>
                    <button class="add-to-cart-btn" data-id="${product.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        Add to Cart
                    </button>
                </div>
            `;

            productGrid.appendChild(card);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                addToCart(id);

                // Visual feedback
                const originalText = e.currentTarget.innerHTML;
                e.currentTarget.innerHTML = `✓ Added`;
                e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                e.currentTarget.style.color = 'white';

                setTimeout(() => {
                    e.currentTarget.innerHTML = originalText;
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--primary-color)';
                }, 1000);
            });
        });
    }

    // 2. Cart Logic
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        window.cartItems = cart;
        updateCartUI();

        // Pulse badge animation
        cartCount.style.animation = 'none';
        cartCount.offsetHeight; /* trigger reflow */
        cartCount.style.animation = 'pop 0.3s ease-out';
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCartUI();
    }

    function updateQuantity(productId, delta) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else {
                updateCartUI();
            }
        }
    }

    function updateCartUI() {
        // Update count
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;

        // Update items list
        // Remove existing items except the empty message
        const items = Array.from(cartItemsContainer.children);
        items.forEach(child => {
            if (child !== emptyCartMessage) {
                child.remove();
            }
        });

        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
            checkoutBtn.disabled = true;
        } else {
            emptyCartMessage.style.display = 'none';
            // Only enable checkout if user is logged in
            if (window.currentUser) {
                checkoutBtn.disabled = false;
            } else {
                checkoutBtn.disabled = true;
                checkoutBtn.textContent = 'Login to Checkout';
            }

            cart.forEach(item => {
                const cartItemEl = document.createElement('div');
                cartItemEl.className = 'cart-item';
                cartItemEl.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                        <div class="cart-item-controls">
                            <button class="qty-btn minus" data-id="${item.id}">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn plus" data-id="${item.id}">+</button>
                            <button class="cart-item-remove" data-id="${item.id}">Remove</button>
                        </div>
                    </div>
                `;
                cartItemsContainer.insertBefore(cartItemEl, emptyCartMessage);
            });

            // Add event listeners to new buttons
            document.querySelectorAll('.qty-btn.minus').forEach(btn => {
                btn.addEventListener('click', (e) => updateQuantity(parseInt(e.target.getAttribute('data-id')), -1));
            });
            document.querySelectorAll('.qty-btn.plus').forEach(btn => {
                btn.addEventListener('click', (e) => updateQuantity(parseInt(e.target.getAttribute('data-id')), 1));
            });
            document.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', (e) => removeFromCart(parseInt(e.target.getAttribute('data-id'))));
            });
        }

        // Update total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalPrice.textContent = `$${total.toFixed(2)}`;
    }

    // 3. UI Interactions
    function toggleCart() {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
        // Prevent body scroll when cart is open
        document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
    }

    cartToggle.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    // Checkout Flow
    checkoutBtn.addEventListener('click', async () => {
        if (!window.currentUser) {
            // Prompt to login
            document.getElementById('auth-modal').classList.add('active');
            return;
        }

        if (cart.length > 0) {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Processing...';

            try {
                const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                // Save order to Firestore
                await addDoc(collection(db, "orders"), {
                    userId: window.currentUser.uid,
                    userEmail: window.currentUser.email,
                    items: cart.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    totalAmount: total,
                    status: 'pending',
                    createdAt: serverTimestamp()
                });

                // Close cart
                toggleCart();
                // Show modal
                setTimeout(() => {
                    checkoutModal.classList.add('active');
                    // Clear cart
                    cart = [];
                    window.cartItems = cart;
                    updateCartUI();
                    checkoutBtn.textContent = 'Proceed to Checkout';
                }, 300);
            } catch (error) {
                console.error("Error processing checkout: ", error);
                alert("There was an error processing your order. Please try again.");
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = 'Proceed to Checkout';
            }
        }
    });

    closeModalBtn.addEventListener('click', () => {
        checkoutModal.classList.remove('active');
    });

    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            const targetId = this.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                window.scrollTo({
                    top: targetEl.offsetTop - 80, // account for header
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize
    loadProducts();
});
