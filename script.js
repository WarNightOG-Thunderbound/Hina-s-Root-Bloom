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
  appId: "1:967448486557:web:f559288e2197177f805a50", // Ensure this matches your Firebase Console web app ID
  measurementId: "G-CM2G05658R" // Ensure this is correct for analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize analytics early
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);


// --- Global Variables ---
let products = [];
let categories = {};
let cart = JSON.parse(localStorage.getItem('cart')) || []; // Initialize cart as an empty array if localStorage is empty or malformed
let currentUser = null; // To store current user data


// --- DOM Elements ---
const loginModal = document.getElementById('login-modal');
const closeLoginModal = document.querySelector('.close-login-modal');
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginErrorMessage = document.getElementById('login-error-message');
const authSection = document.getElementById('auth-section');
const userEmailSpan = document.getElementById('user-email');
const loginButton = document.getElementById('login-btn');
const logoutButton = document.getElementById('logout-btn');
const productGrid = document.getElementById('product-grid');
const categoryFilters = document.getElementById('category-filters');
const searchInput = document.getElementById('search-input');
const sortBySelect = document.getElementById('sort-by');
const cartIcon = document.getElementById('cart-icon');
const cartCountSpan = document.getElementById('cart-count');
const cartItemsDiv = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const placeCartOrderBtn = document.getElementById('place-cart-order-btn');
const viewOrderHistoryBtn = document.getElementById('view-order-history-btn');
const orderHistoryModal = document.getElementById('order-history-modal');
const closeOrderHistoryModal = orderHistoryModal.querySelector('.close-button');
const orderHistoryListDiv = document.getElementById('order-history-list');

// Product Modal
const productModal = document.getElementById('product-modal');
const closeModalButton = productModal.querySelector('.close-button');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductVideo = document.getElementById('modal-product-video');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductStock = document.getElementById('modal-product-stock');
const modalProductQuantity = document.getElementById('modal-product-quantity');
const addToCartButton = document.getElementById('add-to-cart-btn');
const buyNowButton = document.getElementById('buy-now-btn');
const productRatingDiv = document.getElementById('product-rating');
const submitRatingButton = document.getElementById('submit-rating-btn');
const ratingStarsDiv = document.getElementById('rating-stars');
const userRatingMessage = document.getElementById('user-rating-message');


// Sections
const homeSection = document.getElementById('home-section');
const shopSection = document.getElementById('shop-section');
const contactSection = document.getElementById('contact-section');
const aboutSection = document.getElementById('about-section');
const loginSection = document.getElementById('login-section'); // For the actual login form content
const productsSection = document.getElementById('products-section'); // If you have a dedicated products section

// Navigation links
const navLinks = document.querySelectorAll('.main-nav .nav-link');


// --- Utility Functions ---

// Custom Alert/Confirm Modal
function showCustomModal(title, message, type = 'alert', onConfirm = null) {
    const modal = document.getElementById('custom-alert-modal');
    document.getElementById('custom-modal-title').textContent = title;
    document.getElementById('custom-modal-message').textContent = message;

    const okBtn = document.getElementById('custom-modal-ok-btn');
    const cancelBtn = document.getElementById('custom-modal-cancel-btn');

    modal.style.display = 'flex'; // Use flex to center

    okBtn.onclick = () => {
        modal.style.display = 'none';
        if (type === 'confirm' && onConfirm) {
            onConfirm(true);
        }
    };

    if (type === 'confirm') {
        cancelBtn.style.display = 'inline-block';
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            if (onConfirm) {
                onConfirm(false);
            }
        };
    } else {
        cancelBtn.style.display = 'none';
    }
}


// --- Authentication ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        authSection.style.display = 'flex';
        userEmailSpan.textContent = user.email;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        loginModal.style.display = 'none'; // Hide modal if user logs in
        loginSection.style.display = 'none'; // Hide login form section
        viewOrderHistoryBtn.style.display = 'block'; // Show order history button
        loadOrderHistory(); // Load order history when user logs in
    } else {
        authSection.style.display = 'none';
        userEmailSpan.textContent = '';
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
        viewOrderHistoryBtn.style.display = 'none'; // Hide order history button
        // Do NOT automatically show login modal here, only when login button is clicked
    }
});

loginButton.addEventListener('click', () => {
    loginModal.style.display = 'flex'; // Show login modal
});

