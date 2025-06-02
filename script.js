// Your web app's Firebase configuration
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

// Initialize Firebase using the global firebase object
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const database = firebase.database(); // Get the database service instance

// Global variables
const productModal = document.getElementById('product-modal');
const orderModal = document.getElementById('order-modal');
const ratingModal = document.getElementById('rating-modal');
const closeButtons = document.querySelectorAll('.close-button');
const productContainer = document.getElementById('product-container');
const categoryButtons = document.querySelectorAll('.category-button');
const placeOrderButton = document.getElementById('add-to-cart-button');
const searchBar = document.getElementById('search-bar');
const navLinks = document.querySelectorAll('.main-nav a');

// COD specific elements
const codForm = document.getElementById('cod-form');
const confirmCodOrderButton = document.getElementById('confirm-cod-order');
const codNameInput = document.getElementById('cod-name');
const codPhoneInput = document.getElementById('cod-phone');
const codAddressInput = document.getElementById('cod-address');
const orderModalProductTitle = document.getElementById('order-modal-product-title');
const orderModalProductPrice = document.getElementById('order-modal-product-price');

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
        productCard.dataset.productId = product.id; // Store product ID

        // Calculate average rating for display
        const averageRating = product.numberOfRatings > 0 ? (product.totalStarsSum / product.numberOfRatings).toFixed(1) : 'N/A';
        const ratingStarsHtml = product.numberOfRatings > 0 ?
            `<div class="product-card-rating">
                <i class="fa-solid fa-star" style="color: gold;"></i> ${averageRating} / 7
            </div>` : '';

        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x200.png?text=No+Image';

        productCard.innerHTML = `
            <img src="${imageUrl}" alt="${product.title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200.png?text=Error';">
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

// --- Product Modal Logic ---
function openProductModal(product) {
    currentProduct = product; // Set the global currentProduct

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
            embedUrl = embedUrl.replace("watch?v=", "embed/");
        }
        // Remove other parameters like &list=...
        const queryIndex = embedUrl.indexOf('?');
        if (queryIndex !== -1) {
             const videoIdPart = embedUrl.substring(0, queryIndex);
             const params = new URLSearchParams(embedUrl.substring(queryIndex));
             if (params.has('v')) { // For URLs like /embed/?v=VIDEO_ID
                 embedUrl = `https://www.youtube.com/embed/${params.get('v')}`;
             } else if (videoIdPart.includes("/embed/")) { // If it's already an embed link but with params
                 embedUrl = videoIdPart;
             }
        }
        // Ensure it's an HTTPS URL for embedding
        if (!embedUrl.startsWith('https://')) {
            embedUrl = embedUrl.replace('http://', 'https://');
        }

        productVideo.src = embedUrl;
        productVideo.style.display = 'block';
    } else {
        productVideo.style.display = 'none';
        productVideo.src = '';
    }

    productModal.style.display = 'flex';
}

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        productModal.style.display = 'none';
        orderModal.style.display = 'none';
        ratingModal.style.display = 'none';
    });
});

window.addEventListener('click', (event) => {
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
    if (event.target === orderModal) {
        orderModal.style.display = 'none';
    }
    if (event.target === ratingModal) {
        ratingModal.style.display = 'none';
    }
    if (event.target === customAlertModal) {
        customAlertModal.style.display = 'none';
    }
});

// --- Category Filtering ---
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        const category = button.dataset.category;
        filterProductsByCategory(category);
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

function filterProductsByCategory(category) {
    let filteredProducts = {};
    if (category === 'All Products') {
        filteredProducts = { ...allProducts };
    } else {
        for (const productId in allProducts) {
            if (allProducts[productId].category === category) {
                filteredProducts[productId] = allProducts[productId];
            }
        }
    }
    displayProducts(filteredProducts);
}

// --- Search Bar Functionality ---
searchBar.addEventListener('input', () => {
    const searchTerm = searchBar.value.toLowerCase().trim();
    let filteredProducts = {};
    if (searchTerm === '') {
        filteredProducts = { ...allProducts };
    } else {
        for (const productId in allProducts) {
            const product = allProducts[productId];
            if (product.title.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.brand && product.brand.toLowerCase().includes(searchTerm))) {
                filteredProducts[productId] = product;
            }
        }
    }
    displayProducts(filteredProducts);
});

