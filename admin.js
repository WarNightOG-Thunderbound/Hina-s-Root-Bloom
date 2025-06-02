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

// Admin UI Elements
const authSection = document.getElementById('auth-section');
const adminDashboard = document.getElementById('admin-dashboard');
const adminEmailInput = document.getElementById('admin-email');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Dashboard Summary Counts
const totalProductsCountEl = document.getElementById('total-products-count');
const pendingOrdersCountEl = document.getElementById('pending-orders-count');
const completedOrdersCountEl = document.getElementById('completed-orders-count');

// Product Form Elements
const productIdInput = document.getElementById('product-id');
const productTitleInput = document.getElementById('product-title');
const productBrandInput = document.getElementById('product-brand');
const productDescriptionInput = document.getElementById('product-description');
const productCategorySelect = document.getElementById('product-category');
const productPriceInput = document.getElementById('product-price');
const productStockInput = document.getElementById('product-stock');
const productFeaturedCheckbox = document.getElementById('product-featured');
const productVideoInput = document.getElementById('product-video');
const addEditProductBtn = document.getElementById('add-edit-product-btn');
const clearFormBtn = document.getElementById('clear-form-btn');
const productListContainer = document.getElementById('product-list-container');
const adminProductSearchInput = document.getElementById('admin-product-search');
const adminProductSearchBtn = document.getElementById('admin-product-search-btn');

// Image Input Elements (updated for file inputs)
const productImageInputs = [
    document.getElementById('product-image-file-1'),
    document.getElementById('product-image-file-2'),
    document.getElementById('product-image-file-3'),
    document.getElementById('product-image-file-4'),
    document.getElementById('product-image-file-5'),
];
const productImagePreviews = [
    document.getElementById('product-image-preview-1'),
    document.getElementById('product-image-preview-2'),
    document.getElementById('product-image-preview-3'),
    document.getElementById('product-image-preview-4'),
    document.getElementById('product-image-preview-5'),
];
const productImagePlaceholders = [
    document.getElementById('product-image-placeholder-1'),
    document.getElementById('product-image-placeholder-2'),
    document.getElementById('product-image-placeholder-3'),
    document.getElementById('product-image-placeholder-4'),
    document.getElementById('product-image-placeholder-5'),
];
const productImageRemoveBtns = [
    document.getElementById('product-image-remove-1'),
    document.getElementById('product-image-remove-2'),
    document.getElementById('product-image-remove-3'),
    document.getElementById('product-image-remove-4'),
    document.getElementById('product-image-remove-5'),
];

// Order Management Elements
const orderListContainer = document.getElementById('order-list-container');
const completedOrderListContainer = document.getElementById('completed-order-list-container');

// Tab Navigation Elements
const navTabs = document.querySelectorAll('.admin-nav-tab');
const tabContents = document.querySelectorAll('.admin-tab-content');

// Analytics Elements
const analyticsTimeframeSelect = document.getElementById('analytics-timeframe');
const refreshAnalyticsBtn = document.getElementById('refresh-analytics-btn');
const productRatingsChartCanvas = document.getElementById('productRatingsChart');
const winnerProductName = document.getElementById('winner-product-name');
const winnerRatingInfo = document.getElementById('winner-rating-info');
const winnerOrdersInfo = document.getElementById('winner-orders-info');
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');
const productComparisonChartCanvas = document.getElementById('productComparisonChart');

let currentAdminUID = null;
let allAdminProducts = {}; // To store all products for admin search
let allRatings = {}; // To store all ratings for analytics
let allOrders = {}; // To store all orders for analytics
let productRatingsChart = null; // Chart.js instance for main ratings chart
let productComparisonChart = null; // Chart.js instance for comparison chart

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

// --- Tab Navigation Logic ---
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        navTabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetTabId = tab.dataset.tab;
        document.getElementById(targetTabId).classList.add('active');

        // If switching to analytics tab, refresh data
        if (targetTabId === 'analytics-tab') {
            refreshAnalytics();
        }
    });
});

