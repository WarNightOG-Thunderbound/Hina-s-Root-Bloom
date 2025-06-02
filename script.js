// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, set, remove, onValue, serverTimestamp, update, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBr6A2OGh-nwfMzOwmVOWs1-u5ylZ2Vemw",
  authDomain: "hina-s-rootandbloomstore.firebaseapp.com",
  databaseURL: "https://hina-s-rootandbloomstore-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hina-s-rootandbloomstore",
  storageBucket: "hina-s-rootandbloomstore.firebasestorage.app",
  messagingSenderId: "967448486557",
  appId: "1:967448486557:web:45a1fe8a4b14ec2fd22a74",
  measurementId: "G-TT31HC3NZ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Public UI Elements
const productListingsContainer = document.getElementById('product-listings');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const categoryFilterButtons = document.querySelectorAll('.category-button');
const sortBySelect = document.getElementById('sort-by-select');
const productModal = document.getElementById('product-modal');
const closeModalButton = document.querySelector('.close-button');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductBrand = document.getElementById('modal-product-brand');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductStock = document.getElementById('modal-product-stock');
const modalProductVideo = document.getElementById('modal-product-video');
const productQuantityInput = document.getElementById('product-quantity');
const addToCartButton = document.getElementById('add-to-cart-button');
const placeOrderButton = document.getElementById('place-order-button');
const contactUsSection = document.getElementById('contact-us-section');
const emailInput = document.getElementById('email-input');
const messageInput = document.getElementById('message-input');
const sendEmailButton = document.getElementById('send-email-button');
const orderHistorySection = document.getElementById('order-history-section');
const orderHistoryList = document.getElementById('order-history-list');
const toggleOrderHistoryBtn = document.getElementById('toggle-order-history-btn');
const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.querySelector('.close-rating-modal-button');
const ratingProductTitle = document.getElementById('rating-product-title');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const submitRatingButton = document.getElementById('submit-rating-button');

// Custom Alert/Confirm Elements
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');

let allProducts = {};
let currentProductToRate = null;
let selectedRating = 0;
let cart = {}; // Simple in-memory cart

// --- Custom Alert/Confirm Functions ---
function showAlert(message, title = 'Notification') {
    return new Promise(resolve => {
        customModalTitle.textContent = title;
        customModalMessage.textContent = message;
        customModalOkBtn.textContent = 'OK';
        customModalOkBtn.classList.remove('danger', 'secondary');
        customModalOkBtn.classList.add('primary');
        customModalCancelBtn.style.display = 'none';
        customAlertModal.style.display = 'flex';

        const okHandler = () => {
            customAlertModal.style.display = 'none';
            customModalOkBtn.removeEventListener('click', okHandler);
            resolve(true);
        };
        customModalOkBtn.addEventListener('click', okHandler);
    });
}

function showConfirm(message, title = 'Confirm Action', okButtonText = 'Yes', cancelButtonText = 'No', okButtonClass = 'primary') {
    return new Promise(resolve => {
        customModalTitle.textContent = title;
        customModalMessage.textContent = message;
        customModalOkBtn.textContent = okButtonText;
        customModalOkBtn.classList.remove('primary', 'secondary', 'danger');
        customModalOkBtn.classList.add(okButtonClass);
        customModalCancelBtn.textContent = cancelButtonText;
        customModalCancelBtn.style.display = 'inline-block';
        customAlertModal.style.display = 'flex';

        const okHandler = () => {
            customAlertModal.style.display = 'none';
            customModalOkBtn.removeEventListener('click', okHandler);
            customModalCancelBtn.removeEventListener('click', cancelHandler);
            resolve(true);
        };
        const cancelHandler = () => {
            customAlertModal.style.display = 'none';
            customModalOkBtn.removeEventListener('click', okHandler);
            customModalCancelBtn.removeEventListener('click', cancelHandler);
            resolve(false);
        };
        customModalOkBtn.addEventListener('click', okHandler);
        customModalCancelBtn.addEventListener('click', cancelHandler);
    });
}


// --- Firebase Authentication State Change ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user.email);
        // Added checks to prevent errors if elements are not present
        const authSection = document.getElementById('auth-section');
        const adminDashboard = document.getElementById('admin-dashboard');
        if (authSection) {
            authSection.style.display = 'none';
        }
        if (adminDashboard) {
            adminDashboard.style.display = 'block';
        }
    } else {
        console.log("User is signed out.");
        // Added checks to prevent errors if elements are not present
        const authSection = document.getElementById('auth-section');
        const adminDashboard = document.getElementById('admin-dashboard');
        if (authSection) {
            authSection.style.display = 'block';
        }
        if (adminDashboard) {
            adminDashboard.style.display = 'none';
        }
    }
    loadProducts(); // Load products regardless of auth state for public view
});

