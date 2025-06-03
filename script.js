// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"; // Added createUserWithEmailAndPassword
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
  measurementId: "G-Q5Z38734P4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements ---
const loginSection = document.getElementById('auth-section');
const productListingSection = document.getElementById('product-listing-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const signupToggleBtn = document.getElementById('signup-toggle-btn');
const userDisplay = document.getElementById('user-display');

const productGrid = document.getElementById('product-grid');
const cartIcon = document.getElementById('cart-icon');
const cartCountSpan = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const closeCartModalBtn = document.getElementById('close-cart-modal-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');
const placeOrderButton = document.getElementById('place-order-btn');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');

const productModal = document.getElementById('product-modal');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductAvailability = document.getElementById('modal-product-availability');
const modalProductRating = document.getElementById('modal-product-rating');
const modalProductRatingCount = document.getElementById('modal-product-rating-count');
const modalProductVideo = document.getElementById('modal-product-video');
const productQuantityInput = document.getElementById('product-quantity');
const decreaseQuantityBtn = document.getElementById('decrease-quantity');
const increaseQuantityBtn = document.getElementById('increase-quantity');
const addToCartModalBtn = document.getElementById('add-to-cart-modal-btn');
const productSearchInput = document.getElementById('product-search');
const sortSelect = document.getElementById('sort-select');
const categoryFiltersContainer = document.querySelector('.category-filters');

const orderHistorySection = document.getElementById('order-history-section');
const toggleOrderHistoryBtn = document.getElementById('toggle-order-history-btn');
const orderHistoryList = document.getElementById('order-history-list');

const rateProductBtn = document.getElementById('rate-product-btn');
const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.getElementById('close-rating-modal-btn');
const ratingProductTitle = document.getElementById('rating-product-title');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const ratingReviewText = document.getElementById('rating-review-text');
const submitRatingButton = document.getElementById('submit-rating-btn');

// Custom Alert Modal elements
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


// --- Global Variables ---
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let currentProduct = null; // To store the product being viewed in the modal
let selectedRating = 0; // For product rating
let productRatings = {}; // To store ratings fetched from Firebase

// --- Customer Information Inputs ---
const customerNameInput = document.getElementById('customer-name');
const customerPhoneInput = document.getElementById('customer-phone'); // Removed customerEmailInput
const customerAddressInput = document.getElementById('customer-address');


// --- Firebase Authentication ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginSection.style.display = 'none';
        productListingSection.style.display = 'block';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        userDisplay.style.display = 'inline-block';
        userDisplay.textContent = `Welcome, ${user.email}`;
        toggleOrderHistoryBtn.style.display = 'block'; // Show order history button
        loadProducts(); // Load products for authenticated users
        loadCart(); // Load cart for authenticated users
        loadProductRatings(); // Load ratings when user is authenticated
    } else {
        // User is signed out
        loginSection.style.display = 'block';
        productListingSection.style.display = 'none';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        userDisplay.style.display = 'none';
        userDisplay.textContent = '';
        toggleOrderHistoryBtn.style.display = 'none'; // Hide order history button
        orderHistorySection.style.display = 'none'; // Hide order history content
        products = []; // Clear products if not logged in
        renderProducts([]); // Clear displayed products
        updateCartDisplay(); // Clear cart display
    }
});

