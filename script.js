// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getDatabase, ref, onValue, push, serverTimestamp, update, get, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js"; // Added 'set' here

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
const database = getDatabase(app);

// Global variables
const productModal = document.getElementById('product-modal');
const orderModal = document.getElementById('order-modal');
const ratingModal = document.getElementById('rating-modal'); // New rating modal
const closeButtons = document.querySelectorAll('.close-button');
const productContainer = document.getElementById('product-container');
const categoryButtons = document.querySelectorAll('.category-button');
const placeOrderButton = document.getElementById('place-order-button');
const searchBar = document.getElementById('search-bar');
const navLinks = document.querySelectorAll('.main-nav a');

// COD specific elements
const codForm = document.getElementById('cod-form');
const confirmCodOrderButton = document.getElementById('confirm-cod-order');
const codNameInput = document.getElementById('cod-name');
const codPhoneInput = document.getElementById('cod-phone');
const codAddressInput = document.getElementById('cod-address');

// Rating modal elements
const ratingProductTitleSpan = document.getElementById('rating-product-title');
const ratingStarsContainer = document.getElementById('rating-stars-container');
const submitRatingButton = document.getElementById('submit-rating-button');

let currentProduct = null;
let currentOrderId = null; // To link rating to an order
let selectedRating = 0; // Stores the user's selected rating
let allProducts = {}; // Store all products fetched from Firebase

// --- Custom Alert/Confirm Functions ---
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');

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

// --- Smooth Scrolling for Nav Links ---
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// --- Function to display products ---
function displayProducts(productsToDisplay) {
    productContainer.innerHTML = ''; // Clear previous products
    if (Object.keys(productsToDisplay).length === 0) {
        productContainer.innerHTML = '<p class="no-products-message">No products match your criteria.</p>';
        return;
    }
    Object.values(productsToDisplay).forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.productId = product.id;

        // Calculate average rating for display
        const averageRating = product.numberOfRatings > 0 ? (product.totalStarsSum / product.numberOfRatings).toFixed(1) : 'N/A';
        const ratingStarsHtml = product.numberOfRatings > 0 ?
            `<div class="product-card-rating">
                <i class="fa-solid fa-star" style="color: var(--color-warning-yellow);"></i> ${averageRating} (${product.numberOfRatings} ratings)
            </div>` :
            `<div class="product-card-rating">No ratings yet</div>`;


        productCard.innerHTML = `
            <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x200.png?text=No+Image'}" alt="${product.title}">
            <div class="product-info">
                <h3>${product.title}</h3>
                <p class="product-brand-card"><strong>Brand:</strong> ${product.brand || 'N/A'}</p>
                <p>${product.description.substring(0, 80)}...</p>
                <p class="price">PKR ${product.price.toLocaleString()}</p>
                ${ratingStarsHtml}
            </div>
        `;
        productCard.addEventListener('click', () => openProductModal(product));
        productContainer.appendChild(productCard);
    });
}

// --- Fetch products from Firebase ---
const productsRef = ref(database, 'products');
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        allProducts = data;
        displayProducts(allProducts); // Display all products initially
    } else {
        allProducts = {}; // Ensure it's an empty object if no data
        productContainer.innerHTML = '<p class="no-products-message">No products available at the moment. Please check back later!</p>';
    }
}, (error) => {
    console.error("Firebase product read failed: " + error.message);
    showAlert('Could not load products. Please try again later.', 'Error');
});

// --- Category filtering ---
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        const category = button.dataset.category;
        // Highlight active button
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        if (category === "All Products") {
            displayProducts(allProducts);
        } else {
            const filteredProducts = Object.values(allProducts).filter(product => product.category === category);
            displayProducts(filteredProducts);
        }
        searchBar.value = ''; // Clear search bar on category change
    });
});

// --- Search functionality ---
searchBar.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    // Deselect category buttons when searching
    categoryButtons.forEach(btn => btn.classList.remove('active'));

    if (!searchTerm) {
        displayProducts(allProducts); // Show all if search is cleared
        return;
    }

    const filteredProducts = Object.values(allProducts).filter(product =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm))
    );
    displayProducts(filteredProducts);
});


