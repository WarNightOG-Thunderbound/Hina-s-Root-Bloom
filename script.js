// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, set, remove, onValue, serverTimestamp, update, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBr6A2OGh-nwfMzOwmVOWs1-u5ylZ2Vemw", // Replace with your actual API Key
  authDomain: "hina-s-rootandbloomstore.firebaseapp.com",
  databaseURL: "https://hina-s-rootandbloomstore-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hina-s-rootandbloomstore",
  storageBucket: "hina-s-rootandbloomstore.firebasestorage.app",
  messagingSenderId: "967448486557",
  appId: "1:967448486557:web:2c89223921f6479010495f", // IMPORTANT: This was corrected from G-TT31HC3NZ3
  measurementId: "G-TT31HC3NZ3" // IMPORTANT: This is the correct measurement ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize analytics
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements ---
const authLink = document.getElementById('auth-link');
const homeLink = document.getElementById('home-link');
const cartLink = document.getElementById('cart-link');
const orderHistoryLink = document.getElementById('order-history-link');

const authSection = document.getElementById('auth-section');
const productListingSection = document.getElementById('product-listing-section');
const cartSection = document.getElementById('cart-section');
const orderHistorySection = document.getElementById('order-history-section');

const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupBtn = document.getElementById('signup-btn');

const productGrid = document.getElementById('product-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const cartCountSpan = document.getElementById('cart-count');
const checkoutBtn = document.getElementById('checkout-btn');

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const categoryFiltersContainer = document.getElementById('category-filters');
const sortSelect = document.getElementById('sort-select');

const orderHistoryList = document.getElementById('order-history-list');

// Product Detail Modal Elements
const productDetailModal = document.getElementById('product-detail-modal');
const closeDetailModalBtn = document.getElementById('close-detail-modal-btn');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductRating = document.getElementById('modal-product-rating');
const productQuantityInput = document.getElementById('product-quantity');
const decreaseQuantityBtn = document.getElementById('decrease-quantity');
const increaseQuantityBtn = document.getElementById('increase-quantity');
const addToCartModalBtn = document.getElementById('add-to-cart-modal-btn');
const placeOrderBtn = document.getElementById('place-order-btn');

// Order Form Elements
const orderFormSection = document.getElementById('order-form-section');
const orderNameInput = document.getElementById('order-name');
const orderAddressInput = document.getElementById('order-address');
const orderEmailInput = document.getElementById('order-email');
const orderPhoneInput = document.getElementById('order-phone');

// Rating Modal Elements
const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.getElementById('close-rating-modal-btn');
const ratingProductTitle = document.getElementById('rating-product-title');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const ratingCommentInput = document.getElementById('rating-comment');
const submitRatingButton = document.getElementById('submit-rating-button');

// Custom Alert Modal Elements
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');

// Order Confirmation Modal Elements
const orderConfirmationModal = document.getElementById('order-confirmation-modal');
const orderConfirmationOkBtn = document.getElementById('order-confirmation-ok-btn');


let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let currentProduct = null; // To store the product being viewed in the modal
let selectedRating = 0; // To store the rating selected in the rating modal

// --- Firebase Authentication ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        if (authLink) {
            authLink.textContent = 'Logout';
            authLink.removeEventListener('click', showAuthSection); // Remove old listener
            authLink.addEventListener('click', handleLogout); // Add new listener for logout
        }
        if (orderHistoryLink) orderHistoryLink.style.display = 'block';
        displaySection('product-listing-section'); // Show product listing after login
        loadCart(); // Load cart for logged-in user
        loadOrderHistory(); // Load order history for logged-in user
    } else {
        // User is signed out
        if (authLink) {
            authLink.textContent = 'Login';
            authLink.removeEventListener('click', handleLogout); // Remove old listener
            authLink.addEventListener('click', showAuthSection); // Add new listener for login
        }
        if (orderHistoryLink) orderHistoryLink.style.display = 'none';
        displaySection('product-listing-section'); // Show product listing after logout
        cart = {}; // Clear cart if user logs out
        saveCart();
        loadCart(); // Update cart display
    }
});