loginSubmitBtn.addEventListener('click', async () => {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    try {
        if (signupToggleBtn.textContent === 'Sign Up') {
            // Login
            await signInWithEmailAndPassword(auth, email, password);
            showCustomAlert('Success', 'Logged in successfully!');
        } else {
            // Sign Up
            await createUserWithEmailAndPassword(auth, email, password);
            showCustomAlert('Success', 'Account created successfully! Please log in.');
            signupToggleBtn.textContent = 'Sign Up'; // Switch back to login
            authPasswordInput.value = ''; // Clear password field
        }
    } catch (error) {
        showCustomAlert('Error', `Authentication failed: ${error.message}`);
        console.error("Authentication failed:", error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showCustomAlert('Success', 'Logged out successfully!');
        // No need to redirect, onAuthStateChanged will handle UI updates
    } catch (error) {
        showCustomAlert('Error', `Logout failed: ${error.message}`);
        console.error("Logout failed:", error.message);
    }
});

signupToggleBtn.addEventListener('click', () => {
    if (signupToggleBtn.textContent === 'Sign Up') {
        signupToggleBtn.textContent = 'Login';
        loginSubmitBtn.textContent = 'Sign Up';
    } else {
        signupToggleBtn.textContent = 'Sign Up';
        loginSubmitBtn.textContent = 'Login';
    }
});

// --- Product Management (Display & Filtering) ---
function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const productsData = snapshot.val();
        products = [];
        for (let id in productsData) {
            products.push({ id, ...productsData[id] });
        }
        renderProducts(products);
        populateCategoryFilters();
    }, (error) => {
        console.error("Error loading products:", error);
        showCustomAlert('Error', 'Failed to load products.');
    });
}

function renderProducts(productsToRender) {
    productGrid.innerHTML = ''; // Clear existing products
    if (productsToRender.length === 0) {
        productGrid.innerHTML = '<p>No products available.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.id = product.id;

        const averageRating = productRatings[product.id] ? (productRatings[product.id].totalRating / productRatings[product.id].count).toFixed(1) : 'N/A';
        const ratingCount = productRatings[product.id] ? productRatings[product.id].count : 0;

        productCard.innerHTML = `
            <img src="${product.imageUrl || 'placeholder.jpg'}" alt="${product.title}" class="product-image">
            <h3 class="product-title">${product.title}</h3>
            <p class="product-price">PKR ${product.price.toFixed(2)}</p>
            <p class="product-rating">Rating: ${averageRating} (${ratingCount} reviews)</p>
            <button class="button primary add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
            <button class="button secondary view-details-btn" data-id="${product.id}">View Details</button>
        `;
        productGrid.appendChild(productCard);
    });

    // Add event listeners for "Add to Cart" and "View Details" buttons
    productGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            addToCart(productId, 1);
        });
    });

    productGrid.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            openProductModal(productId);
        });
    });
}

function filterAndSortProducts() {
    let filteredProducts = [...products];
    const searchQuery = productSearchInput.value.toLowerCase();
    const selectedCategory = categoryFiltersContainer.querySelector('.category-button.active').dataset.category;
    const sortOption = sortSelect.value;

    // Filter by search query
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchQuery) ||
            product.description.toLowerCase().includes(searchQuery) ||
            product.category.toLowerCase().includes(searchQuery)
        );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product =>
            product.category.toLowerCase() === selectedCategory.toLowerCase()
        );
    }

    // Sort products
    switch (sortOption) {
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
            // No sorting
            break;
    }

    renderProducts(filteredProducts);
}

productSearchInput.addEventListener('input', filterAndSortProducts);
sortSelect.addEventListener('change', filterAndSortProducts);

function populateCategoryFilters() {
    const categories = new Set(['all']);
    products.forEach(product => categories.add(product.category));

    categoryFiltersContainer.innerHTML = ''; // Clear existing buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('category-button');
        if (category === 'all') {
            button.classList.add('active');
        }
        button.dataset.category = category;
        button.textContent = category;
        button.addEventListener('click', () => {
            categoryFiltersContainer.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterAndSortProducts();
        });
        categoryFiltersContainer.appendChild(button);
    });
}


