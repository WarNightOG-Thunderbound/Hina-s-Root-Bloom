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
  appId: "1:967448486557:web:2c89223921f6479010495f", // Ensure this is correct from Firebase Console
  measurementId: "G-TT31HC3NZ3" // IMPORTANT: Update this to match your Firebase Analytics Measurement ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- Global Variables ---
let allProducts = {}; // Stores all products fetched from Firebase
let allCategories = {}; // Stores all categories fetched from Firebase
let userCart = []; // Stores items in the user's cart
let currentProduct = null; // Stores the currently viewed product in the modal
let selectedRating = 0; // For product rating submission
let currentUserId = null; // Store the current user's ID
let currentUserEmail = null; // Store the current user's email


// --- DOM Elements (common across pages or main page specific) ---
const productGrid = document.getElementById('product-grid');
const productDetailModal = document.getElementById('product-detail-modal');
const closeModalBtn = document.querySelector('.close-button');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductVideoContainer = document.getElementById('modal-product-video-container');
const modalProductVideo = document.getElementById('modal-product-video');
const quantityInput = document.getElementById('quantity');
const addToCartBtn = document.getElementById('add-to-cart-btn');
const placeOrderBtn = document.getElementById('place-order-btn');
const cartCountSpan = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const closeCartModalBtn = document.getElementById('close-cart-modal-btn');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const categoryFilterSelect = document.getElementById('category-filter');
const sortBySelect = document.getElementById('sort-by');
const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const logoutButton = document.getElementById('logout-button');
const userEmailDisplay = document.getElementById('user-email-display');
const authStatus = document.getElementById('auth-status');
const toggleAuthModeBtn = document.getElementById('toggle-auth-mode');
const orderConfirmationModal = document.getElementById('order-confirmation-modal');
const orderConfirmationOkBtn = document.getElementById('order-confirmation-ok-btn');
const ratingStarsContainer = document.getElementById('rating-stars');
const submitRatingButton = document.getElementById('submit-rating-button');
const ratingComment = document.getElementById('rating-comment');
const productRatingsContainer = document.getElementById('product-ratings');


// Order Form elements
const orderForm = document.getElementById('order-form');
const customerNameInput = document.getElementById('customer-name');
const customerEmailInput = document.getElementById('customer-email');
const customerAddressInput = document.getElementById('customer-address');
const customerPhoneInput = document.getElementById('customer-phone');
const paymentMethodSelect = document.getElementById('payment-method');
const confirmOrderBtn = document.getElementById('confirm-order-btn');
const cancelOrderBtn = document.getElementById('cancel-order-btn');

// --- Utility Functions ---
function showAlert(title, message) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customAlertModal.style.display = 'flex'; // Use flex to center
}

function closeAlertModal() {
    customAlertModal.style.display = 'none';
}

function showOrderConfirmation() {
    orderConfirmationModal.style.display = 'flex';
}

function closeOrderConfirmationModal() {
    orderConfirmationModal.style.display = 'none';
    clearCart();
}

// --- Authentication ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        currentUserId = user.uid;
        currentUserEmail = user.email;
        authSection.style.display = 'none';
        logoutButton.style.display = 'block';
        userEmailDisplay.textContent = `Logged in as: ${user.email}`;
        authStatus.style.display = 'block';
        console.log('User logged in:', user.email);
    } else {
        // User is signed out
        currentUserId = null;
        currentUserEmail = null;
        authSection.style.display = 'block';
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        logoutButton.style.display = 'none';
        userEmailDisplay.textContent = '';
        authStatus.style.display = 'none';
        console.log('User logged out.');
    }
});

toggleAuthModeBtn.addEventListener('click', () => {
    if (loginForm.style.display === 'block') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        toggleAuthModeBtn.textContent = 'Already have an account? Login';
    } else {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        toggleAuthModeBtn.textContent = 'New user? Sign Up';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert('Login Success', 'You have been successfully logged in!');
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login Failed', `Error: ${error.message}`);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showAlert('Signup Success', 'Account created successfully! You are now logged in.');
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('Signup Failed', `Error: ${error.message}`);
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showAlert('Logout Success', 'You have been successfully logged out.');
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Logout Failed', `Error: ${error.message}`);
    }
});


