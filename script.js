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
  appId: "1:967448486557:web:fb730596395b0986701b3b",
  measurementId: "G-9D72L3W4Z6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

// --- DOM Elements ---
const productList = document.getElementById('product-list');
const categoryFilters = document.getElementById('category-filters');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Modals and Buttons
const productDetailsModal = document.getElementById('product-details-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductVideo = document.getElementById('modal-product-video');
const placeOrderButton = document.getElementById('place-order-button');
const toggleOrderHistoryBtn = document.getElementById('toggle-order-history-btn');
const orderHistorySection = document.getElementById('order-history-section');
const orderHistoryList = document.getElementById('order-history-list');

// Auth elements
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button'); // New register button
const logoutButton = document.getElementById('logout-button');
const adminLinkContainer = document.getElementById('admin-link-container');

// Custom Alert Modal elements
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');
const addressInput = document.getElementById('address-input');
const phoneInput = document.getElementById('phone-input');
const authEmailInput = document.getElementById('auth-email-input');       // New for auth modal
const authPasswordInput = document.getElementById('auth-password-input'); // New for auth modal

// Rating Modal Elements
const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.getElementById('close-rating-modal-btn');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const submitRatingButton = document.getElementById('submit-rating-button');

// Open Code Button
const openCodeButton = document.getElementById('open-code-button');


let allProducts = [];
let currentProduct = null; // Stores the product currently viewed in the modal
let selectedRating = 0; // To store the selected rating

// --- Utility Functions ---

function showCustomAlert(title, message, isConfirm = false, showAuthInputs = false, showAddressPhone = false) {
    return new Promise((resolve) => {
        customModalTitle.textContent = title;
        customModalMessage.textContent = message;
        
        // Reset all input displays
        addressInput.style.display = 'none';
        phoneInput.style.display = 'none';
        authEmailInput.style.display = 'none';
        authPasswordInput.style.display = 'none';

        // Show inputs based on flags
        if (showAddressPhone) {
            addressInput.style.display = 'block';
            phoneInput.style.display = 'block';
            addressInput.value = ''; // Clear previous input
            phoneInput.value = '';   // Clear previous input
        }
        if (showAuthInputs) {
            authEmailInput.style.display = 'block';
            authPasswordInput.style.display = 'block';
            authEmailInput.value = ''; // Clear previous input
            authPasswordInput.value = ''; // Clear previous input
        }

        customModalCancelBtn.style.display = isConfirm ? 'block' : 'none';
        customAlertModal.classList.add('active'); // Use class for animation

        const handleOk = () => {
            customAlertModal.classList.remove('active');
            customModalOkBtn.removeEventListener('click', handleOk);
            customModalCancelBtn.removeEventListener('click', handleCancel);

            if (showAddressPhone) {
                resolve({ address: addressInput.value, phone: phoneInput.value });
            } else if (showAuthInputs) {
                resolve({ email: authEmailInput.value, password: authPasswordInput.value });
            } else {
                resolve(true);
            }
        };

        const handleCancel = () => {
            customAlertModal.classList.remove('active');
            customModalOkBtn.removeEventListener('click', handleOk);
            customModalCancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };

        customModalOkBtn.addEventListener('click', handleOk);
        if (isConfirm) {
            customModalCancelBtn.addEventListener('click', handleCancel);
        }
    });
}


// --- Product Display and Filtering ---

function displayProducts(productsToDisplay) {
    productList.innerHTML = '';
    if (productsToDisplay.length === 0) {
        productList.innerHTML = '<p>No products found.</p>';
        return;
    }
    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="category">${product.category}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <div class="product-card-actions">
                <button class="view-details-btn" data-id="${product.id}">View Details</button>
            </div>
            <div class="product-rating">
                ${generateStarRating(product.averageRating)}
                <span>(${product.ratingCount || 0})</span>
            </div>
        `;
        productList.appendChild(productCard);
    });

    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            viewDetails(productId);
        });
    });
}

function generateStarRating(averageRating) {
    let starsHtml = '';
    const roundedRating = Math.round(averageRating);
    for (let i = 1; i <= 5; i++) {
        if (i <= roundedRating) {
            starsHtml += '<i class="fas fa-star filled"></i>';
        } else {
            starsHtml += '<i class="far fa-star"></i>';
        }
    }
    return starsHtml;
}


function applyFiltersAndSort() {
    let filteredProducts = [...allProducts];

    // Category filter
    const activeCategoryButton = categoryFilters.querySelector('.category-button.active');
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'all';

    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

    // Search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }

    // Sort
    const sortBy = sortSelect.value;
    filteredProducts.sort((a, b) => {
        if (sortBy === 'price-asc') {
            return a.price - b.price;
        } else if (sortBy === 'price-desc') {
            return b.price - a.price;
        } else if (sortBy === 'name-asc') {
            return a.title.localeCompare(b.title);
        } else if (sortBy === 'name-desc') {
            return b.title.localeCompare(a.title);
        }
        return 0; // Default or no sort
    });

    displayProducts(filteredProducts);
}

function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const productsData = snapshot.val();
        allProducts = [];
        for (let id in productsData) {
            const product = { id, ...productsData[id] };
            // Calculate average rating and count
            let totalRating = 0;
            let ratingCount = 0;
            if (product.ratings) {
                for (let userId in product.ratings) {
                    totalRating += product.ratings[userId];
                    ratingCount++;
                }
            }
            product.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
            product.ratingCount = ratingCount;
            allProducts.push(product);
        }
        populateCategories();
        applyFiltersAndSort(); // Apply filters and sort after products are loaded
    });
}

function populateCategories() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        const categoriesData = snapshot.val();
        categoryFilters.innerHTML = '<button class="category-button active" data-category="all">All</button>'; // Reset
        for (let categoryId in categoriesData) {
            const categoryName = categoriesData[categoryId].name;
            const button = document.createElement('button');
            button.classList.add('category-button');
            button.dataset.category = categoryName;
            button.textContent = categoryName;
            categoryFilters.appendChild(button);
        }
    });
}


function viewDetails(productId) {
    currentProduct = allProducts.find(p => p.id === productId);
    if (currentProduct) {
        modalProductImage.src = currentProduct.imageUrl;
        modalProductTitle.textContent = currentProduct.title;
        modalProductCategory.textContent = `Category: ${currentProduct.category}`;
        modalProductPrice.textContent = `Price: $${currentProduct.price.toFixed(2)}`;
        modalProductDescription.textContent = currentProduct.description;

        if (currentProduct.videoUrl) {
            modalProductVideo.style.display = 'block';
            modalProductVideo.querySelector('iframe').src = currentProduct.videoUrl;
        } else {
            modalProductVideo.style.display = 'none';
            modalProductVideo.querySelector('iframe').src = '';
        }

        productDetailsModal.style.display = 'block';
    }
}

async function placeOrder() {
    if (!currentProduct) {
        showCustomAlert('Error', 'No product selected for order.');
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        showCustomAlert('Login Required', 'You must be logged in to place an order.');
        return;
    }

    const { address, phone } = await showCustomAlert('Place Order', 'Please enter your address and phone number:', true, false, true);

    if (address && phone) {
        try {
            const newOrderRef = push(ref(database, 'orders'));
            await set(newOrderRef, {
                userId: user.uid,
                userName: user.email, // Or get user's display name if available
                productId: currentProduct.id,
                productTitle: currentProduct.title,
                productPrice: currentProduct.price,
                productImageUrl: currentProduct.imageUrl,
                address: address,
                phoneNumber: phone,
                orderDate: serverTimestamp(),
                status: 'Pending'
            });
            showCustomAlert('Order Placed!', 'Your order has been placed successfully.');
            productDetailsModal.style.display = 'none'; // Close modal after order
        } catch (error) {
            console.error("Error placing order:", error);
            showCustomAlert('Error', 'Failed to place order. Please try again.');
        }
    } else {
        showCustomAlert('Order Cancelled', 'Address and phone number are required to place an order.');
    }
}


function loadOrderHistory() {
    const user = auth.currentUser;

    if (!user) {
        orderHistoryList.innerHTML = '<p>Please log in to view your order history.</p>';
        return;
    }

    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        orderHistoryList.innerHTML = ''; // Clear previous history
        const ordersData = snapshot.val();
        let userOrdersFound = false;

        if (ordersData) {
            const userOrders = Object.values(ordersData).filter(order => order.userId === user.uid);
            userOrders.sort((a, b) => b.orderDate - a.orderDate); // Sort by most recent

            if (userOrders.length > 0) {
                userOrdersFound = true;
                userOrders.forEach(order => {
                    const orderItem = document.createElement('div');
                    orderItem.classList.add('order-item');
                    const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
                    orderItem.innerHTML = `
                        <p><strong>Product:</strong> ${order.productTitle}</p>
                        <p><strong>Price:</strong> $${order.productPrice.toFixed(2)}</p>
                        <p><strong>Order Date:</strong> ${orderDate}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                        <p><strong>Address:</strong> ${order.address}</p>
                        <p><strong>Phone:</strong> ${order.phoneNumber}</p>
                        <img src="${order.productImageUrl}" alt="${order.productTitle}" style="width: 100px; height: 100px; object-fit: cover; margin-top: 10px;">
                    `;
                    orderHistoryList.appendChild(orderItem);
                });
            }
        }

        if (!userOrdersFound) {
            orderHistoryList.innerHTML = '<p>No orders placed yet.</p>';
        }
    });
}


function updateRatingStars() {
    ratingStarsContainer.querySelectorAll('.fa-star').forEach(star => {
        const rating = parseInt(star.dataset.rating);
        if (rating <= selectedRating) {
            star.classList.remove('far');
            star.classList.add('fas', 'filled');
        } else {
            star.classList.remove('fas', 'filled');
            star.classList.add('far');
        }
    });
}

async function submitProductRating() {
    if (!currentProduct) {
        showCustomAlert('Error', 'No product selected to rate.');
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        showCustomAlert('Login Required', 'You must be logged in to submit a rating.');
        return;
    }

    if (selectedRating === 0) {
        showCustomAlert('Invalid Rating', 'Please select a star rating.');
        return;
    }

    try {
        const productRef = ref(database, `products/${currentProduct.id}/ratings/${user.uid}`);
        await set(productRef, selectedRating);
        showCustomAlert('Rating Submitted', 'Thank you for your feedback!');
        closeRatingModal();
        // Re-load products to update displayed ratings
        loadProducts();
    } catch (error) {
        console.error("Error submitting rating:", error);
        showCustomAlert('Error', 'Failed to submit rating. Please try again.');
    }
}

function openRatingModal() {
    selectedRating = 0; // Reset selected rating
    updateRatingStars(); // Update stars to reflect reset
    ratingModal.classList.add('active'); // Use class for animation
}

function closeRatingModal() {
    ratingModal.classList.remove('active');
}


// --- Authentication Functions ---
async function handleLogin() {
    const { email, password } = await showCustomAlert('Login', 'Please enter your email and password:', true, true);

    if (email && password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            showCustomAlert('Login Successful', `Welcome, ${user.email}!`);
            if (user.email === 'Hina@admin.com' && password === 'School123&') {
                // Admin login, directly navigate to admin.html
                window.location.href = 'admin.html';
            }
            // onAuthStateChanged listener will handle UI updates for regular users
        } catch (error) {
            console.error("Login error:", error.code, error.message);
            let errorMessage = "Failed to log in. Please check your credentials.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Invalid email or password.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            }
            showCustomAlert('Login Failed', errorMessage);
        }
    } else {
        showCustomAlert('Login Cancelled', 'Email and password are required for login.');
    }
}

async function handleRegister() {
    const { email, password } = await showCustomAlert('Register', 'Please enter your email and a password (min 6 characters):', true, true);

    if (email && password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            showCustomAlert('Registration Successful', `Account created for ${user.email}! You are now logged in.`);
            // onAuthStateChanged listener will handle UI updates
        } catch (error) {
            console.error("Registration error:", error.code, error.message);
            let errorMessage = "Failed to register. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already registered.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password should be at least 6 characters.";
            }
            showCustomAlert('Registration Failed', errorMessage);
        }
    } else {
        showCustomAlert('Registration Cancelled', 'Email and password are required for registration.');
    }
}

async function handleLogout() {
    const confirmLogout = await showCustomAlert('Confirm Logout', 'Are you sure you want to log out?', true);
    if (confirmLogout) {
        try {
            await signOut(auth);
            showCustomAlert('Logged Out', 'You have been successfully logged out.');
            // onAuthStateChanged listener will handle UI updates
        } catch (error) {
            console.error("Logout error:", error);
            showCustomAlert('Error', 'Failed to log out. Please try again.');
        }
    }
}

// --- Event Listeners ---
closeModalBtn.addEventListener('click', () => {
    productDetailsModal.style.display = 'none';
    modalProductVideo.querySelector('iframe').src = ''; // Stop video playback
});

window.addEventListener('click', (event) => {
    if (event.target === productDetailsModal) {
        productDetailsModal.style.display = 'none';
        modalProductVideo.querySelector('iframe').src = ''; // Stop video playback
    }
    // Only close if it's the overlay and not the modal content itself
    if (event.target === customAlertModal) {
        customAlertModal.classList.remove('active');
    }
});

categoryFilters.addEventListener('click', (event) => {
    if (event.target.classList.contains('category-button')) {
        categoryFilters.querySelectorAll('.category-button').forEach(button => {
            button.classList.remove('active');
        });
        event.target.classList.add('active');
        applyFiltersAndSort();
    }
});

sortSelect.addEventListener('change', applyFiltersAndSort);
searchButton.addEventListener('click', applyFiltersAndSort);
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        applyFiltersAndSort();
    }
});

placeOrderButton.addEventListener('click', placeOrder);

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

// Auth button event listeners
loginButton.addEventListener('click', handleLogin);
registerButton.addEventListener('click', handleRegister);
logoutButton.addEventListener('click', handleLogout);

// Open Code in Canvas button
openCodeButton.addEventListener('click', async () => {
    const response = await fetch('index.html');
    const htmlContent = await response.text();
    // This will open a new immersive with the HTML content
    // The actual mechanism for "opening a new canvas" is handled by the environment.
    // For demonstration, I'm providing the content here.
    console.log("HTML content for new canvas:", htmlContent);
    // In a real Canvas environment, you would use a specific API to create a new immersive.
    // Since I cannot directly trigger that, I'm logging it and providing it in the response.
});


// --- Authentication State Listener ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginButton.style.display = 'none';
        registerButton.style.display = 'none'; // Hide register button when logged in
        logoutButton.style.display = 'inline-block';
        // Check if the logged-in user is the admin
        if (user.email === 'Hina@admin.com') { // Use the specified admin email
            adminLinkContainer.style.display = 'list-item'; // Show admin link
        } else {
            adminLinkContainer.style.display = 'none'; // Hide admin link for regular users
        }
        // Load user-specific data like order history
        loadOrderHistory();
    } else {
        // User is signed out
        loginButton.style.display = 'inline-block';
        registerButton.style.display = 'inline-block'; // Show register button when logged out
        logoutButton.style.display = 'none';
        adminLinkContainer.style.display = 'none'; // Always hide admin link if not logged in
        orderHistorySection.style.display = 'none'; // Hide order history
        toggleOrderHistoryBtn.textContent = 'Show Order History';
    }
});


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadProducts(); // Initial load of products
    // Firebase auth state listener handles initial data loading based on user status
});
