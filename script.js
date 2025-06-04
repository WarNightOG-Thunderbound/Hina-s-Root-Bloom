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
  appId: "1:967448486557:web:8c5b051268393e877e163b",
  measurementId: "G-G60J2P445C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Database references
const productsRef = ref(database, 'products');
const ordersRef = ref(database, 'orders');
const usersRef = ref(database, 'users');
const reviewsRef = ref(database, 'reviews'); // Reference for product reviews

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const categoryFilter = document.getElementById('category-filter');
const priceSort = document.getElementById('price-sort');
const productGrid = document.getElementById('product-grid');
const productDetailModal = document.getElementById('product-detail-modal');
const closeModalButton = document.getElementById('close-modal');
const modalProductName = document.getElementById('modal-product-name');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductRating = document.getElementById('modal-product-rating');
const modalProductReviews = document.getElementById('modal-product-reviews');
const modalProductVideo = document.getElementById('modal-product-video');

const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutButton = document.getElementById('logout-button');
const currentUserSpan = document.getElementById('current-user');
const userDashboard = document.getElementById('user-dashboard');
const viewOrderHistoryBtn = document.getElementById('view-order-history-btn');
const orderHistorySection = document.getElementById('order-history-section');
const orderHistoryList = document.getElementById('order-history-list');
const closeOrderHistoryBtn = document.getElementById('close-order-history-btn');

const rateProductButton = document.getElementById('rate-product-button');
const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.getElementById('close-rating-modal');
const ratingProductNameSpan = document.getElementById('rating-product-name');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const ratingCommentInput = document.getElementById('rating-comment');
const submitRatingButton = document.getElementById('submit-rating-btn');
let selectedProductIdForRating = null;
let selectedRating = 0;

// Contact Us Form
const contactForm = document.getElementById('contact-form');
const contactNameInput = document.getElementById('contact-name');
const contactEmailInput = document.getElementById('contact-email');
const contactMessageInput = document.getElementById('contact-message');

// Custom Alert Modal
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


// --- Utility Functions ---

function showCustomAlert(title, message, isConfirm = false) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customAlertModal.classList.add('show');
    return new Promise((resolve) => {
        customModalOkBtn.onclick = () => {
            customAlertModal.classList.remove('show');
            resolve(true);
        };
        if (isConfirm) {
            customModalCancelBtn.style.display = 'inline-block';
            customModalCancelBtn.onclick = () => {
                customAlertModal.classList.remove('show');
                resolve(false);
            };
        } else {
            customModalCancelBtn.style.display = 'none';
        }
    });
}


// --- Authentication ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        currentUserSpan.textContent = user.email;
        authSection.style.display = 'none';
        userDashboard.style.display = 'block';
        if (contactForm) contactForm.style.display = 'block'; // Show contact form if user is logged in
        loadOrderHistory(user.uid);
    } else {
        // User is signed out
        currentUserSpan.textContent = 'Guest';
        authSection.style.display = 'block';
        userDashboard.style.display = 'none';
        if (contactForm) contactForm.style.display = 'none'; // Hide contact form if user is logged out
        if (orderHistorySection) orderHistorySection.style.display = 'none';
    }
});

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        await showCustomAlert('Success', 'Logged in successfully!');
        loginForm.reset();
    } catch (error) {
        console.error("Login failed:", error.message);
        await showCustomAlert('Login Failed', error.message);
    }
});

registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = registerForm.email.value;
    const password = registerForm.password.value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Store additional user info in Realtime Database
        await set(ref(database, 'users/' + user.uid), {
            email: user.email,
            createdAt: serverTimestamp()
        });
        await showCustomAlert('Success', 'Registered and logged in successfully!');
        registerForm.reset();
    } catch (error) {
        console.error("Registration failed:", error.message);
        await showCustomAlert('Registration Failed', error.message);
    }
});

logoutButton?.addEventListener('click', async () => {
    try {
        await signOut(auth);
        await showCustomAlert('Success', 'Logged out successfully!');
    } catch (error) {
        console.error("Logout failed:", error.message);
        await showCustomAlert('Logout Failed', error.message);
    }
});