async function handleLogin() {
    const email = loginEmailInput ? loginEmailInput.value : '';
    const password = loginPasswordInput ? loginPasswordInput.value : '';
    if (!email || !password) {
        showAlert('Input Error', 'Please enter both email and password.');
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert('Success', 'Logged in successfully!');
        if (loginEmailInput) loginEmailInput.value = '';
        if (loginPasswordInput) loginPasswordInput.value = '';
        // UI update handled by onAuthStateChanged
    } catch (error) {
        showAlert('Login Failed', error.message);
        console.error("Login error:", error);
    }
}

async function handleSignUp() {
    const email = signupEmailInput ? signupEmailInput.value : '';
    const password = signupPasswordInput ? signupPasswordInput.value : '';
    if (!email || !password) {
        showAlert('Input Error', 'Please enter both email and password.');
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showAlert('Success', 'Signed up and logged in successfully!');
        if (signupEmailInput) signupEmailInput.value = '';
        if (signupPasswordInput) signupPasswordInput.value = '';
        // UI update handled by onAuthStateChanged
    } catch (error) {
        showAlert('Sign Up Failed', error.message);
        console.error("Sign up error:", error);
    }
}

function handleLogout() {
    signOut(auth).then(() => {
        showAlert('Success', 'Logged out successfully!');
        // UI update handled by onAuthStateChanged
    }).catch((error) => {
        showAlert('Logout Failed', error.message);
        console.error("Logout error:", error);
    });
}

// --- Section Display ---
function displaySection(sectionId) {
    if (authSection) authSection.style.display = 'none';
    if (productListingSection) productListingSection.style.display = 'none';
    if (cartSection) cartSection.style.display = 'none';
    if (orderHistorySection) orderHistorySection.style.display = 'none';

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Update active link in navigation
    document.querySelectorAll('.main-nav ul li a').forEach(link => {
        link.classList.remove('active');
    });
    if (sectionId === 'product-listing-section' && homeLink) {
        homeLink.classList.add('active');
    } else if (sectionId === 'cart-section' && cartLink) {
        cartLink.classList.add('active');
    } else if (sectionId === 'auth-section' && authLink) {
        authLink.classList.add('active');
    } else if (sectionId === 'order-history-section' && orderHistoryLink) {
        orderHistoryLink.classList.add('active');
    }
}

function showAuthSection() {
    displaySection('auth-section');
}

// --- Product Listing ---
function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        products = [];
        snapshot.forEach((childSnapshot) => {
            products.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        displayProducts(products);
        populateCategoryFilters(products);
    }, (error) => {
        console.error("Error loading products:", error);
        showAlert('Error', 'Failed to load products.');
    });
}

