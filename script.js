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
  appId: "1:967448486557:web:8c5b62b083652614b1368e",
  measurementId: "G-G0G3E11Q4H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const loginContainer = document.getElementById('login-container');
const signupContainer = document.getElementById('signup-container');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const logoutLink = document.getElementById('logout-link');
const userDisplayName = document.getElementById('user-display-name');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupNameInput = document.getElementById('signup-name');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const loginErrorMessage = document.getElementById('login-error-message');
const signupErrorMessage = document.getElementById('signup-error-message');
const heroSection = document.getElementById('hero-section');
const productsSection = document.getElementById('products-section');
const productGrid = document.getElementById('product-grid');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const categoryFilters = document.getElementById('category-filters');
const sortSelect = document.getElementById('sort-select');

const productModal = document.getElementById('product-modal');
const closeProductModalBtn = document.getElementById('close-product-modal');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductStock = document.getElementById('modal-product-stock');
const modalProductVideoContainer = document.getElementById('modal-product-video-container');
const modalProductVideo = document.getElementById('modal-product-video');
const modalImageThumbnails = document.getElementById('modal-image-thumbnails');
const addToCartModalBtn = document.getElementById('add-to-cart-modal-btn');
const buyNowModalBtn = document.getElementById('buy-now-modal-btn');
const modalProductRating = document.getElementById('modal-product-rating');

const cartButton = document.getElementById('cart-button');
const cartCountSpan = document.getElementById('cart-count');
const cartSection = document.getElementById('cart-section');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-button');
const emptyCartMessage = document.getElementById('empty-cart-message');

const checkoutSection = document.getElementById('checkout-section');
const placeOrderForm = document.getElementById('place-order-form');
const customerNameInput = document.getElementById('customer-name');
const customerAddressInput = document.getElementById('customer-address');
const customerPhoneInput = document.getElementById('customer-phone');
const customerNotesInput = document.getElementById('customer-notes');
const checkoutOrderSummary = document.getElementById('checkout-order-summary');
const orderQuantityInput = document.getElementById('order-quantity');
const orderTotalPriceSpan = document.getElementById('order-total-price');

const orderHistoryLink = document.getElementById('order-history-link');
const orderHistorySection = document.getElementById('order-history-section');
const closeOrderHistoryBtn = document.getElementById('close-order-history-btn');
const orderHistoryList = document.getElementById('order-history-list');
const emptyOrderHistoryMessage = document.getElementById('empty-order-history-message');

const rateProductButton = document.getElementById('rate-product-button');
const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.getElementById('close-rating-modal');
const ratingProductName = document.getElementById('rating-product-name');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const ratingCommentInput = document.getElementById('rating-comment');
const submitRatingButton = document.getElementById('submit-rating-btn');

const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');

const aboutUsLink = document.getElementById('about-us-link');
const aboutUsSection = document.getElementById('about-us-section');

// --- Global Variables ---
let products = [];
let categories = {};
let cart = {};
let currentUser = null;
let selectedProduct = null; // Product currently viewed in modal or for direct buy
let selectedRating = 0; // For product rating

// --- Utility Functions ---
function showCustomAlert(title, message, isConfirm = false) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customModalCancelBtn.style.display = isConfirm ? 'inline-block' : 'none';
    customAlertModal.classList.add('show');
    return new Promise((resolve) => {
        customModalOkBtn.onclick = () => {
            customAlertModal.classList.remove('show');
            resolve(true);
        };
        customModalCancelBtn.onclick = () => {
            customAlertModal.classList.remove('show');
            resolve(false);
        };
    });
}

function showSection(sectionId) {
    // Hide all main sections first
    heroSection.style.display = 'none';
    authSection.style.display = 'none';
    productsSection.style.display = 'none';
    cartSection.style.display = 'none';
    checkoutSection.style.display = 'none';
    orderHistorySection.style.display = 'none';
    aboutUsSection.style.display = 'none'; // Hide about us

    // Show the requested section
    document.getElementById(sectionId).style.display = 'block';

    // Special handling for auth section to show login by default
    if (sectionId === 'auth-section') {
        loginContainer.style.display = 'block';
        signupContainer.style.display = 'none';
    }
}

