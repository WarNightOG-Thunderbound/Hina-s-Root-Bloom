// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getDatabase, ref, push, onValue, serverTimestamp, update, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
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
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements ---
const productGrid = document.getElementById('product-grid');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const sortSelect = document.getElementById('sort-select');
const categoryFilterContainer = document.querySelector('.category-filter');
const exploreProductsBtn = document.getElementById('explore-products-btn');

// Product Detail Modal
const productDetailModal = document.getElementById('product-detail-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductVideo = document.getElementById('modal-product-video');
const modalProductVideoIframe = document.getElementById('modal-product-video-iframe');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductCategory = document.getElementById('modal-product-category');
const modalAverageRatingDisplay = document.getElementById('modal-average-rating-display');
const modalTotalReviews = document.getElementById('modal-total-reviews');
const placeOrderButton = document.getElementById('place-order-button');

// Place Order Modal
const placeOrderModal = document.getElementById('place-order-modal');
const closePlaceOrderModalBtn = document.getElementById('close-place-order-modal-btn');
const orderProductTitleSpan = document.getElementById('order-product-title');
const orderProductIdInput = document.getElementById('order-product-id');
const orderProductPriceInput = document.getElementById('order-product-price');
const orderProductImageUrlInput = document.getElementById('order-product-image-url');
const customerAddressInput = document.getElementById('customer-address');
const customerPhoneInput = document.getElementById('customer-phone');
const orderRatingStarsContainer = document.getElementById('order-rating-stars-container');
const orderRatingError = document.getElementById('order-rating-error');
const orderFormMessage = document.getElementById('order-form-message');
const submitOrderButton = document.getElementById('submit-order-button');


// Custom Alert Modal
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


let allProducts = [];
let filteredProducts = [];
let currentProductForOrder = null; // Stores the product object for the current order
let selectedOrderRating = 0; // To store the rating selected in the order modal


// --- Utility Functions ---
function showCustomAlert(title, message, type = 'alert', onOk = null, onCancel = null) {
    if (customModalTitle) customModalTitle.textContent = title;
    if (customModalMessage) customModalMessage.textContent = message;
    if (customModalCancelBtn) customModalCancelBtn.style.display = 'none'; // Hide cancel by default

    if (customModalOkBtn) {
        customModalOkBtn.onclick = () => {
            if (customAlertModal) customAlertModal.style.display = 'none';
            if (onOk) onOk();
        };
    }

    if (type === 'confirm' && customModalCancelBtn) {
        customModalCancelBtn.style.display = 'inline-block';
        customModalCancelBtn.onclick = () => {
            if (customAlertModal) customAlertModal.style.display = 'none';
            if (onCancel) onCancel();
        };
    }

    if (customAlertModal) customAlertModal.style.display = 'flex';
}

function calculateAverageRating(ratings) {
    if (!ratings || Object.keys(ratings).length === 0) {
        return 0;
    }
    const totalRatings = Object.values(ratings).length;
    const sumRatings = Object.values(ratings).reduce((sum, r) => sum + r.rating, 0);
    return sumRatings / totalRatings;
}

function generateStarRating(averageRating) {
    const fullStars = Math.floor(averageRating);
    const halfStar = averageRating % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star" style="color: gold;"></i>';
    }
    if (halfStar) {
        starsHtml += '<i class="fas fa-star-half-alt" style="color: gold;"></i>';
    }
    for (let i = 0; i < (5 - fullStars - (halfStar ? 1 : 0)); i++) {
        starsHtml += '<i class="far fa-star" style="color: gold;"></i>';
    }
    return starsHtml;
}


// --- Product Listing and Filtering ---
function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        allProducts = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const product = { id: childSnapshot.key, ...childSnapshot.val() };
                allProducts.push(product);
            });
        }
        applyFiltersAndSort();
    });
}

