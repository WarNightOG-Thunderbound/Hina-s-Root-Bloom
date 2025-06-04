// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, set, remove, onValue, serverTimestamp, update, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBr6A2OGh-nwfMzOwmVOWs1-u5ylZ2Vemw",
  authDomain: "hina-s-rootandbloomstore.firebaseapp.com",
  databaseURL: "https://hina-s-rootandbloomstore-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hina-s-rootandbloomstore",
  storageBucket: "hina-s-rootandbloomstore.firebasestorage.app",
  messagingSenderId: "967448486557",
  appId: "1:967448486557:web:fb096a1e35183495d465d6",
  measurementId: "G-BC1L84Y30B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements ---
const authModal = document.getElementById('auth-modal');
const closeModalButtons = document.querySelectorAll('.close-button');
const showLoginButton = document.getElementById('show-login');
const showRegisterButton = document.getElementById('show-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authButton = document.getElementById('auth-button');
const logoutButton = document.getElementById('logout-button');
const welcomeMessage = document.getElementById('welcome-message');

const productGrid = document.getElementById('product-grid');
const categoryDropdown = document.getElementById('category-dropdown');
const categoryFilters = document.getElementById('category-filters');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const sortSelect = document.getElementById('sort-select');

const productModal = document.getElementById('product-modal');
const modalProductName = document.getElementById('modal-product-name');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductStock = document.getElementById('modal-product-stock');
const modalProductQuantity = document.getElementById('modal-product-quantity');
const addProductToCartModalBtn = document.getElementById('add-to-cart-modal-btn');
const productRatingsList = document.getElementById('product-ratings-list');


const cartLink = document.getElementById('cart-link');
const cartSection = document.getElementById('cart-section');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-button');
const clearCartButton = document.getElementById('clear-cart-button');

const checkoutSection = document.getElementById('checkout-section');
const checkoutForm = document.getElementById('checkout-form');

const homeLink = document.getElementById('home-link');
const productListingSection = document.getElementById('product-listing-section');
const heroSection = document.getElementById('hero-section');
const shopNowButton = document.getElementById('shop-now-button');

const ordersLink = document.getElementById('orders-link');
const orderHistorySection = document.getElementById('order-history-section');
const orderList = document.getElementById('order-list');
const closeOrderHistoryBtn = document.getElementById('close-order-history-btn');

const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.getElementById('close-rating-modal');
const rateProductButton = document.getElementById('rate-product-button');
const ratingProductName = document.getElementById('rating-product-name');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const ratingComment = document.getElementById('rating-comment');
const submitRatingButton = document.getElementById('submit-rating-btn');


// Custom Alert Modal Elements
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


// --- Global Variables ---
let products = [];
let categories = [];
let cart = [];
let currentUser = null;
let selectedProductId = null;
let selectedRating = 0; // To store the selected rating value

// --- Utility Functions ---

function showCustomAlert(title, message, type = 'alert', onOk = null, onCancel = null) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;

    customModalOkBtn.onclick = () => {
        customAlertModal.style.display = 'none';
        if (onOk) onOk();
    };

    if (type === 'confirm') {
        customModalCancelBtn.style.display = 'inline-block';
        customModalCancelBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            if (onCancel) onCancel();
        };
    } else {
        customModalCancelBtn.style.display = 'none';
    }

    customAlertModal.style.display = 'flex';
}

// --- Auth Functions ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        welcomeMessage.textContent = `Welcome, ${user.email}`;
        welcomeMessage.style.display = 'inline';
        authButton.style.display = 'none';
        logoutButton.style.display = 'inline';
        cartLink.style.display = 'inline'; // Show cart link
        ordersLink.style.display = 'inline'; // Show orders link
        loadCart(); // Load user's cart
        loadOrders(); // Load user's orders
    } else {
        currentUser = null;
        welcomeMessage.style.display = 'none';
        authButton.style.display = 'inline';
        logoutButton.style.display = 'none';
        cartLink.style.display = 'none'; // Hide cart link
        ordersLink.style.display = 'none'; // Hide orders link
        cart = []; // Clear cart if logged out
        updateCartDisplay();
    }
});

async function handleLogin(event) {
    event.preventDefault();
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        authModal.style.display = 'none';
        showCustomAlert('Success', 'Logged in successfully!', 'alert');
    } catch (error) {
        showCustomAlert('Login Failed', error.message, 'alert');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const email = registerForm['register-email'].value;
    const password = registerForm['register-password'].value;
    const confirmPassword = registerForm['register-confirm-password'].value;

    if (password !== confirmPassword) {
        showCustomAlert('Error', 'Passwords do not match!', 'alert');
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        authModal.style.display = 'none';
        showCustomAlert('Success', 'Registered and logged in successfully!', 'alert');
    } catch (error) {
        showCustomAlert('Registration Failed', error.message, 'alert');
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        showCustomAlert('Success', 'Logged out successfully!', 'alert');
    } catch (error) {
        showCustomAlert('Logout Failed', error.message, 'alert');
    }
}