// --- Product Listing Functions ---
function displayProducts(products) {
    console.log("displayProducts called with:", products); // DEBUG LOG
    productListingsContainer.innerHTML = '';
    if (Object.keys(products).length === 0) {
        productListingsContainer.innerHTML = '<p class="no-products">No products found.</p>';
        console.log("No products to display after filtering."); // DEBUG LOG
        return;
    }

    Object.values(products).forEach(product => {
        console.log("Attempting to display product:", product.title, "ID:", product.id); // DEBUG LOG
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.productId = product.id;

        const imageUrl = product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : 'placeholder.jpg'; // Default image
        const videoHtml = product.videoUrl ? `<div class="product-video-thumbnail"><i class="fas fa-video"></i></div>` : '';

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${imageUrl}" alt="${product.title}" class="product-image">
                ${videoHtml}
            </div>
            <h3 class="product-title">${product.title}</h3>
            <p class="product-brand">${product.brand}</p>
            <p class="product-price">PKR ${product.price.toLocaleString()}</p>
            <button class="view-details-button admin-button primary" data-product-id="${product.id}"><i class="fas fa-info-circle"></i> View Details</button>
            <button class="add-to-cart-card-button admin-button success" data-product-id="${product.id}"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
        `;
        productListingsContainer.appendChild(productCard);
    });

    document.querySelectorAll('.view-details-button').forEach(button => {
        button.removeEventListener('click', openProductModal); // Avoid multiple listeners
        button.addEventListener('click', openProductModal);
    });
    document.querySelectorAll('.add-to-cart-card-button').forEach(button => {
        button.removeEventListener('click', addProductToCartFromCard); // Avoid multiple listeners
        button.addEventListener('click', addProductToCartFromCard);
    });
}

function loadProducts() {
    console.log("Loading products from Firebase..."); // DEBUG LOG
    const productsRef = ref(database, 'products/'); // Corrected path
    onValue(productsRef, (snapshot) => {
        allProducts = {};
        if (!snapshot.exists()) {
            console.log("No snapshot data found at 'products/'."); // DEBUG LOG
        }
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            // It's good practice to also log the key to compare with product.id
            console.log("Fetched product:", product.title, "Firebase Key:", childSnapshot.key, "Product ID:", product.id); // DEBUG LOG
            allProducts[product.id] = product;
        });
        console.log("All products loaded into allProducts:", allProducts); // DEBUG LOG
        filterAndSortProducts(); // Re-filter and display all products
    }, (error) => {
        console.error("Error loading products:", error);
        showAlert("Failed to load products. Please try again later.", "Error");
    });
}

function filterAndSortProducts() {
    console.log("filterAndSortProducts called. Initial allProducts:", allProducts); // DEBUG LOG
    let filteredProducts = Object.values(allProducts);

    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        const initialCount = filteredProducts.length;
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
        console.log(`Search term "${searchTerm}" applied. Filtered from ${initialCount} to ${filteredProducts.length} products.`); // DEBUG LOG
    }

    // Apply category filter
    const activeCategoryButton = document.querySelector('.category-button.active');
    if (activeCategoryButton && activeCategoryButton.dataset.category !== 'all') {
        const category = activeCategoryButton.dataset.category;
        const initialCount = filteredProducts.length;
        filteredProducts = filteredProducts.filter(product => product.category === category);
        console.log(`Category filter "${category}" applied. Filtered from ${initialCount} to ${filteredProducts.length} products.`); // DEBUG LOG
    }

    // Apply sort order
    const sortBy = sortBySelect.value;
    if (sortBy === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'alpha-asc') {
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'alpha-desc') {
        filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'featured') {
        filteredProducts.sort((a, b) => (b.featured || false) - (a.featured || false));
    }

    console.log("Products after filtering and sorting:", filteredProducts); // DEBUG LOG
    displayProducts(filteredProducts);
}

// --- Product Modal Functions ---
function openProductModal(event) {
    const productId = event.currentTarget.dataset.productId;
    const product = allProducts[productId];

    if (!product) {
        showAlert("Product details not found.", "Error");
        return;
    }

    modalProductImage.src = product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : 'placeholder.jpg';
    modalProductTitle.textContent = product.title;
    modalProductPrice.textContent = `PKR ${product.price.toLocaleString()}`;
    modalProductDescription.textContent = product.description;
    modalProductBrand.textContent = `Brand: ${product.brand}`;
    modalProductCategory.textContent = `Category: ${product.category}`;
    modalProductStock.textContent = `Stock: ${product.stock > 0 ? product.stock : 'Out of Stock'}`;

    if (product.videoUrl) {
        modalProductVideo.innerHTML = `<p>Product Video:</p><iframe src="${product.videoUrl}" frameborder="0" allowfullscreen></iframe>`;
        modalProductVideo.style.display = 'block';
    } else {
        modalProductVideo.innerHTML = '';
        modalProductVideo.style.display = 'none';
    }

    productQuantityInput.value = 1; // Reset quantity
    addToCartButton.dataset.productId = productId;
    placeOrderButton.dataset.productId = productId;

    productModal.style.display = 'flex';
}

function closeProductModal() {
    productModal.style.display = 'none';
    modalProductVideo.innerHTML = ''; // Clear video iframe
}

// --- Cart and Order Functions ---
function addProductToCartFromCard(event) {
    const productId = event.currentTarget.dataset.productId;
    const product = allProducts[productId];

    if (!product) {
        showAlert("Product not found.", "Error");
        return;
    }

    if (product.stock <= 0) {
        showAlert("This product is currently out of stock.", "Out of Stock");
        return;
    }

    const quantity = 1; // Always add 1 from card button
    if (cart[productId]) {
        cart[productId].quantity += quantity;
    } else {
        cart[productId] = { ...product, quantity };
    }
    showAlert(`${quantity} x ${product.title} added to cart!`, "Added to Cart");
    console.log("Current Cart:", cart);
}


async function addProductToCartFromModal() {
    const productId = addToCartButton.dataset.productId;
    const product = allProducts[productId];
    const quantity = parseInt(productQuantityInput.value);

    if (!product) {
        showAlert("Product not found.", "Error");
        return;
    }
    if (isNaN(quantity) || quantity <= 0) {
        showAlert("Please enter a valid quantity.", "Invalid Quantity");
        return;
    }
    if (quantity > product.stock) {
        showAlert(`Only ${product.stock} units of ${product.title} are available.`, "Out of Stock");
        return;
    }

    if (cart[productId]) {
        cart[productId].quantity += quantity;
    } else {
        cart[productId] = { ...product, quantity };
    }
    showAlert(`${quantity} x ${product.title} added to cart!`, "Added to Cart");
    console.log("Current Cart:", cart);
    closeProductModal();
}

async function placeOrder() {
    const productId = placeOrderButton.dataset.productId;
    const product = allProducts[productId];
    const quantity = parseInt(productQuantityInput.value);

    if (!product) {
        showAlert("Product not found for order.", "Error");
        return;
    }
    if (isNaN(quantity) || quantity <= 0) {
        showAlert("Please enter a valid quantity for your order.", "Invalid Quantity");
        return;
    }
    if (quantity > product.stock) {
        showAlert(`Cannot order ${quantity} units. Only ${product.stock} units of ${product.title} are available.`, "Insufficient Stock");
        return;
    }

    const confirm = await showConfirm(`Do you want to place an order for ${quantity} x ${product.title} for PKR ${(product.price * quantity).toLocaleString()}?`, "Confirm Order");
    if (!confirm) {
        return;
    }

    try {
        // Create an order object
        const orderData = {
            productId: product.id,
            productTitle: product.title,
            quantity: quantity,
            totalPrice: product.price * quantity,
            orderDate: serverTimestamp(),
            status: 'pending', // e.g., 'pending', 'completed', 'cancelled'
            userId: auth.currentUser ? auth.currentUser.uid : 'guest', // Track user if logged in
            userEmail: auth.currentUser ? auth.currentUser.email : 'guest',
        };

        // Push to 'orders' node
        const newOrderRef = push(ref(database, 'orders/'));
        await set(newOrderRef, orderData);

        // Deduct stock
        const newStock = product.stock - quantity;
        const productRef = ref(database, `products/${product.id}`); // Corrected path
        await update(productRef, { stock: newStock });

        showAlert(`Order for ${quantity} x ${product.title} placed successfully!`, "Order Confirmed");
        closeProductModal();
        loadProducts(); // Refresh product list to show updated stock
    } catch (error) {
        console.error("Error placing order:", error);
        showAlert("Failed to place order. Please try again.", "Order Error");
    }
}

// --- Order History Functions ---
function displayOrderHistory(orders) {
    orderHistoryList.innerHTML = '';
    if (Object.keys(orders).length === 0) {
        orderHistoryList.innerHTML = '<p>No past orders found.</p>';
        return;
    }

    Object.values(orders).sort((a, b) => b.orderDate - a.orderDate).forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
        orderItem.innerHTML = `
            <p><strong>Order ID:</strong> ${order.orderId || 'N/A'}</p>
            <p><strong>Product:</strong> ${order.productTitle}</p>
            <p><strong>Quantity:</strong> ${order.quantity}</p>
            <p><strong>Total Price:</strong> PKR ${order.totalPrice.toLocaleString()}</p>
            <p><strong>Date:</strong> ${orderDate}</p>
            <p><strong>Status:</strong> <span class="order-status ${order.status}">${order.status}</span></p>
            <button class="rate-product-button admin-button info" data-product-id="${order.productId}" data-product-title="${order.productTitle}">Rate Product</button>
        `;
        orderHistoryList.appendChild(orderItem);
    });

    document.querySelectorAll('.rate-product-button').forEach(button => {
        button.removeEventListener('click', openRatingModal);
        button.addEventListener('click', openRatingModal);
    });
}

function loadOrderHistory() {
    // This function will only fetch orders if a user is logged in.
    // For a public facing app, you might only show this if you implement
    // a proper user authentication and order tracking system.
    // For now, it's illustrative.
    if (auth.currentUser) {
        const ordersRef = ref(database, 'orders/');
        onValue(ordersRef, (snapshot) => {
            const userOrders = {};
            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                order.orderId = childSnapshot.key; // Store the order ID
                if (order.userId === auth.currentUser.uid) {
                    userOrders[childSnapshot.key] = order;
                }
            });
            displayOrderHistory(userOrders);
        }, (error) => {
            console.error("Error loading order history:", error);
            showAlert("Failed to load order history.", "Error");
        });
    } else {
        orderHistoryList.innerHTML = '<p>Please log in to view your order history.</p>';
    }
}

// --- Rating Functions ---
function openRatingModal(event) {
    currentProductToRate = {
        id: event.currentTarget.dataset.productId,
        title: event.currentTarget.dataset.productTitle
    };
    ratingProductTitle.textContent = currentProductToRate.title;
    selectedRating = 0; // Reset selected rating
    updateRatingStars();
    ratingModal.style.display = 'flex';
}

function closeRatingModal() {
    ratingModal.style.display = 'none';
}

function updateRatingStars() {
    const stars = ratingStarsContainer.querySelectorAll('.fa-star');
    stars.forEach(star => {
        const rating = parseInt(star.dataset.rating);
        if (rating <= selectedRating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

async function submitProductRating() {
    if (!currentProductToRate || selectedRating === 0) {
        showAlert("Please select a rating before submitting.", "Rating Error");
        return;
    }

    if (!auth.currentUser) {
        showAlert("Please log in to submit a rating.", "Authentication Required");
        return;
    }

    const ratingData = {
        productId: currentProductToRate.id,
        userId: auth.currentUser.uid,
        rating: selectedRating,
        timestamp: serverTimestamp()
    };

    try {
        const ratingsRef = ref(database, `productRatings/${currentProductToRate.id}/${auth.currentUser.uid}`);
        await set(ratingsRef, ratingData);
        showAlert(`Thank you for rating ${currentProductToRate.title} with ${selectedRating} stars!`, "Rating Submitted");
        closeRatingModal();
    } catch (error) {
        console.error("Error submitting rating:", error);
        showAlert("Failed to submit rating. Please try again.", "Rating Error");
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial load of products
    loadProducts();

    // Event listener for search button
    searchButton.addEventListener('click', filterAndSortProducts);

    // Event listener for search input (live search on enter)
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            filterAndSortProducts();
        }
    });

    // Event listeners for category filter buttons
    categoryFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterAndSortProducts();
        });
    });

    // Event listener for sort by select
    sortBySelect.addEventListener('change', filterAndSortProducts);

    // Close product modal
    closeModalButton.addEventListener('click', closeProductModal);
    window.addEventListener('click', (event) => {
        if (event.target === productModal) {
            closeProductModal();
        }
    });

    // Add to cart button in modal
    addToCartButton.addEventListener('click', addProductToCartFromModal);

    // Place Order button in modal
    placeOrderButton.addEventListener('click', placeOrder);

    // Send Email button
    sendEmailButton.addEventListener('click', async () => {
        const email = emailInput.value;
        const message = messageInput.value;

        if (!email || !message) {
            showAlert("Please fill in both email and message fields.", "Validation Error");
            return;
        }

        // In a real application, you would send this to a backend service
        // that handles email sending securely, NOT directly from client-side.
        // For demonstration, we'll just log and show an alert.
        console.log(`Email to send: From ${email}, Message: ${message}`);
        await showAlert("Your message has been sent (simulated). We will get back to you shortly!", "Message Sent");
        emailInput.value = '';
        messageInput.value = '';
    });

    // Toggle Order History visibility
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
    ratingStarsContainer.addEventListener('click', (event) => {
        const star = event.target.closest('.fa-star');
        if (star) {
            selectedRating = parseInt(star.dataset.rating);
            updateRatingStars();
        }
    });

    // Submit rating button
    submitRatingButton.addEventListener('click', submitProductRating);

    // Close rating modal
    closeRatingModalBtn.addEventListener('click', closeRatingModal);
    window.addEventListener('click', (event) => {
        if (event.target === ratingModal) {
            closeRatingModal();
        }
    });
});