// --- Image Preview Logic (for file inputs) ---
productImageInputs.forEach((input, index) => {
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const previewEl = productImagePreviews[index];
        const placeholderEl = productImagePlaceholders[index];
        const removeBtn = productImageRemoveBtns[index];

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewEl.src = e.target.result;
                previewEl.style.display = 'block';
                placeholderEl.style.display = 'none';
                removeBtn.style.display = 'inline-block'; // Show remove button
            };
            reader.readAsDataURL(file);
        } else {
            previewEl.style.display = 'none';
            placeholderEl.style.display = 'flex';
            removeBtn.style.display = 'none'; // Hide remove button
            previewEl.src = ''; // Clear src
        }
    });
});

// Remove Image Logic
productImageRemoveBtns.forEach((button, index) => {
    button.addEventListener('click', () => {
        const fileInput = productImageInputs[index];
        const previewEl = productImagePreviews[index];
        const placeholderEl = productImagePlaceholders[index];
        const removeBtn = productImageRemoveBtns[index];

        fileInput.value = ''; // Clear the file input
        previewEl.src = ''; // Clear the preview image
        previewEl.style.display = 'none';
        placeholderEl.style.display = 'flex';
        removeBtn.style.display = 'none'; // Hide remove button
    });
});

function resetImagePreviews() {
    productImagePreviews.forEach(preview => {
        preview.src = '';
        preview.style.display = 'none';
    });
    productImagePlaceholders.forEach(placeholder => {
        placeholder.style.display = 'flex';
    });
    productImageInputs.forEach(input => {
        input.value = ''; // Clear file input
    });
    productImageRemoveBtns.forEach(btn => {
        btn.style.display = 'none'; // Hide remove buttons
    });
}

// --- Authentication Logic ---
adminLoginBtn.addEventListener('click', async () => {
    const email = adminEmailInput.value;
    const password = adminPasswordInput.value;
    adminLoginBtn.disabled = true;
    adminLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // UI update will be handled by onAuthStateChanged
    } catch (error) {
        await showAlert('Login failed: ' + error.message, 'Login Error');
        console.error('Login error:', error);
    } finally {
        adminLoginBtn.disabled = false;
        adminLoginBtn.innerHTML = 'Login';
    }
});

adminLogoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // UI will be updated by onAuthStateChanged listener
    } catch (error) {
        console.error('Logout error:', error);
        await showAlert('Logout failed: ' + error.message, 'Logout Error');
    }
});

onAuthStateChanged(auth, (user) => {
    const adminEmail = "warnightog.thunderbound@gmail.com"; // Set your admin email here
    if (user && user.email === adminEmail) {
        currentAdminUID = user.uid;
        authSection.style.display = 'none';
        adminDashboard.style.display = 'block';
        // Manually click the dashboard tab to ensure it's active on login
        document.querySelector('.admin-nav-tab[data-tab="dashboard-tab"]').click();
        listenForProducts(); // Start listening for products when admin logs in
        listenForOrders(); // Start listening for orders
        listenForRatings(); // Start listening for ratings
    } else {
        currentAdminUID = null;
        authSection.style.display = 'block';
        adminDashboard.style.display = 'none';
        // Clear any displayed products/orders when logged out
        productListContainer.innerHTML = '<p class="no-items-message">No products available.</p>';
        orderListContainer.innerHTML = '<p class="no-items-message">No pending orders.</p>';
        completedOrderListContainer.innerHTML = '<p class="no-items-message">No completed orders yet.</p>';
        updateDashboardCounts(0, 0, 0); // Reset dashboard counts
        // Destroy charts if they exist
        if (productRatingsChart) productRatingsChart.destroy();
        if (productComparisonChart) productComparisonChart.destroy();
    }
});

// --- Product Management Logic ---
clearFormBtn.addEventListener('click', clearProductForm);

function clearProductForm() {
    productIdInput.value = '';
    productTitleInput.value = '';
    productBrandInput.value = '';
    productDescriptionInput.value = '';
    productCategorySelect.value = 'Fabric'; // Default category
    productPriceInput.value = '';
    productStockInput.value = '';
    productFeaturedCheckbox.checked = false;
    productVideoInput.value = '';
    resetImagePreviews(); // Clear all image previews and file inputs
    addEditProductBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Product';
    productTitleInput.focus();
}

