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
  appId: "1:967448486557:web:c0b31e19d7d24268e36780",
  measurementId: "G-G6Q7K8Q9C1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Keep as is, per user request to ignore 404
const auth = getAuth(app);
const database = getDatabase(app);

// --- DOM Elements ---
const loginSignupBtn = document.getElementById('login-signup-btn');
const profileBtn = document.getElementById('profile-btn');
const userEmailDisplay = document.getElementById('user-email-display');
const profileDropdown = document.getElementById('profile-dropdown');
const logoutButton = document.getElementById('logout-btn');
const authModal = document.getElementById('auth-modal');
const closeAuthModalBtn = document.getElementById('close-auth-modal');
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const productGrid = document.getElementById('product-grid');
const productDetailModal = document.getElementById('product-detail-modal');
const closeProductDetailModalBtn = document.getElementById('close-product-detail-modal');
const modalProductName = document.getElementById('modal-product-name');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductVideoContainer = document.getElementById('modal-product-video-container');
const modalProductVideo = document.getElementById('modal-product-video');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductCategory = document.getElementById('modal-product-category');
const categoryFiltersContainer = document.querySelector('.category-filters');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');
const viewOrdersBtn = document.getElementById('view-orders-btn');
const orderHistorySection = document.getElementById('order-history-section');
const orderHistoryList = document.getElementById('order-history-list');
const closeOrderHistoryBtn = document.getElementById('close-order-history-btn');
const contactForm = document.getElementById('contact-form');

// Rating elements
const rateProductButton = document.getElementById('rate-product-btn');
const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.getElementById('close-rating-modal');
const ratingProductName = document.getElementById('rating-product-name');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const ratingCommentInput = document.getElementById('rating-comment');
const submitRatingButton = document.getElementById('submit-rating-btn');
const modalProductRatingDisplay = document.getElementById('modal-product-rating-display');
const displayStars = document.getElementById('display-stars');
const ratingCount = document.getElementById('rating-count');


// Custom Alert Modal Elements
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


let currentProduct = null;
let selectedRating = 0;
let currentUser = null; // To store current logged-in user

// --- Utility Functions ---

function showCustomAlert(title, message, isConfirm = false, onConfirm = null, onCancel = null) {
    if (customAlertModal && customModalTitle && customModalMessage && customModalOkBtn && customModalCancelBtn) {
        customModalTitle.textContent = title;
        customModalMessage.textContent = message;
        customModalCancelBtn.style.display = isConfirm ? 'inline-block' : 'none';
        customAlertModal.style.display = 'flex'; // Use flex to center

        customModalOkBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            if (onConfirm && isConfirm) {
                onConfirm();
            }
        };

        if (isConfirm) {
            customModalCancelBtn.onclick = () => {
                customAlertModal.style.display = 'none';
                if (onCancel) {
                    onCancel();
                }
            };
        }
    } else {
        alert(`${title}\n${message}`); // Fallback
    }
}

function showAuthModal() {
    if (authModal) authModal.style.display = 'flex';
    if (loginSection) loginSection.style.display = 'block';
    if (signupSection) signupSection.style.display = 'none';
}

function closeAuthModal() {
    if (authModal) authModal.style.display = 'none';
}

function showProductDetailModal() {
    if (productDetailModal) productDetailModal.style.display = 'flex';
}

function closeProductDetailModal() {
    if (productDetailModal) productDetailModal.style.display = 'none';
    currentProduct = null;
    if (modalProductVideo) modalProductVideo.src = ""; // Stop video playback
}

function showRatingModal() {
    if (ratingModal) ratingModal.style.display = 'flex';
    if (ratingCommentInput) ratingCommentInput.value = '';
    selectedRating = 0;
    updateRatingStars();
    if (currentProduct && ratingProductName) {
        ratingProductName.textContent = currentProduct.title;
    }
}

function closeRatingModal() {
    if (ratingModal) ratingModal.style.display = 'none';
}