// --- Product Modals ---
function openProductModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (currentProduct) {
        modalProductImage.src = currentProduct.imageUrl || 'placeholder.jpg';
        modalProductTitle.textContent = currentProduct.title;
        modalProductPrice.textContent = `PKR ${currentProduct.price.toFixed(2)}`;
        modalProductDescription.textContent = currentProduct.description;
        modalProductCategory.textContent = currentProduct.category;
        modalProductAvailability.textContent = currentProduct.availability || 'In Stock';
        productQuantityInput.value = 1; // Reset quantity

        // Display rating
        const averageRating = productRatings[currentProduct.id] ? (productRatings[currentProduct.id].totalRating / productRatings[currentProduct.id].count).toFixed(1) : 'N/A';
        const ratingCount = productRatings[currentProduct.id] ? productRatings[currentProduct.id].count : 0;
        modalProductRating.textContent = averageRating;
        modalProductRatingCount.textContent = ratingCount;

        // Display video if available
        if (currentProduct.videoUrl) {
            modalProductVideo.style.display = 'block';
            modalProductVideo.querySelector('iframe').src = currentProduct.videoUrl;
        } else {
            modalProductVideo.style.display = 'none';
            modalProductVideo.querySelector('iframe').src = '';
        }

        // Show "Rate this Product" button if user is logged in
        if (auth.currentUser) {
            rateProductBtn.style.display = 'block';
        } else {
            rateProductBtn.style.display = 'none';
        }

        productModal.style.display = 'block';
    }
}

function closeProductModal() {
    productModal.style.display = 'none';
    currentProduct = null;
    modalProductVideo.querySelector('iframe').src = ''; // Stop video playback
}

closeModalBtn.addEventListener('click', closeProductModal);
window.addEventListener('click', (event) => {
    if (event.target === productModal) {
        closeProductModal();
    }
});

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
        addToCart(currentProduct.id, quantity);
        closeProductModal();
    }
});

// --- Cart Management ---
function addToCart(productId, quantity) {
    if (!auth.currentUser) {
        showCustomAlert('Error', 'Please log in to add items to your cart.');
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error("Product not found:", productId);
        return;
    }

    if (cart[productId]) {
        cart[productId].quantity += quantity;
    } else {
        cart[productId] = { ...product, quantity: quantity };
    }
    saveCart();
    updateCartDisplay();
    showCustomAlert('Success', `${product.title} added to cart!`);
}

function removeFromCart(productId) {
    if (cart[productId]) {
        delete cart[productId];
        saveCart();
        updateCartDisplay();
        showCustomAlert('Info', 'Item removed from cart.');
    }
}

function updateCartDisplay() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    for (const productId in cart) {
        const item = cart[productId];
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        itemCount += item.quantity;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <span>${item.title} x ${item.quantity}</span>
            <span>PKR ${itemTotal.toFixed(2)}</span>
            <button class="remove-from-cart-btn" data-id="${productId}"><i class="fas fa-trash-alt"></i></button>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    }

    cartTotalSpan.textContent = total.toFixed(2);
    cartCountSpan.textContent = itemCount;

    // Add event listeners for remove buttons
    cartItemsContainer.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id || event.target.closest('button').dataset.id;
            removeFromCart(productId);
        });
    });

    if (itemCount === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        placeOrderButton.disabled = true; // Disable place order if cart is empty
    } else {
        placeOrderButton.disabled = false;
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    cart = JSON.parse(localStorage.getItem('cart')) || {};
    updateCartDisplay();
}

cartIcon.addEventListener('click', () => {
    cartModal.style.display = 'block';
});

closeCartModalBtn.addEventListener('click', () => {
    cartModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === cartModal) {
        cartModal.style.display = 'none';
    }
});

clearCartBtn.addEventListener('click', () => {
    showCustomConfirm('Clear Cart', 'Are you sure you want to clear your cart?', () => {
        cart = {};
        saveCart();
        updateCartDisplay();
        showCustomAlert('Success', 'Cart cleared successfully!');
    });
});