// --- Authentication ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        userDisplayName.textContent = user.displayName || user.email;
        loginLink.style.display = 'none';
        signupLink.style.display = 'none';
        logoutLink.style.display = 'block';
        orderHistoryLink.style.display = 'block';
        // If coming from auth, redirect to products
        if (authSection.style.display === 'block') {
            showSection('products-section');
        }
        loadCart(); // Load user-specific cart
        loadUserProfile(user.uid); // Load user name for signup
    } else {
        userDisplayName.textContent = 'Guest';
        loginLink.style.display = 'block';
        signupLink.style.display = 'block';
        logoutLink.style.display = 'none';
        orderHistoryLink.style.display = 'none';
        cart = {}; // Clear cart if no user
        updateCartDisplay();
    }
});

async function loadUserProfile(userId) {
    const userRef = ref(database, `users/${userId}`);
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.name) {
            userDisplayName.textContent = userData.name;
        }
    }, {
        onlyOnce: true
    });
}


async function handleLogin() {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    loginErrorMessage.textContent = ''; // Clear previous errors

    if (!email || !password) {
        loginErrorMessage.textContent = 'Please enter both email and password.';
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showCustomAlert('Success', 'Logged in successfully!');
        // UI update handled by onAuthStateChanged
    } catch (error) {
        console.error("Login failed:", error);
        switch (error.code) {
            case 'auth/invalid-email':
                loginErrorMessage.textContent = 'Invalid email address format.';
                break;
            case 'auth/user-disabled':
                loginErrorMessage.textContent = 'Your account has been disabled.';
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                loginErrorMessage.textContent = 'Invalid email or password.';
                break;
            case 'auth/too-many-requests':
                loginErrorMessage.textContent = 'Too many login attempts. Please try again later.';
                break;
            default:
                loginErrorMessage.textContent = 'Login failed. Please check your credentials.';
                break;
        }
    }
}

async function handleSignup() {
    const name = signupNameInput.value;
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    signupErrorMessage.textContent = ''; // Clear previous errors

    if (!name || !email || !password) {
        signupErrorMessage.textContent = 'Please fill in all fields.';
        return;
    }

    if (password.length < 6) {
        signupErrorMessage.textContent = 'Password should be at least 6 characters.';
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Save user's name to the database
        await set(ref(database, 'users/' + user.uid), {
            name: name,
            email: email,
            createdAt: serverTimestamp()
        });
        showCustomAlert('Success', 'Account created successfully! You are now logged in.');
        // UI update handled by onAuthStateChanged
    } catch (error) {
        console.error("Signup failed:", error);
        switch (error.code) {
            case 'auth/email-already-in-use':
                signupErrorMessage.textContent = 'Email already in use. Please use a different email or login.';
                break;
            case 'auth/invalid-email':
                signupErrorMessage.textContent = 'Invalid email address format.';
                break;
            case 'auth/weak-password':
                signupErrorMessage.textContent = 'Password is too weak. Please choose a stronger password.';
                break;
            default:
                signupErrorMessage.textContent = 'Signup failed. Please try again.';
                break;
        }
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showCustomAlert('Success', 'Logged out successfully!');
        // UI update handled by onAuthStateChanged
        showSection('hero-section'); // Redirect to hero section after logout
    } catch (error) {
        console.error("Logout failed:", error);
        showCustomAlert('Error', 'Logout failed. Please try again.');
    }
}

// --- Product Listing and Filtering ---
function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        products = [];
        snapshot.forEach((childSnapshot) => {
            products.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        renderProducts(products);
        loadCategories(); // Ensure categories are loaded after products
    });
}

function loadCategories() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        categories = {};
        categoryFilters.innerHTML = '<a href="#" data-category="all" class="category-link active">All Products</a>'; // Reset and add "All"
        snapshot.forEach((childSnapshot) => {
            const category = childSnapshot.val();
            categories[childSnapshot.key] = category.name;
            const categoryLink = document.createElement('a');
            categoryLink.href = '#';
            categoryLink.dataset.category = childSnapshot.key;
            categoryLink.classList.add('category-link');
            categoryLink.textContent = category.name;
            categoryFilters.appendChild(categoryLink);
        });
        addCategoryFilterListeners();
    });
}

