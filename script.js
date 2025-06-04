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
  appId: "1:967448486557:web:c0b31e19d7d24268e36780",
  measurementId: "G-G6Q7K8Q9C1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements ---
const productGrid = document.getElementById('product-grid');
const productModal = document.getElementById('product-modal');
const closeModalButtons = document.querySelectorAll('.close-button');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductStock = document.getElementById('modal-product-stock');
const modalProductRating = document.getElementById('modal-product-rating');
const modalProductVideo = document.getElementById('modal-product-video');

const addToCartModalBtn = document.getElementById('add-to-cart-modal-btn');
const buyNowModalBtn = document.getElementById('buy-now-modal-btn');
const rateProductBtn = document.getElementById('rate-product-btn');

const cartButton = document.getElementById('cart-button');
const cartCountSpan = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const clearCartBtn = document.getElementById('clear-cart-btn');
const checkoutBtn = document.getElementById('checkout-btn');

const loginButton = document.getElementById('login-button');
const loginModal = document.getElementById('login-modal');
const registerSwitchBtn = document.getElementById('register-switch-btn');
const loginSwitchBtn = document.getElementById('login-switch-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const userEmailInput = document.getElementById('user-email');
const userPasswordInput = document.getElementById('user-password');
const userLoginBtn = document.getElementById('user-login-btn');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
const userRegisterBtn = document.getElementById('user-register-btn');
const logoutButton = document.getElementById('logout-button');

const searchInput = document.getElementById('search-input');
const categoryFiltersContainer = document.getElementById('category-filters');
const sortSelect = document.getElementById('sort-select');

const ratingModal = document.getElementById('rating-modal');
const ratingProductTitle = document.getElementById('rating-product-title');
const ratingStarsContainer = document.getElementById('rating-stars');
const ratingCommentInput = document.getElementById('rating-comment');
const submitRatingButton = document.getElementById('submit-rating-btn');
const closeRatingModalBtn = ratingModal.querySelector('.close-button');

const orderHistoryButton = document.getElementById('order-history-button');
const orderHistorySection = document.getElementById('order-history-section');
const userOrdersList = document.getElementById('user-orders-list');

const orderFormModal = document.getElementById('order-form-modal');
const orderDetailsForm = document.getElementById('order-details-form');
const customerNameInput = document.getElementById('customer-name');
const customerAddressInput = document.getElementById('customer-address');
const customerPhoneInput = document.getElementById('customer-phone');


// Custom Alert Modal elements
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


// --- Global Variables ---
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let currentProduct = null; // To store the product being viewed/ordered
let selectedRating = 0;
let currentUser = null;

// --- Firebase Refs ---
const productsRef = ref(database, 'products');
const categoriesRef = ref(database, 'categories');
const ratingsRef = ref(database, 'ratings');
const ordersRef = ref(database, 'orders'); // New: Orders reference

// --- Functions ---

// Custom Alert Function
function showCustomAlert(title, message, isConfirm = false, onConfirm = null, onCancel = null) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    
    if (isConfirm) {
        customModalOkBtn.style.display = 'inline-block';
        customModalCancelBtn.style.display = 'inline-block';
        customModalOkBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            if (onConfirm) onConfirm();
        };
        customModalCancelBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            if (onCancel) onCancel();
        };
    } else {
        customModalOkBtn.style.display = 'inline-block';
        customModalCancelBtn.style.display = 'none';
        customModalOkBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            if (onConfirm) onConfirm(); // Still allow a single callback for OK
        };
    }
    customAlertModal.style.display = 'flex';
}


function renderProducts(productsToRender) {
    productGrid.innerHTML = '';
    if (productsToRender.length === 0) {
        productGrid.innerHTML = '<p>No products found matching your criteria.</p>';
        return;
    }
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.id = product.id;

        const averageRating = product.totalRatings > 0 ? (product.sumRatings / product.totalRatings).toFixed(1) : 'N/A';
        const ratingStarsHtml = getStarRatingHtml(averageRating);

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.imageUrl || 'placeholder.png'}" alt="${product.title}" class="product-image">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${product.description}</p>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-rating">${ratingStarsHtml} (${averageRating})</p>
            </div>
            <div class="product-actions">
                <button class="button primary add-to-cart-btn"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
                <button class="button secondary view-detail-btn"><i class="fas fa-eye"></i> View Detail</button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.closest('.product-card').dataset.id;
            addToCart(productId, 1);
            showCustomAlert('Added to Cart', 'Product added to your cart!');
        });
    });

    document.querySelectorAll('.view-detail-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.closest('.product-card').dataset.id;
            openProductModal(productId);
        });
    });
}

function openProductModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (currentProduct) {
        modalProductTitle.textContent = currentProduct.title;
        modalProductDescription.textContent = currentProduct.description;
        modalProductPrice.textContent = `$${currentProduct.price.toFixed(2)}`;
        modalProductCategory.textContent = `Category: ${currentProduct.category}`;
        modalProductStock.textContent = `Stock: ${currentProduct.stock > 0 ? currentProduct.stock : 'Out of Stock'}`;
        
        const averageRating = currentProduct.totalRatings > 0 ? (currentProduct.sumRatings / currentProduct.totalRatings).toFixed(1) : 'N/A';
        modalProductRating.innerHTML = `Rating: ${getStarRatingHtml(averageRating)} (${averageRating})`;

        if (currentProduct.imageUrl) {
            modalProductImage.src = currentProduct.imageUrl;
            modalProductImage.style.display = 'block';
            modalProductVideo.style.display = 'none';
        } else if (currentProduct.videoUrl && currentProduct.videoUrl.includes('youtube.com/watch?v=')) {
            const videoId = currentProduct.videoUrl.split('v=')[1].split('&')[0];
            modalProductVideo.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            modalProductVideo.style.display = 'block';
            modalProductImage.style.display = 'none';
        } else {
            modalProductImage.src = 'placeholder.png';
            modalProductImage.style.display = 'block';
            modalProductVideo.style.display = 'none';
        }

        addToCartModalBtn.onclick = () => {
            addToCart(currentProduct.id, 1);
            showCustomAlert('Added to Cart', `${currentProduct.title} added to your cart!`);
            productModal.style.display = 'none';
        };

        // Modified buyNowModalBtn to open order form
        buyNowModalBtn.onclick = () => {
            productModal.style.display = 'none'; // Close product detail modal
            openOrderForm(currentProduct); // Open the order form for the current product
        };

        productModal.style.display = 'flex';
    }
}

function getStarRatingHtml(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < (5 - fullStars - (halfStar ? 1 : 0)); i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    return starsHtml;
}

function closeModals() {
    productModal.style.display = 'none';
    cartModal.style.display = 'none';
    loginModal.style.display = 'none';
    ratingModal.style.display = 'none';
    orderFormModal.style.display = 'none'; // Close order form modal
    customAlertModal.style.display = 'none'; // Close custom alert modal
}

function addToCart(productId, quantity) {
    if (cart[productId]) {
        cart[productId].quantity += quantity;
    } else {
        const product = products.find(p => p.id === productId);
        if (product) {
            cart[productId] = { ...product, quantity };
        }
    }
    saveCart();
    updateCartDisplay();
}

function removeFromCart(productId) {
    delete cart[productId];
    saveCart();
    updateCartDisplay();
}

function updateCartQuantity(productId, quantity) {
    if (cart[productId]) {
        cart[productId].quantity = quantity;
        if (cart[productId].quantity <= 0) {
            removeFromCart(productId);
        }
    }
    saveCart();
    updateCartDisplay();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartDisplay() {
    const productIdsInCart = Object.keys(cart);
    cartCountSpan.textContent = productIdsInCart.length;
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (productIdsInCart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalSpan.textContent = '$0.00';
        return;
    }

    productIdsInCart.forEach(productId => {
        const item = cart[productId];
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <img src="${item.imageUrl || 'placeholder.png'}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <h5>${item.title}</h5>
                <p>Price: $${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-quantity">
                <label for="qty-${item.id}">Qty:</label>
                <input type="number" id="qty-${item.id}" value="${item.quantity}" min="1" data-product-id="${item.id}">
            </div>
            <div class="cart-item-price">
                $${itemTotal.toFixed(2)}
            </div>
            <button class="cart-item-remove" data-product-id="${item.id}"><i class="fas fa-trash"></i></button>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });

    cartTotalSpan.textContent = `$${total.toFixed(2)}`;

    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            removeFromCart(productId);
        });
    });

    document.querySelectorAll('.cart-item-quantity input').forEach(input => {
        input.addEventListener('change', (event) => {
            const productId = event.target.dataset.productId;
            const newQuantity = parseInt(event.target.value);
            updateCartQuantity(productId, newQuantity);
        });
    });
}

function clearCart() {
    cart = {};
    saveCart();
    updateCartDisplay();
    showCustomAlert('Cart Cleared', 'Your shopping cart has been cleared.');
}

