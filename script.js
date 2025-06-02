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
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const database = firebase.database();
const ref = firebase.database.ref;
const onValue = firebase.database.onValue;
const push = firebase.database.push;
const set = firebase.database.set;
const get = firebase.database.get;
const child = firebase.database.child;
const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;

// Global variables
const productModal = document.getElementById('product-modal');
const orderModal = document.getElementById('order-modal');
const ratingModal = document.getElementById('rating-modal'); // New rating modal
const closeButtons = document.querySelectorAll('.close-button');
const productContainer = document.getElementById('product-container');
const categoryButtons = document.querySelectorAll('.category-button');
const placeOrderButton = document.getElementById('add-to-cart-button'); // Changed ID to match HTML
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
        productCard.dataset.productId = product.id; // Store product ID

        // Calculate average rating for display
        const averageRating = product.numberOfRatings > 0 ? (product.totalStarsSum / product.numberOfRatings).toFixed(1) : 'N/A';
        const ratingStarsHtml = product.numberOfRatings > 0 ?
            `<div class="product-card-rating">
                <i class="fa-solid fa-star" style="color: gold;"></i> ${averageRating} / 7
            </div>` : '';

        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x200.png?text=No+Image';

        productCard.innerHTML = `
            <img src="${imageUrl}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="product-brand">${product.brand || 'N/A'}</p>
            <p class="product-price">PKR ${product.price.toLocaleString()}</p>
            ${ratingStarsHtml}
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

    const averageRating = product.numberOfRatings > 0 ? (product.totalStarsSum / product.numberOfRatings).toFixed(1) : 'N/A';
    document.getElementById('modal-product-rating').textContent = `${averageRating} / 7 (${product.numberOfRatings || 0} reviews)`;


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
        document.getElementById('order-modal-product-title').textContent = currentProduct.title;
        document.getElementById('order-modal-product-price').textContent = `PKR ${currentProduct.price.toLocaleString()}`;
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

    if (currentProduct.stock === 0) {
        showAlert("Sorry, this product just went out of stock.", "Out of Stock");
        orderModal.style.display = 'none';
        confirmCodOrderButton.disabled = false;
        confirmCodOrderButton.textContent = 'Confirm Order';
        return;
    }


    try {
        // Decrement product stock
        const productRef = ref(database, 'products/' + currentProduct.id);
        const productSnapshot = await get(child(productRef, '')); // Use child('') to get the ref for 'productId' itself
        const productData = productSnapshot.val();

        if (productData && productData.stock > 0) {
            const newStock = productData.stock - 1;
            await set(productRef, { ...productData, stock: newStock });

            // Record the order
            const newOrderRef = push(ref(database, 'orders'));
            currentOrderId = newOrderRef.key; // Store for potential rating
            await set(newOrderRef, {
                id: currentOrderId,
                productId: currentProduct.id,
                productTitle: currentProduct.title,
                productPrice: currentProduct.price,
                customerName: name,
                customerPhone: phone,
                customerAddress: address,
                orderDate: serverTimestamp(),
                status: 'pending'
            });

            showAlert('Your order has been placed successfully! We will contact you soon for confirmation.', 'Order Placed');
            orderModal.style.display = 'none';

            // Optionally, open rating modal after a short delay or confirmation
            const confirmedRating = await showConfirm('Would you like to rate this product now?', 'Rate Product', 'Rate Now', 'Later');
            if (confirmedRating) {
                openRatingModal(currentProduct, currentOrderId);
            }

        } else {
            showAlert("Sorry, this product just went out of stock. Please try again later.", "Out of Stock");
            orderModal.style.display = 'none';
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
        showAlert('Error: Product or Order information missing for rating.', 'Error');
        return;
    }

    submitRatingButton.disabled = true;
    submitRatingButton.textContent = 'Submitting...';

    try {
        // Update product's total stars and number of ratings
        const productRef = ref(database, 'products/' + currentProduct.id);
        const snapshot = await get(child(productRef, '')); // Use child('') to get the ref for 'productId' itself
        const productData = snapshot.val();

        if (productData) {
            const oldTotalStarsSum = productData.totalStarsSum || 0;
            const oldNumberOfRatings = productData.numberOfRatings || 0;
            const newTotalStarsSum = oldTotalStarsSum + selectedRating;
            const newNumberOfRatings = oldNumberOfRatings + 1;
            const newAverageRating = (newTotalStarsSum / newNumberOfRatings).toFixed(2);

            await set(productRef, {
                ...productData,
                totalStarsSum: newTotalStarsSum,
                numberOfRatings: newNumberOfRatings,
                averageRating: parseFloat(newAverageRating) // Store as number for sorting/calculations
            });

            // Record the individual rating
            const newRatingRef = push(ref(database, 'ratings'));
            await set(newRatingRef, {
                id: newRatingRef.key,
                productId: currentProduct.id,
                orderId: currentOrderId,
                stars: selectedRating,
                timestamp: serverTimestamp()
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
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
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

    const homeView = document.getElementById('products-section'); // Correctly identify home view
    const supportView = document.getElementById('support-view');
    const supportNavLink = document.getElementById('contact-us-section').querySelector('a[href="#contact-us-section"]'); // Assuming contact link leads to support
    const backToHomeButton = document.getElementById('back-to-home');
    const submitSupportQueryButton = document.getElementById('submit-support-query');

    // Initialize display states
    if (homeView) homeView.style.display = 'block';
    if (supportView) supportView.style.display = 'none';

    function showView(viewToShow, viewToHide) {
        if (viewToHide) viewToHide.style.display = 'none';
        if (viewToShow) viewToShow.style.display = 'block'; // Or 'flex' if you use flexbox for its internal layout
    }

    // Event listener for the "Contact Us" navigation link to show support view
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

    // Event listener for Submit Support Query button
    if (submitSupportQueryButton) {
        submitSupportQueryButton.addEventListener('click', async () => {
            const name = document.getElementById('support-name').value.trim();
            const email = document.getElementById('support-email').value.trim();
            const subject = document.getElementById('support-subject').value.trim();
            const message = document.getElementById('support-message').value.trim();

            if (!name || !email || !subject || !message) {
                showAlert('Please fill in all fields for your support query.', 'Missing Information');
                return;
            }

            // Basic email validation
            if (!/\S+@\S+\.\S+/.test(email)) {
                showAlert('Please enter a valid email address.', 'Invalid Email');
                return;
            }

            submitSupportQueryButton.disabled = true;
            submitSupportQueryButton.textContent = 'Submitting...';

            try {
                const newQueryRef = push(ref(database, 'supportQueries'));
                await set(newQueryRef, {
                    name,
                    email,
                    subject,
                    message,
                    timestamp: serverTimestamp(),
                    status: 'pending'
                });
                showAlert('Your support query has been submitted successfully!', 'Query Submitted');
                // Clear form
                document.getElementById('support-name').value = '';
                document.getElementById('support-email').value = '';
                document.getElementById('support-subject').value = '';
                document.getElementById('support-message').value = '';
            } catch (error) {
                showAlert('Failed to submit query: ' + error.message, 'Submission Error');
                console.error('Support query submission error:', error);
            } finally {
                submitSupportQueryButton.disabled = false;
                submitSupportQueryButton.textContent = 'Submit Query';
            }
        });
    }
});