function renderProducts(productsToRender) {
    productGrid.innerHTML = ''; // Clear existing products

    if (productsToRender.length === 0) {
        productGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--color-medium-gray);">No products found.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.productId = product.id; // Store product ID

        const categoryName = categories[product.category] || 'Uncategorized'; // Get category name

        productCard.innerHTML = `
            <img src="${(product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : 'https://via.placeholder.com/150'}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="product-category">${categoryName}</p>
            <p class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</p>
            <div class="product-card-rating" data-product-id="${product.id}">
                ${generateStarRating(product.averageRating)}
            </div>
            <button class="add-to-cart-btn primary-button" data-product-id="${product.id}">Add to Cart</button>
        `;
        productCard.querySelector('img').addEventListener('click', () => showProductModal(product.id));
        productCard.querySelector('h3').addEventListener('click', () => showProductModal(product.id));
        productGrid.appendChild(productCard);
    });
    addAddToCartListeners();
}

function generateStarRating(averageRating) {
    const fullStars = Math.floor(averageRating);
    const halfStar = averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    return starsHtml;
}


function addCategoryFilterListeners() {
    document.querySelectorAll('.category-link').forEach(link => {
        link.removeEventListener('click', handleCategoryFilter); // Prevent duplicate listeners
        link.addEventListener('click', handleCategoryFilter);
    });
}

function handleCategoryFilter(event) {
    event.preventDefault();
    document.querySelectorAll('.category-link').forEach(link => link.classList.remove('active'));
    event.target.classList.add('active');

    const category = event.target.dataset.category;
    filterAndSortProducts(searchInput.value, category, sortSelect.value);
}

function handleSearchAndSort() {
    const searchTerm = searchInput.value;
    const activeCategory = document.querySelector('.category-link.active').dataset.category;
    const sortBy = sortSelect.value;
    filterAndSortProducts(searchTerm, activeCategory, sortBy);
}

function filterAndSortProducts(searchTerm, category, sortBy) {
    let filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              product.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = category === 'all' || product.category === category;
        return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        default:
            // No specific sort, maintain original order or Firebase's default
            break;
    }
    renderProducts(filteredProducts);
}

// --- Product Modal ---
async function showProductModal(productId) {
    selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) return;

    modalProductTitle.textContent = selectedProduct.title;
    modalProductPrice.textContent = `$${selectedProduct.price ? selectedProduct.price.toFixed(2) : '0.00'}`;
    modalProductDescription.textContent = selectedProduct.description;
    modalProductStock.textContent = `Stock: ${selectedProduct.stock || 0}`;

    // Display image gallery
    modalImageThumbnails.innerHTML = '';
    if (selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0) {
        modalProductImage.src = selectedProduct.imageUrls[0]; // Set first image as main
        selectedProduct.imageUrls.forEach(url => {
            const thumb = document.createElement('img');
            thumb.src = url;
            thumb.classList.add('thumbnail');
            thumb.addEventListener('click', () => modalProductImage.src = url);
            modalImageThumbnails.appendChild(thumb);
        });
    } else {
        modalProductImage.src = 'https://via.placeholder.com/300';
    }


    // Display video if available
    if (selectedProduct.videoUrl) {
        modalProductVideoContainer.style.display = 'block';
        // Extract YouTube video ID if it's a YouTube URL
        let videoId = '';
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|\/channels\/[^/]+\/|\/watch\?v=|embed\/|v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = selectedProduct.videoUrl.match(youtubeRegex);
        if (match && match[1]) {
            videoId = match[1];
            modalProductVideo.src = `https://www.youtube.com/embed/${videoId}`;
        } else {
            // Assume direct video URL if not YouTube (e.g., MP4, though typically for embedding it's YouTube/Vimeo)
            modalProductVideo.src = selectedProduct.videoUrl;
        }

    } else {
        modalProductVideoContainer.style.display = 'none';
        modalProductVideo.src = ''; // Clear src
    }

    // Update rating stars in modal
    const ratingsRef = ref(database, `ratings/${selectedProduct.id}`);
    get(ratingsRef).then((snapshot) => {
        const productRatings = snapshot.val();
        let totalRating = 0;
        let ratingCount = 0;
        if (productRatings) {
            Object.values(productRatings).forEach(rating => {
                totalRating += rating.rating;
                ratingCount++;
            });
        }
        const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
        modalProductRating.innerHTML = generateStarRating(averageRating);
    });

    productModal.classList.add('show');
}

function closeProductModal() {
    productModal.classList.remove('show');
    modalProductVideo.src = ''; // Stop video playback
    selectedProduct = null;
}

