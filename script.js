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
  appId: "1:967448486557:web:2c89223921f6479010495f",
  measurementId: "G-CM67R2L60J" // ADDED: Measurement ID for Firebase Analytics
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
let currentProductToRate = null; // NEW: To store the product that was just ordered for rating

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
    orderFormSection.style.display = 'none'; // NEW: Hide order form
    ratingModal.style.display = 'none'; // NEW: Hide rating modal

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

        const productImage = document.createElement('img');
        productImage.classList.add('product-image');
        // FIX: Ensure product.imageUrl is valid, otherwise use placeholder
        if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http')) {
            productImage.src = product.imageUrl;
        } else {
            productImage.src = 'https://via.placeholder.com/200'; // Fallback
        }
        productImage.alt = product.title;

        // Create the product image container
        const productImageContainer = document.createElement('div');
        productImageContainer.classList.add('product-image-container');
        productImageContainer.appendChild(productImage);

        productCard.innerHTML = `
            ${productImageContainer.outerHTML}
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
            const product = products.find(p => p.id === productId);
            if (product) {
                openProductDetailModal(product);
            }
        });
    });
}

function openProductDetailModal(product) {
    currentProduct = product;
    modalProductTitle.textContent = product.title;
    // FIX: Ensure modalProductImage src is valid, otherwise use placeholder
    if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http')) {
        modalProductImage.src = product.imageUrl;
    } else {
        modalProductImage.src = 'https://via.placeholder.com/400'; // Fallback
    }
    modalProductImage.alt = product.title;
    modalProductPrice.textContent = product.price.toFixed(2);
    modalProductDescription.textContent = product.description;
    modalProductCategory.textContent = product.category;
    modalProductRating.innerHTML = getStarRatingHtml(product.ratings ? calculateAverageRating(product.ratings) : 0);
    productQuantityInput.value = 1;

    const modalProductVideo = document.getElementById('modal-product-video');
    if (product.videoUrl) {
        modalProductVideo.innerHTML = `
            <h4 style="margin-top: 20px; margin-bottom: 10px;">Product Video</h4>
            <iframe width="100%" height="315" src="${product.videoUrl.replace("watch?v=", "embed/")}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        `;
        modalProductVideo.style.display = 'block';
    } else {
        modalProductVideo.innerHTML = '';
        modalProductVideo.style.display = 'none';
    }

    productDetailModal.style.display = 'flex';
}

function closeProductDetailModal() {
    productDetailModal.style.display = 'none';
}

// --- Cart Management ---
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function loadCart() {
    cart = JSON.parse(localStorage.getItem('cart')) || {};
    renderCart();
    updateCartCount();
}

function updateCartCount() {
    let count = 0;
    for (const productId in cart) {
        count += cart[productId].quantity;
    }
    cartCountSpan.textContent = count;
}

function addToCart(product, quantity = 1) {
    if (cart[product.id]) {
        cart[product.id].quantity += quantity;
    } else {
        cart[product.id] = { ...product, quantity: quantity };
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
        }
    }
    saveCart();
    renderCart();
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    for (const productId in cart) {
        const item = cart[productId];
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <img src="${item.imageUrl || 'https://via.placeholder.com/100'}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.title}</h4>
                <p class="cart-item-price">PKR ${item.price.toFixed(2)}</p>
                <div class="cart-item-quantity-control">
                    <button class="button secondary decrease-cart-quantity" data-id="${item.id}">-</button>
                    <input type="number" value="${item.quantity}" min="1" class="cart-item-quantity" data-id="${item.id}" readonly>
                    <button class="button secondary increase-cart-quantity" data-id="${item.id}">+</button>
                </div>
                <p class="cart-item-total">Subtotal: PKR ${(itemTotal).toFixed(2)}</p>
            </div>
            <button class="button error remove-from-cart-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    }
    cartTotalSpan.textContent = total.toFixed(2);

    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.id;
            removeFromCart(productId);
        });
    });

    document.querySelectorAll('.decrease-cart-quantity').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.id;
            const quantityInput = document.querySelector(`.cart-item-quantity[data-id="${productId}"]`);
            let newQuantity = parseInt(quantityInput.value) - 1;
            updateCartQuantity(productId, newQuantity);
        });
    });

    document.querySelectorAll('.increase-cart-quantity').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.id;
            const quantityInput = document.querySelector(`.cart-item-quantity[data-id="${productId}"]`);
            let newQuantity = parseInt(quantityInput.value) + 1;
            updateCartQuantity(productId, newQuantity);
        });
    });
}

// --- Order Processing ---
checkoutBtn.addEventListener('click', () => {
    if (Object.keys(cart).length === 0) {
        showAlert('Your cart is empty. Please add items before checking out.', 'Empty Cart');
        return;
    }
    if (!auth.currentUser) {
        showAlert('Please log in to proceed with your order.', 'Login Required');
        displaySection('auth-section');
        return;
    }
    // Pre-fill form with user's email if available
    orderEmailInput.value = auth.currentUser.email || '';
    displaySection('order-form-section'); // Show the order form
});