function applyFiltersAndSort() {
    let filteredProducts = [...products];

    // Category Filter
    const activeCategoryButton = document.querySelector('.category-button.active');
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'all';

    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

    // Search Filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }

    // Sorting
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
        return 0;
    });

    renderProducts(filteredProducts);
}

function populateCategoryFilters() {
    categoryFiltersContainer.innerHTML = '<button class="category-button active" data-category="all">All</button>';
    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('category-button');
        button.dataset.category = category.name;
        button.textContent = category.name;
        categoryFiltersContainer.appendChild(button);
    });

    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', (event) => {
            document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            applyFiltersAndSort();
        });
    });
}

function openRatingModal(product) {
    currentProduct = product;
    ratingProductTitle.textContent = product.title;
    selectedRating = 0; // Reset selected rating
    updateRatingStars();
    ratingCommentInput.value = ''; // Clear comment
    ratingModal.style.display = 'flex';
}

function updateRatingStars() {
    ratingStarsContainer.querySelectorAll('.fa-star').forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.replace('far', 'fas');
        } else {
            star.classList.replace('fas', 'far');
        }
    });
}

async function submitProductRating() {
    if (selectedRating === 0) {
        showCustomAlert('Rating Required', 'Please select a star rating.');
        return;
    }
    if (!currentUser) {
        showCustomAlert('Login Required', 'You must be logged in to submit a rating.', false, () => {
            closeModals(); // Close rating modal
            loginModal.style.display = 'flex'; // Open login modal
        });
        return;
    }

    const ratingData = {
        productId: currentProduct.id,
        userId: currentUser.uid,
        userName: currentUser.email, // Or display name if available
        rating: selectedRating,
        comment: ratingCommentInput.value.trim(),
        timestamp: serverTimestamp()
    };

    try {
        const newRatingRef = push(ratingsRef);
        await set(newRatingRef, ratingData);

        // Update product's aggregate rating
        const productRef = ref(database, `products/${currentProduct.id}`);
        const productSnapshot = await get(productRef);
        const productData = productSnapshot.val();

        const currentSumRatings = productData.sumRatings || 0;
        const currentTotalRatings = productData.totalRatings || 0;

        await update(productRef, {
            sumRatings: currentSumRatings + selectedRating,
            totalRatings: currentTotalRatings + 1
        });

        showCustomAlert('Rating Submitted!', 'Thank you for your feedback.', false, () => {
            closeModals();
            loadProducts(); // Reload products to update displayed ratings
        });
    } catch (error) {
        console.error("Error submitting rating:", error);
        showCustomAlert('Error', 'Failed to submit rating: ' + error.message);
    }
}

function closeRatingModal() {
    ratingModal.style.display = 'none';
}

async function loadOrderHistory() {
    if (!currentUser) {
        userOrdersList.innerHTML = '<p>Please log in to view your order history.</p>';
        return;
    }

    userOrdersList.innerHTML = '<p>Loading order history...</p>';

    onValue(ordersRef, (snapshot) => {
        const orders = [];
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (order.userId === currentUser.uid) {
                orders.push({ id: childSnapshot.key, ...order });
            }
        });

        if (orders.length === 0) {
            userOrdersList.innerHTML = '<p>You have not placed any orders yet.</p>';
            return;
        }

        userOrdersList.innerHTML = ''; // Clear loading message

        orders.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

        orders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('order-history-item');
            
            const orderTime = new Date(order.timestamp).toLocaleString();
            let productDetailsHtml = '';
            if (order.products && Array.isArray(order.products)) {
                order.products.forEach(p => {
                    productDetailsHtml += `<p>${p.title} (x${p.quantity}) - $${(p.price * p.quantity).toFixed(2)}</p>`;
                });
            } else if (order.productTitle) { // Handle single product orders from buy now
                productDetailsHtml = `<p>${order.productTitle} (x${order.quantity}) - $${(order.totalPrice).toFixed(2)}</p>`;
            }

            orderDiv.innerHTML = `
                <h4>Order ID: ${order.id}</h4>
                <p><strong>Status:</strong> <span style="color: ${order.status === 'Completed' ? 'green' : (order.status === 'Cancelled' ? 'red' : 'orange')}">${order.status || 'Pending'}</span></p>
                <p><strong>Order Time:</strong> ${orderTime}</p>
                <p><strong>Total Amount:</strong> $${order.totalPrice.toFixed(2)}</p>
                <p><strong>Delivery Address:</strong> ${order.customerAddress}</p>
                <p><strong>Phone Number:</strong> ${order.customerPhone}</p>
                <p><strong>Products:</strong></p>
                ${productDetailsHtml}
                <hr>
            `;
            userOrdersList.appendChild(orderDiv);
        });
    }, (error) => {
        console.error("Error loading order history:", error);
        userOrdersList.innerHTML = '<p>Error loading order history. Please try again later.</p>';
    });
}