// Helper function to upload an image and return its URL
async function uploadImageAndGetURL(file, productId) {
    if (!file) return null;
    const storageRefPath = `product_images/${productId}/${Date.now()}_${file.name}`; // Unique filename
    const imageRef = storageRef(storage, storageRefPath);
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}

addEditProductBtn.addEventListener('click', async () => {
    const id = productIdInput.value;
    const title = productTitleInput.value.trim();
    const brand = productBrandInput.value.trim();
    const description = productDescriptionInput.value.trim();
    const category = productCategorySelect.value;
    const price = parseFloat(productPriceInput.value);
    const stock = parseInt(productStockInput.value, 10);
    const featured = productFeaturedCheckbox.checked;
    const videoUrl = productVideoInput.value.trim();

    // Collect existing image URLs (if editing) and new files to upload
    const existingImageUrls = [];
    const newFilesToUpload = [];

    productImagePreviews.forEach((previewEl, index) => {
        // If an existing image URL is displayed AND it's not a local FileReader URL (which starts with 'data:'),
        // add it to existing URLs.
        if (previewEl.style.display === 'block' && previewEl.src && previewEl.src.startsWith('http')) {
            existingImageUrls.push(previewEl.src);
        }
    });

    productImageInputs.forEach((input, index) => {
        if (input.files && input.files[0]) {
            newFilesToUpload.push(input.files[0]);
        }
    });


    // Basic validation
    if (!title || !description || !category || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0 || (existingImageUrls.length === 0 && newFilesToUpload.length === 0)) {
        await showAlert('Please fill in all required fields (Title, Description, Category, Price > 0, Stock >= 0, at least one image).', 'Validation Error');
        return;
    }

    addEditProductBtn.disabled = true;
    const originalButtonHTML = addEditProductBtn.innerHTML; // Store original button content
    addEditProductBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    let currentProductId = id;
    if (!currentProductId) {
        // Generate a temporary ID for new product to use in storage path, if not editing
        const tempRef = push(ref(database, 'products'));
        currentProductId = tempRef.key;
    }

    try {
        // Upload new files to Firebase Storage
        const uploadedImageUrls = await Promise.all(
            newFilesToUpload.map((file) => uploadImageAndGetURL(file, currentProductId))
        );

        // Filter out nulls from failed uploads and combine with existing URLs
        const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls.filter(url => url !== null)];

        if (finalImageUrls.length === 0) {
             await showAlert('No images were uploaded or existing images found. Please provide at least one image.', 'Image Required');
             addEditProductBtn.disabled = false;
             addEditProductBtn.innerHTML = originalButtonHTML; // Restore button state
             return;
        }

        const productData = {
            title,
            brand: brand || 'N/A',
            description,
            category,
            price,
            stock,
            images: finalImageUrls, // Use the collected URLs
            videoUrl: videoUrl || '',
            featured,
            updatedAt: serverTimestamp()
        };

        if (id) {
            // If editing, use the existing ID
            productData.id = id;
            await set(ref(database, 'products/' + id), productData);
            await showAlert('Product updated successfully!', 'Success');
        } else {
            // If adding, use the generated temporary ID and set createdAt
            productData.id = currentProductId;
            productData.createdAt = serverTimestamp();
            productData.totalStarsSum = 0; // Initialize for new products
            productData.numberOfRatings = 0; // Initialize for new products
            productData.averageRating = "0.00"; // Initialize for new products
            await set(ref(database, 'products/' + currentProductId), productData);
            await showAlert('Product added successfully!', 'Success');
        }
        clearProductForm(); // Clear form after successful add/edit
    } catch (error) {
        await showAlert('Error saving product: ' + error.message, 'Save Error');
        console.error('Product save error:', error);
    } finally {
        addEditProductBtn.disabled = false;
        addEditProductBtn.innerHTML = originalButtonHTML; // Always restore to original content
    }
});


