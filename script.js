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
  appId: "1:967448486557:web:2c89223921f6479010495f", // <--- IMPORTANT: Replace with your actual Firebase App ID
  measurementId: "G-TT31HC3NZ3" // <--- IMPORTANT: Replace with your actual Firebase Measurement ID (if using Analytics)
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements ---
const homeNavLink = document.getElementById('home-nav-link');
const cartNavLink = document.getElementById('cart-nav-link');
const authNavLink = document.getElementById('auth-nav-link');
const logoutNavItem = document.getElementById('logout-nav-item');
const logoutNavLink = document.getElementById('logout-nav-link');
const adminDashboardNavItem = document.getElementById('admin-dashboard-nav-item');
const adminDashboardLink = document.getElementById('admin-dashboard-link');

const authSection = document.getElementById('auth-section');
const storeSection = document.getElementById('store-section');
const cartSection = document.getElementById('cart-section');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerBtn = document.getElementById('register-btn');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

const searchInput = document.getElementById('search-input');
const categorySelect = document.getElementById('category-select');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');
const productGrid = document.getElementById('product-grid');

const cartItemsContainer = document.getElementById('cart-items');
const cartItemCountSpan = document.getElementById('cart-item-count');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutForm = document.getElementById('checkout-form');
const customerNameInput = document.getElementById('customer-name');
const customerAddressInput = document.getElementById('customer-address');
const customerPhoneInput = document.getElementById('customer-phone');
const confirmOrderBtn = document.getElementById('confirm-order-btn');

const productDetailModal = document.getElementById('product-detail-modal');
const closeProductDetailModalBtn = document.getElementById('close-product-detail-modal');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductVideoContainer = document.getElementById('modal-product-video');
const modalProductVideoIframe = modalProductVideoContainer ? modalProductVideoContainer.querySelector('iframe') : null; // Check for existence
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductBrand = document.getElementById('modal-product-brand');
const modalProductAverageRating = document.getElementById('modal-product-average-rating');
const modalProductRatingCount = document.getElementById('modal-product-rating-count');
const decreaseQuantityBtn = document.getElementById('decrease-quantity');
const productQuantityInput = document.getElementById('product-quantity');
const increaseQuantityBtn = document.getElementById('increase-quantity');
const addToCartBtn = document.getElementById('add-to-cart-btn');
const buyNowBtn = document.getElementById('buy-now-btn');

const ratingStarsContainer = document.getElementById('rating-stars-container');
const ratingCommentInput = document.getElementById('rating-comment');
const submitRatingButton = document.getElementById('submit-rating-button');

const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');

const orderConfirmationModal = document.getElementById('order-confirmation-modal');
const orderConfirmationOkBtn = document.getElementById('order-confirmation-ok-btn');


let currentProduct = null;
let selectedRating = 0;
let cart = {}; // { productId: { productData, quantity } }
let products = []; // Array to store all products for filtering/sorting
let allRatings = {}; // To store ratings for products

// --- Firebase Authentication ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        if (authNavLink) authNavLink.style.display = 'none';
        if (logoutNavItem) logoutNavItem.style.display = 'block';
        // Check if user is admin (example: by UID, or a custom claim)
        // For simplicity, let's assume a hardcoded admin UID or check a database path
        // In a real app, use Firebase Custom Claims for robust admin checks.
        // For now, if you have an admin UID, you can hardcode it here:
        const adminUids = ["YOUR_ADMIN_UID_1", "YOUR_ADMIN_UID_2"]; // Replace with actual admin UIDs if any
        if (adminUids.includes(user.uid)) {
            if (adminDashboardNavItem) adminDashboardNavItem.style.display = 'block';
        } else {
            if (adminDashboardNavItem) adminDashboardNavItem.style.display = 'none';
        }

        // Load user's cart
        loadUserCart(user.uid);
    } else {
        // User is signed out
        if (authNavLink) authNavLink.style.display = 'block';
        if (logoutNavItem) logoutNavItem.style.display = 'none';
        if (adminDashboardNavItem) adminDashboardNavItem.style.display = 'none';
        cart = {}; // Clear cart if user logs out
        updateCartDisplay();
        hideAllSections(); // Hide other sections on logout
        showAuthSection(); // Show auth section
    }
});

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showAlert('Login Successful', 'Welcome back!');
            // User will be redirected by onAuthStateChanged
        } catch (error) {
            showAlert('Login Failed', error.message);
        }
    });
}

