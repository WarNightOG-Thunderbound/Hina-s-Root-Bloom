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
  appId: "1:967448486557:web:2c77a83709b6ffb40097a8",
  measurementId: "G-CM67R9X13G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);


// --- DOM Elements ---
const authModal = document.getElementById('auth-modal');
const closeAuthModalButtons = authModal ? authModal.querySelectorAll('.close-button') : [];
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authModalTitle = document.getElementById('auth-modal-title');
const toggleAuthMode = document.getElementById('toggle-auth-mode');
const loginSignupBtn = document.getElementById('login-signup-btn');
const userProfileSection = document.getElementById('user-profile-section');
const welcomeMessage = document.getElementById('welcome-message');
const logoutBtn = document.getElementById('logout-btn');

const productGrid = document.getElementById('product-grid');
const productModal = document.getElementById('product-modal');
const closeProductModalButtons = productModal ? productModal.querySelectorAll('.close-button') : [];
const modalProductImage = document.getElementById('modal-product-image');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductVideo = document.getElementById('modal-product-video');
const addProductToCartBtn = document.getElementById('add-to-cart-modal-btn');
const placeOrderModalBtn = document.getElementById('place-order-modal-btn');
const rateProductBtn = document.getElementById('rate-product-btn');

const cartIcon = document.getElementById('cart-icon');
const cartCountSpan = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const closeCartModalButtons = cartModal ? cartModal.querySelectorAll('.close-button') : [];
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const orderHistorySection = document.getElementById('order-history-section');
const toggleOrderHistoryBtn = document.getElementById('toggle-order-history-btn');
const orderHistoryList = document.getElementById('order-history-list');

const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.getElementById('close-rating-modal');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const submitRatingButton = document.getElementById('submit-rating-btn');
const modalAvgRating = document.getElementById('modal-avg-rating');
const modalRatingStarsDisplay = document.getElementById('modal-rating-stars-display');
const modalRatingCount = document.getElementById('modal-rating-count');

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const categoryFiltersContainer = document.getElementById('category-filters');
const sortSelect = document.getElementById('sort-select');

// New Order Form Elements
const orderFormModal = document.getElementById('order-form-modal');
const closeOrderFormModalBtn = document.getElementById('close-order-form-modal');
const orderDetailsForm = document.getElementById('order-details-form');
const orderAddressInput = document.getElementById('order-address');
const orderPhoneInput = document.getElementById('order-phone');
const finishOrderBtn = document.getElementById('finish-order-btn');


// --- Global Variables ---
let currentAuthMode = 'login'; // 'login' or 'signup'
let products = []; // To store fetched products
let cart = []; // To store cart items
let currentProduct = null; // To store the product currently viewed in modal
let selectedRating = 0; // To store the rating selected by the user
let currentUser = null; // To store the current authenticated user

// --- Utility Functions ---
function showCustomAlert(title, message, isConfirm = false, onOk = null, onCancel = null) {
    const customModal = document.getElementById('custom-alert-modal');
    const customModalTitle = document.getElementById('custom-modal-title');
    const customModalMessage = document.getElementById('custom-modal-message');
    const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
    const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');

    if (!customModal || !customModalTitle || !customModalMessage || !customModalOkBtn || !customModalCancelBtn) {
        console.error("Custom alert modal elements not found.");
        alert(`${title}: ${message}`); // Fallback to browser alert
        return;
    }

    customModalTitle.textContent = title;
    customModalMessage.textContent = message;

    customModalOkBtn.onclick = () => {
        customModal.style.display = 'none';
        if (onOk) onOk();
    };

    if (isConfirm) {
        customModalCancelBtn.style.display = 'inline-block';
        customModalCancelBtn.onclick = () => {
            customModal.style.display = 'none';
            if (onCancel) onCancel();
        };
    } else {
        customModalCancelBtn.style.display = 'none';
    }

    customModal.style.display = 'flex'; // Use flex to center
}