document.getElementById('close-order-form-btn').addEventListener('click', () => {
    displaySection('product-listing-section'); // Go back to products
});

document.getElementById('order-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await placeOrder();
});

async function placeOrder() {
    const user = auth.currentUser;
    if (!user) {
        showAlert('You must be logged in to place an order.', 'Error');
        return;
    }

    if (Object.keys(cart).length === 0) {
        showAlert('Your cart is empty. Please add items before placing an order.', 'Empty Cart');
        return;
    }

    const orderDetails = {
        userId: user.uid,
        userName: orderNameInput.value,
        userEmail: orderEmailInput.value,
        userPhone: orderPhoneInput.value,
        shippingAddress: orderAddressInput.value,
        items: Object.values(cart).map(item => ({
            productId: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl // Include image URL for order history display
        })),
        total: parseFloat(cartTotalSpan.textContent),
        orderDate: serverTimestamp(),
        status: 'pending' // pending, completed, cancelled
    };

    try {
        await push(ref(database, 'orders'), orderDetails);
        showAlert('Order Placed!', 'Your order has been placed successfully. Thank you!');
        cart = {}; // Clear cart after successful order
        saveCart();
        renderCart();
        displaySection('product-listing-section'); // Go back to product listing
        showOrderConfirmationModal(); // Show order confirmation
        // NEW: After order confirmation, show the rating modal
        if (currentProduct) { // Ensure there's a product to rate from the last interaction
            currentProductToRate = currentProduct; // Set the product to rate
            setTimeout(() => {
                openRatingModal();
            }, 1000); // Small delay for better UX
        }
    } catch (error) {
        console.error("Error placing order:", error);
        showAlert('Order Failed', 'There was an error placing your order. Please try again.');
    }
}

function showOrderConfirmationModal() {
    orderConfirmationModal.style.display = 'flex';
}

function closeOrderConfirmationModal() {
    orderConfirmationModal.style.display = 'none';
}

