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
  appId: "1:967448486557:web:f559288e2197177f805a50",
  measurementId: "G-CM2G05658R"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);


// --- DOM Elements ---
const loginLink = document.getElementById('login-link');
const adminLink = document.getElementById('admin-link');
const logoutLink = document.getElementById('logout-link');
const loginModal = document.getElementById('login-modal');
const closeLoginModalButton = loginModal.querySelector('.close-button');
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginErrorMessage = document.getElementById('login-error-message');

const productGrid = document.getElementById('product-grid');
const categoryFilters = document.getElementById('category-filters');
const sortOptions = document.getElementById('sort-options');

const productModal = document.getElementById('product-modal');
const closeProductModalButton = productModal.querySelector('.close-button');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductTitle = document.getElementById('modal-product-title');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductVideoContainer = document.getElementById('modal-product-video-container');
const modalProductVideo = document.getElementById('modal-product-video');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductQuantity = document.getElementById('modal-product-quantity');
const addToCartModalBtn = document.getElementById('add-to-cart-modal-btn');
const placeOrderModalBtn = document.getElementById('place-order-modal-btn');

const cartIcon = document.getElementById('cart-icon');
const cartCount = document.getElementById('cart-count');

const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');

const ratingModal = document.getElementById('rating-modal');
const closeRatingModalBtn = document.getElementById('close-rating-modal-btn');
const ratingProductTitle = document.getElementById('rating-product-title');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const ratingReviewText = document.getElementById('rating-review-text');
const submitRatingButton = document.getElementById('submit-rating-btn');
const modalAverageRating = document.getElementById('modal-average-rating');
const modalRatingBreakdown = document.getElementById('modal-rating-breakdown');
const rateProductBtn = document.getElementById('rate-product-btn');

const contactForm = document.getElementById('contact-form');

const orderHistoryModal = document.getElementById('order-history-modal');
const closeOrderHistoryModalBtn = orderHistoryModal.querySelector('.close-button');
const orderHistoryList = document.getElementById('order-history-list');
const toggleOrderHistoryBtn = document.getElementById('toggle-order-history-btn');

const shopSection = document.getElementById('shop');
const cartItemsContainer = document.getElementById('cart-items');
const emptyCartMessage = document.getElementById('empty-cart-message');
const cartTotalSpan = document.getElementById('cart-total');
const placeCartOrderBtn = document.getElementById('place-cart-order-btn');
const navLinks = document.querySelectorAll('.nav-link'); // For active tab highlighting

// --- Global Variables ---
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentProduct = null; // For modal context
let selectedRating = 0; // For rating submission


// --- Firebase References ---
const dbRef = ref(database);
const productsRef = ref(database, 'products');
const categoriesRef = ref(database, 'categories');
const ordersRef = ref(database, 'orders');
const ratingsRef = ref(database, 'ratings');
const messagesRef = ref(database, 'messages');


// --- Utility Functions ---

function showCustomAlert(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        customModalTitle.textContent = title;
        customModalMessage.textContent = message;
        customModalCancelBtn.style.display = isConfirm ? 'inline-block' : 'none';
        customAlertModal.style.display = 'flex'; // Use flex to center

        customModalOkBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            resolve(true);
        };

        customModalCancelBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            resolve(false);
        };

        // Close on outside click for alert, but not for confirm
        if (!isConfirm) {
            customAlertModal.addEventListener('click', function handler(event) {
                if (event.target === customAlertModal) {
                    customAlertModal.style.display = 'none';
                    resolve(false); // Resolve false if clicked outside for alert
                    customAlertModal.removeEventListener('click', handler);
                }
            });
        }
    });
}

// --- Product Display Functions ---