// --- Product Functions ---
function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        products = [];
        snapshot.forEach((childSnapshot) => {
            products.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        displayProducts(products);
        populateCategoryFilters();
    });
}

function displayProducts(productsToDisplay) {
    productGrid.innerHTML = '';
    if (productsToDisplay.length === 0) {
        productGrid.innerHTML = '<p>No products found.</p>';
        return;
    }
    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.innerHTML = `
            <img src="${product.imageUrl || 'placeholder.jpg'}" alt="${product.name}">
            <h3>${product.title}</h3>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <button class="button primary add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
            <button class="button secondary view-details-btn" data-product-id="${product.id}">View Details</button>
        `;
        productGrid.appendChild(productCard);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            const product = products.find(p => p.id === productId);
            if (product) {
                addToCart(product, 1);
            }
        });
    });

    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            openProductModal(productId);
        });
    });
}

function populateCategoryFilters() {
    const uniqueCategories = ['all', ...new Set(products.map(p => p.category))];
    categoryFilters.innerHTML = ''; // Clear existing filters
    uniqueCategories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('filter-button');
        if (category === 'all') {
            button.classList.add('active');
        }
        button.dataset.category = category;
        button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryFilters.appendChild(button);
    });

    // Populate dropdown for small screens
    const dropdown = document.getElementById('category-dropdown');
    dropdown.innerHTML = ''; // Clear existing dropdown
    uniqueCategories.forEach(category => {
        const a = document.createElement('a');
        a.href = "#";
        a.dataset.category = category;
        a.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        dropdown.appendChild(a);
    });
}


function filterProducts(category) {
    let filtered = products;
    if (category !== 'all') {
        filtered = products.filter(product => product.category === category);
    }
    displayProducts(filtered);
    // Update active class for filter buttons
    document.querySelectorAll('.filter-button').forEach(button => {
        button.classList.remove('active');
        if (button.dataset.category === category) {
            button.classList.add('active');
        }
    });
}

function searchProducts(query) {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = products.filter(product =>
        product.title.toLowerCase().includes(lowerCaseQuery) ||
        product.description.toLowerCase().includes(lowerCaseQuery) ||
        product.category.toLowerCase().includes(lowerCaseQuery)
    );
    displayProducts(filtered);
}

function sortProducts(sortBy) {
    let sortedProducts = [...products];
    switch (sortBy) {
        case 'price-asc':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            sortedProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            sortedProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        default:
            // No sorting
            break;
    }
    displayProducts(sortedProducts);
}

async function openProductModal(productId) {
    selectedProductId = productId;
    const product = products.find(p => p.id === productId);
    if (product) {
        modalProductName.textContent = product.title;
        modalProductImage.src = product.imageUrl || 'placeholder.jpg';
        modalProductPrice.textContent = `$${product.price.toFixed(2)}`;
        modalProductDescription.textContent = product.description;
        modalProductCategory.textContent = product.category;
        modalProductStock.textContent = product.stock;
        modalProductQuantity.value = 1; // Reset quantity

        await loadProductRatings(productId); // Load and display ratings
        productModal.style.display = 'flex';
    }
}