// --- Authentication ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        loginSignupBtn.style.display = 'none';
        userProfileSection.style.display = 'flex';
        welcomeMessage.textContent = `Welcome, ${user.email}!`;
        // Load cart and order history for the logged-in user
        loadCart();
        loadOrderHistory(); // Load initially if user is logged in
    } else {
        loginSignupBtn.style.display = 'block';
        userProfileSection.style.display = 'none';
        welcomeMessage.textContent = '';
        cart = []; // Clear cart on logout
        updateCartCount();
        cartItemsContainer.innerHTML = ''; // Clear cart display
        cartTotalSpan.textContent = '0.00';
        orderHistoryList.innerHTML = ''; // Clear order history display
        orderHistorySection.style.display = 'none'; // Hide order history
        toggleOrderHistoryBtn.textContent = 'Show Order History';
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmailInput.value;
    const password = authPasswordInput.value;

    try {
        if (currentAuthMode === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
            showCustomAlert('Success', 'Logged in successfully!');
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
            showCustomAlert('Success', 'Account created and logged in successfully!');
        }
        authModal.style.display = 'none'; // Close modal on success
        authForm.reset(); // Clear form
    } catch (error) {
        showCustomAlert('Error', error.message);
    }
});

loginSignupBtn.addEventListener('click', () => {
    authModal.style.display = 'block';
    authModalTitle.textContent = 'Login';
    authSubmitBtn.textContent = 'Login';
    toggleAuthMode.innerHTML = `Don't have an account? <span class="link" data-mode="signup">Sign Up</span>`;
    currentAuthMode = 'login';
});

toggleAuthMode.addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
        const mode = e.target.dataset.mode;
        if (mode === 'signup') {
            authModalTitle.textContent = 'Sign Up';
            authSubmitBtn.textContent = 'Sign Up';
            toggleAuthMode.innerHTML = `Already have an account? <span class="link" data-mode="login">Login</span>`;
            currentAuthMode = 'signup';
        } else {
            authModalTitle.textContent = 'Login';
            authSubmitBtn.textContent = 'Login';
            toggleAuthMode.innerHTML = `Don't have an account? <span class="link" data-mode="signup">Sign Up</span>`;
            currentAuthMode = 'login';
        }
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showCustomAlert('Success', 'Logged out successfully!');
    } catch (error) {
        showCustomAlert('Error', error.message);
    }
});

// --- Product Listing ---
function fetchProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        products = [];
        if (data) {
            for (let id in data) {
                products.push({ id, ...data[id] });
            }
        }
        displayProducts(products); // Initial display
        populateCategoryFilters(); // Populate categories based on fetched products
    }, (error) => {
        showCustomAlert('Error', 'Failed to fetch products: ' + error.message);
    });
}

function populateCategoryFilters() {
    if (!categoryFiltersContainer) {
        console.error("Category filters container not found.");
        return;
    }
    categoryFiltersContainer.innerHTML = ''; // Clear existing buttons
    const allButton = document.createElement('button');
    allButton.classList.add('category-button', 'active');
    allButton.dataset.category = 'all';
    allButton.textContent = 'All';
    categoryFiltersContainer.appendChild(allButton);

    const categories = new Set(products.map(p => p.category).filter(Boolean)); // Get unique categories
    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('category-button');
        button.dataset.category = category;
        button.textContent = category;
        categoryFiltersContainer.appendChild(button);
    });
}

function displayProducts(productsToDisplay) {
    if (!productGrid) {
        console.error("Product grid container not found.");
        return;
    }
    productGrid.innerHTML = ''; // Clear existing products
    if (productsToDisplay.length === 0) {
        productGrid.innerHTML = '<p>No products found.</p>';
        return;
    }

    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.id = product.id; // Store product ID

        const ratingHTML = getStarRatingHTML(product.averageRating);

        productCard.innerHTML = `
            <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p>${product.description.substring(0, 70)}...</p>
            <div class="product-card-rating">
                ${ratingHTML} (${product.ratingCount || 0})
            </div>
            <p class="price">$${product.price ? product.price.toFixed(2) : 'N/A'}</p>
            <button class="button secondary view-detail-btn">View Detail</button>
            <button class="button primary add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
        `;
        productGrid.appendChild(productCard);
    });
}

function getStarRatingHTML(averageRating) {
    let ratingHTML = '';
    const fullStars = Math.floor(averageRating);
    const halfStar = averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
        ratingHTML += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        ratingHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        ratingHTML += '<i class="far fa-star"></i>';
    }
    return ratingHTML;
}


// --- Search and Filter ---
searchInput.addEventListener('input', applyFiltersAndSort);
searchButton.addEventListener('click', applyFiltersAndSort);

if (categoryFiltersContainer) {
    categoryFiltersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-button')) {
            // Remove 'active' from all buttons
            categoryFiltersContainer.querySelectorAll('.category-button').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add 'active' to the clicked button
            e.target.classList.add('active');
            applyFiltersAndSort();
        }
    });
}