function displayAdminProducts(products) {
    productListContainer.innerHTML = '';
    if (Object.keys(products).length === 0) {
        productListContainer.innerHTML = '<p class="no-items-message">No products available.</p>';
        return;
    }

    const productListHtml = Object.values(products).map(product => {
        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/65x65?text=No+Image';
        const averageRating = product.numberOfRatings > 0 ? (product.totalStarsSum / product.numberOfRatings).toFixed(1) : 'N/A';
        const ratingDisplay = product.numberOfRatings > 0 ? `Rating: ${averageRating}/7 (${product.numberOfRatings} reviews)` : 'No ratings yet';

        return `
            <div class="admin-product-item">
                <img src="${imageUrl}" alt="${product.title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/65x65?text=Error';">
                <div class="admin-product-details">
                    <h4>${product.title} (ID: ${product.id.substring(0, 6)}...)</h4>
                    <p>${product.brand} - ${product.category}</p>
                    <p>Price: PKR ${product.price.toLocaleString()}</p>
                    <p class="product-stock-info">Stock: ${product.stock}</p>
                    <p class="product-rating-info">${ratingDisplay}</p>
                </div>
                <div class="admin-product-actions">
                    <button class="admin-button secondary edit-product-btn" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="admin-button danger delete-product-btn" data-id="${product.id}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    }).join('');
    productListContainer.innerHTML = productListHtml;

    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', (e) => editProduct(e.target.dataset.id));
    });
    document.querySelectorAll('.delete-product-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const confirmed = await showConfirm(`Are you sure you want to delete product ${e.target.dataset.id.substring(0, 6)}...? This action cannot be undone.`, 'Confirm Deletion', 'Delete', 'Cancel', 'danger');
            if (confirmed) {
                deleteProduct(e.target.dataset.id);
            }
        });
    });
}

function listenForProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        allAdminProducts = snapshot.val() || {};
        displayAdminProducts(allAdminProducts);
        updateDashboardCounts(Object.keys(allAdminProducts).length, pendingOrdersCountEl.textContent, completedOrdersCountEl.textContent);
        populateProductSelects(); // Update product selects for analytics
    }, (error) => {
        console.error("Error listening for products:", error);
        productListContainer.innerHTML = `<p class="no-items-message error-message">Error loading products. Firebase: ${error.message}. Check console and Firebase rules.</p>`;
        showAlert(`Error loading products: ${error.message}. Check console and Firebase rules.`, 'Data Error');
    });
}

adminProductSearchBtn.addEventListener('click', () => {
    const searchTerm = adminProductSearchInput.value.toLowerCase().trim();
    if (!searchTerm) {
        displayAdminProducts(allAdminProducts);
        return;
    }
    const filtered = {};
    for (const productId in allAdminProducts) {
        const product = allAdminProducts[productId];
        if (
            (product.title && product.title.toLowerCase().includes(searchTerm)) ||
            (productId && productId.toLowerCase().includes(searchTerm)) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm))
        ) {
            filtered[productId] = product;
        }
    }
    displayAdminProducts(filtered);
});

adminProductSearchInput.addEventListener('keyup', (event) => {
    if (event.key === "Enter") {
        adminProductSearchBtn.click();
    }
    if (adminProductSearchInput.value.trim() === '') {
        displayAdminProducts(allAdminProducts);
    }
});

function editProduct(id) {
    const product = allAdminProducts[id];
    if (product) {
        productIdInput.value = product.id;
        productTitleInput.value = product.title || '';
        productBrandInput.value = product.brand || '';
        productDescriptionInput.value = product.description || '';
        productCategorySelect.value = product.category || 'Fabric'; // Set default if category is missing
        productPriceInput.value = product.price || '';
        productStockInput.value = typeof product.stock === 'number' ? product.stock : '0';
        productFeaturedCheckbox.checked = product.featured || false;
        productVideoInput.value = product.videoUrl || '';
        resetImagePreviews(); // Clear all current previews and file inputs first
        if (product.images && product.images.length > 0) {
            product.images.forEach((url, index) => {
                if (index < productImagePreviews.length) {
                    const previewEl = productImagePreviews[index];
                    const placeholderEl = productImagePlaceholders[index];
                    const removeBtn = productImageRemoveBtns[index];
                    previewEl.src = url;
                    previewEl.style.display = 'block';
                    placeholderEl.style.display = 'none';
                    removeBtn.style.display = 'inline-block'; // Show remove button for existing image
                    previewEl.onerror = () => { // Fallback if existing image URL fails to load
                        previewEl.style.display = 'none';
                        placeholderEl.style.display = 'flex';
                        removeBtn.style.display = 'none'; // Hide remove button if image is broken
                        previewEl.src = ''; // Clear src
                        showAlert(`Failed to load image for ${product.title}. Please check the URL or re-upload.`, 'Image Load Error');
                    };
                }
            });
        }
        addEditProductBtn.innerHTML = '<i class="fas fa-save"></i> Update Product';
        const productTab = document.querySelector('.admin-nav-tab[data-tab="product-management-tab"]');
        if (productTab) productTab.click();
        productTitleInput.focus();
        productIdInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        showAlert('Product not found. It might have been deleted.', 'Product Not Found');
        clearProductForm();
    }
}

async function deleteProduct(id) {
    try {
        // TODO: Optionally delete images from Firebase Storage here as well
        // This requires listing items in a folder, which can be complex if not using specific file paths.
        // For now, only deleting database entry.
        await remove(ref(database, 'products/' + id));
        await showAlert('Product deleted successfully!', 'Success');
    } catch (error) {
        await showAlert('Error deleting product: ' + error.message, 'Delete Error');
        console.error('Product delete error:', error);
    }
}

// --- Order Management Logic ---
function listenForOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        const data = snapshot.val() || {};
        console.log("Raw orders data from Firebase:", data); // Log raw data
        allOrders = data; // Store all orders for analytics
        const pendingOrders = {};
        const completedOrders = {};
        for (const orderId in allOrders) {
            const order = { id: orderId, ...allOrders[orderId] }; // Add ID to the order object
            // Make status comparison more robust to handle case and leading/trailing spaces
            if (order.status && typeof order.status === 'string' && order.status.trim().toLowerCase() === 'pending') {
                pendingOrders[orderId] = order;
            } else if (order.status && typeof order.status === 'string' && order.status.trim().toLowerCase() === 'completed') {
                completedOrders[orderId] = order;
            }
        }
        console.log("Filtered pending orders (before display):", pendingOrders); // Log filtered pending orders
        displayPendingOrders(pendingOrders);
        displayCompletedOrders(completedOrders);
        updateDashboardCounts(Object.keys(allAdminProducts).length, Object.keys(pendingOrders).length, Object.keys(completedOrders).length);
    }, (error) => {
        console.error("Error listening for orders:", error);
        orderListContainer.innerHTML = `<p class="no-items-message error-message">Error loading orders. Firebase: ${error.message}. Check console and Firebase rules.</p>`;
        completedOrderListContainer.innerHTML = `<p class="no-items-message error-message">Error loading completed orders. Firebase: ${error.message}.</p>`;
        showAlert(`Error loading orders: ${error.message}. Check console and Firebase rules.`, 'Data Error');
    });
}

function displayPendingOrders(orders) {
    console.log("displayPendingOrders received orders for rendering:", orders); // Log orders received by display function
    orderListContainer.innerHTML = ''; // Clear previous content

    if (Object.keys(orders).length === 0) {
        orderListContainer.innerHTML = '<p class="no-items-message">No pending orders.</p>';
        return;
    }

    // --- TEMPORARY SIMPLIFIED RENDERING FOR DEBUGGING ---
    Object.values(orders).forEach(order => {
        const product = allAdminProducts[order.productId] || { title: 'Unknown Product', price: 0 };
        console.log(`Rendering order ${order.id.substring(0,6)}... Product:`, product); // Log product data for this order

        const orderDiv = document.createElement('div');
        orderDiv.className = 'admin-order-item-debug'; // Add a unique class for easy identification
        orderDiv.style.border = '1px solid #ccc';
        orderDiv.style.padding = '10px';
        orderDiv.style.marginBottom = '10px';
        orderDiv.innerHTML = `
            <strong>Debug Order ID:</strong> ${order.id.substring(0, 6)}...<br>
            <strong>Product:</strong> ${product.title}<br>
            <strong>Quantity:</strong> ${order.quantity}<br>
            <strong>Customer:</strong> ${order.customerName}<br>
            <strong>Status:</strong> ${order.status}
        `;
        orderListContainer.appendChild(orderDiv);
    });
    // --- END TEMPORARY SIMPLIFIED RENDERING ---

    // The original detailed HTML rendering logic is commented out/removed for this debug version.
    // We will revert to it once we confirm basic rendering works.
}

function displayCompletedOrders(orders) {
    completedOrderListContainer.innerHTML = '';
    if (Object.keys(orders).length === 0) {
        completedOrderListContainer.innerHTML = '<p class="no-items-message">No completed orders yet.</p>';
        return;
    }
    const orderListHtml = Object.values(orders).map(order => {
        const product = allAdminProducts[order.productId] || { title: 'Unknown Product', price: 0 };
        return `
            <div class="admin-order-item completed">
                <div class="order-details">
                    <h4>Order ID: ${order.id.substring(0, 6)}... <span class="status-tag completed">Completed</span></h4>
                    <p><strong>Product:</strong> ${product.title}</p>
                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                    <p><strong>Total Price:</strong> PKR ${(order.quantity * product.price).toLocaleString()}</p>
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Address:</strong> ${order.customerAddress}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone}</p>
                    <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                    <p><strong>Completion Date:</strong> ${new Date(order.completionDate).toLocaleString()}</p>
                </div>
                <div class="order-actions">
                    <button class="admin-button danger delete-order-btn" data-id="${order.id}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    }).join('');
    completedOrderListContainer.innerHTML = orderListHtml;

    document.querySelectorAll('.completed .delete-order-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const confirmed = await showConfirm(`Are you sure you want to delete completed order ${e.target.dataset.id.substring(0, 6)}...? This action cannot be undone.`, 'Confirm Deletion', 'Delete', 'Cancel', 'danger');
            if (confirmed) {
                deleteOrder(e.target.dataset.id);
            }
        });
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const orderRef = ref(database, 'orders/' + orderId);
        const updates = {
            status: newStatus,
            completionDate: serverTimestamp() // Set completion date only when completing
        };
        await update(orderRef, updates); // Use update to only change specific fields
        await showAlert(`Order ${orderId.substring(0, 6)}... marked as ${newStatus}!`, 'Success');
    } catch (error) {
        await showAlert(`Error updating order status: ${error.message}`, 'Update Error');
        console.error('Order status update error:', error);
    }
}