if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        const email = registerEmailInput.value;
        const password = registerPasswordInput.value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showAlert('Registration Successful', 'Your account has been created!');
            // User will be redirected by onAuthStateChanged
        } catch (error) {
            showAlert('Registration Failed', error.message);
        }
    });
}

if (logoutNavLink) {
    logoutNavLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            showAlert('Logged Out', 'You have been successfully logged out.');
        } catch (error) {
            showAlert('Logout Error', error.message);
        }
    });
}

// --- Section Management ---
function hideAllSections() {
    if (authSection) authSection.style.display = 'none';
    if (storeSection) storeSection.style.display = 'none';
    if (cartSection) cartSection.style.display = 'none';
}

function showAuthSection() {
    hideAllSections();
    if (authSection) authSection.style.display = 'flex';
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
}

function showStoreSection() {
    hideAllSections();
    if (storeSection) storeSection.style.display = 'block';
    loadProducts(); // Reload products when store section is shown
}

function showCartSection() {
    hideAllSections();
    if (cartSection) cartSection.style.display = 'block';
    updateCartDisplay();
}

// Initial display based on auth state (handled by onAuthStateChanged)
if (homeNavLink) homeNavLink.addEventListener('click', (e) => { e.preventDefault(); showStoreSection(); });
if (cartNavLink) cartNavLink.addEventListener('click', (e) => { e.preventDefault(); showCartSection(); });
if (authNavLink) authNavLink.addEventListener('click', (e) => { e.preventDefault(); showAuthSection(); });

if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
});

if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
});

// --- Product and Category Management ---
function populateCategorySelect() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const productData = snapshot.val();
        const categories = new Set();
        if (productData) {
            Object.values(productData).forEach(product => {
                if (product.category) {
                    categories.add(product.category);
                }
            });
        }

        if (categorySelect) {
            categorySelect.innerHTML = '<option value="all">All Categories</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
    }, {
        onlyOnce: false // Listen for changes
    });
}

function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const productData = snapshot.val();
        products = [];
        if (productData) {
            for (const id in productData) {
                products.push({ id, ...productData[id] });
            }
        }
        applyFiltersAndSort();
    }, {
        onlyOnce: false // Listen for changes
    });
}

function loadRatings() {
    const ratingsRef = ref(database, 'ratings');
    onValue(ratingsRef, (snapshot) => {
        allRatings = snapshot.val() || {};
        applyFiltersAndSort(); // Re-render products to show updated ratings
    }, {
        onlyOnce: false
    });
}

function getProductAverageRating(productId) {
    let totalRating = 0;
    let ratingCount = 0;
    for (const ratingId in allRatings) {
        if (allRatings[ratingId].productId === productId) {
            totalRating += allRatings[ratingId].rating;
            ratingCount++;
        }
    }
    return ratingCount > 0 ? { average: totalRating / ratingCount, count: ratingCount } : { average: 0, count: 0 };
}