// --- Cart Functionality ---
function addAddToCartListeners() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.onclick = (event) => {
            const productId = event.target.dataset.productId;
            addToCart(productId, 1);
        };
    });
}

function loadCart() {
    if (!currentUser) return;
    const cartRef = ref(database, `carts/${currentUser.uid}`);
    onValue(cartRef, (snapshot) => {
        cart = snapshot.val() || {};
        updateCartDisplay();
    });
}

async function addToCart(productId, quantity) {
    if (!currentUser) {
        showCustomAlert('Login Required', 'Please login to add items to your cart.');
        showSection('auth-section');
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
        showCustomAlert('Error', 'Product not found.');
        return;
    }

    if (product.stock === 0) {
        showCustomAlert('Out of Stock', `${product.title} is currently out of stock.`);
        return;
    }

    if (cart[productId]) {
        cart[productId].quantity += quantity;
    } else {
        cart[productId] = {
            title: product.title,
            price: product.price,
            imageUrl: (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : 'https://via.placeholder.com/150',
            quantity: quantity,
            stock: product.stock // Store original stock to prevent overselling
        };
    }

    // Prevent adding more than available stock
    if (cart[productId].quantity > product.stock) {
        cart[productId].quantity = product.stock;
        showCustomAlert('Limit Reached', `You can only add up to ${product.stock} of ${product.title}.`);
    }

    await set(ref(database, `carts/${currentUser.uid}`), cart);
    showCustomAlert('Added to Cart', `${product.title} added to your cart.`);
    updateCartDisplay();
}

async function removeFromCart(productId) {
    if (!currentUser) return;
    delete cart[productId];
    await set(ref(database, `carts/${currentUser.uid}`), cart);
    updateCartDisplay();
}

async function updateCartItemQuantity(productId, newQuantity) {
    if (!currentUser) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    if (newQuantity > product.stock) {
        newQuantity = product.stock;
        showCustomAlert('Limit Reached', `You can only add up to ${product.stock} of ${product.title}.`);
    }

    cart[productId].quantity = newQuantity;
    await set(ref(database, `carts/${currentUser.uid}`), cart);
    updateCartDisplay();
}


function updateCartDisplay() {
    let totalItems = 0;
    let totalPrice = 0;
    cartItemsContainer.innerHTML = '';

    for (const productId in cart) {
        const item = cart[productId];
        totalItems += item.quantity;
        totalPrice += item.quantity * item.price;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.title}">
            <div class="cart-item-info">
                <h4>${item.title}</h4>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                <div class="cart-item-quantity-control">
                    <button class="quantity-minus" data-product-id="${productId}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-plus" data-product-id="${productId}">+</button>
                </div>
            </div>
            <button class="remove-from-cart-btn" data-product-id="${productId}"><i class="fas fa-trash"></i></button>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    }

    cartCountSpan.textContent = totalItems;
    cartTotalSpan.textContent = `$${totalPrice.toFixed(2)}`;

    // Add/remove "empty cart" message
    if (totalItems === 0) {
        emptyCartMessage.style.display = 'block';
        checkoutButton.style.display = 'none';
    } else {
        emptyCartMessage.style.display = 'none';
        checkoutButton.style.display = 'block';
    }

    // Add listeners for quantity controls and remove buttons
    document.querySelectorAll('.quantity-minus').forEach(button => {
        button.onclick = (e) => {
            const productId = e.target.dataset.productId;
            const currentQuantity = cart[productId].quantity;
            updateCartItemQuantity(productId, currentQuantity - 1);
        };
    });

    document.querySelectorAll('.quantity-plus').forEach(button => {
        button.onclick = (e) => {
            const productId = e.target.dataset.productId;
            const currentQuantity = cart[productId].quantity;
            updateCartItemQuantity(productId, currentQuantity + 1);
        };
    });

    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.onclick = (e) => {
            const productId = e.target.dataset.productId;
            removeFromCart(productId);
        };
    });
}