// --- Open Product Modal ---
function openProductModal(product) {
    currentProduct = product;
    document.getElementById('modal-product-title').textContent = product.title;
    document.getElementById('modal-product-brand').textContent = product.brand || 'N/A';
    document.getElementById('modal-product-description').textContent = product.description;
    document.getElementById('modal-product-price').textContent = `PKR ${product.price.toLocaleString()}`;
    document.getElementById('modal-product-stock').textContent = product.stock !== undefined ? (product.stock > 0 ? `${product.stock} available` : 'Out of Stock') : 'N/A';
    placeOrderButton.disabled = product.stock === 0; // Disable button if out of stock

    const imageGallery = document.getElementById('modal-product-images');
    imageGallery.innerHTML = ''; // Clear previous images
    if (product.images && product.images.length > 0) {
        product.images.forEach(imageUrl => {
            if(imageUrl) { // Ensure URL is not empty or null
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = product.title;
                imageGallery.appendChild(img);
            }
        });
    } else {
        const img = document.createElement('img');
        img.src = 'https://via.placeholder.com/300x200.png?text=No+Image';
        img.alt = product.title;
        imageGallery.appendChild(img);
    }

    const productVideo = document.getElementById('modal-product-video');
    if (product.videoUrl) {
        // Basic YouTube URL to Embed URL conversion
        let embedUrl = product.videoUrl;
        if (product.videoUrl.includes("watch?v=")) {
            embedUrl = product.videoUrl.replace("watch?v=", "embed/");
        }
        // Remove other parameters like &list=...
        const queryIndex = embedUrl.indexOf('?');
        if (queryIndex !== -1) {
            const videoIdPart = embedUrl.substring(0, queryIndex);
            const params = new URLSearchParams(embedUrl.substring(queryIndex));
            if (params.has('v')) { // For URLs like /embed/?v=VIDEO_ID...
                embedUrl = `https://www.youtube.com/embed/${params.get('v')}`;
            } else {
                 embedUrl = videoIdPart; // Keep original if no 'v' param, could be a clean embed URL
            }
        }

        productVideo.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        productVideo.style.display = 'block';
    } else {
        productVideo.innerHTML = '';
        productVideo.style.display = 'none';
    }


    productModal.style.display = 'flex';
}

// --- Close Modals ---
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        productModal.style.display = 'none';
        orderModal.style.display = 'none';
        ratingModal.style.display = 'none';
        // Clear COD form fields when order modal is closed
        codNameInput.value = '';
        codPhoneInput.value = '';
        codAddressInput.value = '';
        // Reset rating stars
        resetRatingStars();
        selectedRating = 0;
    });
});

window.addEventListener('click', (event) => {
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
    if (event.target === orderModal) {
        orderModal.style.display = 'none';
        codNameInput.value = '';
        codPhoneInput.value = '';
        codAddressInput.value = '';
    }
    if (event.target === ratingModal) {
        ratingModal.style.display = 'none';
        resetRatingStars();
        selectedRating = 0;
    }
});

// --- Place Order Logic (COD) ---
placeOrderButton.addEventListener('click', () => {
    if (currentProduct && currentProduct.stock > 0) {
        orderModal.style.display = 'flex';
    } else {
        showAlert('This product is out of stock.', 'Out of Stock');
    }
});

confirmCodOrderButton.addEventListener('click', async () => {
    const customerName = codNameInput.value.trim();
    const customerPhone = codPhoneInput.value.trim();
    const customerAddress = codAddressInput.value.trim();

    if (!customerName || !customerPhone || !customerAddress) {
        await showAlert('Please fill in all customer details.', 'Missing Information');
        return;
    }

    if (!currentProduct) {
        await showAlert('No product selected for order.', 'Error');
        return;
    }

    if (currentProduct.stock === 0) {
        await showAlert('This product is out of stock.', 'Out of Stock');
        return;
    }

    confirmCodOrderButton.disabled = true;
    confirmCodOrderButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';

    try {
        const newOrderRef = push(ref(database, 'orders'));
        currentOrderId = newOrderRef.key; // Store the new order ID for linking rating

        const orderData = {
            productId: currentProduct.id,
            productTitle: currentProduct.title,
            quantity: 1, // For simplicity, always 1 for now
            totalPrice: currentProduct.price,
            customerName: customerName,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            orderDate: serverTimestamp(),
            status: 'Pending', // Initial status
            // Other details could be added
        };

        await set(newOrderRef, orderData); // 'set' is now imported

        // Decrease product stock
        const productRef = ref(database, 'products/' + currentProduct.id);
        const newStock = currentProduct.stock - 1;
        await update(productRef, { stock: newStock });

        await showAlert('Your order has been placed successfully! We will contact you soon.', 'Order Confirmed');
        orderModal.style.display = 'none';
        productModal.style.display = 'none'; // Close product modal too

        // Prompt for rating after order, if applicable
        await showRatingModal(currentProduct.title, currentOrderId);

    } catch (error) {
        await showAlert('There was an error placing your order: ' + error.message, 'Order Failed');
        console.error('Order placement error:', error);
    } finally {
        confirmCodOrderButton.disabled = false;
        confirmCodOrderButton.innerHTML = 'Confirm Order';
    }
});