function applyFiltersAndSort() {
    let filteredProducts = [...products];

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedCategory = categorySelect ? categorySelect.value : 'all';
    const sortOrder = sortSelect ? sortSelect.value : 'name-asc';

    // Filter by search term
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

    // Sort
    filteredProducts.sort((a, b) => {
        if (sortOrder === 'name-asc') return a.title.localeCompare(b.title);
        if (sortOrder === 'name-desc') return b.title.localeCompare(a.title);
        if (sortOrder === 'price-asc') return a.price - b.price;
        if (sortOrder === 'price-desc') return b.price - a.price;
        if (sortOrder === 'rating-desc') {
            const ratingA = getProductAverageRating(a.id).average;
            const ratingB = getProductAverageRating(b.id).average;
            return ratingB - ratingA;
        }
        return 0;
    });

    displayProducts(filteredProducts);
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
        productCard.className = 'product-card';
        productCard.dataset.productId = product.id; // Store product ID

        const { average, count } = getProductAverageRating(product.id);
        const ratingHtml = count > 0 ? `${average.toFixed(1)}/5 (${count})` : 'N/A';

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.imageUrl || 'placeholder.png'}" alt="${product.title}">
            </div>
            <div class="product-info">
                <h4>${product.title}</h4>
                <p class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</p>
                <p class="product-rating">Rating: ${ratingHtml}</p>
            </div>
            <div class="product-actions">
                <button class="button primary view-details-btn" data-product-id="${product.id}">View Details</button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });

    // Add event listeners for "View Details" buttons
    productGrid.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            openProductDetailModal(productId);
        });
    });
}

// Search and Sort event listeners
if (searchBtn) searchBtn.addEventListener('click', applyFiltersAndSort);
if (searchInput) searchInput.addEventListener('input', applyFiltersAndSort); // Live search
if (categorySelect) categorySelect.addEventListener('change', applyFiltersAndSort);
if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndSort);


// --- Product Detail Modal ---
function openProductDetailModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) {
        showAlert('Error', 'Product not found.');
        return;
    }

    if (modalProductTitle) modalProductTitle.textContent = currentProduct.title;
    if (modalProductPrice) modalProductPrice.textContent = currentProduct.price ? currentProduct.price.toFixed(2) : '0.00';
    if (modalProductImage) modalProductImage.src = currentProduct.imageUrl || 'placeholder.png';
    if (modalProductDescription) modalProductDescription.textContent = currentProduct.description;
    if (modalProductCategory) modalProductCategory.textContent = currentProduct.category;
    if (modalProductBrand) modalProductBrand.textContent = currentProduct.brand;

    if (currentProduct.videoUrl && modalProductVideoContainer && modalProductVideoIframe) {
        modalProductVideoIframe.src = currentProduct.videoUrl;
        modalProductVideoContainer.style.display = 'block';
    } else if (modalProductVideoContainer) {
        modalProductVideoContainer.style.display = 'none';
        if (modalProductVideoIframe) modalProductVideoIframe.src = ''; // Clear video
    }

    // Display average rating
    const { average, count } = getProductAverageRating(productId);
    if (modalProductAverageRating) modalProductAverageRating.textContent = count > 0 ? average.toFixed(1) : 'N/A';
    if (modalProductRatingCount) modalProductRatingCount.textContent = count > 0 ? `${count} reviews` : '0 reviews';

    // Reset quantity and rating
    if (productQuantityInput) productQuantityInput.value = 1;
    selectedRating = 0;
    updateRatingStars();
    if (ratingCommentInput) ratingCommentInput.value = '';

    if (productDetailModal) productDetailModal.style.display = 'block';
}

function closeProductDetailModal() {
    if (productDetailModal) productDetailModal.style.display = 'none';
    currentProduct = null;
    if (modalProductVideoIframe) modalProductVideoIframe.src = ''; // Stop video playback
}

if (closeProductDetailModalBtn) closeProductDetailModalBtn.addEventListener('click', closeProductDetailModal);

// Quantity controls
if (decreaseQuantityBtn) {
    decreaseQuantityBtn.addEventListener('click', () => {
        if (productQuantityInput) {
            let quantity = parseInt(productQuantityInput.value);
            if (quantity > 1) {
                productQuantityInput.value = quantity - 1;
            }
        }
    });
}

if (increaseQuantityBtn) {
    increaseQuantityBtn.addEventListener('click', () => {
        if (productQuantityInput) {
            let quantity = parseInt(productQuantityInput.value);
            productQuantityInput.value = quantity + 1;
        }
    });
}