if (sortSelect) {
    sortSelect.addEventListener('change', applyFiltersAndSort);
}

function applyFiltersAndSort() {
    let filteredProducts = [...products];

    // Search Filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            (product.category && product.category.toLowerCase().includes(searchTerm))
        );
    }

    // Category Filter
    const activeCategoryButton = document.querySelector('.category-button.active');
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'all';

    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

    // Sorting
    const sortBy = sortSelect.value;
    switch (sortBy) {
        case 'price-asc':
            filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'rating-desc':
            filteredProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            break;
        default:
            // No sorting or default order
            break;
    }

    displayProducts(filteredProducts);
}


// --- Product Details Modal ---
if (productGrid) {
    productGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-detail-btn')) {
            const productId = e.target.closest('.product-card').dataset.id;
            const product = products.find(p => p.id === productId);
            if (product) {
                currentProduct = product; // Set current product for modal actions
                showProductDetails(product);
            }
        } else if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = e.target.dataset.productId;
            const productToAdd = products.find(p => p.id === productId);
            if (productToAdd) {
                addToCart(productToAdd);
            }
        }
    });
}


function showProductDetails(product) {
    if (!productModal) {
        console.error("Product modal not found.");
        return;
    }
    modalProductImage.src = product.imageUrl || 'https://via.placeholder.com/300';
    modalProductTitle.textContent = product.title;
    modalProductDescription.textContent = product.description;
    modalProductPrice.textContent = product.price ? product.price.toFixed(2) : 'N/A';

    // Video display
    if (product.videoUrl) {
        modalProductVideo.style.display = 'block';
        modalProductVideo.querySelector('iframe').src = product.videoUrl.replace("watch?v=", "embed/");
        modalProductVideo.querySelector('iframe').setAttribute('allowfullscreen', '');
    } else {
        modalProductVideo.style.display = 'none';
        modalProductVideo.querySelector('iframe').src = ''; // Clear existing video
    }

    // Display product ratings
    updateProductRatingDisplay(product.id, product.averageRating, product.ratingCount);

    productModal.style.display = 'block';
}

if (addProductToCartBtn) {
    addProductToCartBtn.addEventListener('click', () => {
        if (currentProduct) {
            addToCart(currentProduct);
            productModal.style.display = 'none'; // Close modal after adding to cart
        }
    });
}

if (placeOrderModalBtn) {
    placeOrderModalBtn.addEventListener('click', () => {
        if (!currentUser) {
            showCustomAlert('Authentication Required', 'Please log in to place an order.');
            return;
        }
        if (currentProduct) {
            productModal.style.display = 'none'; // Close product detail modal
            openOrderFormModal(); // Open the new order form modal
        }
    });
}

// --- Order Form Modal Functions ---
function openOrderFormModal() {
    if (orderFormModal) {
        orderFormModal.style.display = 'block';
        orderDetailsForm.reset(); // Clear any previous input
    }
}

if (closeOrderFormModalBtn) {
    closeOrderFormModalBtn.addEventListener('click', () => {
        if (orderFormModal) {
            orderFormModal.style.display = 'none';
        }
    });
}

if (orderDetailsForm) {
    orderDetailsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        placeOrder();
    });
}

async function placeOrder() {
    if (!currentUser || !currentProduct) {
        showCustomAlert('Error', 'Cannot place order. Please ensure you are logged in and have selected a product.');
        return;
    }

    const address = orderAddressInput.value.trim();
    const phoneNumber = orderPhoneInput.value.trim();

    if (!address || !phoneNumber) {
        showCustomAlert('Missing Information', 'Please provide your delivery address and phone number.');
        return;
    }

    try {
        const ordersRef = ref(database, 'orders');
        const newOrderRef = push(ordersRef); // Generates a unique key for the new order
        const orderData = {
            productId: currentProduct.id,
            productTitle: currentProduct.title,
            productPrice: currentProduct.price,
            productImageUrl: currentProduct.imageUrl || '',
            userId: currentUser.uid,
            userEmail: currentUser.email,
            deliveryAddress: address,
            phoneNumber: phoneNumber,
            orderTime: serverTimestamp() // Firebase server timestamp
        };
        await set(newOrderRef, orderData);
        showCustomAlert('Order Placed!', 'Your order has been placed successfully. We will contact you soon!', false, () => {
            if (orderFormModal) orderFormModal.style.display = 'none'; // Close the order form modal
            if (productModal) productModal.style.display = 'none'; // Also close product detail modal if it's still open
        });
        // Optionally add the order to the local order history array and re-display
        loadOrderHistory(); // Refresh order history
    } catch (error) {
        showCustomAlert('Order Error', 'Failed to place order: ' + error.message);
    }
}