// --- Product Display and Filtering ---
function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        allProducts = snapshot.val() || {}; // Ensure it's an object, even if empty
        displayProducts(allProducts);
    }, (error) => {
        console.error("Error loading products:", error);
        showAlert('Data Error', 'Failed to load products. Please try again later.');
    });
}

function loadCategories() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        allCategories = snapshot.val() || {}; // Ensure it's an object, even if empty
        populateCategoryFilter(allCategories);
    }, (error) => {
        console.error("Error loading categories:", error);
        // Do not show alert for categories load error as it might be empty on first run
    });
}


function displayProducts(products) {
    productGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    Object.entries(products).forEach(([key, product]) => {
        // Only display if product has a category, or handle uncategorized products appropriately
        if (product && product.category) { // Ensure product and its category exist
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.dataset.productId = key; // Store product ID

            const categoryName = allCategories[product.category] ? allCategories[product.category].name : 'Uncategorized';

            productCard.innerHTML = `
                <img src="${product.imageUrl || 'placeholder.png'}" alt="${product.title}" class="product-card-image">
                <div class="product-card-content">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-category">${categoryName}</p>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <button class="button primary view-details-btn">View Details</button>
                </div>
            `;
            fragment.appendChild(productCard);
        }
    });
    productGrid.appendChild(fragment);

    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.closest('.product-card').dataset.productId;
            openProductDetailModal(productId);
        });
    });
}


function populateCategoryFilter(categories) {
    categoryFilterSelect.innerHTML = '<option value="all">All Categories</option>';
    if (categories) {
        Object.entries(categories).forEach(([key, category]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = category.name;
            categoryFilterSelect.appendChild(option);
        });
    }
}

function applyFiltersAndSort() {
    let filteredProducts = Object.values(allProducts);

    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }

    // Apply category filter
    const selectedCategory = categoryFilterSelect.value;
    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

    // Apply sorting
    const sortBy = sortBySelect.value;
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
    }

    displayProducts(filteredProducts.reduce((obj, product) => {
        obj[product.id] = product; // Convert back to object with keys for displayProducts
        return obj;
    }, {}));
}

searchButton.addEventListener('click', applyFiltersAndSort);
categoryFilterSelect.addEventListener('change', applyFiltersAndSort);
sortBySelect.addEventListener('change', applyFiltersAndSort);


// --- Product Detail Modal ---
async function openProductDetailModal(productId) {
    currentProduct = allProducts[productId];
    if (currentProduct) {
        modalProductImage.src = currentProduct.imageUrl || 'placeholder.png';
        modalProductTitle.textContent = currentProduct.title;
        modalProductDescription.textContent = currentProduct.description;
        modalProductPrice.textContent = `$${currentProduct.price.toFixed(2)}`;
        quantityInput.value = 1; // Reset quantity

        const categoryName = allCategories[currentProduct.category] ? allCategories[currentProduct.category].name : 'Uncategorized';
        modalProductCategory.textContent = `Category: ${categoryName}`;

        // Handle video display
        if (currentProduct.videoUrl) {
            modalProductVideoContainer.style.display = 'block';
            // Basic embedding for YouTube. For other platforms, you'd need more logic.
            const videoId = currentProduct.videoUrl.split('v=')[1] || currentProduct.videoUrl.split('/').pop();
            modalProductVideo.src = `https://www.youtube.com/embed/${videoId}`;
        } else {
            modalProductVideoContainer.style.display = 'none';
            modalProductVideo.src = ''; // Clear source
        }

        await displayProductRatings(productId); // Display existing ratings
        productDetailModal.style.display = 'flex'; // Use flex to center
    }
}

function closeProductDetailModal() {
    productDetailModal.style.display = 'none';
    modalProductVideo.src = ''; // Stop video playback
    currentProduct = null;
    selectedRating = 0; // Reset selected rating
    updateRatingStars(); // Clear stars
    ratingComment.value = ''; // Clear comment
}