// --- COD Order Logic ---
placeOrderButton.addEventListener('click', () => {
    if (currentProduct) {
        // Pre-fill order modal with product details
        orderModalProductTitle.textContent = currentProduct.title;
        orderModalProductPrice.textContent = `PKR ${currentProduct.price.toLocaleString()}`;
        orderModal.style.display = 'flex';
        productModal.style.display = 'none'; // Hide product modal
    }
});

codForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    confirmCodOrderButton.disabled = true;
    confirmCodOrderButton.textContent = 'Placing Order...';

    const name = codNameInput.value.trim();
    const phone = codPhoneInput.value.trim();
    const address = codAddressInput.value.trim();

    if (!name || !phone || !address) {
        showAlert('Please fill in all delivery details.', 'Missing Details');
        confirmCodOrderButton.disabled = false;
        confirmCodOrderButton.textContent = 'Confirm Order';
        return;
    }

    // Basic Pakistani phone number validation (e.g., 03XX-XXXXXXX or 03XXXXXXXXX)
    if (!/^(03\d{2}[-\s]?\d{7})$/.test(phone) && !/^(03\d{9})$/.test(phone)) {
        showAlert('Please enter a valid Pakistani phone number (e.g., 03XX-XXXXXXX or 03XXXXXXXXX).', 'Invalid Phone');
        confirmCodOrderButton.disabled = false;
        confirmCodOrderButton.textContent = 'Confirm Order';
        return;
    }

    if (!currentProduct) {
        showAlert('Error: No product selected. Please close this form and select a product.', 'Error');
        confirmCodOrderButton.disabled = false;
        confirmCodOrderButton.textContent = 'Confirm Order';
        return;
    }

    // Re-check stock just before placing order
    // Correctly call database.ref() and .once()
    const productRef = database.ref('products/' + currentProduct.id);
    const productSnapshot = await productRef.once('value');
    const productData = productSnapshot.val();

    if (!productData || productData.stock === 0) {
        showAlert("Sorry, this product just went out of stock. Please try again later.", "Out of Stock");
        orderModal.style.display = 'none';
        confirmCodOrderButton.disabled = false;
        confirmCodOrderButton.textContent = 'Confirm Order';
        return;
    }

    try {
        // Decrement product stock
        const newStock = productData.stock - 1;
        // Correctly call .update() on the productRef
        await productRef.update({ stock: newStock });

        // Record the order
        // Correctly call .push() on database.ref()
        const newOrderRef = database.ref('orders').push();
        currentOrderId = newOrderRef.key; // Store for potential rating
        // Correctly call .set() on newOrderRef
        await newOrderRef.set({
            id: currentOrderId,
            productId: currentProduct.id,
            productTitle: currentProduct.title,
            productPrice: currentProduct.price,
            customerName: name,
            customerPhone: phone,
            customerAddress: address,
            orderDate: firebase.database.ServerValue.TIMESTAMP, // Correct ServerValue usage
            status: 'pending',
            totalAmount: currentProduct.price // Assuming single item order
        });

        showAlert('Your order has been placed successfully! We will contact you soon for confirmation.', 'Order Placed');
        orderModal.style.display = 'none';

        // Optionally, open rating modal after a short delay or confirmation
        const confirmedRating = await showConfirm('Would you like to rate this product now?', 'Rate Product', 'Rate Now', 'Later');
        if (confirmedRating) {
            openRatingModal(currentProduct, currentOrderId);
        }

    } catch (error) {
        showAlert('There was an error placing your order: ' + error.message, 'Order Error');
        console.error('Order placement error:', error);
    } finally {
        confirmCodOrderButton.disabled = false;
        confirmCodOrderButton.textContent = 'Confirm Order';
        codForm.reset(); // Clear form
    }
});

// --- Rating Modal Logic ---
function openRatingModal(product, orderId) {
    ratingProductTitleSpan.textContent = product.title;
    currentProduct = product; // Set for rating submission
    currentOrderId = orderId; // Set the order ID
    selectedRating = 0; // Reset selected rating
    updateStarDisplay(0); // Clear stars
    ratingModal.style.display = 'flex';
}