closeLoginModal.addEventListener('click', () => {
    loginModal.style.display = 'none'; // Hide login modal
    loginErrorMessage.style.display = 'none'; // Clear any previous error messages
    loginForm.reset(); // Reset form fields
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle UI update
    } catch (error) {
        console.error('Login Error:', error);
        loginErrorMessage.textContent = error.message;
        loginErrorMessage.style.display = 'block';
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // onAuthStateChanged will handle UI update
        showCustomModal('Logged Out', 'You have been successfully logged out.', 'alert');
        // Clear cart and update display on logout
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    } catch (error) {
        console.error('Logout Error:', error);
        showCustomModal('Logout Error', 'Failed to log out: ' + error.message, 'alert');
    }
});


// --- Load Data (Products & Categories) ---
function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        products = [];
        snapshot.forEach(childSnapshot => {
            products.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        displayProducts();
        filterProducts(); // Apply initial filters/sorts
    }, (error) => {
        console.error("Error loading products:", error);
        showCustomModal('Error', 'Failed to load products: ' + error.message, 'alert');
    });
}

function loadCategories() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        categories = {};
        snapshot.forEach(childSnapshot => {
            categories[childSnapshot.key] = childSnapshot.val();
        });
        displayCategoryFilters();
        filterProducts(); // Re-filter products if categories change
    }, (error) => {
        console.error("Error loading categories:", error);
        showCustomModal('Error', 'Failed to load categories: ' + error.message, 'alert');
    });
}

// --- Display Functions ---
function displayProducts(filteredProducts = products) {
    productGrid.innerHTML = '';
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<p>No products found matching your criteria.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const categoryName = categories[product.category] ? categories[product.category].name : 'Uncategorized';
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.imageUrl || 'https://via.placeholder.com/200'}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-category">${categoryName}</p>
                <div class="product-rating-display" data-product-id="${product.id}">
                    </div>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <button class="button primary-button view-details-btn" data-product-id="${product.id}">View Details</button>
            </div>
        `;
        productGrid.appendChild(productCard);
        displayAverageRating(product.id); // Display rating for each product
    });

    attachProductCardListeners();
}

function displayCategoryFilters() {
    categoryFilters.innerHTML = '<button class="category-button active" data-category-id="all">All</button>';
    for (let id in categories) {
        const category = categories[id];
        const button = document.createElement('button');
        button.className = 'category-button';
        button.dataset.categoryId = id;
        button.textContent = category.name;
        categoryFilters.appendChild(button);
    }
    attachCategoryFilterListeners();
}


// --- Filtering and Sorting ---
function filterProducts() {
    const activeCategoryButton = document.querySelector('.category-button.active');
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.categoryId : 'all';
    const searchTerm = searchInput.value.toLowerCase();
    const sortBy = sortBySelect.value;

    let filtered = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        const matchesSearch = product.title.toLowerCase().includes(searchTerm) ||
                              product.description.toLowerCase().includes(searchTerm) ||
                              categories[product.category]?.name.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });

    switch (sortBy) {
        case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filtered.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'stock-asc':
            filtered.sort((a, b) => a.stock - b.stock);
            break;
        case 'stock-desc':
            filtered.sort((a, b) => b.stock - a.stock);
            break;
        case 'rating-desc':
            filtered.sort((a, b) => getAverageRatingForProduct(b.id) - getAverageRatingForProduct(a.id));
            break;
        case 'rating-asc':
            filtered.sort((a, b) => getAverageRatingForProduct(a.id) - getAverageRatingForProduct(b.id));
            break;
    }

    displayProducts(filtered);
}

function getAverageRatingForProduct(productId) {
    let total = 0;
    let count = 0;
    for (let ratingId in allRatings) {
        const rating = allRatings[ratingId];
        if (rating.productId === productId) {
            total += rating.rating;
            count++;
        }
    }
    return count > 0 ? (total / count) : 0; // Return 0 if no ratings
}

// --- Event Listeners for Filtering and Sorting ---
searchInput.addEventListener('input', filterProducts);
sortBySelect.addEventListener('change', filterProducts);

function attachCategoryFilterListeners() {
    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterProducts();
        });
    });
}


// --- Product Modal ---
function attachProductCardListeners() {
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.productId;
            openProductModal(productId);
        });
    });
}

closeModalButton.addEventListener('click', () => {
    productModal.style.display = 'none';
    modalProductVideo.innerHTML = ''; // Clear video iframe
});

async function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showCustomModal('Error', 'Product not found!', 'alert');
        return;
    }

    modalProductImage.src = product.imageUrl || 'https://via.placeholder.com/400';
    modalProductTitle.textContent = product.title;
    modalProductDescription.textContent = product.description;
    modalProductPrice.textContent = `$${product.price.toFixed(2)}`;
    modalProductCategory.textContent = categories[product.category] ? categories[product.category].name : 'Uncategorized';
    modalProductStock.textContent = `Stock: ${product.stock}`;
    modalProductQuantity.max = product.stock;
    modalProductQuantity.value = 1; // Reset quantity

    // Handle video display
    modalProductVideo.innerHTML = ''; // Clear previous video
    if (product.videoUrl) {
        // Assuming YouTube embed URL or similar
        const videoId = product.videoUrl.split('v=')[1] || product.videoUrl.split('youtu.be/')[1] || product.videoUrl.split('/').pop();
        if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId.split('&')[0]}?autoplay=0&rel=0`;
            modalProductVideo.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
            // Fallback for direct video file URLs
            modalProductVideo.innerHTML = `<video controls src="${product.videoUrl}" style="width:100%; height:auto;"></video>`;
        }
        modalProductVideo.style.display = 'block';
    } else {
        modalProductVideo.style.display = 'none';
    }

    // Set product ID for Add to Cart and Buy Now buttons
    addToCartButton.dataset.productId = productId;
    buyNowButton.dataset.productId = productId;
    submitRatingButton.dataset.productId = productId; // Set for rating submission

    await displayProductRatings(productId); // Display existing ratings and user's rating option

    productModal.style.display = 'flex';
}