closeModalBtn.addEventListener('click', closeProductDetailModal);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === productDetailModal) {
        closeProductDetailModal();
    }
});


// --- Cart Functionality ---
function updateCartCount() {
    cartCountSpan.textContent = userCart.reduce((total, item) => total + item.quantity, 0);
}

function addToCart(product, quantity) {
    const existingItemIndex = userCart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
        userCart[existingItemIndex].quantity += quantity;
    } else {
        userCart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category, // Store category key
            categoryName: allCategories[product.category] ? allCategories[product.category].name : 'Uncategorized', // Store category name
            quantity: quantity
        });
    }
    updateCartCount();
    saveCart();
    renderCartItems();
}

function saveCart() {
    localStorage.setItem('userCart', JSON.stringify(userCart));
}

function loadCart() {
    const savedCart = localStorage.getItem('userCart');
    if (savedCart) {
        userCart = JSON.parse(savedCart);
        updateCartCount();
        renderCartItems();
    }
}

function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (userCart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        userCart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.innerHTML = `
                <img src="${item.imageUrl || 'placeholder.png'}" alt="${item.title}">
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p>$${item.price.toFixed(2)} x ${item.quantity} = $${itemTotal.toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="button small remove-from-cart-btn" data-product-id="${item.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });
    }
    cartTotalSpan.textContent = total.toFixed(2);

    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.closest('.remove-from-cart-btn').dataset.productId;
            removeFromCart(productId);
        });
    });
}

function removeFromCart(productId) {
    userCart = userCart.filter(item => item.id !== productId);
    updateCartCount();
    saveCart();
    renderCartItems();
    showAlert('Removed from Cart', 'Product removed from your cart.');
}

function clearCart() {
    userCart = [];
    updateCartCount();
    saveCart();
    renderCartItems();
}

document.getElementById('cart-icon').addEventListener('click', () => {
    cartModal.style.display = 'flex';
});

closeCartModalBtn.addEventListener('click', () => {
    cartModal.style.display = 'none';
});

// Close cart modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === cartModal) {
        cartModal.style.display = 'none';
    }
});


// --- Order Placement ---
async function placeOrder() {
    if (!currentUserId) {
        showAlert('Order Error', 'Please log in to place an order.');
        // Optionally, show login/signup form here or redirect
        return;
    }
    if (userCart.length === 0) {
        showAlert('Order Error', 'Your cart is empty. Please add products before placing an order.');
        return;
    }

    // Pre-fill email if logged in
    if (currentUserEmail) {
        customerEmailInput.value = currentUserEmail;
    }

    // Show the order form modal/section
    document.getElementById('order-form-modal').style.display = 'flex';
}


confirmOrderBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const customerName = customerNameInput.value.trim();
    const customerEmail = customerEmailInput.value.trim();
    const customerAddress = customerAddressInput.value.trim();
    const customerPhone = customerPhoneInput.value.trim();
    const paymentMethod = paymentMethodSelect.value;

    if (!customerName || !customerEmail || !customerAddress || !customerPhone || !paymentMethod) {
        showAlert('Order Details Missing', 'Please fill in all customer and payment details.');
        return;
    }

    const orderTotal = userCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
        userId: currentUserId,
        customerName: customerName,
        customerEmail: customerEmail,
        customerAddress: customerAddress,
        customerPhone: customerPhone,
        paymentMethod: paymentMethod,
        items: userCart,
        total: orderTotal,
        status: 'Pending', // Initial status
        timestamp: serverTimestamp()
    };

    try {
        const ordersRef = ref(database, 'orders');
        await push(ordersRef, orderData);

        showAlert('Order Placed', 'Your order has been placed successfully!');
        document.getElementById('order-form-modal').style.display = 'none'; // Hide order form
        showOrderConfirmation(); // Show order confirmation modal
        clearOrderForm(); // Clear form after successful order

    } catch (error) {
        console.error('Error placing order:', error);
        showAlert('Order Failed', `There was an error placing your order: ${error.message}`);
    }
});

cancelOrderBtn.addEventListener('click', () => {
    document.getElementById('order-form-modal').style.display = 'none'; // Hide order form
    clearOrderForm();
});

function clearOrderForm() {
    customerNameInput.value = '';
    customerEmailInput.value = '';
    customerAddressInput.value = '';
    customerPhoneInput.value = '';
    paymentMethodSelect.value = 'Cash on Delivery'; // Reset to default
}


// --- Product Rating ---
function updateRatingStars() {
    if (!ratingStarsContainer) return;
    const stars = ratingStarsContainer.children;
    for (let i = 0; i < stars.length; i++) {
        if (i < selectedRating) {
            stars[i].classList.remove('far');
            stars[i].classList.add('fas'); // Filled star
        } else {
            stars[i].classList.remove('fas');
            stars[i].classList.add('far'); // Empty star
        }
    }
}

async function submitProductRating() {
    if (!currentUserId) {
        showAlert('Rating Error', 'Please log in to submit a rating.');
        return;
    }
    if (!currentProduct) {
        showAlert('Rating Error', 'No product selected to rate.');
        return;
    }
    if (selectedRating === 0) {
        showAlert('Rating Error', 'Please select a star rating.');
        return;
    }

    const productId = currentProduct.id;
    const comment = ratingComment.value.trim();

    const ratingData = {
        userId: currentUserId,
        userName: currentUserEmail || 'Anonymous', // Use email or anonymous
        rating: selectedRating,
        comment: comment,
        timestamp: serverTimestamp()
    };

    try {
        // Store ratings under products/productId/ratings/userId
        const ratingRef = ref(database, `ratings/${productId}/${currentUserId}`);
        await set(ratingRef, ratingData);

        showAlert('Rating Submitted', 'Your rating has been submitted successfully!');
        selectedRating = 0; // Reset for next rating
        ratingComment.value = '';
        updateRatingStars();
        displayProductRatings(productId); // Refresh ratings display
    } catch (error) {
        console.error('Error submitting rating:', error);
        showAlert('Rating Failed', `Failed to submit rating: ${error.message}`);
    }
}

async function displayProductRatings(productId) {
    if (!productRatingsContainer) return;
    productRatingsContainer.innerHTML = '<h4>Customer Reviews:</h4>';

    const productRatingsRef = ref(database, `ratings/${productId}`);
    onValue(productRatingsRef, (snapshot) => {
        productRatingsContainer.innerHTML = '<h4>Customer Reviews:</h4>'; // Clear before re-rendering
        const ratings = snapshot.val();
        if (ratings) {
            const sortedRatings = Object.values(ratings).sort((a, b) => b.timestamp - a.timestamp); // Newest first

            sortedRatings.forEach(rating => {
                const ratingDiv = document.createElement('div');
                ratingDiv.classList.add('customer-review-item');
                const starsHtml = '<div class="review-stars">' +
                    Array(rating.rating).fill('<i class="fas fa-star"></i>').join('') +
                    Array(5 - rating.rating).fill('<i class="far fa-star"></i>').join('') +
                    '</div>';

                ratingDiv.innerHTML = `
                    <p><strong>${rating.userName}</strong> ${starsHtml}</p>
                    ${rating.comment ? `<p>${rating.comment}</p>` : ''}
                    <p class="review-date">${new Date(rating.timestamp).toLocaleDateString()}</p>
                `;
                productRatingsContainer.appendChild(ratingDiv);
            });
        } else {
            productRatingsContainer.innerHTML += '<p>No reviews yet. Be the first to rate this product!</p>';
        }
    }, {
        onlyOnce: true // Listen once to display, will be called again on submit
    });
}


// --- Initial Data Load and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCategories(); // Load categories when DOM is ready
    loadCart(); // Load cart from local storage

    // Product Detail Modal event listeners
    addToCartBtn.addEventListener('click', () => {
        if (currentProduct) {
            const quantity = parseInt(quantityInput.value);
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
    // Allow closing by clicking outside the alert modal
    window.addEventListener('click', (event) => {
        if (event.target === customAlertModal) {
            closeAlertModal();
        }
    });

    // Order Confirmation Modal
    orderConfirmationOkBtn.addEventListener('click', closeOrderConfirmationModal);
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
});