async function deleteOrder(orderId) {
    try {
        await remove(ref(database, 'orders/' + orderId));
        await showAlert('Order deleted successfully!', 'Success');
    } catch (error) {
        await showAlert('Error deleting order: ' + error.message, 'Delete Error');
        console.error('Order delete error:', error);
    }
}

// --- Dashboard Counts ---
function updateDashboardCounts(products, pendingOrders, completedOrders) {
    totalProductsCountEl.textContent = products;
    pendingOrdersCountEl.textContent = pendingOrders;
    completedOrdersCountEl.textContent = completedOrders;
}

// --- Analytics Logic ---
analyticsTimeframeSelect.addEventListener('change', refreshAnalytics);
refreshAnalyticsBtn.addEventListener('click', refreshAnalytics);

function refreshAnalytics() {
    console.log("Refreshing analytics...");
    const timeframe = analyticsTimeframeSelect.value;
    updateProductRatingsChart(timeframe);
    updateWinnerOfTheWeek();
}

function updateProductRatingsChart(timeframe) {
    console.log("Updating product ratings chart for timeframe:", timeframe);

    // Filter ratings based on timeframe
    const now = Date.now();
    let cutoffDate = 0;
    if (timeframe === 'week') {
        cutoffDate = now - (7 * 24 * 60 * 60 * 1000); // 7 days
    } else if (timeframe === 'month') {
        cutoffDate = now - (30 * 24 * 60 * 60 * 1000); // 30 days
    }

    const productRatingData = {}; // productId -> { totalStarsSum, numberOfRatings }

    for (const ratingId in allRatings) {
        const rating = allRatings[ratingId];
        const ratingTimestamp = rating.timestamp ? new Date(rating.timestamp).getTime() : 0;

        if (ratingTimestamp >= cutoffDate) {
            const productId = rating.productId;
            if (!productRatingData[productId]) {
                productRatingData[productId] = { totalStarsSum: 0, numberOfRatings: 0 };
            }
            productRatingData[productId].totalStarsSum += rating.rating;
            productRatingData[productId].numberOfRatings++;
        }
    }

    const labels = [];
    const data = [];
    const backgroundColors = [];
    const borderColors = [];

    let colorIndex = 0;
    const colors = [
        'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(40, 159, 64, 0.6)'
    ];

    for (const productId in productRatingData) {
        const product = allAdminProducts[productId];
        if (product) {
            labels.push(product.title);
            data.push((productRatingData[productId].totalStarsSum / productRatingData[productId].numberOfRatings).toFixed(2));
            backgroundColors.push(colors[colorIndex % colors.length]);
            borderColors.push(colors[colorIndex % colors.length].replace('0.6', '1'));
            colorIndex++;
        }
    }

    if (productRatingsChart) {
        productRatingsChart.destroy(); // Destroy existing chart before creating a new one
    }

    productRatingsChart = new Chart(productRatingsChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Rating (out of 7)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 7, // Max rating is 7
                    title: {
                        display: true,
                        text: 'Average Rating'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Product'
                    }
                }
            }
        }
    });
}