function displayProducts(productsToDisplay) {
    if (!productGrid) return; // Ensure productGrid exists
    productGrid.innerHTML = '';
    if (productsToDisplay.length === 0) {
        productGrid.innerHTML = '<p>No products found.</p>';
        return;
    }

    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.id = product.id;

        // Calculate average rating for display
        const productRatings = product.ratings || {};
        const averageRating = calculateAverageRating(productRatings);
        const starIcons = getStarRatingHtml(averageRating);
        const ratingCount = Object.keys(productRatings).length;

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.imageUrl || 'https://placehold.co/200x200?text=No+Image'}" alt="${product.title}" class="product-image">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-price">PKR ${product.price ? product.price.toFixed(2) : '0.00'}</p>
                <div class="product-rating">${starIcons} (${ratingCount})</div>
                <div class="product-actions">
                    <button class="button primary add-to-cart-btn" data-id="${product.id}"><i class="fas fa-cart-plus"></i> Add to Cart</button>
                    <button class="button secondary view-detail-btn" data-id="${product.id}"><i class="fas fa-eye"></i> View Detail</button>
                </div>
            </div>
        `;
        productGrid.appendChild(productCard);
    });

    // Attach event listeners for "Add to Cart" and "View Detail" buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.id;
            const product = products.find(p => p.id === productId);
            if (product) {
                addToCart(product, 1);
                showAlert('Added to Cart', `${product.title} added to your cart.`);
            }
        });
    });

    document.querySelectorAll('.view-detail-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.id;
            showProductDetail(productId);
        });
    });
}

function calculateAverageRating(ratings) {
    if (!ratings || Object.keys(ratings).length === 0) return 0;
    const ratingValues = Object.values(ratings).map(r => r.rating);
    const sum = ratingValues.reduce((acc, curr) => acc + curr, 0);
    return sum / ratingValues.length;
}

function getStarRatingHtml(averageRating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.round(averageRating)) {
            starsHtml += '<i class="fas fa-star"></i>'; // Filled star
        } else {
            starsHtml += '<i class="far fa-star"></i>'; // Empty star
        }
    }
    return starsHtml;
}

function populateCategoryFilters(allProducts) {
    if (!categoryFiltersContainer) return;

    // Clear existing dynamic category buttons, keep "All"
    const existingButtons = Array.from(categoryFiltersContainer.children);
    existingButtons.forEach(btn => {
        if (btn.dataset.category !== 'all') {
            btn.remove();
        }
    });

    const categoriesFromFirebase = new Set();
    allProducts.forEach(product => {
        if (product.category) {
            categoriesFromFirebase.add(product.category);
        }
    });

    // Add new categories from Firebase
    categoriesFromFirebase.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('category-button');
        button.dataset.category = category;
        button.textContent = category.charAt(0).toUpperCase() + category.slice(1); // Capitalize
        categoryFiltersContainer.appendChild(button);
    });

    // Re-attach event listeners to ALL category buttons (both hardcoded "All" and dynamically added)
    document.querySelectorAll('.category-button').forEach(button => {
        button.removeEventListener('click', handleCategoryFilterClick); // Prevent duplicate listeners
        button.addEventListener('click', handleCategoryFilterClick);
    });
}

function handleCategoryFilterClick(event) {
    document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    filterAndSortProducts();
}


function filterAndSortProducts() {
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedCategory = document.querySelector('.category-button.active')?.dataset.category || 'all';
    const sortOption = sortSelect ? sortSelect.value : 'default';

    let filtered = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchQuery) ||
                              product.description.toLowerCase().includes(searchQuery) ||
                              product.brand.toLowerCase().includes(searchQuery); // Include brand in search
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
        switch (sortOption) {
            case 'price-asc':
                return (a.price || 0) - (b.price || 0);
            case 'price-desc':
                return (b.price || 0) - (a.price || 0);
            case 'name-asc':
                return (a.title || '').localeCompare(b.title || '');
            case 'name-desc':
                return (b.title || '').localeCompare(a.title || '');
            case 'rating-desc':
                const ratingA = a.ratings ? calculateAverageRating(a.ratings) : 0;
                const ratingB = b.ratings ? calculateAverageRating(b.ratings) : 0;
                return ratingB - ratingA;
            default:
                return 0;
        }
    });

    displayProducts(filtered);
}

// --- Product Detail Modal ---
function showProductDetail(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) {
        showAlert('Error', 'Product not found.');
        return;
    }

    if (modalProductImage) modalProductImage.src = currentProduct.imageUrl || 'https://placehold.co/400x400?text=No+Image';
    if (modalProductTitle) modalProductTitle.textContent = currentProduct.title;
    if (modalProductPrice) modalProductPrice.textContent = `PKR ${currentProduct.price ? currentProduct.price.toFixed(2) : '0.00'}`;
    if (modalProductDescription) modalProductDescription.textContent = currentProduct.description;
    if (modalProductCategory) modalProductCategory.textContent = currentProduct.category || 'N/A';
    if (productQuantityInput) productQuantityInput.value = 1; // Reset quantity

    // Display average rating and "Rate this product" button
    const productRatings = currentProduct.ratings || {};
    const averageRating = calculateAverageRating(productRatings);
    const ratingCount = Object.keys(productRatings).length;
    if (modalProductRating) {
        modalProductRating.innerHTML = `${getStarRatingHtml(averageRating)} (${ratingCount} reviews) <button class="button secondary" id="rate-product-btn">Rate this product</button>`;
    }

    // Hide the order form by default when opening modal
    if (orderFormSection) orderFormSection.style.display = 'none';
    // Reset "Place Order" button text and ensure it has the correct listener
    if (placeOrderBtn) {
        placeOrderBtn.textContent = 'Place Order';
        placeOrderBtn.removeEventListener('click', confirmOrder); // Remove confirm handler if present
        placeOrderBtn.addEventListener('click', handlePlaceOrderClick); // Add or re-add initial handler
    }
    // Clear order form fields
    if (orderNameInput) orderNameInput.value = '';
    if (orderAddressInput) orderAddressInput.value = '';
    if (orderEmailInput) orderEmailInput.value = '';
    if (orderPhoneInput) orderPhoneInput.value = '';


    if (productDetailModal) productDetailModal.classList.add('active');
    if (document.body) document.body.classList.add('no-scroll'); // Add no-scroll class
    
    const rateProductBtn = document.getElementById('rate-product-btn');
    if (rateProductBtn) {
        rateProductBtn.addEventListener('click', openRatingModal);
    }
}

function closeProductDetailModal() {
    if (productDetailModal) productDetailModal.classList.remove('active');
    if (document.body) document.body.classList.remove('no-scroll'); // Remove no-scroll class
    currentProduct = null;
    // Hide the order form when closing the modal
    if (orderFormSection) orderFormSection.style.display = 'none';
    // Reset form fields
    if (orderNameInput) orderNameInput.value = '';
    if (orderAddressInput) orderAddressInput.value = '';
    if (orderEmailInput) orderEmailInput.value = '';
    if (orderPhoneInput) orderPhoneInput.value = '';
    // Reset the place order button text and listener
    if (placeOrderBtn) {
        placeOrderBtn.textContent = 'Place Order';
        placeOrderBtn.removeEventListener('click', confirmOrder); // Ensure old listener is removed
        placeOrderBtn.addEventListener('click', handlePlaceOrderClick); // Re-add initial listener
    }
}

// --- Cart Functionality ---
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function loadCart() {
    renderCart();
    updateCartCount();
}

function addToCart(product, quantity) {
    if (cart[product.id]) {
        cart[product.id].quantity += quantity;
    } else {
        cart[product.id] = { ...product, quantity };
    }
    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    delete cart[productId];
    saveCart();
    renderCart();
}

function updateCartQuantity(productId, newQuantity) {
    if (cart[productId]) {
        cart[productId].quantity = newQuantity;
        if (cart[productId].quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
        }
    }
    renderCart();
}

function renderCart() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';
    let total = 0;
    const productIdsInCart = Object.keys(cart);

    if (productIdsInCart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        if (cartTotalSpan) cartTotalSpan.textContent = '0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    productIdsInCart.forEach(productId => {
        const item = cart[productId];
        const itemTotal = (item.price || 0) * item.quantity;
        total += itemTotal;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <div class="cart-item-image-container">
                <img src="${item.imageUrl || 'https://placehold.co/80x80?text=No+Image'}" alt="${item.title}" class="cart-item-image">
            </div>
            <div class="cart-item-details">
                <h4>${item.title}</h4>
                <p>Price: PKR ${item.price ? item.price.toFixed(2) : '0.00'}</p>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-control">
                    <button class="decrease-cart-quantity" data-id="${item.id}">-</button>
                    <input type="number" value="${item.quantity}" min="1" data-id="${item.id}" class="cart-quantity-input">
                    <button class="increase-cart-quantity" data-id="${item.id}">+</button>
                </div>
                <p class="cart-item-price">PKR ${itemTotal.toFixed(2)}</p>
                <button class="cart-item-remove" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });

    if (cartTotalSpan) cartTotalSpan.textContent = total.toFixed(2);

    // Add event listeners for quantity and remove buttons in cart
    document.querySelectorAll('.decrease-cart-quantity').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.id;
            if (cart[productId]) {
                updateCartQuantity(productId, cart[productId].quantity - 1);
            }
        });
    });

    document.querySelectorAll('.increase-cart-quantity').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.id;
            if (cart[productId]) {
                updateCartQuantity(productId, cart[productId].quantity + 1);
            }
        });
    });

    document.querySelectorAll('.cart-quantity-input').forEach(input => {
        input.addEventListener('change', (event) => {
            const productId = event.currentTarget.dataset.id;
            const newQuantity = parseInt(event.currentTarget.value);
            if (!isNaN(newQuantity) && newQuantity >= 1) {
                updateCartQuantity(productId, newQuantity);
            } else if (cart[productId]) {
                event.currentTarget.value = cart[productId].quantity; // Revert to current quantity if invalid
            }
        });
    });

    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.id;
            removeFromCart(productId);
        });
    });
}

function updateCartCount() {
    if (!cartCountSpan) return;
    const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = count;
}

// --- Order Placement ---
function handlePlaceOrderClick() {
    // This function is called when the "Place Order" button in the modal is clicked
    // It displays the order form and changes the button to "Confirm Order"
    if (orderFormSection) orderFormSection.style.display = 'block';
    // Scroll to the order form section within the modal
    if (orderFormSection) orderFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (placeOrderBtn) {
        placeOrderBtn.textContent = 'Confirm Order';
        // IMPORTANT: Remove the current 'handlePlaceOrderClick' listener and add 'confirmOrder' listener
        placeOrderBtn.removeEventListener('click', handlePlaceOrderClick);
        placeOrderBtn.addEventListener('click', confirmOrder);
    }
}

async function confirmOrder() {
    const customerName = orderNameInput ? orderNameInput.value.trim() : '';
    const customerAddress = orderAddressInput ? orderAddressInput.value.trim() : '';
    const customerEmail = orderEmailInput ? orderEmailInput.value.trim() : '';
    const customerPhone = orderPhoneInput ? orderPhoneInput.value.trim() : '';

    if (!customerName || !customerAddress || !customerEmail || !customerPhone) {
        showAlert('Missing Information', 'Please fill in all order details.');
        return;
    }

    if (!currentProduct) {
        showAlert('Error', 'No product selected for order.');
        return;
    }

    const quantity = parseInt(productQuantityInput ? productQuantityInput.value : 0);
    if (isNaN(quantity) || quantity <= 0) {
        showAlert('Invalid Quantity', 'Invalid quantity.');
        return;
    }

    const orderDetails = {
        productId: currentProduct.id,
        productTitle: currentProduct.title,
        productPrice: currentProduct.price,
        productImageUrl: currentProduct.imageUrl,
        quantity: quantity,
        totalAmount: (currentProduct.price || 0) * quantity,
        customerName: customerName,
        customerAddress: customerAddress,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        orderDate: serverTimestamp(),
        status: 'Pending' // Initial status
    };

    try {
        const newOrderRef = push(ref(database, 'orders'));
        await set(newOrderRef, orderDetails);
        showAlert('Order Placed!', 'Your order has been placed successfully. Thank you for your purchase!');
        showOrderConfirmationModal(); // Show order confirmation modal
        closeProductDetailModal(); // Close the product detail modal
        // Clear order form fields and reset button state are now handled by closeProductDetailModal

    } catch (error) {
        showAlert('Order Failed', `There was an error placing your order: ${error.message}`);
        console.error("Order placement error:", error);
    }
}

async function handleCheckout() {
    const productIdsInCart = Object.keys(cart);
    if (productIdsInCart.length === 0) {
        showAlert('Cart Empty', 'Your cart is empty. Add some products before checking out.');
        return;
    }

    const user = auth.currentUser;
    // If you want to force login for checkout, uncomment this block
    /*
    if (!user) {
        showAlert('Login Required', 'Please login or sign up to place an order.');
        displaySection('auth-section');
        return;
    }
    */

    const itemsInOrder = Object.values(cart).map(item => ({
        productId: item.id,
        productTitle: item.title,
        productPrice: item.price,
        productImageUrl: item.imageUrl,
        quantity: item.quantity,
        subTotal: (item.price || 0) * item.quantity
    }));

    const customerEmailForCheckout = user ? user.email : "guest@example.com";
    const customerNameForCheckout = user ? (user.displayName || user.email) : "Guest User"; // Placeholder
    const customerAddressForCheckout = "N/A (Full checkout form not implemented)"; // Placeholder
    const customerPhoneForCheckout = "N/A"; // Placeholder


    const orderDetails = {
        items: itemsInOrder,
        totalAmount: parseFloat(cartTotalSpan ? cartTotalSpan.textContent : '0.00'),
        customerName: customerNameForCheckout,
        customerAddress: customerAddressForCheckout,
        customerEmail: customerEmailForCheckout,
        customerPhone: customerPhoneForCheckout,
        orderDate: serverTimestamp(),
        status: 'Pending'
    };

    try {
        const newOrderRef = push(ref(database, 'orders'));
        await set(newOrderRef, orderDetails);
        showAlert('Checkout Complete!', 'Your cart items have been ordered. Thank you for your purchase!');
        cart = {}; // Clear cart after successful checkout
        saveCart();
        renderCart(); // Update cart display
        displaySection('product-listing-section'); // Redirect to product list
    } catch (error) {
        showAlert('Checkout Failed', `There was an error processing your checkout: ${error.message}`);
        console.error("Checkout error:", error);
    }
}

// --- Order History ---
function loadOrderHistory() {
    const user = auth.currentUser;
    if (!user) {
        if (orderHistoryList) orderHistoryList.innerHTML = '<p>Please login to view your order history.</p>';
        return;
    }

    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        if (!orderHistoryList) return;
        orderHistoryList.innerHTML = ''; // Clear previous history
        let hasOrders = false;
        const ordersArray = [];
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            // Filter orders by the currently logged-in user's email
            if (order.customerEmail && order.customerEmail === user.email) {
                ordersArray.push({ id: childSnapshot.key, ...order });
            }
        });

        if (ordersArray.length === 0) {
            orderHistoryList.innerHTML = '<p>You have not placed any orders yet.</p>';
            return;
        }

        // Sort orders by date, newest first
        ordersArray.sort((a, b) => {
            const dateA = a.orderDate ? (a.orderDate.timestamp || a.orderDate) : 0;
            const dateB = b.orderDate ? (b.orderDate.timestamp || b.orderDate) : 0;
            return dateB - dateA;
        });

        ordersArray.forEach(order => {
            hasOrders = true;
            const orderItemDiv = document.createElement('div');
            orderItemDiv.classList.add('order-item');

            const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';

            let productInfoHtml = '';
            // Check if it's a single product order or a multi-item cart order
            if (order.productId) { // Single product order structure
                productInfoHtml = `<p><strong>Product:</strong> ${order.productTitle}</p>
                                   <p><strong>Quantity:</strong> ${order.quantity}</p>
                                   <p><strong>Total:</strong> PKR ${order.totalAmount ? order.totalAmount.toFixed(2) : 'N/A'}</p>`;
            } else if (order.items && Array.isArray(order.items)) { // Multi-item cart order structure
                productInfoHtml = '<p><strong>Items:</strong></p><ul>';
                order.items.forEach(item => {
                    productInfoHtml += `<li>${item.productTitle} (x${item.quantity}) - PKR ${item.subTotal ? item.subTotal.toFixed(2) : 'N/A'}</li>`;
                });
                productInfoHtml += `</ul><p><strong>Total Order Amount:</strong> PKR ${order.totalAmount ? order.totalAmount.toFixed(2) : 'N/A'}</p>`;
            }


            orderItemDiv.innerHTML = `
                <h4>Order ID: ${order.id}</h4>
                ${productInfoHtml}
                <p><strong>Order Date:</strong> ${orderDate}</p>
                <p><strong>Status:</strong> <span class="order-status">${order.status}</span></p>
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Address:</strong> ${order.customerAddress}</p>
                <p><strong>Email:</strong> ${order.customerEmail}</p>
                <p><strong>Phone:</strong> ${order.customerPhone}</p>
            `;
            orderHistoryList.appendChild(orderItemDiv); // Append in order
        });
        if (!hasOrders) {
            orderHistoryList.innerHTML = '<p>You have not placed any orders yet.</p>';
        }
    }, (error) => {
        console.error("Error loading order history:", error);
        showAlert('Error', 'Failed to load order history.');
    });
}


// --- Rating Functionality ---
function openRatingModal() {
    if (!currentProduct) {
        showAlert('Error', 'No product selected for rating.');
        return;
    }
    if (ratingProductTitle) ratingProductTitle.textContent = currentProduct.title;
    selectedRating = 0; // Reset selected rating
    updateRatingStars();
    if (ratingCommentInput) ratingCommentInput.value = ''; // Clear comment
    if (ratingModal) ratingModal.classList.add('active');
    if (document.body) document.body.classList.add('no-scroll');
}

function closeRatingModal() {
    if (ratingModal) ratingModal.classList.remove('active');
    if (document.body) document.body.classList.remove('no-scroll');
}

function updateRatingStars() {
    if (!ratingStarsContainer) return;
    Array.from(ratingStarsContainer.children).forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

async function submitProductRating() {
    if (!currentProduct || selectedRating === 0) {
        showAlert('Error', 'Please select a rating (1-5 stars).');
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        showAlert('Login Required', 'You must be logged in to submit a rating.');
        return;
    }

    const ratingData = {
        productId: currentProduct.id,
        userId: user.uid,
        userName: user.email, // Or user.displayName if available
        rating: selectedRating,
        comment: ratingCommentInput ? ratingCommentInput.value.trim() : '',
        timestamp: serverTimestamp()
    };

    try {
        // Store ratings under product ID, then a unique ID for each rating
        const newRatingRef = push(ref(database, `products/${currentProduct.id}/ratings`));
        await set(newRatingRef, ratingData);
        showAlert('Rating Submitted', 'Thank you for your feedback!');
        closeRatingModal();
        // Reload product details to update average rating display
        showProductDetail(currentProduct.id);
        // Refresh product listing to reflect new ratings
        loadProducts();
    } catch (error) {
        showAlert('Submission Failed', `Error submitting rating: ${error.message}`);
        console.error("Rating submission error:", error);
    }
}

// --- Custom Alert Modal ---
function showAlert(title, message) {
    if (customModalTitle) customModalTitle.textContent = title;
    if (customModalMessage) customModalMessage.textContent = message;
    if (customAlertModal) customAlertModal.classList.add('active');
    if (document.body) document.body.classList.add('no-scroll'); // Add no-scroll to body for alert
}

function closeAlertModal() {
    if (customAlertModal) customAlertModal.classList.remove('active');
    if (document.body) document.body.classList.remove('no-scroll'); // Remove no-scroll from body after alert
}

// --- Order Confirmation Modal ---
function showOrderConfirmationModal() {
    if (orderConfirmationModal) orderConfirmationModal.classList.add('active');
    if (document.body) document.body.classList.add('no-scroll'); // Add no-scroll to body for confirmation
}

function closeOrderConfirmationModal() {
    if (orderConfirmationModal) orderConfirmationModal.classList.remove('active');
    if (document.body) document.body.classList.remove('no-scroll'); // Remove no-scroll from body after confirmation
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial data load after auth state is checked
    loadProducts(); // Load products regardless of auth state
    loadCart(); // Load cart always

    // Navigation
    if (homeLink) homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        displaySection('product-listing-section');
    });

    if (cartLink) cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        displaySection('cart-section');
    });

    if (orderHistoryLink) orderHistoryLink.addEventListener('click', (e) => {
        e.preventDefault();
        displaySection('order-history-section');
        loadOrderHistory(); // Ensure order history is loaded when navigating
    });

    // Auth
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (signupBtn) signupBtn.addEventListener('click', handleSignUp);

    // Search and Filter
    if (searchButton) searchButton.addEventListener('click', filterAndSortProducts);
    if (searchInput) searchInput.addEventListener('input', filterAndSortProducts); // Live search
    if (sortSelect) sortSelect.addEventListener('change', filterAndSortProducts);

    // Initial attachment of category filter click handlers (for hardcoded "All" button)
    // Dynamic category buttons will have their listeners re-attached by populateCategoryFilters
    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', handleCategoryFilterClick);
    });

    // Cart
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);

    // Product Detail Modal
    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener('click', closeProductDetailModal);
    if (productDetailModal) {
        window.addEventListener('click', (event) => {
            if (event.target === productDetailModal) {
                closeProductDetailModal();
            }
        });
    }

    // Product Quantity in Detail Modal
    if (decreaseQuantityBtn) decreaseQuantityBtn.addEventListener('click', () => {
        if (productQuantityInput) {
            let quantity = parseInt(productQuantityInput.value);
            if (quantity > 1) {
                productQuantityInput.value = quantity - 1;
            }
        }
    });

    if (increaseQuantityBtn) increaseQuantityBtn.addEventListener('click', () => {
        if (productQuantityInput) {
            let quantity = parseInt(productQuantityInput.value);
            productQuantityInput.value = quantity + 1;
        }
    });

    if (addToCartModalBtn) addToCartModalBtn.addEventListener('click', () => {
        if (currentProduct && productQuantityInput) {
            const quantity = parseInt(productQuantityInput.value);
            if (isNaN(quantity) || quantity <= 0) {
                showAlert('Invalid Quantity', 'Please enter a valid quantity.');
                return;
            }
            addToCart(currentProduct, quantity);
            showAlert('Added to Cart', `${currentProduct.title} (x${quantity}) added to your cart.`);
            closeProductDetailModal();
        }
    });

    // Place Order button in Product Detail Modal
    // Initial listener to show form, not place order directly
    if (placeOrderBtn) placeOrderBtn.addEventListener('click', handlePlaceOrderClick);

    // Custom Alert Modal
    if (customModalOkBtn) customModalOkBtn.addEventListener('click', closeAlertModal);
    if (customAlertModal) {
        window.addEventListener('click', (event) => {
            if (event.target === customAlertModal) {
                closeAlertModal();
            }
        });
    }

    // Order Confirmation Modal
    if (orderConfirmationOkBtn) orderConfirmationOkBtn.addEventListener('click', closeOrderConfirmationModal);
    if (orderConfirmationModal) {
        window.addEventListener('click', (event) => {
            if (event.target === orderConfirmationModal) {
                closeOrderConfirmationModal();
            }
        });
    }

    // Rating star click handler
    if (ratingStarsContainer) {
        ratingStarsContainer.addEventListener('click', (event) => {
            const star = event.target.closest('.fa-star');
            if (star) {
                selectedRating = parseInt(star.dataset.rating);
                updateRatingStars();
            }
        });
    }

    // Submit rating button
    if (submitRatingButton) {
        submitRatingButton.addEventListener('click', submitProductRating);
    }
});
