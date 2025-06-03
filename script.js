// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
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
  appId: "1:967448486557:web:2c89283921f6479010495f",
  measurementId: "G-CM67R2L60J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
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

const toggleOrderHistoryBtn = document.getElementById('toggle-order-history-btn');
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
const placeOrderBtn = document.getElementById('place-order-btn'); // For the new order form

// Order Form Elements (new)
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

// Order Confirmation Modal Elements (new)
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
        authLink.textContent = 'Logout';
        authLink.removeEventListener('click', showAuthSection);
        authLink.addEventListener('click', handleLogout);
        orderHistoryLink.style.display = 'block';
        displaySection('product-listing-section');
        loadCart(); // Load cart for logged-in user
        loadOrderHistory(); // Load order history for logged-in user
    } else {
        // User is signed out
        authLink.textContent = 'Login';
        authLink.removeEventListener('click', handleLogout);
        authLink.addEventListener('click', showAuthSection);
        orderHistoryLink.style.display = 'none';
        displaySection('product-listing-section');
        cart = {}; // Clear cart if user logs out
        saveCart();
        loadCart(); // Update cart display
    }
});

async function handleLogin() {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert('Success', 'Logged in successfully!');
        loginEmailInput.value = '';
        loginPasswordInput.value = '';
        displaySection('product-listing-section'); // Redirect to product listing
    } catch (error) {
        showAlert('Login Failed', error.message);
        console.error("Login error:", error);
    }
}

async function handleSignUp() {
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showAlert('Success', 'Signed up and logged in successfully!');
        signupEmailInput.value = '';
        signupPasswordInput.value = '';
        displaySection('product-listing-section'); // Redirect to product listing
    } catch (error) {
        showAlert('Sign Up Failed', error.message);
        console.error("Sign up error:", error);
    }
}

function handleLogout() {
    signOut(auth).then(() => {
        showAlert('Success', 'Logged out successfully!');
        displaySection('product-listing-section'); // Redirect to product listing
    }).catch((error) => {
        showAlert('Logout Failed', error.message);
        console.error("Logout error:", error);
    });
}