function updateWinnerOfTheWeek() {
    const timeframe = analyticsTimeframeSelect.value; // Use the selected timeframe

    const now = Date.now();
    let cutoffDate = 0;
    if (timeframe === 'week') {
        cutoffDate = now - (7 * 24 * 60 * 60 * 1000); // 7 days
    } else if (timeframe === 'month') {
        cutoffDate = now - (30 * 24 * 60 * 60 * 1000); // 30 days
    } else { // "All Time"
        cutoffDate = 0;
    }

    let bestProduct = null;
    let highestAverageRating = 0;
    let mostOrdersCount = 0;

    // Calculate average ratings for products within the timeframe
    const productAggregatedRatings = {}; // { productId: { totalStarsSum, numberOfRatings } }
    for (const ratingId in allRatings) {
        const rating = allRatings[ratingId];
        const ratingTimestamp = rating.timestamp ? new Date(rating.timestamp).getTime() : 0;
        if (ratingTimestamp >= cutoffDate) {
            if (!productAggregatedRatings[rating.productId]) {
                productAggregatedRatings[rating.productId] = { totalStarsSum: 0, numberOfRatings: 0 };
            }
            productAggregatedRatings[rating.productId].totalStarsSum += rating.rating;
            productAggregatedRatings[rating.productId].numberOfRatings++;
        }
    }

    // Determine product with highest average rating
    for (const productId in productAggregatedRatings) {
        if (allAdminProducts[productId]) { // Ensure product exists
            const { totalStarsSum, numberOfRatings } = productAggregatedRatings[productId];
            if (numberOfRatings > 0) {
                const avgRating = totalStarsSum / numberOfRatings;
                if (avgRating > highestAverageRating) {
                    highestAverageRating = avgRating;
                    bestProduct = allAdminProducts[productId];
                }
            }
        }
    }

    // If no ratings, try to find product with most orders in the timeframe
    if (!bestProduct) {
        const productOrdersCount = {}; // { productId: count }
        for (const orderId in allOrders) {
            const order = allOrders[orderId];
            const orderTimestamp = order.orderDate ? new Date(order.orderDate).getTime() : 0;
            if (orderTimestamp >= cutoffDate && order.status && typeof order.status === 'string' && order.status.trim().toLowerCase() === 'completed') { // Only count completed orders
                productOrdersCount[order.productId] = (productOrdersCount[order.productId] || 0) + order.quantity; // Sum quantities
            }
        }

        for (const productId in productOrdersCount) {
            if (productOrdersCount[productId] > mostOrdersCount) {
                mostOrdersCount = productOrdersCount[productId];
                bestProduct = allAdminProducts[productId];
            }
        }
    }


    if (bestProduct) {
        winnerProductName.textContent = bestProduct.title;
        const currentProductRatingData = productAggregatedRatings[bestProduct.id];
        if (currentProductRatingData && currentProductRatingData.numberOfRatings > 0) {
            const avgRating = (currentProductRatingData.totalStarsSum / currentProductRatingData.numberOfRatings).toFixed(2);
            winnerRatingInfo.textContent = `Average Rating: ${avgRating}/7 (${currentProductRatingData.numberOfRatings} reviews)`;
        } else {
            winnerRatingInfo.textContent = `No ratings in selected timeframe.`;
        }

        const ordersCount = getOrdersForProductInTimeframe(bestProduct.id, timeframe);
        winnerOrdersInfo.textContent = `Orders: ${ordersCount}`;

    } else {
        winnerProductName.textContent = 'N/A';
        winnerRatingInfo.textContent = 'No data for selected timeframe.';
        winnerOrdersInfo.textContent = 'No data for selected timeframe.';
    }
}