// --- Product Display ---

function loadProducts() {
    onValue(productsRef, (snapshot) => {
        const products = [];
        snapshot.forEach((childSnapshot) => {
            products.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        displayProducts(products);
    }, (error) => {
        console.error("Error loading products:", error);
        showCustomAlert('Error', 'Failed to load products. Please try again.');
    });
}

function displayProducts(products) {
    productGrid.innerHTML = ''; // Clear existing products

    // Apply filters and sorting
    let filteredProducts = products;

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }

    const selectedCategory = categoryFilter.value;
    if (selectedCategory && selectedCategory !== 'All') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

    const sortOrder = priceSort.value;
    if (sortOrder === 'asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<p class="no-products-message">No products found matching your criteria.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

        // Changed line as per request: Use product.imageUrls array
        productCard.innerHTML = `
            <img src="${(product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : 'https://via.placeholder.com/150'}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <button class="view-details-btn" data-id="${product.id}">View Details</button>
        `;
        productGrid.appendChild(productCard);
    });

    // Add event listeners for "View Details" buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            openProductDetailModal(productId);
        });
    });
}


// --- Product Detail Modal ---

async function openProductDetailModal(productId) {
    try {
        const productSnapshot = await get(ref(database, `products/${productId}`));
        const product = productSnapshot.val();

        if (product) {
            modalProductName.textContent = product.title;
            modalProductCategory.textContent = product.category;
            modalProductPrice.textContent = `$${product.price.toFixed(2)}`;
            modalProductDescription.textContent = product.description;
            // Use the first image from imageUrls for the main display
            modalProductImage.src = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : 'https://via.placeholder.com/400x300';
            modalProductImage.alt = product.title;

            // Handle video display
            if (product.videoUrl) {
                modalProductVideo.src = product.videoUrl;
                modalProductVideo.style.display = 'block';
            } else {
                modalProductVideo.style.display = 'none';
                modalProductVideo.src = ''; // Clear previous video
            }

            // Display reviews and average rating
            await loadProductReviews(productId);

            // Set product ID for rating functionality
            selectedProductIdForRating = productId;
            ratingProductNameSpan.textContent = product.title;

            productDetailModal.classList.add('show');
        } else {
            await showCustomAlert('Error', 'Product not found.');
        }
    } catch (error) {
        console.error("Error opening product detail modal:", error);
        await showCustomAlert('Error', 'Failed to load product details.');
    }
}


closeModalButton.addEventListener('click', () => {
    productDetailModal.classList.remove('show');
    modalProductVideo.pause(); // Pause video when closing modal
});

productDetailModal.addEventListener('click', (event) => {
    if (event.target === productDetailModal) {
        productDetailModal.classList.remove('show');
        modalProductVideo.pause(); // Pause video when clicking outside modal
    }
});


// --- Product Reviews/Ratings ---

async function loadProductReviews(productId) {
    const reviewsList = document.getElementById('modal-product-reviews');
    reviewsList.innerHTML = '<p class="reviews-loading">Loading reviews...</p>';
    let totalRating = 0;
    let reviewCount = 0;

    const reviewsSnapshot = await get(ref(database, `reviews/${productId}`));

    reviewsList.innerHTML = ''; // Clear loading message

    if (reviewsSnapshot.exists()) {
        reviewsSnapshot.forEach((childSnapshot) => {
            const review = childSnapshot.val();
            const reviewItem = document.createElement('div');
            reviewItem.classList.add('review-item');
            reviewItem.innerHTML = `
                <p><strong>${review.userName || 'Anonymous'}</strong> - 
                   <span class="rating-stars-display">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span></p>
                <p>${review.comment}</p>
                <small>${new Date(review.timestamp).toLocaleDateString()}</small>
            `;
            reviewsList.appendChild(reviewItem);
            totalRating += review.rating;
            reviewCount++;
        });
    } else {
        reviewsList.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to rate this product!</p>';
    }

    const averageRating = reviewCount > 0 ? (totalRating / reviewCount) : 0;
    modalProductRating.innerHTML = `Average Rating: ${averageRating.toFixed(1)} / 5 (${reviewCount} reviews)`;
}