// --- Checkout Functionality ---
function showCheckout(productForDirectBuy = null) {
    if (!currentUser) {
        showCustomAlert('Login Required', 'Please login to proceed to checkout.');
        showSection('auth-section');
        return;
    }

    checkoutOrderSummary.innerHTML = '';
    let totalForCheckout = 0;

    if (productForDirectBuy) {
        // Direct buy scenario
        selectedProduct = productForDirectBuy; // Store for order placement
        orderQuantityInput.value = 1; // Reset quantity for direct buy
        checkoutOrderSummary.innerHTML = `
            <div class="checkout-product-item">
                <img src="${(selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0) ? selectedProduct.imageUrls[0] : 'https://via.placeholder.com/150'}" alt="${selectedProduct.title}">
                <div>
                    <h4>${selectedProduct.title}</h4>
                    <p>$${selectedProduct.price.toFixed(2)}</p>
                </div>
            </div>
        `;
        totalForCheckout = selectedProduct.price;
        orderQuantityInput.max = selectedProduct.stock; // Set max quantity based on stock
    } else {
        // Cart checkout scenario
        if (Object.keys(cart).length === 0) {
            showCustomAlert('Empty Cart', 'Your cart is empty. Add items before checking out.');
            showSection('products-section'); // Go back to products
            return;
        }
        selectedProduct = null; // Clear selectedProduct for cart checkout
        orderQuantityInput.value = 1; // Reset quantity input
        orderQuantityInput.max = 99999; // No specific max for cart, stock check during order

        for (const productId in cart) {
            const item = cart[productId];
            checkoutOrderSummary.innerHTML += `
                <div class="checkout-product-item">
                    <img src="${item.imageUrl}" alt="${item.title}">
                    <div>
                        <h4>${item.title}</h4>
                        <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
                    </div>
                </div>
            `;
            totalForCheckout += item.price * item.quantity;
        }
    }

    // Prefill user details if available
    const userRef = ref(database, `users/${currentUser.uid}`);
    get(userRef).then((snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            customerNameInput.value = userData.name || '';
            customerAddressInput.value = userData.address || '';
            customerPhoneInput.value = userData.phone || '';
        }
    });

    updateOrderTotalPrice(); // Calculate initial total
    showSection('checkout-section');
}

function updateOrderTotalPrice() {
    let quantity = parseInt(orderQuantityInput.value);
    if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
        orderQuantityInput.value = 1;
    }

    if (selectedProduct) { // Direct buy
        if (quantity > selectedProduct.stock) {
            quantity = selectedProduct.stock;
            orderQuantityInput.value = quantity;
            showCustomAlert('Limit Reached', `Maximum quantity for ${selectedProduct.title} is ${selectedProduct.stock}.`);
        }
        orderTotalPriceSpan.textContent = `$${(selectedProduct.price * quantity).toFixed(2)}`;
    } else { // Cart checkout
        let total = 0;
        for (const productId in cart) {
            total += cart[productId].price * cart[productId].quantity;
        }
        orderTotalPriceSpan.textContent = `$${total.toFixed(2)}`;
        // Quantity input is largely irrelevant for cart checkout, it's just for display.
        // The actual quantities come from the 'cart' object.
    }
}