function renderProducts(productsToRender) {
    if (productGrid) productGrid.innerHTML = ''; // Clear existing products

    if (productsToRender.length === 0) {
        if (productGrid) productGrid.innerHTML = '<p>No products found matching your criteria.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const averageRating = calculateAverageRating(product.ratings);
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.imageUrl || 'Hina%E2%80%99s%20Root&Bloom.png'}" alt="${product.title}" class="product-image">
            </div>
            <h3 class="product-card-title">${product.title}</h3>
            <p class="product-card-price">$${product.price.toFixed(2)}</p>
            <div class="product-card-rating">
                ${generateStarRating(averageRating)} (${Object.keys(product.ratings || {}).length} reviews)
            </div>
            <button class="button secondary view-detail-btn" data-id="${product.id}">View Details</button>
        `;
        if (productGrid) productGrid.appendChild(productCard);
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

function applyFiltersAndSort() {
    let currentProducts = [...allProducts];

    // Category Filter
    const activeCategoryButton = document.querySelector('.category-button.active');
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'all';
    if (selectedCategory !== 'all') {
        currentProducts = currentProducts.filter(product => product.category === selectedCategory);
    }

    // Search Filter
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (searchTerm) {
        currentProducts = currentProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }

    // Sorting
    const sortBy = sortSelect ? sortSelect.value : 'default';
    if (sortBy === 'price-asc') {
        currentProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        currentProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating-desc') {
        currentProducts.sort((a, b) => {
            const ratingA = calculateAverageRating(a.ratings);
            const ratingB = calculateAverageRating(b.ratings);
            return ratingB - ratingA;
        });
    }

    filteredProducts = currentProducts; // Store the filtered products
    renderProducts(filteredProducts);
}


// --- Event Listeners for Filtering and Sorting ---
if (searchButton) searchButton.addEventListener('click', applyFiltersAndSort);
if (searchInput) {
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            applyFiltersAndSort();
        }
    });
}
if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndSort);

// --- Category Filtering ---
function loadCategories() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        if (categoryFilterContainer) {
            // Keep "All" button, remove others
            categoryFilterContainer.querySelectorAll('.category-button:not([data-category="all"])').forEach(button => button.remove());
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const categoryName = childSnapshot.key;
                    const button = document.createElement('button');
                    button.className = 'category-button';
                    button.dataset.category = categoryName;
                    button.textContent = categoryName;
                    categoryFilterContainer.appendChild(button);
                });
            }
            addCategoryButtonListeners();
        }
    });
}

function addCategoryButtonListeners() {
    if (categoryFilterContainer) {
        categoryFilterContainer.querySelectorAll('.category-button').forEach(button => {
            button.removeEventListener('click', handleCategoryClick); // Prevent duplicate listeners
            button.addEventListener('click', handleCategoryClick);
        });
    }
}

function handleCategoryClick(event) {
    if (categoryFilterContainer) {
        categoryFilterContainer.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
    }
    event.target.classList.add('active');
    applyFiltersAndSort();
}


// --- Product Detail Modal ---
function openProductDetailModal(product) {
    if (!productDetailModal || !modalProductTitle || !modalProductImage || !modalProductDescription || !modalProductPrice || !modalProductCategory || !modalAverageRatingDisplay || !modalTotalReviews || !modalProductVideo || !modalProductVideoIframe) {
        console.error("One or more modal elements not found.");
        return;
    }

    currentProductForOrder = product; // Store the full product object

    modalProductTitle.textContent = product.title;
    modalProductImage.src = product.imageUrl || 'Hina%E2%80%99s%20Root&Bloom.png';
    modalProductDescription.textContent = product.description;
    modalProductPrice.textContent = product.price.toFixed(2);
    modalProductCategory.textContent = product.category;

    const averageRating = calculateAverageRating(product.ratings);
    const totalReviews = Object.keys(product.ratings || {}).length;
    modalAverageRatingDisplay.innerHTML = `${averageRating.toFixed(1)} ${generateStarRating(averageRating)}`;
    modalTotalReviews.textContent = totalReviews;

    if (product.videoUrl) {
        modalProductVideo.style.display = 'block';
        // Simple YouTube URL embed. More robust parsing might be needed for other video platforms.
        const youtubeMatch = product.videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/);
        if (youtubeMatch && youtubeMatch[1]) {
            modalProductVideoIframe.src = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        } else {
            modalProductVideoIframe.src = product.videoUrl; // Fallback for direct video URLs
        }
    } else {
        modalProductVideo.style.display = 'none';
        modalProductVideoIframe.src = '';
    }

    productDetailModal.style.display = 'flex'; // Show the modal

    // Populate hidden fields for the order modal (to be used when Place Order is clicked)
    if (orderProductIdInput) orderProductIdInput.value = product.id;
    if (orderProductPriceInput) orderProductPriceInput.value = product.price;
    if (orderProductImageUrlInput) orderProductImageUrlInput.value = product.imageUrl || 'Hina%E2%80%99s%20Root&Bloom.png';

    // Reset rating selection for order modal
    selectedOrderRating = 0;
    updateOrderRatingStars();
    if (orderRatingError) orderRatingError.textContent = '';
    if (orderFormMessage) orderFormMessage.textContent = '';
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (productDetailModal) productDetailModal.style.display = 'none';
        // Clear video iframe to stop playback
        if (modalProductVideoIframe) modalProductVideoIframe.src = '';
    });
}

// --- Place Order Modal Logic ---
if (placeOrderButton) {
    placeOrderButton.addEventListener('click', () => {
        if (!currentProductForOrder) {
            showCustomAlert("Error", "No product selected to place an order.", 'alert');
            return;
        }
        if (productDetailModal) productDetailModal.style.display = 'none'; // Close product detail modal
        if (placeOrderModal) placeOrderModal.style.display = 'flex'; // Open place order modal
        if (orderProductTitleSpan) orderProductTitleSpan.textContent = currentProductForOrder.title;
    });
}

if (closePlaceOrderModalBtn) {
    closePlaceOrderModalBtn.addEventListener('click', () => {
        if (placeOrderModal) placeOrderModal.style.display = 'none';
        // Optionally reset form fields
        if (customerAddressInput) customerAddressInput.value = '';
        if (customerPhoneInput) customerPhoneInput.value = '';
        selectedOrderRating = 0;
        updateOrderRatingStars();
        if (orderFormMessage) orderFormMessage.textContent = '';
        if (orderRatingError) orderRatingError.textContent = '';
    });
}

if (orderRatingStarsContainer) {
    orderRatingStarsContainer.addEventListener('click', (event) => {
        const star = event.target.closest('.fa-star');
        if (star) {
            selectedOrderRating = parseInt(star.dataset.rating);
            updateOrderRatingStars();
        }
    });
}

function updateOrderRatingStars() {
    if (orderRatingStarsContainer) {
        orderRatingStarsContainer.querySelectorAll('.fa-star, .fa-star-half-alt').forEach((star, index) => {
            if (index < selectedOrderRating) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
    }
}

if (submitOrderButton) {
    submitOrderButton.addEventListener('click', submitOrder);
}

async function submitOrder() {
    const address = customerAddressInput ? customerAddressInput.value.trim() : '';
    const phone = customerPhoneInput ? customerPhoneInput.value.trim() : '';

    if (!address || !phone) {
        if (orderFormMessage) {
            orderFormMessage.textContent = 'Please enter your address and phone number.';
            orderFormMessage.style.color = 'var(--color-error-red)';
        }
        return;
    }

    if (!currentProductForOrder) {
        if (orderFormMessage) {
            orderFormMessage.textContent = 'No product selected to order.';
            orderFormMessage.style.color = 'var(--color-error-red)';
        }
        return;
    }

    if (orderFormMessage) {
        orderFormMessage.textContent = 'Placing order...';
        orderFormMessage.style.color = 'var(--color-info-blue)';
    }

    const orderDetails = {
        productId: currentProductForOrder.id,
        title: currentProductForOrder.title,
        price: currentProductForOrder.price,
        imageUrl: currentProductForOrder.imageUrl || 'Hina%E2%80%99s%20Root&Bloom.png',
        address: address,
        phoneNumber: phone,
        quantity: 1, // Assuming 1 quantity per order for simplicity
        rating: selectedOrderRating > 0 ? selectedOrderRating : null, // Optional rating
        timestamp: serverTimestamp(),
        status: 'Pending'
    };

    try {
        // Save order
        const newOrderRef = push(ref(database, 'orders'));
        await set(newOrderRef, orderDetails);

        // If a rating was given, update product's ratings for analytics
        if (selectedOrderRating > 0) {
            const productRatingsRef = ref(database, `products/${currentProductForOrder.id}/ratings`);
            await push(productRatingsRef, {
                rating: selectedOrderRating,
                timestamp: serverTimestamp()
            });
        }

        showCustomAlert("Order Placed!", "Your order has been placed successfully. We will contact you soon!", 'alert', () => {
            if (placeOrderModal) placeOrderModal.style.display = 'none';
            if (customerAddressInput) customerAddressInput.value = '';
            if (customerPhoneInput) customerPhoneInput.value = '';
            selectedOrderRating = 0;
            updateOrderRatingStars();
        });
    } catch (error) {
        console.error("Error placing order:", error);
        if (orderFormMessage) {
            orderFormMessage.textContent = 'Failed to place order. Please try again.';
            orderFormMessage.style.color = 'var(--color-error-red)';
        }
    }
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCategories();

    // Scroll to products section if 'Explore Products' button is clicked
    if (exploreProductsBtn) {
        exploreProductsBtn.addEventListener('click', () => {
            const productListingSection = document.getElementById('product-listing-section');
            if (productListingSection) {
                productListingSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});