function showRatingModal() {
    if (!auth.currentUser) {
        showCustomAlert('Login Required', 'You must be logged in to rate products.');
        return;
    }
    if (selectedProductIdForRating) {
        selectedRating = 0; // Reset rating
        ratingCommentInput.value = ''; // Clear comment
        updateRatingStars(); // Update stars to reflect reset
        ratingModal.classList.add('show');
    } else {
        showCustomAlert('Error', 'No product selected for rating.');
    }
}

function closeRatingModal() {
    ratingModal.classList.remove('show');
}

function updateRatingStars() {
    Array.from(ratingStarsContainer.children).forEach((star, index) => {
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
    if (!auth.currentUser) {
        await showCustomAlert('Login Required', 'You must be logged in to submit a rating.');
        return;
    }
    if (!selectedProductIdForRating || selectedRating === 0) {
        await showCustomAlert('Error', 'Please select a rating for the product.');
        return;
    }

    const comment = ratingCommentInput.value.trim();
    const user = auth.currentUser;

    try {
        const reviewData = {
            userId: user.uid,
            userName: user.email, // Or user's display name if available
            rating: selectedRating,
            comment: comment,
            timestamp: serverTimestamp()
        };
        await push(ref(database, `reviews/${selectedProductIdForRating}`), reviewData);
        await showCustomAlert('Success', 'Thank you for your rating!');
        closeRatingModal();
        loadProductReviews(selectedProductIdForRating); // Refresh reviews
    } catch (error) {
        console.error("Error submitting rating:", error);
        await showCustomAlert('Error', 'Failed to submit rating. Please try again.');
    }
}


// --- Search, Filter, Sort Event Listeners ---

searchInput.addEventListener('input', () => {
    loadProducts();
});

searchButton.addEventListener('click', () => {
    loadProducts();
});

categoryFilter.addEventListener('change', () => {
    loadProducts();
});

priceSort.addEventListener('change', () => {
    loadProducts();
});

// --- Contact Form Submission ---
async function handleContactFormSubmit(event) {
    event.preventDefault();

    const name = contactNameInput.value.trim();
    const email = contactEmailInput.value.trim();
    const message = contactMessageInput.value.trim();

    if (!name || !email || !message) {
        await showCustomAlert('Error', 'Please fill in all contact fields.');
        return;
    }

    const user = auth.currentUser;
    const userId = user ? user.uid : 'guest'; // Associate with user if logged in

    try {
        await push(ref(database, 'contactMessages'), {
            name: name,
            email: email,
            message: message,
            userId: userId,
            timestamp: serverTimestamp()
        });
        await showCustomAlert('Success', 'Your message has been sent!');
        contactForm.reset();
    } catch (error) {
        console.error("Error submitting contact form:", error);
        await showCustomAlert('Error', 'Failed to send message. Please try again.');
    }
}


// --- Order History (for logged-in users) ---
async function loadOrderHistory(userId) {
    const userOrdersRef = ref(database, `users/${userId}/orders`);
    onValue(userOrdersRef, async (snapshot) => {
        orderHistoryList.innerHTML = ''; // Clear previous list
        if (snapshot.exists()) {
            const orderIds = snapshot.val();
            const ordersPromises = Object.keys(orderIds).map(orderId => get(ref(database, `orders/${orderId}`)));
            const ordersSnapshots = await Promise.all(ordersPromises);

            if (ordersSnapshots.length === 0) {
                orderHistoryList.innerHTML = '<p>No orders found.</p>';
                return;
            }

            ordersSnapshots.sort((a, b) => b.val().timestamp - a.val().timestamp); // Sort by newest first

            ordersSnapshots.forEach(orderSnapshot => {
                const order = orderSnapshot.val();
                if (order) {
                    const orderItem = document.createElement('div');
                    orderItem.classList.add('order-item');
                    const orderDate = new Date(order.timestamp).toLocaleString();
                    let productsHtml = '';
                    if (order.products) {
                        for (const productId in order.products) {
                            const productData = order.products[productId];
                            productsHtml += `<li>${productData.title} x ${productData.quantity} ($${productData.price.toFixed(2)} each)</li>`;
                        }
                    }

                    orderItem.innerHTML = `
                        <h4>Order ID: ${orderSnapshot.key}</h4>
                        <p>Date: ${orderDate}</p>
                        <p>Total: $${order.totalPrice.toFixed(2)}</p>
                        <p>Status: <span class="order-status ${order.status.toLowerCase()}">${order.status}</span></p>
                        <p>Products:</p>
                        <ul>${productsHtml}</ul>
                        <button class="view-order-details-btn" data-order-id="${orderSnapshot.key}">View Details</button>
                    `;
                    orderHistoryList.appendChild(orderItem);
                }
            });
        } else {
            orderHistoryList.innerHTML = '<p>No orders found.</p>';
        }
    }, (error) => {
        console.error("Error loading order history:", error);
        showCustomAlert('Error', 'Failed to load order history. Please try again.');
    });
}

// Function to show order details (can be a modal or expanded view)
async function viewOrderDetails(orderId) {
    try {
        const orderSnapshot = await get(ref(database, `orders/${orderId}`));
        const order = orderSnapshot.val();

        if (order) {
            let detailsMessage = `
                Order ID: ${orderId}
                Date: ${new Date(order.timestamp).toLocaleString()}
                Total Price: $${order.totalPrice.toFixed(2)}
                Status: ${order.status}
                Customer Name: ${order.customerName}
                Customer Email: ${order.customerEmail}
                Shipping Address: ${order.shippingAddress}
                Products Ordered:
            `;
            if (order.products) {
                for (const productId in order.products) {
                    const productData = order.products[productId];
                    detailsMessage += `\n  - ${productData.title} (x${productData.quantity}) @ $${productData.price.toFixed(2)}`;
                }
            }
            await showCustomAlert('Order Details', detailsMessage);
        } else {
            await showCustomAlert('Error', 'Order details not found.');
        }
    } catch (error) {
        console.error("Error fetching order details:", error);
        await showCustomAlert('Error', 'Failed to retrieve order details.');
    }
}


// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // Initial load for category filter options
    onValue(productsRef, (snapshot) => {
        const categories = new Set();
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            if (product.category) {
                categories.add(product.category);
            }
        });

        categoryFilter.innerHTML = '<option value="All">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }, { onlyOnce: true }); // Only populate categories once on page load

    // Delegated event listener for "View Details" buttons
    productGrid.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-details-btn')) {
            const productId = event.target.dataset.id;
            openProductDetailModal(productId);
        }
    });

    // Delegated event listener for "View Details" buttons in order history
    orderHistoryList.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-order-details-btn')) {
            const orderId = event.target.dataset.orderId;
            viewOrderDetails(orderId);
        }
    });

    // Dropdown for user actions (e.g., order history)
    const userActionsDropdown = document.querySelector('.user-actions .dropdown');
    const userActionsToggle = document.querySelector('.user-actions .dropbtn');

    if (userActionsToggle && userActionsDropdown) {
        userActionsToggle.addEventListener('click', () => {
            userActionsDropdown.classList.toggle('show');
        });

        // Close the dropdown if the user clicks outside of it
        window.addEventListener('click', (event) => {
            if (!event.target.matches('.user-actions .dropbtn') && !event.target.matches('.user-actions .dropbtn *')) {
                if (userActionsDropdown.classList.contains('show')) {
                    userActionsDropdown.classList.remove('show');
                }
            }
        });
    }

    if (viewOrderHistoryBtn) {
        viewOrderHistoryBtn.addEventListener('click', () => {
            if (orderHistorySection) orderHistorySection.style.display = 'block';
            userActionsDropdown.classList.remove('show'); // Hide dropdown after clicking
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