function updateRatingStars() {
    if (ratingStarsContainer) {
        const stars = ratingStarsContainer.querySelectorAll('.fa-star');
        stars.forEach((star, index) => {
            if (index < selectedRating) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
    }
}

// --- Firebase Authentication ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        if (loginSignupBtn) loginSignupBtn.style.display = 'none';
        if (profileBtn) {
            profileBtn.style.display = 'block';
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;
        }
        closeAuthModal();
        console.log("User logged in:", user.uid);
    } else {
        currentUser = null;
        if (loginSignupBtn) loginSignupBtn.style.display = 'block';
        if (profileBtn) profileBtn.style.display = 'none';
        if (userEmailDisplay) userEmailDisplay.textContent = '';
        console.log("User logged out.");
    }
});

function handleLogin(event) {
    event.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            // onAuthStateChanged will handle UI update
            console.log("Logged in successfully.");
            showCustomAlert("Success", "Logged in successfully!");
        })
        .catch((error) => {
            const errorMessage = error.message;
            console.error("Login error:", errorMessage);
            showCustomAlert("Login Failed", errorMessage);
        });
}

function handleSignup(event) {
    event.preventDefault();
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up
            // onAuthStateChanged will handle UI update
            console.log("Signed up successfully.");
            showCustomAlert("Success", "Account created successfully! You are now logged in.");
        })
        .catch((error) => {
            const errorMessage = error.message;
            console.error("Signup error:", errorMessage);
            showCustomAlert("Signup Failed", errorMessage);
        });
}

function handleLogout() {
    showCustomAlert("Confirm Logout", "Are you sure you want to log out?", true, () => {
        signOut(auth).then(() => {
            // Signed out
            console.log("Signed out successfully.");
            showCustomAlert("Success", "Logged out successfully!");
        }).catch((error) => {
            console.error("Logout error:", error.message);
            showCustomAlert("Logout Failed", error.message);
        });
    });
}

// --- Product Display & Filtering ---