// --- Order History ---
function loadOrderHistory() {
    const user = auth.currentUser;
    if (!user) {
        orderHistoryList.innerHTML = '<p>Please log in to view your order history.</p>';
        return;
    }

    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        orderHistoryList.innerHTML = '';
        let hasOrders = false;
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (order.userId === user.uid) {
                hasOrders = true;
                const orderDiv = document.createElement('div');
                orderDiv.classList.add('order-item');

                const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';

                let itemsHtml = order.items.map(item => `
                    <div class="order-item-detail">
                        <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" alt="${item.title}" class="order-item-image">
                        <span>${item.title} (x${item.quantity}) - PKR ${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('');

                orderDiv.innerHTML = `
                    <h3>Order ID: ${childSnapshot.key}</h3>
                    <p><strong>Date:</strong> ${orderDate}</p>
                    <p><strong>Status:</strong> <span class="order-status ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
                    <p><strong>Total:</strong> PKR ${order.total.toFixed(2)}</p>
                    <div class="order-items-list">${itemsHtml}</div>
                `;
                orderHistoryList.prepend(orderDiv); // Add latest orders first
            }
        });
        if (!hasOrders) {
            orderHistoryList.innerHTML = '<p>No orders found in your history.</p>';
        }
    }, (error) => {
        console.error("Error loading order history:", error);
        showAlert('Error', 'Failed to load order history.');
    });
}


// --- Search, Filter, Sort ---
searchInput.addEventListener('input', () => {
    filterAndSortProducts();
});

searchButton.addEventListener('click', () => {
    filterAndSortProducts();
});

sortSelect.addEventListener('change', () => {
    filterAndSortProducts();
});

function populateCategoryFilters(allProducts) {
    const categories = new Set();
    allProducts.forEach(product => {
        if (product.category) {
            categories.add(product.category);
        }
    });

    categoryFiltersContainer.innerHTML = ''; // Clear previous buttons
    const allButton = document.createElement('button');
    allButton.classList.add('button', 'category-filter-btn', 'active');
    allButton.textContent = 'All';
    allButton.dataset.category = 'all';
    categoryFiltersContainer.appendChild(allButton);

    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('button', 'category-filter-btn', 'secondary');
        button.textContent = category;
        button.dataset.category = category;
        categoryFiltersContainer.appendChild(button);
    });

    document.querySelectorAll('.category-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            // Remove active from all and add to clicked
            document.querySelectorAll('.category-filter-btn').forEach(btn => btn.classList.remove('active'));
            event.currentTarget.classList.add('active');
            filterAndSortProducts();
        });
    });
}

function filterAndSortProducts() {
    let filteredProducts = [...products];

    // Search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm)
        );
    }

    // Category filter
    const activeCategoryButton = document.querySelector('.category-filter-btn.active');
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'all';

    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

    // Sort
    const sortBy = sortSelect.value;
    if (sortBy === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'name-desc') {
        filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
    }

    displayProducts(filteredProducts);
}

// --- Utility Functions ---
function showAlert(title, message) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customAlertModal.style.display = 'flex';
}

function closeAlertModal() {
    customAlertModal.style.display = 'none';
}

function calculateAverageRating(ratings) {
    if (!ratings) return 0;
    const ratingValues = Object.values(ratings);
    if (ratingValues.length === 0) return 0;
    const sum = ratingValues.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / ratingValues.length;
}

function getStarRatingHtml(averageRating) {
    let starsHtml = '';
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star filled"></i>';
    }
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt filled"></i>';
    }
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    return starsHtml;
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadProducts(); // Initial load of products
    loadCart(); // Load cart on initial page load

    homeLink.addEventListener('click', (event) => {
        event.preventDefault();
        displaySection('product-listing-section');
    });

    cartLink.addEventListener('click', (event) => {
        event.preventDefault();
        displaySection('cart-section');
    });

    // Auth links handled by onAuthStateChanged

    orderHistoryLink.addEventListener('click', (event) => {
        event.preventDefault();
        displaySection('order-history-section');
    });

    loginBtn.addEventListener('click', handleLogin);
    signupBtn.addEventListener('click', handleSignUp);

    closeDetailModalBtn.addEventListener('click', closeProductDetailModal);

    increaseQuantityBtn.addEventListener('click', () => {
        productQuantityInput.value = parseInt(productQuantityInput.value) + 1;
    });

    decreaseQuantityBtn.addEventListener('click', () => {
        const currentValue = parseInt(productQuantityInput.value);
        if (currentValue > 1) {
            productQuantityInput.value = currentValue - 1;
        }
    });

    addToCartModalBtn.addEventListener('click', () => {
        if (currentProduct) {
            const quantity = parseInt(productQuantityInput.value);
            if (isNaN(quantity) || quantity < 1) {
                showAlert('Invalid Quantity', 'Please enter a valid quantity (at least 1).');
                return;
            }
            addToCart(currentProduct, quantity);
            showAlert('Added to Cart', `${currentProduct.title} (x${quantity}) added to your cart.`);
            closeProductDetailModal();
        }
    });

    // New: Place Order button in Product Detail Modal
    placeOrderBtn.addEventListener('click', () => {
        if (currentProduct) {
            // Set the product to rate before showing the order form
            currentProductToRate = currentProduct;
            displaySection('order-form-section'); // Show the order form for "Buy Now"
            closeProductDetailModal(); // Close product detail modal
        }
    });

    // Custom Alert Modal
    customModalOkBtn.addEventListener('click', () => {
        closeAlertModal();
        closeRatingModal(); // NEW: Ensure it closes if rating modal is also open
        closeOrderConfirmationModal(); // NEW: Ensure it closes if order confirmation is open
    });
    // Allow closing by clicking outside the alert modal
    window.addEventListener('click', (event) => {
        if (event.target === customAlertModal) {
            closeAlertModal();
        }
    });

    // Order Confirmation Modal
    orderConfirmationOkBtn.addEventListener('click', () => {
        closeOrderConfirmationModal();
        closeRatingModal(); // NEW: Ensure it closes if rating modal is also open
    });
    // Allow closing by clicking outside the confirmation modal
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

    // NEW: Close rating modal button
    if (closeRatingModalBtn) {
        closeRatingModalBtn.addEventListener('click', closeRatingModal);
    }

    // NEW: Allow closing rating modal by clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === ratingModal) {
            closeRatingModal();
        }
    });
});

// NEW: Functions for Rating Modal
function openRatingModal() {
    if (ratingModal && currentProductToRate) {
        ratingProductTitle.textContent = currentProductToRate.title;
        ratingModal.style.display = 'flex';
        // Reset stars and comment for new rating
        selectedRating = 0;
        updateRatingStars();
        if (ratingCommentInput) {
            ratingCommentInput.value = '';
        }
    }
}

function closeRatingModal() {
    if (ratingModal) {
        ratingModal.style.display = 'none';
        currentProductToRate = null; // Clear the product after closing
    }
}

function updateRatingStars() {
    const stars = ratingStarsContainer.querySelectorAll('.fa-star');
    stars.forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.remove('far');
            star.classList.add('fas', 'filled');
        } else {
            star.classList.remove('fas', 'filled');
            star.classList.add('far');
        }
    });
}

async function submitProductRating() {
    if (selectedRating === 0) {
        showAlert('Rating Required', 'Please select a star rating before submitting.');
        return;
    }

    if (!currentProductToRate || !currentProductToRate.id) {
        showAlert('Error', 'No product selected for rating.');
        return;
    }

    const ratingData = {
        productId: currentProductToRate.id,
        rating: selectedRating,
        comment: ratingCommentInput.value.trim(),
        timestamp: serverTimestamp()
    };

    try {
        const newRatingRef = push(ref(database, 'ratings')); // Push a new rating
        await set(newRatingRef, ratingData);
        showAlert('Rating Submitted', 'Thank you for your rating!');
        closeRatingModal();
    } catch (error) {
        console.error('Error submitting rating:', error);
        showAlert('Error', 'Failed to submit rating. Please try again.');
    }
}