// --- Cart Functionality ---
function updateCartDisplay() {
    cartItemsDiv.innerHTML = '';
    let total = 0;

    // Ensure cart is an array before using reduce or forEach
    if (!Array.isArray(cart)) {
        cart = []; // Reset cart if it's not an array
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalSpan.textContent = '$0.00';
        cartCountSpan.textContent = '0';
        placeCartOrderBtn.disabled = true;
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <span>${item.title} x ${item.quantity}</span>
            <span>$${itemTotal.toFixed(2)}</span>
            <button class="remove-from-cart-btn" data-product-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
        `;
        cartItemsDiv.appendChild(cartItem);
    });

    cartTotalSpan.textContent = `$${total.toFixed(2)}`;
    cartCountSpan.textContent = cart.reduce((sum, item) => sum + item.quantity, 0); // Correctly sum quantities
    placeCartOrderBtn.disabled = false;

    attachRemoveFromCartListeners();
}


function addToCart(productId, quantity) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showCustomModal('Error', 'Product not found!', 'alert');
        return;
    }
    if (quantity > product.stock) {
        showCustomModal('Error', `Only ${product.stock} items of ${product.title} are in stock.`, 'alert');
        return;
    }

    const existingCartItem = cart.find(item => item.id === productId);

    if (existingCartItem) {
        // Check if adding more would exceed stock
        if (existingCartItem.quantity + quantity > product.stock) {
            showCustomModal('Error', `Adding ${quantity} more would exceed available stock (${product.stock}). You currently have ${existingCartItem.quantity} in cart.`, 'alert');
            return;
        }
        existingCartItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            quantity: quantity,
            imageUrl: product.imageUrl, // Include image for cart display
            category: product.category // Include category for order processing
        });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    showCustomModal('Added to Cart', `${quantity} x ${product.title} added to your cart!`, 'alert');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    showCustomModal('Removed', 'Item removed from cart.', 'alert');
}

function attachRemoveFromCartListeners() {
    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.closest('button').dataset.productId;
            removeFromCart(productId);
        });
    });
}

addToCartButton.addEventListener('click', () => {
    const productId = addToCartButton.dataset.productId;
    const quantity = parseInt(modalProductQuantity.value);
    if (quantity > 0) {
        addToCart(productId, quantity);
        productModal.style.display = 'none'; // Close modal after adding
    } else {
        showCustomModal('Error', 'Quantity must be at least 1.', 'alert');
    }
});

buyNowButton.addEventListener('click', () => {
    const productId = buyNowButton.dataset.productId;
    const quantity = parseInt(modalProductQuantity.value);
    if (quantity > 0) {
        placeOrder(productId, false, quantity); // Not from cart
        productModal.style.display = 'none'; // Close modal after ordering
    } else {
        showCustomModal('Error', 'Quantity must be at least 1.', 'alert');
    }
});

// --- Order Placement ---
async function placeOrder(productId = null, fromCart = false, quantity = 1) {
    if (!currentUser) {
        showCustomModal('Login Required', 'Please log in to place an order.', 'alert');
        return;
    }

    let orderProducts = {};
    let totalAmount = 0;

    if (fromCart) {
        if (cart.length === 0) {
            showCustomModal('Cart Empty', 'Your cart is empty. Add items before placing an order.', 'alert');
            return;
        }
        cart.forEach(item => {
            orderProducts[item.id] = {
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl,
                category: item.category
            };
            totalAmount += item.price * item.quantity;
        });

        // Check stock for all items in cart
        for (const item of cart) {
            const productRef = ref(database, `products/${item.id}`);
            const snapshot = await get(productRef);
            const currentProduct = snapshot.val();
            if (!currentProduct || currentProduct.stock < item.quantity) {
                showCustomModal('Stock Error', `Not enough stock for ${item.title}. Available: ${currentProduct ? currentProduct.stock : 0}, Requested: ${item.quantity}.`, 'alert');
                return;
            }
        }
    } else {
        const product = products.find(p => p.id === productId);
        if (!product || product.stock < quantity) {
            showCustomModal('Stock Error', `Not enough stock for ${product.title}. Available: ${product.stock}, Requested: ${quantity}.`, 'alert');
            return;
        }
        orderProducts[product.id] = {
            id: product.id,
            title: product.title,
            price: product.price,
            quantity: quantity,
            imageUrl: product.imageUrl,
            category: product.category
        };
        totalAmount = product.price * quantity;
    }

    showCustomModal('Confirm Order', `Total: $${totalAmount.toFixed(2)}. Do you want to confirm your order?`, 'confirm', async (confirmed) => {
        if (confirmed) {
            try {
                const ordersRef = ref(database, 'orders');
                const newOrderRef = push(ordersRef);
                const orderData = {
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    products: orderProducts,
                    total: totalAmount,
                    timestamp: serverTimestamp(),
                    status: 'Pending'
                };
                await set(newOrderRef, orderData);

                // Decrease stock for ordered items
                for (const itemId in orderProducts) {
                    const orderedQty = orderProducts[itemId].quantity;
                    const productRef = ref(database, `products/${itemId}`);
                    const snapshot = await get(productRef);
                    const currentStock = snapshot.val().stock;
                    await update(productRef, { stock: currentStock - orderedQty });
                }

                if (fromCart) {
                    cart = []; // Clear cart after successful order
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartDisplay();
                }

                showCustomModal('Order Placed!', 'Your order has been placed successfully. Thank you!', 'alert');
            } catch (error) {
                console.error('Error placing order:', error);
                showCustomModal('Order Error', 'Failed to place order: ' + error.message, 'alert');
            }
        }
    });
}

// --- Order History ---
viewOrderHistoryBtn.addEventListener('click', () => {
    if (currentUser) {
        orderHistoryModal.style.display = 'flex';
        loadOrderHistory(); // Ensure history is fresh when modal opens
    } else {
        showCustomModal('Login Required', 'Please log in to view your order history.', 'alert');
    }
});

closeOrderHistoryModal.addEventListener('click', () => {
    orderHistoryModal.style.display = 'none';
});

function loadOrderHistory() {
    if (!currentUser) {
        orderHistoryListDiv.innerHTML = '<p>Please log in to view your order history.</p>';
        return;
    }

    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        orderHistoryListDiv.innerHTML = '';
        const userOrders = [];
        snapshot.forEach(childSnapshot => {
            const order = { id: childSnapshot.key, ...childSnapshot.val() };
            if (order.userId === currentUser.uid) {
                userOrders.push(order);
            }
        });

        if (userOrders.length === 0) {
            orderHistoryListDiv.innerHTML = '<p>You have no past orders.</p>';
            return;
        }

        userOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Newest first

        userOrders.forEach(order => {
            const orderDate = order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A';
            const productsList = order.products ? Object.values(order.products).map(p => `<li>${p.title} (x${p.quantity}) - $${(p.price * p.quantity).toFixed(2)}</li>`).join('') : '<li>No products</li>';
            const orderItem = document.createElement('div');
            orderItem.className = 'order-history-item';
            orderItem.innerHTML = `
                <h4>Order ID: ${order.id}</h4>
                <p><strong>Date:</strong> ${orderDate}</p>
                <p><strong>Status:</strong> <span class="order-status-${order.status.toLowerCase()}">${order.status}</span></p>
                <p><strong>Total:</strong> $${order.total ? order.total.toFixed(2) : '0.00'}</p>
                <p><strong>Products:</strong></p>
                <ul>${productsList}</ul>
                <button class="button secondary-button reorder-btn" data-order-id="${order.id}">Reorder</button>
            `;
            orderHistoryListDiv.appendChild(orderItem);
        });
        attachReorderListeners();
    }, (error) => {
        console.error("Error loading order history:", error);
        orderHistoryListDiv.innerHTML = '<p>Error loading order history.</p>';
    });
}

function attachReorderListeners() {
    document.querySelectorAll('.reorder-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.orderId;
            const orderToReorder = Object.values(allOrders).find(order => order.id === orderId); // Assuming allOrders is available

            if (!orderToReorder || !orderToReorder.products) {
                showCustomModal('Error', 'Order details not found for reorder.', 'alert');
                return;
            }

            // Populate cart with items from the order
            cart = [];
            for (const productId in orderToReorder.products) {
                const item = orderToReorder.products[productId];
                const productInShop = products.find(p => p.id === productId);
                if (productInShop && productInShop.stock >= item.quantity) {
                    cart.push({
                        id: item.id,
                        title: item.title,
                        price: item.price,
                        quantity: item.quantity,
                        imageUrl: item.imageUrl,
                        category: item.category
                    });
                } else {
                    showCustomModal('Stock Issue', `Not enough stock for ${item.title} to reorder. Available: ${productInShop ? productInShop.stock : 0}, Requested: ${item.quantity}.`, 'alert');
                    cart = []; // Clear cart if any item has stock issue
                    return;
                }
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
            showCustomModal('Reorder Initiated', 'Items from your previous order have been added to your cart. Please proceed to checkout.', 'alert');
            orderHistoryModal.style.display = 'none'; // Close history modal
            document.querySelectorAll('section').forEach(section => section.style.display = 'none');
            shopSection.style.display = 'block'; // Show shop section with updated cart
            // Update active class for navigation links
            navLinks.forEach(nav => nav.classList.remove('active'));
            document.querySelector('.nav-link[href="#shop"]').classList.add('active');
        });
    });
}


// --- Product Rating ---
let allRatings = {}; // Global variable to store all ratings

function loadAllRatings() {
    const ratingsRef = ref(database, 'ratings');
    onValue(ratingsRef, (snapshot) => {
        allRatings = snapshot.val() || {};
        // Re-render product cards to update their average ratings if visible
        displayProducts();
    }, (error) => {
        console.error("Error loading all ratings:", error);
    });
}


function displayAverageRating(productId) {
    const productRatingDiv = document.querySelector(`.product-rating-display[data-product-id="${productId}"]`);
    if (!productRatingDiv) return;

    let totalRating = 0;
    let reviewCount = 0;

    for (const ratingId in allRatings) {
        const rating = allRatings[ratingId];
        if (rating.productId === productId) {
            totalRating += rating.rating;
            reviewCount++;
        }
    }

    const averageRating = reviewCount > 0 ? (totalRating / reviewCount) : 0;
    productRatingDiv.innerHTML = generateStarHtml(averageRating) + ` (${reviewCount})`;
}

function generateStarHtml(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            starsHtml += '<i class="fas fa-star filled"></i>';
        } else if (i - 0.5 <= rating) {
            starsHtml += '<i class="fas fa-star-half-alt filled"></i>';
        } else {
            starsHtml += '<i class="far fa-star"></i>';
        }
    }
    return starsHtml;
}


async function displayProductRatings(productId) {
    productRatingDiv.innerHTML = '';
    ratingStarsDiv.innerHTML = '';
    userRatingMessage.textContent = '';

    // Display average rating for the modal product
    const product = products.find(p => p.id === productId);
    if (product) {
        let totalRating = 0;
        let reviewCount = 0;
        let userHasRated = false;
        let userCurrentRating = 0;

        for (const ratingId in allRatings) {
            const rating = allRatings[ratingId];
            if (rating.productId === productId) {
                totalRating += rating.rating;
                reviewCount++;
                if (currentUser && rating.userId === currentUser.uid) {
                    userHasRated = true;
                    userCurrentRating = rating.rating;
                }
            }
        }

        const averageRating = reviewCount > 0 ? (totalRating / reviewCount) : 0;
        productRatingDiv.innerHTML = `Average Rating: ${generateStarHtml(averageRating)} (${reviewCount} reviews)`;

        // Show rating input if user is logged in
        if (currentUser) {
            if (userHasRated) {
                userRatingMessage.textContent = `You have rated this product ${userCurrentRating} stars.`;
                submitRatingButton.style.display = 'none'; // Hide submit button if already rated
            } else {
                userRatingMessage.textContent = 'Rate this product:';
                submitRatingButton.style.display = 'block';
            }

            // Populate rating stars for user input
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('i');
                star.className = `fas fa-star ${i <= userCurrentRating ? 'selected' : ''}`;
                star.dataset.value = i;
                star.addEventListener('click', () => {
                    document.querySelectorAll('#rating-stars .fas.fa-star').forEach(s => s.classList.remove('selected'));
                    for (let j = 1; j <= i; j++) {
                        document.querySelector(`#rating-stars .fas.fa-star[data-value="${j}"]`).classList.add('selected');
                    }
                    modalProductQuantity.dataset.rating = i; // Store selected rating
                });
                ratingStarsDiv.appendChild(star);
            }
        } else {
            userRatingMessage.textContent = 'Login to rate this product.';
            submitRatingButton.style.display = 'none';
        }
    }
}