async function placeOrder(event) {
    event.preventDefault();

    if (!currentUser) {
        showCustomAlert('Login Required', 'Please login to place an order.');
        showSection('auth-section');
        return;
    }

    const customerName = customerNameInput.value.trim();
    const customerAddress = customerAddressInput.value.trim();
    const customerPhone = customerPhoneInput.value.trim();
    const customerNotes = customerNotesInput.value.trim();

    if (!customerName || !customerAddress || !customerPhone) {
        showCustomAlert('Missing Information', 'Please fill in all required delivery information (Name, Address, Phone).');
        return;
    }

    let orderItems = [];
    let orderTotal = 0;
    let productsToUpdateStock = {}; // To store productIds and their decremented stock

    if (selectedProduct) { // Direct buy
        const quantity = parseInt(orderQuantityInput.value);
        if (isNaN(quantity) || quantity < 1 || quantity > selectedProduct.stock) {
            showCustomAlert('Invalid Quantity', `Please enter a valid quantity for ${selectedProduct.title}. Max stock: ${selectedProduct.stock}`);
            return;
        }
        orderItems.push({
            productId: selectedProduct.id,
            title: selectedProduct.title,
            price: selectedProduct.price,
            quantity: quantity,
            imageUrl: (selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0) ? selectedProduct.imageUrls[0] : 'https://via.placeholder.com/150'
        });
        orderTotal = selectedProduct.price * quantity;
        productsToUpdateStock[selectedProduct.id] = selectedProduct.stock - quantity;

    } else { // Cart checkout
        if (Object.keys(cart).length === 0) {
            showCustomAlert('Empty Cart', 'Your cart is empty. Add items before placing an order.');
            showSection('products-section');
            return;
        }

        for (const productId in cart) {
            const item = cart[productId];
            const productInDB = products.find(p => p.id === productId); // Get latest stock
            if (!productInDB || item.quantity > productInDB.stock) {
                showCustomAlert('Stock Error', `Not enough stock for "${item.title}". Available: ${productInDB ? productInDB.stock : 0}. Please adjust your cart.`);
                return; // Stop the order if stock is insufficient
            }
            orderItems.push({
                productId: productId,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl
            });
            orderTotal += item.price * item.quantity;
            productsToUpdateStock[productId] = productInDB.stock - item.quantity;
        }
    }

    const orderData = {
        userId: currentUser.uid,
        customerName: customerName,
        customerEmail: currentUser.email,
        customerAddress: customerAddress,
        customerPhone: customerPhone,
        customerNotes: customerNotes,
        items: orderItems,
        totalAmount: orderTotal,
        orderDate: serverTimestamp(),
        status: 'Pending' // Initial status
    };

    try {
        // Push order to 'orders' node
        const newOrderRef = push(ref(database, 'orders'));
        await set(newOrderRef, orderData);

        // Update product stock and clear cart in a single transaction/batch if possible, or sequentially
        const updates = {};
        for (const productId in productsToUpdateStock) {
            updates[`products/${productId}/stock`] = productsToUpdateStock[productId];
        }

        if (selectedProduct) { // Clear selected product for direct buy
            selectedProduct = null;
        } else { // Clear cart after successful cart checkout
            updates[`carts/${currentUser.uid}`] = null; // Remove the entire cart for the user
        }

        await update(ref(database), updates);

        showCustomAlert('Order Placed!', `Your order has been placed successfully! Order total: $${orderTotal.toFixed(2)}`);
        placeOrderForm.reset(); // Clear form
        showSection('products-section'); // Go back to product listing
    } catch (error) {
        console.error("Error placing order:", error);
        showCustomAlert('Order Failed', 'There was an error placing your order. Please try again.');
    }
}