function displayProducts(productsToDisplay) {
    productGrid.innerHTML = ''; // Clear existing products
    if (productsToDisplay.length === 0) {
        productGrid.innerHTML = '<p>No products found for this category.</p>';
        return;
    }

    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.id = product.id;

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.imageUrl || 'https://via.placeholder.com/200'}" alt="${product.title}">
            </div>
            <div class="product-info">
                <h3>${product.title}</h3>
                <p>${product.description.substring(0, 70)}...</p>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <div class="product-actions">
                    <button class="button primary-button view-detail-btn" data-id="${product.id}">View Detail</button>
                    <button class="button secondary-button add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        `;
        productGrid.appendChild(productCard);
    });

    document.querySelectorAll('.view-detail-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            openProductModal(productId);
        });
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            addToCart(productId, 1);
            showCustomAlert('Added to Cart', 'Product has been added to your cart!');
        });
    });
}

function filterAndSortProducts() {
    let filteredProducts = [...products]; // Create a mutable copy

    // Filter by category
    const activeCategoryButton = document.querySelector('.category-button.active');
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'all';

    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

    // Sort products
    const sortBy = sortOptions.value;
    if (sortBy === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'name-desc') {
        filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
    }

    displayProducts(filteredProducts);
}

// --- Product Modal Functions ---

async function openProductModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) {
        showCustomAlert('Error', 'Product not found.');
        return;
    }

    modalProductImage.src = currentProduct.imageUrl || 'https://via.placeholder.com/400';
    modalProductImage.alt = currentProduct.title;
    modalProductTitle.textContent = currentProduct.title;
    modalProductDescription.textContent = currentProduct.description;
    modalProductPrice.textContent = `$${currentProduct.price.toFixed(2)}`;
    modalProductQuantity.value = 1; // Reset quantity

    // Handle video display
    if (currentProduct.videoUrl) {
        modalProductVideoContainer.style.display = 'block';
        // Basic embedding for YouTube, you might need more robust parsing for other services
        const videoId = currentProduct.videoUrl.split('v=')[1] || currentProduct.videoUrl.split('/').pop();
        modalProductVideo.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
        modalProductVideoContainer.style.display = 'none';
        modalProductVideo.innerHTML = '';
    }

    await loadProductRatings(productId); // Load ratings for the current product
    productModal.style.display = 'flex';
}

function closeProductModal() {
    productModal.style.display = 'none';
    currentProduct = null;
    modalProductVideo.innerHTML = ''; // Clear video iframe
    selectedRating = 0; // Reset selected rating
    updateRatingStars(); // Reset rating stars
}

// --- Cart Functions ---

function addToCart(productId, quantity) {
    const productToAdd = products.find(p => p.id === productId);
    if (!productToAdd) return;

    const existingCartItem = cart.find(item => item.id === productId);

    if (existingCartItem) {
        existingCartItem.quantity += quantity;
    } else {
        cart.push({
            id: productToAdd.id,
            title: productToAdd.title,
            price: productToAdd.price,
            imageUrl: productToAdd.imageUrl,
            quantity: quantity
        });
    }
    updateCartDisplay();
    saveCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    saveCart();
    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        placeCartOrderBtn.style.display = 'none';
    }
}

function updateCartItemQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = parseInt(newQuantity, 10);
        if (item.quantity <= 0) {
            removeFromCart(productId);
        }
        updateCartDisplay();
        saveCart();
    }
}

function updateCartDisplay() {
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    renderCartItems();
    calculateCartTotal();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        placeCartOrderBtn.style.display = 'none';
        return;
    }
    emptyCartMessage.style.display = 'none';
    placeCartOrderBtn.style.display = 'block';

    cart.forEach(item => {
        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <img src="${item.imageUrl || 'https://via.placeholder.com/80'}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${item.title}</h4>
                <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
                <div class="cart-item-quantity">
                    <label>Qty:</label>
                    <input type="number" value="${item.quantity}" min="1" data-id="${item.id}" class="cart-quantity-input">
                </div>
            </div>
            <button class="remove-from-cart-btn" data-id="${item.id}">Remove</button>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });

    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            removeFromCart(event.target.dataset.id);
        });
    });

    document.querySelectorAll('.cart-quantity-input').forEach(input => {
        input.addEventListener('change', (event) => {
            updateCartItemQuantity(event.target.dataset.id, event.target.value);
        });
    });
}

function calculateCartTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalSpan.textContent = `$${total.toFixed(2)}`;
}


// --- Order Functions ---

async function placeOrder(productDetails = null, itemsFromCart = false) {
    let orderItems = [];
    let orderTotal = 0;

    if (itemsFromCart) {
        if (cart.length === 0) {
            await showCustomAlert('Cart Empty', 'Your cart is empty. Add items before placing an order.');
            return;
        }
        orderItems = cart.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl
        }));
        orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    } else if (productDetails) {
        orderItems.push({
            id: productDetails.id,
            title: productDetails.title,
            price: productDetails.price,
            quantity: productDetails.quantity,
            imageUrl: productDetails.imageUrl
        });
        orderTotal = productDetails.price * productDetails.quantity;
    } else {
        await showCustomAlert('Error', 'No items to order.');
        return;
    }

    const userAddress = await showPrompt('Enter your shipping address:', 'Shipping Address');
    if (!userAddress) {
        await showCustomAlert('Order Cancelled', 'Shipping address is required to place an order.');
        return;
    }

    const userPhone = await showPrompt('Enter your phone number:', 'Phone Number');
    if (!userPhone) {
        await showCustomAlert('Order Cancelled', 'Phone number is required to place an order.');
        return;
    }

    const orderId = push(ordersRef).key;
    const orderData = {
        orderId: orderId,
        items: orderItems,
        total: orderTotal,
        timestamp: serverTimestamp(),
        status: 'Pending',
        customerAddress: userAddress,
        customerPhone: userPhone
    };

    try {
        await set(ref(database, `orders/${orderId}`), orderData);
        await showCustomAlert('Order Placed!', 'Your order has been placed successfully. We will contact you soon.');
        if (itemsFromCart) {
            cart = []; // Clear cart after placing order
            saveCart();
            updateCartDisplay();
            closeProductModal(); // Close modal if open
        }
    } catch (error) {
        console.error("Error placing order: ", error);
        await showCustomAlert('Order Failed', 'There was an error placing your order. Please try again.');
    }
}

async function showPrompt(message, title = 'Input Required') {
    return new Promise((resolve) => {
        showCustomAlert(title, message, true); // Use confirm modal for prompt

        customModalOkBtn.onclick = () => {
            const inputElement = customModalMessage.querySelector('input');
            const inputValue = inputElement ? inputElement.value : '';
            customAlertModal.style.display = 'none';
            resolve(inputValue);
        };

        customModalCancelBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            resolve(null); // User cancelled
        };

        // Replace message with an input field
        customModalMessage.innerHTML = `<p>${message}</p><input type="text" id="prompt-input" class="custom-modal-input" placeholder="${title}">`;
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            promptInput.focus();
            promptInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    customModalOkBtn.click();
                }
            });
        }
    });
}


// --- Rating Functions ---