// --- Rating Logic ---
function showRatingModal(productTitle, orderId) {
    return new Promise(resolve => {
        ratingProductTitleSpan.textContent = productTitle;
        currentOrderId = orderId; // Store the order ID
        resetRatingStars(); // Reset stars visually
        selectedRating = 0; // Reset selected rating value
        ratingModal.style.display = 'flex';

        // Listen for submit rating button click
        const submitHandler = async () => {
            if (selectedRating > 0) {
                await submitProductRating(currentProduct.id, currentOrderId, selectedRating);
            } else {
                await showAlert('Please select a star rating before submitting.', 'Rating Required');
            }
            ratingModal.style.display = 'none';
            submitRatingButton.removeEventListener('click', submitHandler);
            resolve();
        };
        submitRatingButton.addEventListener('click', submitHandler);
    });
}


ratingStarsContainer.addEventListener('click', (event) => {
    const clickedStar = event.target.closest('.fa-star');
    if (clickedStar) {
        const rating = parseInt(clickedStar.dataset.rating);
        selectedRating = rating;
        highlightStars(rating);
    }
});

function highlightStars(rating) {
    const stars = ratingStarsContainer.querySelectorAll('.fa-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

function resetRatingStars() {
    const stars = ratingStarsContainer.querySelectorAll('.fa-star');
    stars.forEach(star => star.classList.remove('selected'));
}

async function submitProductRating(productId, orderId, rating) {
    submitRatingButton.disabled = true;
    submitRatingButton.textContent = 'Submitting...';
    try {
        // Save rating to 'ratings' collection
        const newRatingRef = push(ref(database, 'ratings'));
        await set(newRatingRef, {
            productId: productId,
            orderId: orderId, // Link rating to the order
            rating: rating,
            timestamp: serverTimestamp()
        });

        // Update product's average rating in 'products' collection
        const productRef = ref(database, 'products/' + productId);
        const productSnapshot = await get(productRef); // Fetch current product data

        if (productSnapshot.exists()) {
            const productData = productSnapshot.val();
            const currentTotalStarsSum = productData.totalStarsSum || 0;
            const currentNumberOfRatings = productData.numberOfRatings || 0;

            const updatedTotalStarsSum = currentTotalStarsSum + rating;
            const updatedNumberOfRatings = currentNumberOfRatings + 1;
            const updatedAverageRating = (updatedTotalStarsSum / updatedNumberOfRatings).toFixed(2);

            await update(productRef, {
                totalStarsSum: updatedTotalStarsSum,
                numberOfRatings: updatedNumberOfRatings,
                averageRating: updatedAverageRating
            });
        }

        await showAlert('Thank you for your rating!', 'Rating Submitted');
    } catch (error) {
        await showAlert('Failed to submit rating: ' + error.message, "Rating Failed");
        console.error('Rating submission error:', error);
    } finally {
        submitRatingButton.disabled = false;
        submitRatingButton.textContent = 'Submit Rating';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const homeView = document.getElementById('home-view');
    const supportView = document.getElementById('support-view');
    const supportNavLink = document.getElementById('support-nav-link');
    const backToHomeButton = document.getElementById('back-to-home');
    const navLinks = document.querySelectorAll('.nav-link'); // Select all other nav links

    function showView(viewToShow, viewToHide) {
        viewToHide.style.display = 'none';
        viewToShow.style.display = 'block'; // Or 'flex' if you use flexbox for its internal layout
    }

    // Event listener for the "Support" navigation link
    if (supportNavLink) {
        supportNavLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior (like jumping to #)
            showView(supportView, homeView);
            window.scrollTo(0, 0); // Scroll to top when switching view
        });
    }

    // Event listener for the "Back" button within the Support view
    if (backToHomeButton) {
        backToHomeButton.addEventListener('click', () => {
            showView(homeView, supportView);
            window.scrollTo(0, 0); // Scroll to top when switching back
        });
    }

}); // This closes the document.addEventListener('DOMContentLoaded' block