function listenForRatings() {
    const ratingsRef = ref(database, 'ratings');
    onValue(ratingsRef, (snapshot) => {
        allRatings = snapshot.val() || {};
        refreshAnalytics(); // Update analytics when ratings change
    }, (error) => {
        console.error("Error listening for ratings:", error);
        showAlert(`Error loading ratings: ${error.message}. Check console and Firebase rules.`, 'Data Error');
    });
}

function populateProductSelects() {
    let optionsHtml = '<option value="">Select a Product</option>';
    for (const productId in allAdminProducts) {
        optionsHtml += `<option value="${productId}">${allAdminProducts[productId].title}</option>`;
    }
    compareProduct1Select.innerHTML = optionsHtml;
    compareProduct2Select.innerHTML = optionsHtml;
}

compareProductsBtn.addEventListener('click', () => {
    const product1Id = compareProduct1Select.value;
    const product2Id = compareProduct2Select.value;

    if (!product1Id || !product2Id) {
        showAlert('Please select two products to compare.', 'Comparison Error');
        return;
    }
    if (product1Id === product2Id) {
        showAlert('Please select two *different* products to compare.', 'Comparison Error');
        return;
    }

    const product1 = allAdminProducts[product1Id];
    const product2 = allAdminProducts[product2Id];

    if (!product1 || !product2) {
        showAlert('One or both selected products not found.', 'Comparison Error');
        return;
    }

    drawProductComparisonChart(product1, product2);
});