// New function to open the order form modal
function openOrderForm(productToOrder = null) {
    // If a specific product is passed (from Buy Now), store it
    // Otherwise, it's a cart checkout
    currentProduct = productToOrder; 

    // Reset form fields
    orderDetailsForm.reset();
    orderFormModal.style.display = 'flex';
}

// New function to handle placing the order
async function placeOrder(event) {
    event.preventDefault(); // Prevent default form submission

    if (!currentUser) {
        showCustomAlert('Login Required', 'You must be logged in to place an order.', false, () => {
            closeModals();
            loginModal.style.display = 'flex';
        });
        return;
    }

    const customerName = customerNameInput.value.trim();
    const customerAddress = customerAddressInput.value.trim();
    const customerPhone = customerPhoneInput.value.trim();

    if (!customerName || !customerAddress || !customerPhone) {
        showCustomAlert('Missing Information', 'Please fill in all order details (Name, Address, Phone Number).');
        return;
    }

    let orderProducts = [];
    let totalPrice = 0;

    if (currentProduct) { // Single product order (Buy Now)
        if (currentProduct.stock <= 0) {
            showCustomAlert('Out of Stock', `${currentProduct.title} is currently out of stock.`);
            return;
        }
        orderProducts.push({
            id: currentProduct.id,
            title: currentProduct.title,
            price: currentProduct.price,
            quantity: 1, // Always 1 for buy now
            imageUrl: currentProduct.imageUrl
        });
        totalPrice = currentProduct.price;
    } else { // Cart checkout
        if (Object.keys(cart).length === 0) {
            showCustomAlert('Cart Empty', 'Your cart is empty. Add products before checking out.');
            return;
        }
        for (const productId in cart) {
            const item = cart[productId];
            const productInStock = products.find(p => p.id === productId);
            if (!productInStock || productInStock.stock < item.quantity) {
                showCustomAlert('Stock Alert', `Not enough stock for ${item.title}. Available: ${productInStock ? productInStock.stock : 0}`);
                return; // Stop checkout if any item is out of stock or insufficient
            }
            orderProducts.push({
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl
            });
            totalPrice += item.price * item.quantity;
        }
    }

    const orderData = {
        userId: currentUser.uid,
        userName: currentUser.email, // Or currentUser.displayName if available
        customerName: customerName,
        customerAddress: customerAddress,
        customerPhone: customerPhone,
        products: orderProducts,
        totalPrice: totalPrice,
        timestamp: serverTimestamp(),
        status: 'Pending' // Initial status
    };

    try {
        const newOrderRef = push(ordersRef);
        await set(newOrderRef, orderData);

        // Update stock for ordered products
        for (const item of orderProducts) {
            const productRef = ref(database, `products/${item.id}`);
            const productSnapshot = await get(productRef);
            const currentStock = productSnapshot.val().stock || 0;
            await update(productRef, {
                stock: currentStock - item.quantity
            });
        }

        if (!currentProduct) { // Only clear cart if it was a cart checkout
            clearCart();
        }
        closeModals();
        showCustomAlert('Order Placed!', 'Your order has been placed successfully. Thank you!', false, () => {
            loadOrderHistory(); // Refresh order history after placing order
            // Optionally navigate to order history section:
            // window.location.hash = '#order-history-section';
        });

    } catch (error) {
        console.error("Error placing order:", error);
        showCustomAlert('Order Failed', 'There was an error placing your order. Please try again.');
    }
}


// --- Event Listeners ---
closeModalButtons.forEach(button => {
    button.addEventListener('click', closeModals);
});

window.addEventListener('click', (event) => {
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
    if (event.target === cartModal) {
        cartModal.style.display = 'none';
    }
    if (event.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (event.target === ratingModal) {
        ratingModal.style.display = 'none';
    }
    if (event.target === orderFormModal) { // Close order form on outside click
        orderFormModal.style.display = 'none';
    }
    if (event.target === customAlertModal) { // Close custom alert on outside click
        customAlertModal.style.display = 'none';
    }
});

cartButton.addEventListener('click', () => {
    cartModal.style.display = 'flex';
    updateCartDisplay();
});

clearCartBtn.addEventListener('click', clearCart);

checkoutBtn.addEventListener('click', () => {
    cartModal.style.display = 'none'; // Close cart modal
    openOrderForm(); // Open the order form for cart checkout
});

loginButton.addEventListener('click', () => {
    loginModal.style.display = 'flex';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
});

registerSwitchBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
});