function displayProducts(products) {
    if (!productGrid) return;
    productGrid.innerHTML = ''; // Clear existing products
    if (!products || products.length === 0) {
        productGrid.innerHTML = '<p>No products found.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" alt="${product.title}">
            </div>
            <h3 class="product-title">${product.title}</h3>
            <p class="product-price">PKR ${product.price}</p>
            <div class="product-rating-display">
                Rating: <span class="stars">${generateStarHtml(product.averageRating || 0)}</span> (${product.ratingCount || 0} reviews)
            </div>
            <button class="view-detail-btn" data-id="${product.id}">View Detail</button>
        `;
        productGrid.appendChild(productCard);
    });

    document.querySelectorAll('.view-detail-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                openProductDetailModal(product);
            }
        });
    });
}

let allProducts = [];
let allCategories = new Set();

function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        allProducts = [];
        allCategories = new Set(['all']); // Always include 'all'
        snapshot.forEach((childSnapshot) => {
            const product = { id: childSnapshot.key, ...childSnapshot.val() };
            allProducts.push(product);
            if (product.category) {
                allCategories.add(product.category);
            }
        });
        updateCategoryFilters();
        applyFiltersAndSort(); // Display initial products
    }, (error) => {
        console.error("Error loading products:", error);
        showCustomAlert("Error", "Failed to load products.");
    });
}

function updateCategoryFilters() {
    if (!categoryFiltersContainer) return;
    categoryFiltersContainer.innerHTML = ''; // Clear existing buttons
    const sortedCategories = Array.from(allCategories).sort((a, b) => {
        if (a === 'all') return -1; // 'all' comes first
        if (b === 'all') return 1;
        return a.localeCompare(b);
    });

    sortedCategories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-button';
        if (category === 'all') {
            button.classList.add('active');
        }
        button.dataset.category = category;
        button.textContent = category;
        button.addEventListener('click', () => {
            // Remove active from all and add to clicked
            document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            applyFiltersAndSort();
        });
        categoryFiltersContainer.appendChild(button);
    });
}


function applyFiltersAndSort() {
    let filteredProducts = [...allProducts];

    // Filter by category
    const activeCategoryButton = document.querySelector('.category-button.active');
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'all';

    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

    // Filter by search input
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }

    // Sort products
    const sortMethod = sortSelect.value;
    filteredProducts.sort((a, b) => {
        if (sortMethod === 'price-asc') {
            return parseFloat(a.price) - parseFloat(b.price);
        } else if (sortMethod === 'price-desc') {
            return parseFloat(b.price) - parseFloat(a.price);
        } else if (sortMethod === 'name-asc') {
            return a.title.localeCompare(b.title);
        } else if (sortMethod === 'name-desc') {
            return b.title.localeCompare(a.title);
        } else if (sortMethod === 'rating-desc') {
            return (b.averageRating || 0) - (a.averageRating || 0);
        }
        return 0; // Default or no sorting
    });

    displayProducts(filteredProducts);
}


function openProductDetailModal(product) {
    currentProduct = product;
    if (modalProductName) modalProductName.textContent = product.title;
    if (modalProductPrice) modalProductPrice.textContent = `PKR ${product.price}`;
    if (modalProductImage) modalProductImage.src = product.imageUrl;
    if (modalProductDescription) modalProductDescription.textContent = product.description;
    if (modalProductCategory) modalProductCategory.textContent = `Category: ${product.category}`;

    if (product.videoUrl && modalProductVideoContainer && modalProductVideo) {
        modalProductVideoContainer.style.display = 'block';
        // Ensure YouTube embedded URL format. Basic check.
        let videoEmbedUrl = product.videoUrl;
        if (product.videoUrl.includes('youtube.com/watch?v=')) {
            const videoId = product.videoUrl.split('v=')[1].split('&')[0];
            videoEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (product.videoUrl.includes('youtu.be/')) {
            const videoId = product.videoUrl.split('youtu.be/')[1].split('?')[0];
            videoEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        modalProductVideo.src = videoEmbedUrl;
    } else if (modalProductVideoContainer) {
        modalProductVideoContainer.style.display = 'none';
        if (modalProductVideo) modalProductVideo.src = '';
    }

    loadProductRatings(product.id); // Load ratings for the current product

    showProductDetailModal();
}

// --- Order History ---
function loadOrderHistory() {
    if (!currentUser || !orderHistoryList) {
        orderHistoryList.innerHTML = '<p>Please log in to view your order history.</p>';
        return;
    }

    orderHistoryList.innerHTML = '<p>Loading order history...</p>';
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        let ordersFound = false;
        orderHistoryList.innerHTML = ''; // Clear previous
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (order.userId === currentUser.uid) {
                ordersFound = true;
                const orderItem = document.createElement('div');
                orderItem.className = 'order-item';
                const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
                orderItem.innerHTML = `
                    <h4>Order ID: ${childSnapshot.key}</h4>
                    <p>Product: ${order.productName}</p>
                    <p>Quantity: ${order.quantity}</p>
                    <p>Total Price: PKR ${order.totalPrice}</p>
                    <p>Status: <span class="order-status ${order.status.toLowerCase()}">${order.status}</span></p>
                    <p>Order Date: ${orderDate}</p>
                    <p>Shipping Address: ${order.shippingAddress}</p>
                `;
                orderHistoryList.appendChild(orderItem);
            }
        });
        if (!ordersFound) {
            orderHistoryList.innerHTML = '<p>No orders found for your account.</p>';
        }
    }, (error) => {
        console.error("Error loading order history:", error);
        showCustomAlert("Error", "Failed to load order history.");
    });
}


// --- Product Rating ---

function generateStarHtml(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < (5 - fullStars - (hasHalfStar ? 1 : 0)); i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    return starsHtml;
}

async function loadProductRatings(productId) {
    const ratingsRef = ref(database, `ratings/${productId}`);
    onValue(ratingsRef, (snapshot) => {
        let totalRating = 0;
        let count = 0;
        snapshot.forEach((childSnapshot) => {
            const rating = childSnapshot.val();
            totalRating += rating.value;
            count++;
        });

        const averageRating = count > 0 ? (totalRating / count) : 0;

        if (displayStars) displayStars.innerHTML = generateStarHtml(averageRating);
        if (ratingCount) ratingCount.textContent = count;

        // Also update product data in allProducts array
        const productIndex = allProducts.findIndex(p => p.id === productId);
        if (productIndex > -1) {
            allProducts[productIndex].averageRating = averageRating;
            allProducts[productIndex].ratingCount = count;
        }
    });
}

async function submitProductRating() {
    if (!currentUser) {
        showCustomAlert("Login Required", "Please log in to submit a rating.");
        closeRatingModal();
        showAuthModal();
        return;
    }
    if (!currentProduct) {
        showCustomAlert("Error", "No product selected to rate.");
        return;
    }
    if (selectedRating === 0) {
        showCustomAlert("Invalid Rating", "Please select a star rating.");
        return;
    }

    const comment = ratingCommentInput.value.trim();
    const ratingData = {
        value: selectedRating,
        comment: comment,
        userId: currentUser.uid,
        userName: currentUser.email, // Or displayName if you collect it
        timestamp: serverTimestamp()
    };

    try {
        await set(ref(database, `ratings/${currentProduct.id}/${currentUser.uid}`), ratingData);
        showCustomAlert("Rating Submitted!", "Thank you for your feedback!");
        closeRatingModal();
    } catch (error) {
        console.error("Error submitting rating:", error);
        showCustomAlert("Submission Failed", `There was an error submitting your rating: ${error.message}`);
    }
}

// --- Contact Form ---
function handleContactFormSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
        showCustomAlert("Input Error", "Please fill in all fields.");
        return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showCustomAlert("Invalid Email", "Please enter a valid email address.");
        return;
    }

    const contactMessage = {
        name: name,
        email: email,
        message: message,
        timestamp: serverTimestamp()
    };

    push(ref(database, 'contactMessages'), contactMessage)
        .then(() => {
            showCustomAlert("Success", "Your message has been sent!");
            contactForm.reset();
        })
        .catch((error) => {
            console.error("Error sending message:", error);
            showCustomAlert("Error", "Failed to send message: " + error.message);
        });
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if elements exist before adding listeners to avoid TypeError
    if (loginSignupBtn) {
        loginSignupBtn.addEventListener('click', showAuthModal);
    }

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            if (profileDropdown) profileDropdown.classList.toggle('show');
        });
        // Close dropdown if clicked outside
        window.addEventListener('click', (event) => {
            if (!profileBtn.contains(event.target) && !profileDropdown.contains(event.target)) {
                if (profileDropdown) profileDropdown.classList.remove('show');
            }
        });
    }


    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    if (closeAuthModalBtn) {
        closeAuthModalBtn.addEventListener('click', closeAuthModal);
    }
    // Close modal if clicked outside content
    if (authModal) {
        authModal.addEventListener('click', (event) => {
            if (event.target === authModal) {
                closeAuthModal();
            }
        });
    }

    if (showSignupLink) {
        showSignupLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (loginSection) loginSection.style.display = 'none';
            if (signupSection) signupSection.style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (signupSection) signupSection.style.display = 'none';
            if (loginSection) loginSection.style.display = 'block';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    if (closeProductDetailModalBtn) {
        closeProductDetailModalBtn.addEventListener('click', closeProductDetailModal);
    }
    // Close modal if clicked outside content
    if (productDetailModal) {
        productDetailModal.addEventListener('click', (event) => {
            if (event.target === productDetailModal) {
                closeProductDetailModal();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', applyFiltersAndSort);
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFiltersAndSort);
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFiltersAndSort);
    }

    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', () => {
            if (orderHistorySection) {
                orderHistorySection.style.display = 'block';
                loadOrderHistory();
            }
            if (profileDropdown) profileDropdown.classList.remove('show'); // Hide dropdown after clicking
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

    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }

    loadProducts(); // Initial load of products
});