// --- Cart Functionality ---
function addToCart(product) {
    if (!currentUser) {
        showCustomAlert('Authentication Required', 'Please log in to add items to your cart.');
        return;
    }

    const cartItem = cart.find(item => item.productId === product.id);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({
            productId: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: 1
        });
    }
    saveCart();
    showCustomAlert('Added to Cart', `${product.title} has been added to your cart.`);
}

function saveCart() {
    if (currentUser) {
        set(ref(database, `users/${currentUser.uid}/cart`), cart);
    }
    updateCartCount();
    renderCartItems(); // Re-render cart display immediately
}

function loadCart() {
    if (currentUser) {
        onValue(ref(database, `users/${currentUser.uid}/cart`), (snapshot) => {
            const data = snapshot.val();
            cart = data ? Object.values(data) : [];
            updateCartCount();
            renderCartItems();
        }, {
            onlyOnce: false // Listen for real-time updates
        });
    }
}

function updateCartCount() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountSpan) {
        cartCountSpan.textContent = totalCount;
    }
}

if (cartIcon) {
    cartIcon.addEventListener('click', () => {
        if (!currentUser) {
            showCustomAlert('Authentication Required', 'Please log in to view your cart.');
            return;
        }
        if (cartModal) {
            cartModal.style.display = 'block';
            renderCartItems();
        }
    });
}