async function placeOrder() {
    const user = auth.currentUser;
    if (!user) {
        showCustomAlert('Error', 'You must be logged in to place an order.');
        return;
    }

    if (Object.keys(cart).length === 0) {
        showCustomAlert('Error', 'Your cart is empty. Please add items before placing an order.');
        return;
    }

    const customerName = customerNameInput.value.trim();
    const customerPhone = customerPhoneInput.value.trim();
    const customerAddress = customerAddressInput.value.trim();

    if (!customerName || !customerPhone || !customerAddress) {
        showCustomAlert('Validation Error', 'Please fill in all customer information fields: Name, Phone Number, and Delivery Address.');
        return;
    }

    const orderItems = Object.values(cart).map(item => ({
        productId: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
        userId: user.uid,
        userEmail: user.email, // Keep user's login email for admin to contact
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        items: orderItems,
        totalAmount: totalAmount,
        timestamp: serverTimestamp(),
        status: 'Pending' // Initial status
    };

    try {
        const newOrderRef = push(ref(database, 'orders'));
        await set(newOrderRef, orderData);
        showCustomAlert('Success', 'Order placed successfully!');
        cart = {}; // Clear cart after successful order
        saveCart();
        updateCartDisplay();
        clearCustomerInfoForm(); // Clear the customer info form
        cartModal.style.display = 'none'; // Close cart modal
        loadOrderHistory(); // Refresh order history
    } catch (error) {
        showCustomAlert('Error', `Failed to place order: ${error.message}`);
        console.error("Error placing order:", error);
    }
}

function clearCustomerInfoForm() {
    customerNameInput.value = '';
    customerPhoneInput.value = '';
    customerAddressInput.value = '';
}

// --- Order History ---
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

function loadOrderHistory() {
    const user = auth.currentUser;
    if (!user) {
        orderHistoryList.innerHTML = '<p>Please log in to view your order history.</p>';
        return;
    }

    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        orderHistoryList.innerHTML = '';
        const ordersData = snapshot.val();
        if (!ordersData) {
            orderHistoryList.innerHTML = '<p>No orders found.</p>';
            return;
        }

        const userOrders = [];
        for (let orderId in ordersData) {
            const order = ordersData[orderId];
            if (order.userId === user.uid) {
                userOrders.push({ id: orderId, ...order });
            }
        }

        if (userOrders.length === 0) {
            orderHistoryList.innerHTML = '<p>You have not placed any orders yet.</p>';
            return;
        }

        userOrders.sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first

        userOrders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('order-item');

            const orderDate = order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A';
            const customerDetails = `
                <p><strong>Name:</strong> ${order.customerName || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
                <p><strong>Address:</strong> ${order.customerAddress || 'N/A'}</p>
            `;

            let itemsHtml = '<ul>';
            order.items.forEach(item => {
                itemsHtml += `<li>${item.title} x ${item.quantity} (PKR ${item.price.toFixed(2)} each)</li>`;
            });
            itemsHtml += '</ul>';

            orderDiv.innerHTML = `
                <h3>Order ID: ${order.id}</h3>
                <p><strong>Date:</strong> ${orderDate}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <h4>Customer Details:</h4>
                ${customerDetails}
                <h4>Items:</h4>
                ${itemsHtml}
                <p><strong>Total Amount:</strong> PKR ${order.totalAmount.toFixed(2)}</p>
            `;
            orderHistoryList.appendChild(orderDiv);
        });
    }, (error) => {
        console.error("Error loading order history:", error);
        showCustomAlert('Error', 'Failed to load order history.');
    });
}

// --- Product Rating ---
let productToRateId = null; // To store the ID of the product being rated

rateProductBtn.addEventListener('click', () => {
    if (currentProduct) {
        productToRateId = currentProduct.id;
        ratingProductTitle.textContent = currentProduct.title;
        selectedRating = 0; // Reset rating
        ratingReviewText.value = ''; // Clear review text
        updateRatingStars();
        ratingModal.style.display = 'block';
    }
});

closeRatingModalBtn.addEventListener('click', closeRatingModal);

