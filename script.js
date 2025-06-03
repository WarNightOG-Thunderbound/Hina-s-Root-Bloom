// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
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
  appId: "1:967448486557:web:8c51a02796e62111c1d81b",
  measurementId: "G-65W55QJJF4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);


// --- DOM Elements ---
const adminLoginLink = document.getElementById('admin-login-link');
const homeLink = document.getElementById('home-link');
const adminLoginSection = document.getElementById('admin-login-section');
const productListingSection = document.getElementById('product-listing-section');
const adminEmailInput = document.getElementById('admin-email');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminLoginError = document.getElementById('admin-login-error');
const productGrid = document.getElementById('product-grid');
const searchInput = document.getElementById('product-search');
const searchButton = document.getElementById('search-button');
const sortSelect = document.getElementById('sort-select');
const categoryFiltersContainer = document.getElementById('category-filters');

// Product Detail Modal
const productDetailModal = document.getElementById('product-detail-modal');
const closeDetailModalBtn = document.getElementById('close-detail-modal-btn');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductVideo = document.getElementById('modal-product-video');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductRating = document.getElementById('modal-product-rating');
const placeOrderDetailBtn = document.getElementById('place-order-detail-btn');


// Order Form Modal
const orderFormModal = document.getElementById('order-form-modal');
const closeOrderFormModalBtn = document.getElementById('close-order-form-modal-btn');
const orderAddressInput = document.getElementById('order-address');
const orderPhoneInput = document.getElementById('order-phone');
const submitOrderBtn = document.getElementById('submit-order-btn');

// Rating Modal
const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.getElementById('close-rating-modal-btn');
const ratingProductTitle = document.getElementById('rating-product-title');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const submitRatingButton = document.getElementById('submit-rating-button');
const ratingError = document.getElementById('rating-error');

// Custom Alert Modal
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


let products = [];
let selectedRating = 0;
let currentProductToRate = null; // Stores the product ID for the rating modal
let currentProductToOrder = null; // Stores the product details for the order form


// --- Utility Functions ---
function showCustomAlert(title, message, type = 'alert', onOk = null, onCancel = null) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customModalCancelBtn.style.display = 'none'; // Hide cancel by default

    customModalOkBtn.onclick = () => {
        customAlertModal.style.display = 'none';
        if (onOk) onOk();
    };

    if (type === 'confirm') {
        customModalCancelBtn.style.display = 'inline-block';
        customModalCancelBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            if (onCancel) onCancel();
        };
    }

    customAlertModal.style.display = 'flex';
}

// --- Admin Authentication ---
adminLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    adminLoginSection.style.display = 'block';
    productListingSection.style.display = 'none';
});

homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    adminLoginSection.style.display = 'none';
    productListingSection.style.display = 'block';
    // Clear any previous login errors
    adminLoginError.textContent = '';
    adminEmailInput.value = '';
    adminPasswordInput.value = '';
});

adminLoginBtn.addEventListener('click', () => {
    const email = adminEmailInput.value;
    const password = adminPasswordInput.value;

    if (!email || !password) {
        adminLoginError.textContent = "Please enter both email and password.";
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in successfully
            adminLoginError.textContent = "";
            showCustomAlert("Login Successful", "Redirecting to admin panel...", 'alert', () => {
                window.location.href = 'admin.html'; // Redirect to admin page
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Login error:", errorCode, errorMessage);
            adminLoginError.textContent = "Login failed: Invalid email or password.";
        });
});


// --- Product Display ---
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
        showCustomAlert("Error", "Failed to load products. Please try again later.", 'alert');
    });
}