// --- Cart Functions ---
function loadCart() {
    if (!currentUser) return;
    const cartRef = ref(database, `carts/${currentUser.uid}`);
    onValue(cartRef, (snapshot) => {
        cart = [];
        snapshot.forEach((childSnapshot) => {
            cart.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        updateCartDisplay();
    });
}

async function addToCart(product, quantity) {
    if (!currentUser) {
        showCustomAlert('Login Required', 'Please log in to add items to your cart.', 'alert');
        return;
    }

    const cartItemRef = ref(database, `carts/${currentUser.uid}/${product.id}`);
    const snapshot = await get(cartItemRef);

    if (snapshot.exists()) {
        // Item already in cart, update quantity
        const existingItem = snapshot.val();
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
            showCustomAlert('Out of Stock', 'Cannot add more, not enough stock available.', 'alert');
            return;
        }
        await update(cartItemRef, { quantity: newQuantity });
        showCustomAlert('Cart Updated', `${product.title} quantity updated in cart.`, 'alert');
    } else {
        // Add new item to cart
        if (quantity > product.stock) {
            showCustomAlert('Out of Stock', 'Cannot add this quantity, not enough stock available.', 'alert');
            return;
        }
        await set(cartItemRef, {
            productId: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: quantity
        });
        showCustomAlert('Added to Cart', `${product.title} added to cart!`, 'alert');
    }
}

async function updateCartItemQuantity(productId, newQuantity) {
    if (!currentUser) return;
    const cartItemRef = ref(database, `carts/${currentUser.uid}/${productId}`);
    const product = products.find(p => p.id === productId);

    if (!product) {
        showCustomAlert('Error', 'Product not found.', 'alert');
        return;
    }

    if (newQuantity <= 0) {
        await remove(cartItemRef);
    } else if (newQuantity > product.stock) {
        showCustomAlert('Out of Stock', `Only ${product.stock} items of ${product.title} are available.`, 'alert');
        // Revert quantity in display to max available or current cart quantity
        // This will be handled by the onValue listener refreshing the cart.
    }
    else {
        await update(cartItemRef, { quantity: newQuantity });
    }
}

async function removeCartItem(productId) {
    if (!currentUser) return;
    showCustomAlert('Remove Item', 'Are you sure you want to remove this item from your cart?', 'confirm', async () => {
        const cartItemRef = ref(database, `carts/${currentUser.uid}/${productId}`);
        await remove(cartItemRef);
        showCustomAlert('Removed', 'Item removed from cart.', 'alert');
    });
}

async function clearCart() {
    if (!currentUser) return;
    showCustomAlert('Clear Cart', 'Are you sure you want to clear your entire cart?', 'confirm', async () => {
        const cartRef = ref(database, `carts/${currentUser.uid}`);
        await remove(cartRef);
        showCustomAlert('Cart Cleared', 'Your cart has been cleared.', 'alert');
    });
}

function updateCartDisplay() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalSpan.textContent = '0.00';
        checkoutButton.disabled = true;
        clearCartButton.disabled = true;
        return;
    }

    checkoutButton.disabled = false;
    clearCartButton.disabled = false;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <img src="${item.imageUrl || 'placeholder.jpg'}" alt="${item.title}">
            <div class="cart-item-details">
                <h4>${item.title}</h4>
                <p>Price: $${item.price.toFixed(2)}</p>
                <div class="cart-item-quantity">
                    <label for="cart-quantity-${item.productId}">Quantity:</label>
                    <input type="number" id="cart-quantity-${item.productId}" value="${item.quantity}" min="1" data-product-id="${item.productId}">
                </div>
                <p>Total: $${itemTotal.toFixed(2)}</p>
                <button class="button secondary remove-from-cart-btn" data-product-id="${item.productId}">Remove</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });

    cartTotalSpan.textContent = total.toFixed(2);

    document.querySelectorAll('.cart-item-quantity input').forEach(input => {
        input.addEventListener('change', (event) => {
            const productId = event.target.dataset.productId;
            const newQuantity = parseInt(event.target.value);
            updateCartItemQuantity(productId, newQuantity);
        });
    });

    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            removeCartItem(productId);
        });
    });

    document.getElementById('cart-count').textContent = cart.length;
}

// --- Order Functions ---
async function placeOrder(event) {
    event.preventDefault();
    if (!currentUser) {
        showCustomAlert('Login Required', 'Please log in to place an order.', 'alert');
        return;
    }
    if (cart.length === 0) {
        showCustomAlert('Cart Empty', 'Your cart is empty. Add some products before checking out.', 'alert');
        return;
    }

    const customerName = checkoutForm['customer-name'].value;
    const customerEmail = checkoutForm['customer-email'].value;
    const customerAddress = checkoutForm['customer-address'].value;
    const customerPhone = checkoutForm['customer-phone'].value;
    const paymentMethod = checkoutForm['payment-method'].value;
    const totalAmount = parseFloat(cartTotalSpan.textContent);

    // Prepare order details including current product stock for validation
    const orderItems = [];
    const updates = {};
    let stockProblem = false;

    for (const item of cart) {
        const productRef = ref(database, `products/${item.productId}`);
        const productSnapshot = await get(productRef);
        const productData = productSnapshot.val();

        if (!productData || productData.stock < item.quantity) {
            stockProblem = true;
            showCustomAlert('Stock Error', `Not enough stock for ${item.title}. Available: ${productData ? productData.stock : 0}`, 'alert');
            return; // Stop the order process
        }
        orderItems.push({
            productId: item.productId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl
        });
        // Prepare stock update
        updates[`products/${item.productId}/stock`] = productData.stock - item.quantity;
    }

    if (stockProblem) {
        return; // Exit if there was a stock problem
    }

    const orderData = {
        userId: currentUser.uid,
        customerName: customerName,
        customerEmail: customerEmail,
        customerAddress: customerAddress,
        customerPhone: customerPhone,
        paymentMethod: paymentMethod,
        items: orderItems,
        totalAmount: totalAmount,
        orderDate: serverTimestamp(),
        status: 'Pending' // Initial status
    };

    try {
        const newOrderRef = push(ref(database, 'orders'));
        await set(newOrderRef, orderData);

        // Update product stocks and clear cart in a single batch update
        updates[`carts/${currentUser.uid}`] = null; // Clear the user's cart
        await update(ref(database), updates);

        showCustomAlert('Order Placed', 'Your order has been placed successfully!', 'alert', () => {
            checkoutForm.reset();
            cart = []; // Clear local cart array
            updateCartDisplay(); // Update display to reflect empty cart
            showSection('product-listing-section'); // Go back to product listing
        });
    } catch (error) {
        showCustomAlert('Order Error', `Failed to place order: ${error.message}`, 'alert');
    }
}