submitRatingButton.addEventListener('click', async () => {
    if (!currentUser) {
        showCustomModal('Login Required', 'Please log in to submit a rating.', 'alert');
        return;
    }

    const productId = submitRatingButton.dataset.productId;
    const selectedRating = parseInt(modalProductQuantity.dataset.rating);

    if (isNaN(selectedRating) || selectedRating < 1 || selectedRating > 5) {
        showCustomModal('Rating Error', 'Please select a star rating (1-5).', 'alert');
        return;
    }

    try {
        // Check if user has already rated this product
        const ratingsRef = ref(database, 'ratings');
        const snapshot = await get(ratingsRef);
        let existingRatingId = null;
        snapshot.forEach(childSnapshot => {
            const rating = childSnapshot.val();
            if (rating.productId === productId && rating.userId === currentUser.uid) {
                existingRatingId = childSnapshot.key;
            }
        });

        if (existingRatingId) {
            // Update existing rating
            await update(ref(database, `ratings/${existingRatingId}`), {
                rating: selectedRating,
                timestamp: serverTimestamp()
            });
            showCustomModal('Rating Updated', 'Your rating has been updated successfully!', 'alert');
        } else {
            // Add new rating
            const newRatingRef = push(ratingsRef);
            await set(newRatingRef, {
                productId: productId,
                userId: currentUser.uid,
                rating: selectedRating,
                timestamp: serverTimestamp()
            });
            showCustomModal('Rating Submitted', 'Thank you for your rating!', 'alert');
        }
        productModal.style.display = 'none'; // Close modal after rating
    } catch (error) {
        console.error('Error submitting rating:', error);
        showCustomModal('Rating Error', 'Failed to submit rating: ' + error.message, 'alert');
    }
});