function renderCartItems() {
    if (!cartItemsContainer || !cartTotalSpan) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" alt="${item.title}">
                <span>${item.title}</span>
                <span>$${item.price.toFixed(2)} x ${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                <button class="remove-from-cart-btn" data-product-id="${item.productId}"><i class="fas fa-times"></i></button>
            `;
            cartItemsContainer.appendChild(itemElement);
            total += item.price * item.quantity;
        });
    }
    cartTotalSpan.textContent = total.toFixed(2);

    // Add event listeners for remove buttons
    cartItemsContainer.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.productId;
            removeFromCart(productId);
        });
    });
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCart();
    showCustomAlert('Removed from Cart', 'Item removed from your cart.');
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showCustomAlert('Cart Empty', 'Your cart is empty. Add some products before checking out.');
            return;
        }
        showCustomAlert('Checkout', 'Proceeding to checkout (this is a placeholder for actual checkout logic).', false, () => {
            // Placeholder for actual checkout logic
            // For now, let's clear the cart after "checkout"
            cart = [];
            saveCart();
            if (cartModal) {
                cartModal.style.display = 'none';
            }
        });
    });
}

// --- Order History ---
function loadOrderHistory() {
    if (!currentUser) {
        orderHistoryList.innerHTML = '<p>Please log in to view your order history.</p>';
        return;
    }

    const userOrdersRef = ref(database, 'orders'); // Listen to all orders for admin functionality. For user-specific history, filter by userId.

    onValue(userOrdersRef, (snapshot) => {
        orderHistoryList.innerHTML = ''; // Clear existing history
        const ordersData = snapshot.val();
        let userOrders = [];

        if (ordersData) {
            for (const orderId in ordersData) {
                const order = ordersData[orderId];
                if (order.userId === currentUser.uid) { // Filter orders for the current user
                    userOrders.push({ id: orderId, ...order });
                }
            }
        }

        if (userOrders.length === 0) {
            orderHistoryList.innerHTML = '<p>You have no past orders.</p>';
            return;
        }

        // Sort orders by time, newest first
        userOrders.sort((a, b) => (b.orderTime || 0) - (a.orderTime || 0));

        userOrders.forEach(order => {
            const orderDate = order.orderTime ? new Date(order.orderTime).toLocaleString() : 'N/A';
            const orderElement = document.createElement('div');
            orderElement.classList.add('order-history-item');
            orderElement.innerHTML = `
                <img src="${order.productImageUrl || 'https://via.placeholder.com/50'}" alt="${order.productTitle}">
                <div>
                    <h4>${order.productTitle}</h4>
                    <p>Price: $${order.productPrice ? order.productPrice.toFixed(2) : 'N/A'}</p>
                    <p>Ordered On: ${orderDate}</p>
                    <p>Address: ${order.deliveryAddress}</p>
                    <p>Phone: ${order.phoneNumber}</p>
                </div>
            `;
            orderHistoryList.appendChild(orderElement);
        });
    }, (error) => {
        showCustomAlert('Error', 'Failed to load order history: ' + error.message);
    });
}

// --- Product Rating ---
if (rateProductBtn) {
    rateProductBtn.addEventListener('click', () => {
        if (!currentUser) {
            showCustomAlert('Authentication Required', 'Please log in to rate a product.');
            return;
        }
        if (currentProduct) {
            openRatingModal();
        }
    });
}

function openRatingModal() {
    if (ratingModal) {
        selectedRating = 0; // Reset rating
        updateRatingStars(); // Clear star display
        ratingModal.style.display = 'block';
    }
}

function closeRatingModal() {
    if (ratingModal) {
        ratingModal.style.display = 'none';
    }
}

function updateRatingStars() {
    if (!ratingStarsContainer) return;
    ratingStarsContainer.querySelectorAll('.fa-star, .fa-star-half-alt').forEach((star, index) => {
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
    if (!currentUser || !currentProduct || selectedRating === 0) {
        showCustomAlert('Error', 'Please log in, select a product, and choose a rating before submitting.');
        return;
    }

    const ratingRef = ref(database, `productRatings/${currentProduct.id}/${currentUser.uid}`);
    try {
        await set(ratingRef, selectedRating);
        showCustomAlert('Rating Submitted', 'Thank you for your rating!', false, () => {
            closeRatingModal();
            // Re-fetch and update product details to reflect new average rating
            fetchProductRatings(currentProduct.id);
        });
    } catch (error) {
        showCustomAlert('Rating Error', 'Failed to submit rating: ' + error.message);
    }
}

function fetchProductRatings(productId) {
    const ratingsRef = ref(database, `productRatings/${productId}`);
    onValue(ratingsRef, (snapshot) => {
        let totalRating = 0;
        let ratingCount = 0;
        snapshot.forEach((childSnapshot) => {
            totalRating += childSnapshot.val();
            ratingCount++;
        });

        const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

        // Update the product object in the 'products' array
        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            products[productIndex].averageRating = averageRating;
            products[productIndex].ratingCount = ratingCount;
        }

        // Update product modal display if it's open for this product
        if (currentProduct && currentProduct.id === productId) {
            updateProductRatingDisplay(productId, averageRating, ratingCount);
        }
        // Also update product grid display
        displayProducts(products); // Re-render all products to show updated ratings
    }, (error) => {
        console.error("Error fetching product ratings: ", error);
        // showCustomAlert('Error', 'Failed to fetch product ratings: ' + error.message);
    });
}

function updateProductRatingDisplay(productId, averageRating, ratingCount) {
    if (modalAvgRating) {
        modalAvgRating.textContent = averageRating.toFixed(1);
    }
    if (modalRatingStarsDisplay) {
        modalRatingStarsDisplay.innerHTML = getStarRatingHTML(averageRating);
    }
    if (modalRatingCount) {
        modalRatingCount.textContent = ratingCount;
    }
}

// --- Initial Data Load ---
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts(); // Load products and initial display
    // Initial check for auth state is handled by onAuthStateChanged
    // No need to call loadCart or loadOrderHistory here, as onAuthStateChanged will trigger it
});

// --- Modal Closers ---
if (authModal) {
    closeAuthModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    });
    window.addEventListener('click', (event) => {
        if (event.target === authModal) {
            authModal.style.display = 'none';
        }
    });
}

if (productModal) {
    closeProductModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            productModal.style.display = 'none';
        });
    });
    window.addEventListener('click', (event) => {
        if (event.target === productModal) {
            productModal.style.display = 'none';
        }
    });
}

if (cartModal) {
    closeCartModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    });
    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
}

// Toggle Order History visibility
if (toggleOrderHistoryBtn) {
    toggleOrderHistoryBtn.addEventListener('click', () => {
        if (orderHistorySection.style.display === 'block') {
            orderHistorySection.style.display = 'none';
            toggleOrderHistoryBtn.textContent = 'Show Order History';
        } else {
            orderHistorySection.style.display = 'block';
            toggleOrderHistoryBtn.textContent = 'Hide Order History';
            loadOrderHistory(); // Load when shown
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

// Close rating modal
if (closeRatingModalBtn) {
    closeRatingModalBtn.addEventListener('click', closeRatingModal);
}
window.addEventListener('click', (event) => {
    if (event.target === ratingModal) {
        closeRatingModal();
    }
});