// Add to Cart from Product Detail Modal
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
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
}

// Buy Now from Product Detail Modal
if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
        if (currentProduct && productQuantityInput) {
            const quantity = parseInt(productQuantityInput.value);
            if (isNaN(quantity) || quantity <= 0) {
                showAlert('Invalid Quantity', 'Please enter a valid quantity.');
                return;
            }
            // Temporarily add to cart for immediate purchase flow
            cart = {}; // Clear previous cart for a direct "buy now"
            addToCart(currentProduct, quantity);
            closeProductDetailModal();
            showCartSection(); // Go directly to cart for checkout
            if (checkoutBtn) checkoutBtn.click(); // Auto-click checkout button
        }
    });
}

// --- Cart Management ---
function addToCart(product, quantity) {
    const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous'; // Use anonymous cart for non-logged-in users
    const cartItemRef = ref(database, `carts/${userId}/${product.id}`);

    get(cartItemRef).then((snapshot) => {
        const existingQuantity = snapshot.exists() ? snapshot.val().quantity : 0;
        const newQuantity = existingQuantity + quantity;
        set(cartItemRef, {
            id: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: newQuantity
        }).then(() => {
            // Cart updated in Firebase, onValue listener will update local cart
        }).catch(error => {
            console.error("Error updating cart:", error);
            showAlert('Error', 'Failed to add to cart: ' + error.message);
        });
    }).catch(error => {
        console.error("Error fetching cart item:", error);
        showAlert('Error', 'Failed to fetch cart item: ' + error.message);
    });
}

function loadUserCart(userId) {
    const cartRef = ref(database, `carts/${userId}`);
    onValue(cartRef, (snapshot) => {
        cart = snapshot.val() || {};
        updateCartDisplay();
    }, {
        onlyOnce: false // Listen for real-time updates
    });
}

