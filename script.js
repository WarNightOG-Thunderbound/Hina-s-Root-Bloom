// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";


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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Analytics might not be strictly needed for this simplified app
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app); // Storage might not be strictly needed for this simplified app

// Public UI Elements
const productListingsContainer = document.getElementById('product-listings');
const searchInput = document.getElementById('search-input'); // Corrected ID
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
const contactUsSection = document.getElementById('contact-us-section');
const emailInput = document.getElementById('email-input');
const messageInput = document.getElementById('message-input');
const sendEmailButton = document.getElementById('send-email-button');

// Custom Alert/Confirm Elements (kept for general notifications)
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');

let allProducts = {}; // Stores all fetched products

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


// --- Firebase Authentication State Change (simplified for public app) ---
onAuthStateChanged(auth, (user) => {
    // This block is mainly for debugging or if you later add public/admin auth
    if (user) {
        console.log("User is signed in:", user.email);
    } else {
        console.log("User is signed out.");
    }
    // Always load products for the public view regardless of auth state
    loadProducts();
});

// --- Product Listing Functions ---
function displayProducts(products) {
    console.log("displayProducts called with:", products); // Debugging: Check what products are passed
    productListingsContainer.innerHTML = ''; // Clear existing products

    if (!products || Object.keys(products).length === 0) {
        productListingsContainer.innerHTML = '<p class="no-products">No products found.</p>';
        console.log("No products to display after filtering.");
        return;
    }

    Object.values(products).forEach(product => {
        console.log("Attempting to display product:", product.title, "ID:", product.id); // Debugging: Check each product
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.productId = product.id; // Store product ID for modal

        const imageUrl = product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : 'https://placehold.co/400x300/E9ECEF/495057?text=No+Image'; // Default placeholder image
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
        `;
        productListingsContainer.appendChild(productCard);
    });

    // Add event listeners for "View Details" buttons
    document.querySelectorAll('.view-details-button').forEach(button => {
        button.removeEventListener('click', openProductModal); // Prevent duplicate listeners
        button.addEventListener('click', openProductModal);
    });
}

function loadProducts() {
    console.log("Loading products from Firebase...");
    const productsRef = ref(database, 'products/'); // Correct path confirmed
    onValue(productsRef, (snapshot) => {
        allProducts = {}; // Reset products
        if (!snapshot.exists()) {
            console.log("No snapshot data found at 'products/'. Database might be empty or path is wrong.");
        }
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            // Ensure product has an ID, use Firebase key if product.id is missing
            product.id = product.id || childSnapshot.key;
            allProducts[product.id] = product;
            console.log("Fetched product:", product.title, "ID:", product.id); // Debugging: Log each fetched product
        });
        console.log("All products loaded into allProducts:", allProducts); // Debugging: Final check of allProducts object
        filterAndSortProducts(); // Apply filters and display
    }, (error) => {
        console.error("Error loading products:", error);
        showAlert("Failed to load products. Please try again later.", "Error");
    });
}

function filterAndSortProducts() {
    console.log("filterAndSortProducts called. Initial allProducts:", allProducts);
    let filteredProducts = Object.values(allProducts);

    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        const initialCount = filteredProducts.length;
        filteredProducts = filteredProducts.filter(product =>
            (product.title && product.title.toLowerCase().includes(searchTerm)) ||
            (product.description && product.description.toLowerCase().includes(searchTerm)) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
            (product.category && product.category.toLowerCase().includes(searchTerm))
        );
        console.log(`Search term "${searchTerm}" applied. Filtered from ${initialCount} to ${filteredProducts.length} products.`);
    }

    // Apply category filter
    const activeCategoryButton = document.querySelector('.category-button.active');
    if (activeCategoryButton && activeCategoryButton.dataset.category !== 'all') {
        const category = activeCategoryButton.dataset.category;
        const initialCount = filteredProducts.length;
        filteredProducts = filteredProducts.filter(product => product.category === category);
        console.log(`Category filter "${category}" applied. Filtered from ${initialCount} to ${filteredProducts.length} products.`);
    }

    // Apply sort order
    const sortBy = sortBySelect.value;
    if (sortBy === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'alpha-asc') {
        filteredProducts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'alpha-desc') {
        filteredProducts.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else if (sortBy === 'featured') {
        filteredProducts.sort((a, b) => (b.featured || false) - (a.featured || false));
    }

    console.log("Products after filtering and sorting:", filteredProducts);
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

    modalProductImage.src = product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : 'https://placehold.co/400x300/E9ECEF/495057?text=No+Image';
    modalProductTitle.textContent = product.title;
    modalProductPrice.textContent = `PKR ${product.price ? product.price.toLocaleString() : 'N/A'}`;
    modalProductDescription.textContent = product.description || 'No description available.';
    modalProductBrand.textContent = `Brand: ${product.brand || 'N/A'}`;
    modalProductCategory.textContent = `Category: ${product.category || 'N/A'}`;
    modalProductStock.textContent = `Stock: ${product.stock > 0 ? product.stock : 'Out of Stock'}`;

    if (product.videoUrl) {
        modalProductVideo.innerHTML = `<p>Product Video:</p><iframe src="${product.videoUrl}" frameborder="0" allowfullscreen></iframe>`;
        modalProductVideo.style.display = 'block';
    } else {
        modalProductVideo.innerHTML = '';
        modalProductVideo.style.display = 'none';
    }

    productModal.style.display = 'flex';
}

function closeProductModal() {
    productModal.style.display = 'none';
    modalProductVideo.innerHTML = ''; // Clear video iframe
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial load of products when the DOM is ready
    loadProducts();

    // Event listener for search button
    if (searchButton) {
        searchButton.addEventListener('click', filterAndSortProducts);
    }

    // Event listener for search input (live search on enter)
    if (searchInput) {
        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                filterAndSortProducts();
            }
        });
    }

    // Event listeners for category filter buttons
    categoryFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterAndSortProducts();
        });
    });

    // Event listener for sort by select
    if (sortBySelect) {
        sortBySelect.addEventListener('change', filterAndSortProducts);
    }

    // Close product modal
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeProductModal);
    }
    window.addEventListener('click', (event) => {
        if (event.target === productModal) {
            closeProductModal();
        }
    });

    // Send Email button
    if (sendEmailButton) {
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
    }
});