function displayProducts(productsToDisplay) {
    productGrid.innerHTML = ''; // Clear current products
    if (productsToDisplay.length === 0) {
        productGrid.innerHTML = '<p class="no-results">No products found matching your criteria.</p>';
        return;
    }

    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.id = product.id;

        const averageRating = calculateAverageRating(product.id, product.ratings);

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.imageUrl || 'placeholder.png'}" alt="${product.title}">
            </div>
            <h3 class="product-title">${product.title}</h3>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <div class="product-rating">
                ${generateStarRating(averageRating)}
                <span class="rating-count">(${Object.keys(product.ratings || {}).length})</span>
            </div>
            <button class="button secondary view-detail-btn" data-id="${product.id}"><i class="fas fa-info-circle"></i> View Detail</button>
        `;
        productGrid.appendChild(productCard);
    });

    document.querySelectorAll('.view-detail-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            openProductDetailModal(productId);
        });
    });
}

function generateStarRating(averageRating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= averageRating) {
            starsHtml += '<i class="fas fa-star filled"></i>';
        } else if (i - 0.5 <= averageRating) {
            starsHtml += '<i class="fas fa-star-half-alt filled"></i>';
        } else {
            starsHtml += '<i class="far fa-star"></i>';
        }
    }
    return starsHtml;
}

function calculateAverageRating(productId, ratings) {
    if (!ratings) return 0;
    const ratingValues = Object.values(ratings).map(r => r.rating);
    if (ratingValues.length === 0) return 0;
    const sum = ratingValues.reduce((acc, curr) => acc + curr, 0);
    return sum / ratingValues.length;
}

// --- Search and Sort ---
searchInput.addEventListener('input', filterAndSortProducts);
searchButton.addEventListener('click', filterAndSortProducts);
sortSelect.addEventListener('change', filterAndSortProducts);

function filterAndSortProducts() {
    let filteredProducts = [...products];
    const searchTerm = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;
    const activeCategoryButton = document.querySelector('.category-button.active');
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'all';


    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }

    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

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
        case 'rating-desc':
            filteredProducts.sort((a, b) => {
                const ratingA = calculateAverageRating(a.id, a.ratings);
                const ratingB = calculateAverageRating(b.id, b.ratings);
                return ratingB - ratingA;
            });
            break;
        default:
            // No specific sort, maintain original order or Firebase order
            break;
    }

    displayProducts(filteredProducts);
}

// --- Category Filters ---
function populateCategoryFilters(productsData) {
    const categories = new Set(['all']);
    productsData.forEach(product => {
        if (product.category) {
            categories.add(product.category);
        }
    });

    categoryFiltersContainer.innerHTML = '';
    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('category-button');
        if (category === 'all') {
            button.classList.add('active');
        }
        button.dataset.category = category;
        button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryFiltersContainer.appendChild(button);
    });

    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', (event) => {
            document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            filterAndSortProducts();
        });
    });
}

// --- Product Detail Modal ---
function openProductDetailModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showCustomAlert("Error", "Product not found.", 'alert');
        return;
    }

    currentProductToOrder = product; // Set the product for ordering

    modalProductImage.src = product.imageUrl || 'placeholder.png';
    modalProductTitle.textContent = product.title;
    modalProductPrice.textContent = `$${product.price.toFixed(2)}`;
    modalProductCategory.textContent = `Category: ${product.category || 'N/A'}`;
    modalProductDescription.textContent = product.description;

    // Handle video display
    if (product.videoUrl) {
        modalProductVideo.innerHTML = `<iframe src="${product.videoUrl}" frameborder="0" allowfullscreen></iframe>`;
        modalProductVideo.style.display = 'block';
    } else {
        modalProductVideo.innerHTML = '';
        modalProductVideo.style.display = 'none';
    }

    const averageRating = calculateAverageRating(product.id, product.ratings);
    modalProductRating.innerHTML = `Average Rating: ${generateStarRating(averageRating)} (${Object.keys(product.ratings || {}).length} reviews)`;

    productDetailModal.style.display = 'flex';
}

closeDetailModalBtn.addEventListener('click', () => {
    productDetailModal.style.display = 'none';
    currentProductToOrder = null; // Clear the product when modal is closed
});

window.addEventListener('click', (event) => {
    if (event.target === productDetailModal) {
        productDetailModal.style.display = 'none';
        currentProductToOrder = null;
    } else if (event.target === orderFormModal) {
        orderFormModal.style.display = 'none';
    } else if (event.target === ratingModal) {
        closeRatingModal();
    } else if (event.target === customAlertModal) {
        customAlertModal.style.display = 'none';
    }
});


// --- Place Order Logic (from Product Detail) ---
placeOrderDetailBtn.addEventListener('click', () => {
    if (currentProductToOrder) {
        orderFormModal.style.display = 'flex';
        productDetailModal.style.display = 'none'; // Close detail modal
        orderAddressInput.value = ''; // Clear previous input
        orderPhoneInput.value = ''; // Clear previous input
    } else {
        showCustomAlert("Error", "No product selected for order.", 'alert');
    }
});

closeOrderFormModalBtn.addEventListener('click', () => {
    orderFormModal.style.display = 'none';
});

submitOrderBtn.addEventListener('click', () => {
    const address = orderAddressInput.value.trim();
    const phoneNumber = orderPhoneInput.value.trim();

    if (!address || !phoneNumber) {
        showCustomAlert("Input Required", "Please provide your delivery address and phone number.", 'alert');
        return;
    }

    if (!currentProductToOrder) {
        showCustomAlert("Error", "No product selected for order.", 'alert');
        return;
    }

    // Prepare order data
    const orderData = {
        productId: currentProductToOrder.id,
        productTitle: currentProductToOrder.title,
        productPrice: currentProductToOrder.price,
        productImageUrl: currentProductToOrder.imageUrl || 'placeholder.png',
        address: address,
        phoneNumber: phoneNumber,
        orderDate: serverTimestamp(),
        status: 'Pending' // Initial status
    };

    const ordersRef = ref(database, 'orders');
    push(ordersRef, orderData)
        .then(() => {
            showCustomAlert("Order Placed!", "Your order has been placed successfully. We will contact you soon!", 'alert', () => {
                orderFormModal.style.display = 'none';
                currentProductToOrder = null; // Clear current product after successful order
            });
        })
        .catch(error => {
            console.error("Error placing order:", error);
            showCustomAlert("Order Failed", "There was an error placing your order. Please try again.", 'alert');
        });
});


// --- Rating System ---
function openRatingModal(productId) {
    currentProductToRate = productId;
    const product = products.find(p => p.id === productId);
    if (product) {
        ratingProductTitle.textContent = product.title;
        selectedRating = 0; // Reset selected rating
        updateRatingStars();
        ratingError.textContent = ''; // Clear any previous error
        ratingModal.style.display = 'flex';
    } else {
        showCustomAlert("Error", "Product not found for rating.", 'alert');
    }
}

function closeRatingModal() {
    ratingModal.style.display = 'none';
    currentProductToRate = null;
    selectedRating = 0;
    updateRatingStars();
}

function updateRatingStars() {
    ratingStarsContainer.querySelectorAll('.fa-star').forEach(star => {
        const rating = parseInt(star.dataset.rating);
        if (rating <= selectedRating) {
            star.classList.remove('far');
            star.classList.add('fas');
            star.classList.add('filled');
        } else {
            star.classList.remove('fas');
            star.classList.remove('filled');
            star.classList.add('far');
        }
    });
}

ratingStarsContainer.addEventListener('click', (event) => {
    const star = event.target.closest('.fa-star');
    if (star) {
        selectedRating = parseInt(star.dataset.rating);
        updateRatingStars();
    }
});

submitRatingButton.addEventListener('click', submitProductRating);

function submitProductRating() {
    if (!currentProductToRate) {
        ratingError.textContent = "No product selected for rating.";
        return;
    }
    if (selectedRating === 0) {
        ratingError.textContent = "Please select a star rating.";
        return;
    }

    const productRef = ref(database, `products/${currentProductToRate}/ratings`);
    push(productRef, {
        rating: selectedRating,
        timestamp: serverTimestamp()
    })
    .then(() => {
        showCustomAlert("Rating Submitted", "Thank you for your rating!", 'alert', () => {
            closeRatingModal();
        });
    })
    .catch(error => {
        console.error("Error submitting rating:", error);
        showCustomAlert("Error", "Failed to submit rating. Please try again.", 'alert');
    });
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadProducts(); // Load products for the main display
});