loginSwitchBtn.addEventListener('click', () => {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
});

userLoginBtn.addEventListener('click', async () => {
    const email = userEmailInput.value;
    const password = userPasswordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showCustomAlert('Login Successful', 'You have been logged in.', false, closeModals);
    } catch (error) {
        showCustomAlert('Login Failed', error.message);
    }
});

userRegisterBtn.addEventListener('click', async () => {
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;
    const confirmPassword = registerConfirmPasswordInput.value;

    if (password !== confirmPassword) {
        showCustomAlert('Registration Failed', 'Passwords do not match.');
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showCustomAlert('Registration Successful', 'Account created and logged in.', false, closeModals);
    } catch (error) {
        showCustomAlert('Registration Failed', error.message);
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showCustomAlert('Logged Out', 'You have been logged out.');
    } catch (error) {
        showCustomAlert('Logout Failed', error.message);
    }
});

searchInput.addEventListener('input', applyFiltersAndSort);
sortSelect.addEventListener('change', applyFiltersAndSort);

rateProductBtn.addEventListener('click', () => {
    if (currentProduct) {
        closeModals(); // Close product detail modal first
        openRatingModal(currentProduct);
    }
});

ratingStarsContainer.addEventListener('click', (event) => {
    const star = event.target.closest('.fa-star');
    if (star) {
        selectedRating = parseInt(star.dataset.rating);
        updateRatingStars();
    }
});

submitRatingButton.addEventListener('click', submitProductRating);

orderHistoryButton.addEventListener('click', () => {
    closeModals();
    orderHistorySection.style.display = 'block';
    // Hide other sections if they are not meant to be alongside order history
    document.getElementById('home').style.display = 'none';
    document.getElementById('products').style.display = 'none';
    document.getElementById('about').style.display = 'none';
    document.getElementById('contact').style.display = 'none';
    loadOrderHistory();
});


// Handle navigation links to show/hide sections
document.querySelectorAll('.main-nav a').forEach(link => {
    link.addEventListener('click', (event) => {
        // Only prevent default for internal links that handle section display
        if (event.target.getAttribute('href').startsWith('#')) {
            event.preventDefault();
            const targetId = event.target.getAttribute('href').substring(1);
            
            // Hide all main sections
            document.getElementById('home').style.display = 'none';
            document.getElementById('products').style.display = 'none';
            document.getElementById('about').style.display = 'none';
            document.getElementById('contact').style.display = 'none';
            orderHistorySection.style.display = 'none';

            // Show the target section
            if (targetId) {
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                    if (targetId === 'order-history-section') {
                        loadOrderHistory(); // Load data specifically for order history
                    }
                }
            }
        }
    });
});
// Special handling for the home link to always show the home section
document.getElementById('home-nav-link').addEventListener('click', () => {
    document.getElementById('home').style.display = 'block';
    document.getElementById('products').style.display = 'block'; // Assuming products is part of home view
    document.getElementById('about').style.display = 'block';
    document.getElementById('contact').style.display = 'block';
    orderHistorySection.style.display = 'none'; // Ensure history is hidden
});


// New: Event listener for order form submission
orderDetailsForm.addEventListener('submit', placeOrder);


// --- Initial Data Load ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // User is signed in
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('logout-button').style.display = 'inline-block';
        document.getElementById('order-history-button').style.display = 'inline-block';
    } else {
        // User is signed out
        document.getElementById('login-button').style.display = 'inline-block';
        document.getElementById('logout-button').style.display = 'none';
        document.getElementById('order-history-button').style.display = 'none';
    }
});


onValue(productsRef, (snapshot) => {
    products = [];
    snapshot.forEach((childSnapshot) => {
        products.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    applyFiltersAndSort(); // Re-render products when data changes
});

onValue(categoriesRef, (snapshot) => {
    categories = [];
    snapshot.forEach((childSnapshot) => {
        categories.push({ id: childSnapshot.key, name: childSnapshot.val().name });
    });
    populateCategoryFilters();
    applyFiltersAndSort(); // Re-filter products based on updated categories
});

updateCartDisplay(); // Initial cart display on load