function updateRatingStars() {
    ratingStarsContainer.querySelectorAll('.fa-star').forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= selectedRating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

async function submitProductRating() {
    if (!currentProduct) {
        await showCustomAlert('Error', 'No product selected for rating.');
        return;
    }
    if (selectedRating === 0) {
        await showCustomAlert('Rating Required', 'Please select a star rating.');
        return;
    }

    const reviewText = ratingReviewText.value.trim();
    const ratingId = push(ratingsRef).key;

    const ratingData = {
        productId: currentProduct.id,
        rating: selectedRating,
        review: reviewText,
        timestamp: serverTimestamp(),
        // Potentially add userId if user authentication is implemented
    };

    try {
        await set(ref(database, `ratings/${ratingId}`), ratingData);
        await showCustomAlert('Success', 'Thank you for your rating!');
        closeRatingModal();
        await loadProductRatings(currentProduct.id); // Reload ratings for the product
    } catch (error) {
        console.error("Error submitting rating:", error);
        await showCustomAlert('Error', 'Failed to submit rating. Please try again.');
    }
}

async function loadProductRatings(productId) {
    const productRatingsRef = ref(database, 'ratings');
    onValue(productRatingsRef, (snapshot) => {
        const allRatings = snapshot.val();
        const ratingsForProduct = [];
        if (allRatings) {
            for (const key in allRatings) {
                if (allRatings[key].productId === productId) {
                    ratingsForProduct.push(allRatings[key]);
                }
            }
        }
        renderProductRatings(ratingsForProduct);
    }, {
        onlyOnce: true // Fetch once to avoid constant updates while modal is open
    });
}

function renderProductRatings(ratings) {
    let totalRating = 0;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    ratings.forEach(r => {
        totalRating += r.rating;
        ratingCounts[r.rating]++;
    });

    const average = ratings.length > 0 ? (totalRating / ratings.length) : 0;
    modalAverageRating.innerHTML = `Average Rating: <strong>${average.toFixed(1)} / 5</strong> (${ratings.length} reviews)`;

    modalRatingBreakdown.innerHTML = '';
    for (let i = 5; i >= 1; i--) {
        const count = ratingCounts[i];
        const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
        const barHtml = `
            <div>
                <span>${i} Star</span>
                <div class="rating-bar-container">
                    <div class="rating-bar" style="width: ${percentage}%"></div>
                </div>
                <span>(${count})</span>
            </div>
        `;
        modalRatingBreakdown.insertAdjacentHTML('beforeend', barHtml);
    }
}


function openRatingModal() {
    if (!currentProduct) {
        showCustomAlert('Error', 'Please select a product to rate.');
        return;
    }
    ratingProductTitle.textContent = currentProduct.title;
    selectedRating = 0; // Reset selected rating
    ratingReviewText.value = ''; // Clear review text
    updateRatingStars();
    ratingModal.style.display = 'flex';
}

function closeRatingModal() {
    ratingModal.style.display = 'none';
}

// --- Data Loading from Firebase ---

// Listen for products data
onValue(productsRef, (snapshot) => {
    products = [];
    snapshot.forEach((childSnapshot) => {
        products.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    filterAndSortProducts(); // Re-render products when data changes
});

// Listen for categories data
onValue(categoriesRef, (snapshot) => {
    categories = [];
    snapshot.forEach((childSnapshot) => {
        categories.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    populateCategoryFilters();
});


// --- Initialization ---

function populateCategoryFilters() {
    categoryFilters.innerHTML = '<button class="category-button active" data-category="all">All</button>';
    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('category-button');
        button.dataset.category = category.name;
        button.textContent = category.name;
        categoryFilters.appendChild(button);
    });

    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', (event) => {
            document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            filterAndSortProducts();
        });
    });
}

function setActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100; // Adjust offset for header height
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });
}


// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    updateCartDisplay(); // Load cart on page load
    setActiveNavLink(); // Set active nav link on scroll

    // Login/Logout button visibility
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginLink.style.display = 'none';
            adminLink.style.display = 'block';
            logoutLink.style.display = 'block';
        } else {
            loginLink.style.display = 'block';
            adminLink.style.display = 'none';
            logoutLink.style.display = 'none';
        }
    });

    // Login modal
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'flex';
    });

    closeLoginModalButton.addEventListener('click', () => {
        loginModal.style.display = 'none';
        loginErrorMessage.textContent = '';
    });

    loginModal.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
            loginErrorMessage.textContent = '';
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            loginModal.style.display = 'none';
            loginEmailInput.value = '';
            loginPasswordInput.value = '';
            loginErrorMessage.textContent = '';
            window.location.href = 'admin.html'; // Redirect to admin page
        } catch (error) {
            console.error("Login failed:", error);
            loginErrorMessage.textContent = 'Invalid email or password.';
        }
    });

    // Logout
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            showCustomAlert('Logged Out', 'You have been successfully logged out.');
        } catch (error) {
            console.error("Logout failed:", error);
            showCustomAlert('Error', 'Failed to log out.');
        }
    });

    // Product modal close
    closeProductModalButton.addEventListener('click', closeProductModal);
    productModal.addEventListener('click', (event) => {
        if (event.target === productModal) {
            closeProductModal();
        }
    });

    // Add to cart from modal
    addToCartModalBtn.addEventListener('click', () => {
        if (currentProduct) {
            const quantity = parseInt(modalProductQuantity.value);
            addToCart(currentProduct.id, quantity);
            showCustomAlert('Added to Cart', `${quantity} x ${currentProduct.title} added to your cart!`);
            closeProductModal();
        }
    });

    // Place order from modal (single product)
    placeOrderModalBtn.addEventListener('click', () => {
        if (currentProduct) {
            const quantity = parseInt(modalProductQuantity.value);
            const productToOrder = { ...currentProduct, quantity: quantity };
            placeOrder(productToOrder, false); // false indicates not from cart
            closeProductModal();
        }
    });


    // Sort products
    sortOptions.addEventListener('change', filterAndSortProducts);

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

    // Rate product button in product modal
    rateProductBtn.addEventListener('click', openRatingModal);

    // Contact Form Submission
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const message = document.getElementById('contact-message').value;

        try {
            await push(messagesRef, {
                name,
                email,
                message,
                timestamp: serverTimestamp()
            });
            await showCustomAlert('Message Sent', 'Your message has been sent successfully!');
            contactForm.reset();
        } catch (error) {
            console.error("Error sending message:", error);
            await showCustomAlert('Error', 'Failed to send message. Please try again.');
        }
    });

    // Navigation scroll to sections and highlight active link
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                // If it's the 'shop' link, show the shop section and update cart display
                if (targetId === 'shop') {
                    document.querySelectorAll('section').forEach(section => section.style.display = 'none');
                    shopSection.style.display = 'block';
                    updateCartDisplay();
                } else {
                    // Otherwise, show the relevant section and hide others
                    document.querySelectorAll('section').forEach(section => {
                        if (section.id === targetId) {
                            section.style.display = 'block';
                        } else if (section.id !== 'order-history-modal' && section.id !== 'login-modal' && section.id !== 'product-modal' && section.id !== 'rating-modal' && section.id !== 'custom-alert-modal') {
                             section.style.display = 'none';
                        }
                    });
                     // For regular sections, scroll into view
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }

                // Update active class for navigation links
                navLinks.forEach(nav => nav.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Initial load, show home section
    document.getElementById('home').style.display = 'block';
    document.getElementById('products').style.display = 'block';
    document.querySelector('.nav-link[href="#home"]').classList.add('active');


    // Toggle Order History visibility (if needed, this was commented out in index.html, keeping it here for completeness if you decide to add it back)
    // if (toggleOrderHistoryBtn) {
    //     toggleOrderHistoryBtn.addEventListener('click', () => {
    //         if (orderHistorySection.style.display === 'block') {
    //             orderHistorySection.style.display = 'none';
    //             toggleOrderHistoryBtn.textContent = 'Show Order History';
    //         } else {
    //             orderHistorySection.style.display = 'block';
    //             toggleOrderHistoryBtn.textContent = 'Hide Order History';
    //             loadOrderHistory(); // Load when shown
    //         }
    //     });
    // }

    // Cart icon click to show shop section
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('section').forEach(section => section.style.display = 'none');
        shopSection.style.display = 'block';
        updateCartDisplay();

        // Update active class for navigation links
        navLinks.forEach(nav => nav.classList.remove('active'));
        document.querySelector('.nav-link[href="#shop"]').classList.add('active');
    });

    // Place Cart Order button
    placeCartOrderBtn.addEventListener('click', () => {
        placeOrder(null, true); // true indicates from cart
    });
});