function loadOrders() {
    if (!currentUser) return;
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        orderList.innerHTML = '';
        let hasOrders = false;
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (order.userId === currentUser.uid) {
                hasOrders = true;
                const orderDiv = document.createElement('div');
                orderDiv.classList.add('order-item');
                const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
                orderDiv.innerHTML = `
                    <h3>Order ID: ${childSnapshot.key}</h3>
                    <p>Date: ${orderDate}</p>
                    <p>Status: <span class="order-status ${order.status.toLowerCase()}">${order.status}</span></p>
                    <p>Total: $${order.totalAmount.toFixed(2)}</p>
                    <div class="order-items-detail">
                        <h4>Items:</h4>
                        <ul>
                            ${order.items.map(item => `
                                <li>${item.title} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</li>
                            `).join('')}
                        </ul>
                    </div>
                `;
                orderList.prepend(orderDiv); // Add most recent orders first
            }
        });
        if (!hasOrders) {
            orderList.innerHTML = '<p>You have no past orders.</p>';
        }
    });
}

// --- Rating Functions ---
async function loadProductRatings(productId) {
    productRatingsList.innerHTML = ''; // Clear previous ratings
    const ratingsRef = ref(database, `ratings/${productId}`);
    onValue(ratingsRef, (snapshot) => {
        productRatingsList.innerHTML = ''; // Clear again to handle real-time updates
        if (snapshot.exists()) {
            let totalRating = 0;
            let ratingCount = 0;
            snapshot.forEach((childSnapshot) => {
                const rating = childSnapshot.val();
                totalRating += rating.rating;
                ratingCount++;

                const ratingDiv = document.createElement('div');
                ratingDiv.classList.add('customer-rating-item');
                ratingDiv.innerHTML = `
                    <p><strong>Rating:</strong> ${'★'.repeat(rating.rating)}${'☆'.repeat(5 - rating.rating)}</p>
                    ${rating.comment ? `<p><strong>Comment:</strong> ${rating.comment}</p>` : ''}
                    <p class="rating-meta">By ${rating.userEmail} on ${new Date(rating.timestamp).toLocaleDateString()}</p>
                `;
                productRatingsList.appendChild(ratingDiv);
            });
            const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 'N/A';
            const averageRatingDiv = document.createElement('div');
            averageRatingDiv.classList.add('average-rating');
            averageRatingDiv.innerHTML = `<p><strong>Average Rating:</strong> ${averageRating} (${ratingCount} reviews)</p>`;
            productRatingsList.prepend(averageRatingDiv); // Show average at the top

        } else {
            productRatingsList.innerHTML = '<p>No ratings yet for this product.</p>';
        }
    });
}