function updateCartDisplay() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    for (const productId in cart) {
        const item = cart[productId];
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        itemCount += item.quantity;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.innerHTML = `
            <img src="${item.imageUrl || 'placeholder.png'}" alt="${item.title}">
            <div class="cart-item-details">
                <h4>${item.title}</h4>
                <p>Price: $${item.price ? item.price.toFixed(2) : '0.00'}</p>
                <p>Quantity: ${item.quantity}</p>
                <p>Subtotal: $${itemTotal.toFixed(2)}</p>
            </div>
            <div class="cart-item-actions">
                <button class="button secondary remove-from-cart-btn" data-product-id="${item.id}">Remove</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    }

    if (cartTotalSpan) cartTotalSpan.textContent = total.toFixed(2);
    if (cartItemCountSpan) cartItemCountSpan.textContent = itemCount;

    // Add event listeners for "Remove" buttons
    cartItemsContainer.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            removeFromCart(productId);
        });
    });

    if (itemCount === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        if (checkoutBtn) checkoutBtn.style.display = 'none';
        if (checkoutForm) checkoutForm.style.display = 'none';
    } else {
        if (checkoutBtn) checkoutBtn.style.display = 'block';
    }
}

function removeFromCart(productId) {
    const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous';
    const cartItemRef = ref(database, `carts/${userId}/${productId}`);
    remove(cartItemRef).then(() => {
        showAlert('Removed', 'Item removed from cart.');
    }).catch(error => {
        console.error("Error removing from cart:", error);
        showAlert('Error', 'Failed to remove from cart: ' + error.message);
    });
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (Object.keys(cart).length === 0) {
            showAlert('Cart Empty', 'Your cart is empty. Please add items before checking out.');
            return;
        }
        if (checkoutForm) checkoutForm.style.display = 'block';
        // Pre-fill user info if logged in (optional)
        if (auth.currentUser) {
            if (customerNameInput) customerNameInput.value = auth.currentUser.displayName || ''; // You might need a profile system for names
            if (customerNameInput) customerNameInput.value = auth.currentUser.email || ''; // Example: using email for name, adjust as needed
        }
    });
}

if (confirmOrderBtn) {
    confirmOrderBtn.addEventListener('click', async () => {
        const customerName = customerNameInput ? customerNameInput.value.trim() : '';
        const customerAddress = customerAddressInput ? customerAddressInput.value.trim() : '';
        const customerPhone = customerPhoneInput ? customerPhoneInput.value.trim() : '';

        if (!customerName || !customerAddress || !customerPhone) {
            showAlert('Missing Information', 'Please fill in all customer details.');
            return;
        }

        const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous';
        const orderId = push(ref(database, 'orders')).key;
        const orderData = {
            orderId: orderId,
            userId: userId,
            customerName,
            customerAddress,
            customerPhone,
            items: cart,
            total: parseFloat(cartTotalSpan.textContent),
            timestamp: serverTimestamp(),
            status: 'Pending' // Initial status
        };

        try {
            await set(ref(database, `orders/${orderId}`), orderData);
            // Clear cart after successful order
            await remove(ref(database, `carts/${userId}`));
            showOrderConfirmationModal();
            if (checkoutForm) checkoutForm.style.display = 'none';
            // Optionally redirect to home or order history
            showStoreSection();
        } catch (error) {
            console.error("Error placing order:", error);
            showAlert('Order Failed', 'There was an error placing your order: ' + error.message);
        }
    });
}

// --- Rating System ---
function updateRatingStars() {
    if (!ratingStarsContainer) return;
    const stars = ratingStarsContainer.querySelectorAll('.fa-star');
    stars.forEach(star => {
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
    if (!auth.currentUser) {
        showAlert('Login Required', 'You must be logged in to submit a rating.');
        showAuthSection();
        return;
    }
    if (!currentProduct) {
        showAlert('Error', 'No product selected for rating.');
        return;
    }
    if (selectedRating === 0) {
        showAlert('No Rating Selected', 'Please select a star rating.');
        return;
    }

    const comment = ratingCommentInput ? ratingCommentInput.value.trim() : '';
    const ratingId = push(ref(database, 'ratings')).key;
    const ratingData = {
        productId: currentProduct.id,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        rating: selectedRating,
        comment: comment,
        timestamp: serverTimestamp()
    };

    try {
        await set(ref(database, `ratings/${ratingId}`), ratingData);
        showAlert('Rating Submitted', 'Thank you for your feedback!');
        closeProductDetailModal(); // Close modal after rating
        // Ratings are loaded in real-time by loadRatings()
    } catch (error) {
        console.error("Error submitting rating:", error);
        showAlert('Submission Failed', 'Failed to submit rating: ' + error.message);
    }
}

// --- Custom Alert/Confirmation Modals ---
function showAlert(title, message) {
    if (customModalTitle) customModalTitle.textContent = title;
    if (customModalMessage) customModalMessage.textContent = message;
    if (customAlertModal) customAlertModal.style.display = 'block';
    if (customModalOkBtn) {
        customModalOkBtn.onclick = () => {
            if (customAlertModal) customAlertModal.style.display = 'none';
        };
    }
}

function closeAlertModal() {
    if (customAlertModal) customAlertModal.style.display = 'none';
}

function showOrderConfirmationModal() {
    if (orderConfirmationModal) orderConfirmationModal.style.display = 'block';
}

function closeOrderConfirmationModal() {
    if (orderConfirmationModal) orderConfirmationModal.style.display = 'none';
}

// --- Event Listeners and Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial data loading. onAuthStateChanged will handle displaying sections.
    populateCategorySelect();
    loadProducts();
    loadRatings();

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

    // Call showStoreSection initially if no user is logged in
    // This is handled by onAuthStateChanged logic, but if you want to ensure
    // the store is visible immediately if user isn't logged in, uncomment below.
    // However, onAuthStateChanged will hide/show sections correctly.
    // if (!auth.currentUser) {
    //     showStoreSection();
    // }
});