window.addEventListener('click', (event) => {
    if (event.target === ratingModal) {
        closeRatingModal();
    }
});

function closeRatingModal() {
    ratingModal.style.display = 'none';
    productToRateId = null;
    selectedRating = 0;
    updateRatingStars();
}

ratingStarsContainer.addEventListener('click', (event) => {
    const star = event.target.closest('.fa-star');
    if (star) {
        selectedRating = parseInt(star.dataset.rating);
        updateRatingStars();
    }
});

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
    const user = auth.currentUser;
    if (!user) {
        showCustomAlert('Error', 'Please log in to submit a rating.');
        return;
    }

    if (!productToRateId) {
        showCustomAlert('Error', 'No product selected for rating.');
        return;
    }

    if (selectedRating === 0) {
        showCustomAlert('Validation Error', 'Please select a star rating.');
        return;
    }

    const reviewText = ratingReviewText.value.trim();

    const ratingData = {
        productId: productToRateId,
        userId: user.uid,
        userEmail: user.email,
        rating: selectedRating,
        review: reviewText,
        timestamp: serverTimestamp()
    };

    try {
        const newRatingRef = push(ref(database, 'ratings'));
        await set(newRatingRef, ratingData);
        showCustomAlert('Success', 'Rating submitted successfully!');
        closeRatingModal();
        loadProductRatings(); // Refresh ratings to update display
        filterAndSortProducts(); // Re-render products to show updated ratings
    } catch (error) {
        showCustomAlert('Error', `Failed to submit rating: ${error.message}`);
        console.error("Error submitting rating:", error);
    }
}

function loadProductRatings() {
    const ratingsRef = ref(database, 'ratings');
    onValue(ratingsRef, (snapshot) => {
        productRatings = {}; // Reset
        const ratingsData = snapshot.val();
        if (ratingsData) {
            for (const ratingId in ratingsData) {
                const rating = ratingsData[ratingId];
                if (!productRatings[rating.productId]) {
                    productRatings[rating.productId] = { totalRating: 0, count: 0 };
                }
                productRatings[rating.productId].totalRating += rating.rating;
                productRatings[rating.productId].count += 1;
            }
        }
        filterAndSortProducts(); // Re-render products with updated ratings
        // If product modal is open for a product that was just rated, update its rating display
        if (productModal.style.display === 'block' && currentProduct) {
            const averageRating = productRatings[currentProduct.id] ? (productRatings[currentProduct.id].totalRating / productRatings[currentProduct.id].count).toFixed(1) : 'N/A';
            const ratingCount = productRatings[currentProduct.id] ? productRatings[currentProduct.id].count : 0;
            modalProductRating.textContent = averageRating;
            modalProductRatingCount.textContent = ratingCount;
        }
    }, (error) => {
        console.error("Error loading product ratings:", error);
    });
}


// --- Custom Alert/Confirm Modals ---
function showCustomAlert(title, message) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customModalOkBtn.style.display = 'block';
    customModalCancelBtn.style.display = 'none';
    customModalOkBtn.onclick = () => customAlertModal.style.display = 'none';
    customAlertModal.style.display = 'block';
}

function showCustomConfirm(title, message, onConfirm) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customModalOkBtn.textContent = 'Yes';
    customModalCancelBtn.textContent = 'No';
    customModalOkBtn.style.display = 'block';
    customModalCancelBtn.style.display = 'block';
    customModalOkBtn.onclick = () => {
        onConfirm();
        customAlertModal.style.display = 'none';
    };
    customModalCancelBtn.onclick = () => customAlertModal.style.display = 'none';
    customAlertModal.style.display = 'block';
}


// --- Initial Data Load ---
document.addEventListener('DOMContentLoaded', () => {
    // onAuthStateChanged will trigger loadProducts and loadCart when user logs in
    // For initial load, if user is already authenticated (e.g., page refresh), onAuthStateChanged handles it.
});