// --- Navigation ---
document.querySelectorAll('.main-nav .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default anchor behavior

        // Hide all sections
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });

        // Remove active class from all nav links
        navLinks.forEach(nav => nav.classList.remove('active'));

        // Show the target section based on href
        const targetId = e.target.getAttribute('href').substring(1); // Get id from href (e.g., "home-section")
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
            e.target.classList.add('active'); // Add active class to clicked link
        }
        // Special handling for "Shop" to ensure products are always displayed
        if (targetId === 'shop-section') {
            productsSection.style.display = 'block';
        }
    });
});


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial data loads
    loadCategories();
    loadProducts();
    loadAllRatings(); // Load all ratings globally for display on product cards

    updateCartDisplay(); // Display cart items on load

    // Default to showing the home section and activating its nav link
    homeSection.style.display = 'block';
    document.querySelector('.nav-link[href="#home-section"]').classList.add('active');


    // Cart icon click to show shop section
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('section').forEach(section => section.style.display = 'none');
        shopSection.style.display = 'block';
        productsSection.style.display = 'block'; // Ensure products section is also visible
        updateCartDisplay();

        // Update active class for navigation links
        navLinks.forEach(nav => nav.classList.remove('active'));
        document.querySelector('.nav-link[href="#shop-section"]').classList.add('active');
    });

    // Place Cart Order button
    placeCartOrderBtn.addEventListener('click', () => {
        placeOrder(null, true); // true indicates from cart
    });
});