// --- Section Display ---
function displaySection(sectionId) {
    authSection.style.display = 'none';
    productListingSection.style.display = 'none';
    cartSection.style.display = 'none';
    orderHistorySection.style.display = 'none';

    document.getElementById(sectionId).style.display = 'block';

    // Update active link in navigation
    document.querySelectorAll('.main-nav ul li a').forEach(link => {
        link.classList.remove('active');
    });
    if (sectionId === 'product-listing-section') {
        homeLink.classList.add('active');
    } else if (sectionId === 'cart-section') {
        cartLink.classList.add('active');
    } else if (sectionId === 'auth-section') {
        authLink.classList.add('active');
    } else if (sectionId === 'order-history-section') {
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
    productGrid.innerHTML = '';
    if (productsToDisplay.length === 0) {
        productGrid.innerHTML = '<p>No products found.</p>';
        return;
    }

    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.id = product.id;

        const averageRating = product.ratings ? calculateAverageRating(product.ratings) : 0;
        const starIcons = getStarRatingHtml(averageRating);

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.imageUrl || 'https://via.placeholder.com/200'}" alt="${product.title}" class="product-image">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-price">PKR ${product.price.toFixed(2)}</p>
                <div class="product-rating">${starIcons} (${product.ratings ? Object.keys(product.ratings).length : 0})</div>
                <div class="product-actions">
                    <button class="button primary add-to-cart-btn" data-id="${product.id}"><i class="fas fa-cart-plus"></i> Add to Cart</button>
                    <button class="button secondary view-detail-btn" data-id="${product.id}"><i class="fas fa-eye"></i> View Detail</button>
                </div>
            </div>
        `;
        productGrid.appendChild(productCard);
    });

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
    if (!ratings) return 0;
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
    const categories = new Set(['all']); // Start with 'all'
    allProducts.forEach(product => {
        if (product.category) {
            categories.add(product.category);
        }
    });

    categoryFiltersContainer.innerHTML = ''; // Clear existing buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('category-button');
        if (category === 'all') {
            button.classList.add('active');
        }
        button.dataset.category = category;
        button.textContent = category.charAt(0).toUpperCase() + category.slice(1); // Capitalize
        categoryFiltersContainer.appendChild(button);
    });

    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', (event) => {
            document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
            event.currentTarget.classList.add('active');
            filterAndSortProducts();
        });
    });
}

function filterAndSortProducts() {
    const searchQuery = searchInput.value.toLowerCase();
    const selectedCategory = document.querySelector('.category-button.active')?.dataset.category || 'all';
    const sortOption = sortSelect.value;

    let filtered = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchQuery) ||
                              product.description.toLowerCase().includes(searchQuery);
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
        switch (sortOption) {
            case 'price-asc':
                return a.price - b.price;
            case 'price-desc':
                return b.price - a.price;
            case 'name-asc':
                return a.title.localeCompare(b.title);
            case 'name-desc':
                return b.title.localeCompare(a.title);
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
    if (currentProduct) {
        modalProductImage.src = currentProduct.imageUrl || 'https://via.placeholder.com/400';
        modalProductTitle.textContent = currentProduct.title;
        modalProductPrice.textContent = `PKR ${currentProduct.price.toFixed(2)}`;
        modalProductDescription.textContent = currentProduct.description;
        modalProductCategory.textContent = currentProduct.category || 'N/A';
        productQuantityInput.value = 1; // Reset quantity

        const averageRating = currentProduct.ratings ? calculateAverageRating(currentProduct.ratings) : 0;
        modalProductRating.innerHTML = `${getStarRatingHtml(averageRating)} (${currentProduct.ratings ? Object.keys(currentProduct.ratings).length : 0} reviews) <button class="button secondary" id="rate-product-btn">Rate this product</button>`;

        // Show/Hide order form
        orderFormSection.style.display = 'none'; // Hide by default when opening modal

        productDetailModal.classList.add('active');
        document.body.classList.add('no-scroll'); // Add no-scroll class
        
        const rateProductBtn = document.getElementById('rate-product-btn');
        if (rateProductBtn) {
            rateProductBtn.addEventListener('click', openRatingModal);
        }
    }
}

function closeProductDetailModal() {
    productDetailModal.classList.remove('active');
    document.body.classList.remove('no-scroll'); // Remove no-scroll class
    currentProduct = null;
    // Hide the order form when closing the modal
    orderFormSection.style.display = 'none';
    // Reset form fields
    orderNameInput.value = '';
    orderAddressInput.value = '';
    orderEmailInput.value = '';
    orderPhoneInput.value = '';
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
    cartItemsContainer.innerHTML = '';
    let total = 0;
    const productIdsInCart = Object.keys(cart);

    if (productIdsInCart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalSpan.textContent = '0.00';
        checkoutBtn.disabled = true;
        return;
    }

    checkoutBtn.disabled = false;

    productIdsInCart.forEach(productId => {
        const item = cart[productId];
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <div class="cart-item-image-container">
                <img src="${item.imageUrl || 'https://via.placeholder.com/80'}" alt="${item.title}" class="cart-item-image">
            </div>
            <div class="cart-item-details">
                <h4>${item.title}</h4>
                <p>Price: PKR ${item.price.toFixed(2)}</p>
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

    cartTotalSpan.textContent = total.toFixed(2);

    // Add event listeners for quantity and remove buttons in cart
    document.querySelectorAll('.decrease-cart-quantity').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.id;
            updateCartQuantity(productId, cart[productId].quantity - 1);
        });
    });

    document.querySelectorAll('.increase-cart-quantity').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.id;
            updateCartQuantity(productId, cart[productId].quantity + 1);
        });
    });

    document.querySelectorAll('.cart-quantity-input').forEach(input => {
        input.addEventListener('change', (event) => {
            const productId = event.currentTarget.dataset.id;
            const newQuantity = parseInt(event.currentTarget.value);
            if (!isNaN(newQuantity) && newQuantity >= 1) {
                updateCartQuantity(productId, newQuantity);
            } else {
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
    const count = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = count;
}

// --- Order Placement ---
function placeOrder() {
    // This function is now called when the "Place Order" button in the modal is clicked
    // and will display the order form.
    orderFormSection.style.display = 'block';
    // Scroll to the order form section within the modal
    orderFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Change "Place Order" button to "Confirm Order" or similar, or handle via a new button
    placeOrderBtn.textContent = 'Confirm Order';
    placeOrderBtn.removeEventListener('click', placeOrder); // Remove old listener
    placeOrderBtn.addEventListener('click', confirmOrder); // Add new listener for confirmation
}

async function confirmOrder() {
    const customerName = orderNameInput.value.trim();
    const customerAddress = orderAddressInput.value.trim();
    const customerEmail = orderEmailInput.value.trim();
    const customerPhone = orderPhoneInput.value.trim();

    if (!customerName || !customerAddress || !customerEmail || !customerPhone) {
        showAlert('Error', 'Please fill in all order details.');
        return;
    }

    if (!currentProduct) {
        showAlert('Error', 'No product selected for order.');
        return;
    }

    const quantity = parseInt(productQuantityInput.value);
    if (isNaN(quantity) || quantity <= 0) {
        showAlert('Error', 'Invalid quantity.');
        return;
    }

    const orderDetails = {
        productId: currentProduct.id,
        productTitle: currentProduct.title,
        productPrice: currentProduct.price,
        productImageUrl: currentProduct.imageUrl,
        quantity: quantity,
        totalAmount: currentProduct.price * quantity,
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
        // Clear order form fields
        orderNameInput.value = '';
        orderAddressInput.value = '';
        orderEmailInput.value = '';
        orderPhoneInput.value = '';
        // Reset the place order button text and listener
        placeOrderBtn.textContent = 'Place Order';
        placeOrderBtn.removeEventListener('click', confirmOrder);
        placeOrderBtn.addEventListener('click', placeOrder);

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
    if (!user) {
        showAlert('Login Required', 'Please login or sign up to place an order.');
        displaySection('auth-section');
        return;
    }

    // For simplicity, directly place orders for all items in cart.
    // In a real app, you might want a multi-step checkout with address form etc.
    // Here, we'll simulate individual orders for each item if there's no overall order form.
    // If you want a single order with multiple items, the 'orders' structure in Firebase
    // needs to support an array of items, and the admin app needs to parse it.

    // For now, let's just make it clear that a direct "checkout" button for cart
    // would also require customer details. Let's make checkout similar to single product order.
    // For a full cart checkout, you'd show a form to collect user details for the whole cart.

    // Let's assume for now that checkout leads to a generic "order placed" for all cart items.
    // If a full checkout form is needed, it would be a new modal/section.
    // For this request, we'll keep the cart checkout simple and assume user details are collected
    // if a similar form like the single product order form is added to the cart section.

    // If "checkout" implies placing all items as one order, you would need to:
    // 1. Open a new modal/section for checkout details (name, address, email, phone for the whole order)
    // 2. Collect those details.
    // 3. Construct a single order object containing an array of cart items.
    // 4. Push this single order to Firebase.

    // Since the request was specifically about the "Place Order" button on product detail,
    // I'll adjust checkout behavior to use the existing "placeOrder" logic or a similar approach.
    // Given the current structure, a cart checkout implies a single transaction for all items.

    // Let's present a simple alert for cart checkout for now.
    // To implement full cart checkout with a form, it would be a larger task.
    // For the scope of this request, the 'placeOrder' feature is for individual products.
    showAlert('Checkout Initiated', 'Proceeding to checkout for all items in your cart. (Further development needed for a full checkout form)');
    // If you want to empty cart after "checkout initiation", add:
    // cart = {};
    // saveCart();
    // renderCart();
}

// --- Order History ---
function loadOrderHistory() {
    const user = auth.currentUser;
    if (!user) {
        orderHistoryList.innerHTML = '<p>Please login to view your order history.</p>';
        return;
    }

    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        orderHistoryList.innerHTML = ''; // Clear previous history
        let hasOrders = false;
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            // Filter orders by the currently logged-in user's email
            // (assuming email is used as a unique identifier for customer orders)
            if (order.customerEmail && order.customerEmail === user.email) {
                hasOrders = true;
                const orderItemDiv = document.createElement('div');
                orderItemDiv.classList.add('order-item');

                const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';

                orderItemDiv.innerHTML = `
                    <h4>Order ID: ${childSnapshot.key}</h4>
                    <p><strong>Product:</strong> ${order.productTitle}</p>
                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                    <p><strong>Total:</strong> PKR ${order.totalAmount ? order.totalAmount.toFixed(2) : 'N/A'}</p>
                    <p><strong>Order Date:</strong> ${orderDate}</p>
                    <p><strong>Status:</strong> <span class="order-status">${order.status}</span></p>
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Address:</strong> ${order.customerAddress}</p>
                    <p><strong>Email:</strong> ${order.customerEmail}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone}</p>
                `;
                orderHistoryList.prepend(orderItemDiv); // Add latest order at the top
            }
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
    if (currentProduct) {
        ratingProductTitle.textContent = currentProduct.title;
        selectedRating = 0; // Reset selected rating
        updateRatingStars();
        ratingCommentInput.value = ''; // Clear comment
        ratingModal.classList.add('active');
        document.body.classList.add('no-scroll');
    }
}

function closeRatingModal() {
    ratingModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

function updateRatingStars() {
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
        comment: ratingCommentInput.value.trim(),
        timestamp: serverTimestamp()
    };

    try {
        const newRatingRef = push(ref(database, `ratings/${currentProduct.id}`));
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
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customAlertModal.classList.add('active');
    document.body.classList.add('no-scroll');
}

function closeAlertModal() {
    customAlertModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

// --- Order Confirmation Modal ---
function showOrderConfirmationModal() {
    orderConfirmationModal.classList.add('active');
    document.body.classList.add('no-scroll');
}

function closeOrderConfirmationModal() {
    orderConfirmationModal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial data load after auth state is checked
    loadProducts(); // Load products regardless of auth state
    loadCart(); // Load cart always

    // Navigation
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        displaySection('product-listing-section');
    });

    cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        displaySection('cart-section');
    });

    orderHistoryLink.addEventListener('click', (e) => {
        e.preventDefault();
        displaySection('order-history-section');
        loadOrderHistory(); // Ensure order history is loaded when navigating
    });

    // Auth
    loginBtn.addEventListener('click', handleLogin);
    signupBtn.addEventListener('click', handleSignUp);

    // Search and Filter
    searchButton.addEventListener('click', filterAndSortProducts);
    searchInput.addEventListener('input', filterAndSortProducts); // Live search
    sortSelect.addEventListener('change', filterAndSortProducts);

    // Cart
    checkoutBtn.addEventListener('click', handleCheckout);

    // Product Detail Modal
    closeDetailModalBtn.addEventListener('click', closeProductDetailModal);
    window.addEventListener('click', (event) => {
        if (event.target === productDetailModal) {
            closeProductDetailModal();
        }
    });

    // Product Quantity in Detail Modal
    decreaseQuantityBtn.addEventListener('click', () => {
        let quantity = parseInt(productQuantityInput.value);
        if (quantity > 1) {
            productQuantityInput.value = quantity - 1;
        }
    });

    increaseQuantityBtn.addEventListener('click', () => {
        let quantity = parseInt(productQuantityInput.value);
        productQuantityInput.value = quantity + 1;
    });

    addToCartModalBtn.addEventListener('click', () => {
        if (currentProduct) {
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

    // New: Place Order button in Product Detail Modal
    placeOrderBtn.addEventListener('click', placeOrder); // Initial listener to show form

    // Custom Alert Modal
    customModalOkBtn.addEventListener('click', closeAlertModal);
    window.addEventListener('click', (event) => {
        if (event.target === customAlertModal) {
            closeAlertModal();
        }
    });

    // Order Confirmation Modal
    orderConfirmationOkBtn.addEventListener('click', closeOrderConfirmationModal);
    window.addEventListener('click', (event) => {
        if (event.target === orderConfirmationModal) {
            closeOrderConfirmationModal();
        }
    });

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