// --- Order History ---
function loadOrderHistory() {
    if (!currentUser) {
        orderHistoryList.innerHTML = '';
        emptyOrderHistoryMessage.style.display = 'block';
        return;
    }

    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        orderHistoryList.innerHTML = '';
        const orders = [];
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (order.userId === currentUser.uid) { // Filter orders by current user
                orders.push({ id: childSnapshot.key, ...order });
            }
        });

        if (orders.length === 0) {
            emptyOrderHistoryMessage.style.display = 'block';
        } else {
            emptyOrderHistoryMessage.style.display = 'none';
            // Sort by order date, newest first
            orders.sort((a, b) => (b.orderDate || 0) - (a.orderDate || 0));
            orders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.classList.add('order-history-item');

                const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
                let itemsHtml = order.items.map(item => `
                    <div class="order-item-detail">
                        <img src="${item.imageUrl}" alt="${item.title}">
                        <span>${item.title} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('');

                orderDiv.innerHTML = `
                    <h3>Order ID: ${order.id}</h3>
                    <p><strong>Date:</strong> ${orderDate}</p>
                    <p><strong>Status:</strong> <span class="order-status">${order.status}</span></p>
                    <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
                    <div class="order-items-summary">
                        <h4>Items:</h4>
                        ${itemsHtml}
                    </div>
                `;
                orderHistoryList.appendChild(orderDiv);
            });
        }
    });
}

// --- Product Rating ---
function showRatingModal() {
    if (!currentUser) {
        showCustomAlert('Login Required', 'Please login to rate products.');
        showSection('auth-section');
        return;
    }
    if (!selectedProduct) {
        showCustomAlert('Error', 'No product selected for rating.');
        return;
    }

    ratingProductName.textContent = selectedProduct.title;
    selectedRating = 0; // Reset selected rating
    ratingCommentInput.value = ''; // Clear comment
    updateRatingStars();
    ratingModal.classList.add('show');

    // Pre-fill existing rating if available
    const userRatingRef = ref(database, `ratings/${selectedProduct.id}/${currentUser.uid}`);
    get(userRatingRef).then((snapshot) => {
        const existingRating = snapshot.val();
        if (existingRating) {
            selectedRating = existingRating.rating;
            ratingCommentInput.value = existingRating.comment || '';
            updateRatingStars();
        }
    }).catch(error => {
        console.error("Error fetching existing rating:", error);
    });
}

function closeRatingModal() {
    ratingModal.classList.remove('show');
}

function updateRatingStars() {
    ratingStarsContainer.querySelectorAll('.fa-star').forEach(star => {
        const rating = parseInt(star.dataset.rating);
        if (rating <= selectedRating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

async function submitProductRating() {
    if (!currentUser) {
        showCustomAlert('Login Required', 'Please login to submit a rating.');
        return;
    }
    if (!selectedProduct) {
        showCustomAlert('Error', 'No product selected for rating.');
        return;
    }
    if (selectedRating === 0) {
        showCustomAlert('Missing Rating', 'Please select a star rating.');
        return;
    }

    const comment = ratingCommentInput.value.trim();
    const ratingData = {
        rating: selectedRating,
        comment: comment,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        timestamp: serverTimestamp()
    };

    try {
        await set(ref(database, `ratings/${selectedProduct.id}/${currentUser.uid}`), ratingData);
        showCustomAlert('Rating Submitted', 'Thank you for your rating!');
        closeRatingModal();
        // Optionally, re-render product card or modal to show updated average rating
        // For simplicity, we just close the modal. Average is calculated in admin.
    } catch (error) {
        console.error("Error submitting rating:", error);
        showCustomAlert('Error', 'Failed to submit rating. Please try again.');
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial view based on auth state (handled by onAuthStateChanged)
    // If not logged in, show hero section by default
    if (!currentUser) {
        showSection('hero-section');
    }

    // Auth Section
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.style.display = 'none';
            signupContainer.style.display = 'block';
        });
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.style.display = 'block';
            signupContainer.style.display = 'none';
        });
    }
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }
    if (signupButton) {
        signupButton.addEventListener('click', handleSignup);
    }
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
    if (document.getElementById('login-link')) {
        document.getElementById('login-link').addEventListener('click', (e) => {
            e.preventDefault();
            showSection('auth-section');
            loginContainer.style.display = 'block';
            signupContainer.style.display = 'none';
        });
    }
    if (document.getElementById('signup-link')) {
        document.getElementById('signup-link').addEventListener('click', (e) => {
            e.preventDefault();
            showSection('auth-section');
            loginContainer.style.display = 'none';
            signupContainer.style.display = 'block';
        });
    }

    // Navigation and Search
    if (searchButton) {
        searchButton.addEventListener('click', handleSearchAndSort);
    }
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchAndSort);
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSearchAndSort);
    }

    // Product Modal
    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', closeProductModal);
    }
    if (productModal) {
        productModal.addEventListener('click', (event) => {
            if (event.target === productModal) { // Clicked outside the modal content
                closeProductModal();
            }
        });
    }

    // Cart and Checkout
    if (cartButton) {
        cartButton.addEventListener('click', () => showSection('cart-section'));
    }
    if (addToCartModalBtn) {
        addToCartModalBtn.addEventListener('click', () => {
            if (selectedProduct) {
                addToCart(selectedProduct.id, 1);
                closeProductModal();
            }
        });
    }
    if (buyNowModalBtn) {
        buyNowModalBtn.addEventListener('click', () => {
            if (selectedProduct) {
                showCheckout(selectedProduct);
                closeProductModal();
            }
        });
    }
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => showCheckout());
    }

    // Order History
    if (orderHistoryLink) {
        orderHistoryLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('order-history-section');
            loadOrderHistory(); // Load orders when section is shown
            // Close dropdown after clicking
            const dropdownContent = e.target.closest('.dropdown-container').querySelector('.dropdown-content');
            if (dropdownContent) dropdownContent.classList.remove('show');
        });
    }
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
    if (placeOrderForm) {
        placeOrderForm.addEventListener('submit', placeOrder);
    }
    if (orderQuantityInput) {
        orderQuantityInput.addEventListener('input', updateOrderTotalPrice);
    }
    
    // About Us Link
    if (aboutUsLink) {
        aboutUsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('about-us-section');
        });
    }

    loadProducts(); // Initial load of products
});