ratingStarsContainer.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('fa-star')) {
        const rating = parseInt(e.target.dataset.rating);
        updateStarDisplay(rating);
    }
});

ratingStarsContainer.addEventListener('mouseout', () => {
    updateStarDisplay(selectedRating); // Revert to selected rating
});

ratingStarsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('fa-star')) {
        selectedRating = parseInt(e.target.dataset.rating);
        updateStarDisplay(selectedRating);
    }
});

function updateStarDisplay(rating) {
    const stars = ratingStarsContainer.querySelectorAll('.fa-star');
    stars.forEach(star => {
        if (parseInt(star.dataset.rating) <= rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

submitRatingButton.addEventListener('click', async () => {
    if (selectedRating === 0) {
        showAlert('Please select a star rating.', 'Rating Required');
        return;
    }
    if (!currentProduct || !currentOrderId) {
        showAlert('Error: Product or Order information missing for rating. Please try ordering again.', 'Error');
        return;
    }

    submitRatingButton.disabled = true;
    submitRatingButton.textContent = 'Submitting...';

    try {
        // Update product's total stars and number of ratings
        // Correctly call database.ref() and .once()
        const productRef = database.ref('products/' + currentProduct.id);
        const snapshot = await productRef.once('value');
        const productData = snapshot.val();

        if (productData) {
            const oldTotalStarsSum = productData.totalStarsSum || 0;
            const oldNumberOfRatings = productData.numberOfRatings || 0;
            const newTotalStarsSum = oldTotalStarsSum + selectedRating;
            const newNumberOfRatings = oldNumberOfRatings + 1;
            const newAverageRating = (newTotalStarsSum / newNumberOfRatings); // Calculate as number

            // Correctly call .update() on productRef
            await productRef.update({
                totalStarsSum: newTotalStarsSum,
                numberOfRatings: newNumberOfRatings,
                averageRating: parseFloat(newAverageRating.toFixed(2)) // Store as number for sorting/calculations
            });

            // Record the individual rating
            // Correctly call .push() on database.ref()
            const newRatingRef = database.ref('ratings').push();
            // Correctly call .set() on newRatingRef
            await newRatingRef.set({
                id: newRatingRef.key,
                productId: currentProduct.id,
                orderId: currentOrderId,
                stars: selectedRating,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });

            showAlert('Thank you for your rating!', 'Rating Submitted');
            ratingModal.style.display = 'none';
        } else {
            showAlert('Product not found for rating. It might have been deleted.', 'Rating Failed');
        }
    } catch (error) {
        showAlert('Error submitting rating: ' + error.message, 'Rating Failed');
        console.error('Rating submission error:', error);
    } finally {
        submitRatingButton.disabled = false;
        submitRatingButton.textContent = 'Submit Rating';
    }
});

// --- Firebase Product Data Listener ---
document.addEventListener('DOMContentLoaded', () => {
    // Correctly call database.ref() and .on()
    const productsRef = database.ref('products');
    productsRef.on('value', (snapshot) => {
        allProducts = {};
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const product = childSnapshot.val();
                allProducts[product.id] = product;
            });
        }
        displayProducts(allProducts); // Display all products initially
    }, (error) => {
        console.error("Error listening for products:", error);
        productContainer.innerHTML = `<p class="no-products-message error-message">Error loading products. Firebase: ${error.message}.</p>`;
        showAlert(`Error loading products: ${error.message}.`, 'Data Error');
    });

    const homeView = document.getElementById('home-view'); // Main product listing section
    const supportView = document.getElementById('support-view'); // Support iframe section
    // Correctly target the 'Contact Us' nav link to toggle support view
    const contactUsNavLink = document.querySelector('nav.main-nav ul li a[href="#contact-us-section"]');
    const backToHomeButton = document.getElementById('back-to-home');

    // Initial display states
    if (homeView) homeView.style.display = 'block';
    if (supportView) supportView.style.display = 'none';

    function showView(viewToShow, viewToHide) {
        if (viewToHide) viewToHide.style.display = 'none';
        if (viewToShow) viewToShow.style.display = 'block'; // Or 'flex' if you use flexbox for its internal layout
    }

    // Event listener for the "Contact Us" navigation link to show support view
    if (contactUsNavLink) {
        contactUsNavLink.addEventListener('click', (event) => {
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
});