function showRatingModal() {
    if (!currentUser) {
        showCustomAlert('Login Required', 'Please log in to rate products.', 'alert');
        return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (product) {
        ratingProductName.textContent = product.title;
        selectedRating = 0; // Reset selected rating
        ratingComment.value = ''; // Clear any previous comment
        updateRatingStars();
        ratingModal.style.display = 'flex';
    }
}

function closeRatingModal() {
    ratingModal.style.display = 'none';
}

function updateRatingStars() {
    ratingStarsContainer.querySelectorAll('.fa-star').forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= selectedRating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

async function submitProductRating() {
    if (!currentUser || !selectedProductId || selectedRating === 0) {
        showCustomAlert('Error', 'Please log in, select a product, and provide a rating.', 'alert');
        return;
    }

    const ratingData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        rating: selectedRating,
        comment: ratingComment.value.trim(),
        timestamp: serverTimestamp()
    };

    try {
        const ratingRef = ref(database, `ratings/${selectedProductId}/${currentUser.uid}`);
        await set(ratingRef, ratingData);
        showCustomAlert('Success', 'Your rating has been submitted!', 'alert');
        closeRatingModal();
        loadProductRatings(selectedProductId); // Refresh ratings on the product modal
    } catch (error) {
        showCustomAlert('Submission Error', `Failed to submit rating: ${error.message}`, 'alert');
    }
}

// --- Section Display Management ---
function hideAllSections() {
    heroSection.style.display = 'none';
    productListingSection.style.display = 'none';
    cartSection.style.display = 'none';
    checkoutSection.style.display = 'none';
    orderHistorySection.style.display = 'none';
}

function showSection(sectionId) {
    hideAllSections();
    document.getElementById(sectionId).style.display = 'block';
    if (sectionId === 'product-listing-section') {
        heroSection.style.display = 'block'; // Always show hero with product listing
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadProducts(); // Initial load of products

    // Nav Link Event Listeners
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('product-listing-section');
    });

    shopNowButton.addEventListener('click', () => {
        showSection('product-listing-section');
        // Optionally scroll to product grid
        productListingSection.scrollIntoView({ behavior: 'smooth' });
    });

    cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('cart-section');
        updateCartDisplay(); // Ensure cart display is fresh
    });

    ordersLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('order-history-section');
        loadOrders(); // Reload orders when navigating to the section
    });


    // Auth Modal Event Listeners
    authButton.addEventListener('click', () => authModal.style.display = 'flex');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            authModal.style.display = 'none';
            productModal.style.display = 'none';
            ratingModal.style.display = 'none';
        });
    });
    authModal.addEventListener('click', (event) => {
        if (event.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    showLoginButton.addEventListener('click', () => {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        showLoginButton.classList.add('active');
        showRegisterButton.classList.remove('active');
    });

    showRegisterButton.addEventListener('click', () => {
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
        showRegisterButton.classList.add('active');
        showLoginButton.classList.remove('active');
    });

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutButton.addEventListener('click', handleLogout);


    // Product Modal Event Listeners
    productModal.addEventListener('click', (event) => {
        if (event.target === productModal) {
            productModal.style.display = 'none';
        }
    });

    addProductToCartModalBtn.addEventListener('click', () => {
        const product = products.find(p => p.id === selectedProductId);
        const quantity = parseInt(modalProductQuantity.value);
        if (product && quantity > 0) {
            addToCart(product, quantity);
            productModal.style.display = 'none'; // Close modal after adding
        } else {
            showCustomAlert('Invalid Quantity', 'Please enter a valid quantity.', 'alert');
        }
    });


    // Product Filtering & Sorting Event Listeners
    categoryFilters.addEventListener('click', (event) => {
        if (event.target.classList.contains('filter-button')) {
            const category = event.target.dataset.category;
            filterProducts(category);
        }
    });

    categoryDropdown.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            const category = event.target.dataset.category;
            filterProducts(category);
            event.target.closest('.dropdown-content').classList.remove('show'); // Hide dropdown after clicking
        }
    });

    searchButton.addEventListener('click', () => searchProducts(searchInput.value));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchProducts(searchInput.value);
        }
    });
    sortSelect.addEventListener('change', (e) => sortProducts(e.target.value));


    // Cart Event Listeners
    checkoutButton.addEventListener('click', () => {
        showSection('checkout-section');
        // Pre-fill checkout form if user is logged in
        if (currentUser) {
            checkoutForm['customer-email'].value = currentUser.email;
        }
    });

    clearCartButton.addEventListener('click', clearCart);

    // Order History Event Listeners
    if (closeOrderHistoryBtn) {
        closeOrderHistoryBtn.addEventListener('click', () => {
            if (orderHistorySection) orderHistorySection.style.display = 'none';
        });
    }

    if (rateProductButton) {
        rateProductButton.addEventListener('click', showRatingModal);
    }

    if (closeRatingModalBtn) {
        closeRatingModalBtn.addEventListener('click', closeRatingModal);
    }
    if (ratingModal) {
        ratingModal.addEventListener('click', (event) => {
            if (event.target === ratingModal) {
                closeRatingModal();
            }
        });
    }

    if (ratingStarsContainer) {
        ratingStarsContainer.addEventListener('click', (event) => {
            const star = event.target.closest('.fa-star');
            if (star) {
                selectedRating = parseInt(star.dataset.rating);
                updateRatingStars();
            }
        });
    }

    if (submitRatingButton) {
        submitRatingButton.addEventListener('click', submitProductRating);
    }


    // Place Order Form Event Listeners
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', placeOrder);
    }

});