function drawProductComparisonChart(product1, product2) {
    if (productComparisonChart) {
        productComparisonChart.destroy();
    }

    const labels = ['Price', 'Stock', 'Average Rating', 'Total Orders (Completed)'];
    const product1Data = [
        product1.price,
        product1.stock,
        product1.numberOfRatings > 0 ? (product1.totalStarsSum / product1.numberOfRatings).toFixed(2) : 0,
        getOrdersForProductInTimeframe(product1.id, 'all') // Get all time orders
    ];
    const product2Data = [
        product2.price,
        product2.stock,
        product2.numberOfRatings > 0 ? (product2.totalStarsSum / product2.numberOfRatings).toFixed(2) : 0,
        getOrdersForProductInTimeframe(product2.id, 'all')
    ];

    productComparisonChart = new Chart(productComparisonChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: product1.title,
                    data: product1Data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: product2.title,
                    data: product2Data,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)', // Red
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    });
}

function getOrdersForProductInTimeframe(productId, timeframe) {
    const now = Date.now();
    let cutoffDate = 0;

    if (timeframe === 'week') {
        cutoffDate = now - (7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'month') {
        cutoffDate = now - (30 * 24 * 60 * 60 * 1000);
    }

    let count = 0;
    for (const orderId in allOrders) {
        const order = allOrders[orderId];
        const orderTimestamp = order.orderDate ? new Date(order.orderDate).getTime() : 0;
        if (order.productId === productId && orderTimestamp >= cutoffDate) {
            count++;
        }
    }
    return count;
}


document.addEventListener('DOMContentLoaded', () => {
    if (auth.currentUser && adminDashboard.style.display === 'block') {
        // Already handled by onAuthStateChanged
    } else if (!auth.currentUser) {
        authSection.style.display = 'block';
        adminDashboard.style.display = 'none';
    }
});
