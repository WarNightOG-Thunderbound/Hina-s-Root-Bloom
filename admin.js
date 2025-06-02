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
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();
const storageRef = firebase.storage.ref;
const uploadBytes = firebase.storage.uploadBytes;
const getDownloadURL = firebase.storage.getDownloadURL;
const deleteObject = firebase.storage.deleteObject;
const ref = firebase.database.ref;
const onValue = firebase.database.onValue;
const push = firebase.database.push;
const set = firebase.database.set;
const remove = firebase.database.remove;
const get = firebase.database.get;
const child = firebase.database.child;
const signInWithEmailAndPassword = firebase.auth.signInWithEmailAndPassword;
const signOut = firebase.auth.signOut;
const onAuthStateChanged = firebase.auth.onAuthStateChanged;
const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;

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
        adminEmailInput.value = '';
        adminPasswordInput.value = '';
    }
});

// --- Firebase Product Operations ---
async function uploadImage(file) {
    if (!file) return null;
    const fileName = `${Date.now()}_${file.name}`;
    const storageReference = storageRef(storage, 'product_images/' + fileName);
    const snapshot = await uploadBytes(storageReference, file);
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

    if (!title || !price || isNaN(price) || !stock || isNaN(stock)) {
        await showAlert('Please fill in all required product fields: Title, Price, and Stock.', 'Validation Error');
        return;
    }
    if (price <= 0 || stock < 0) {
        await showAlert('Price must be greater than 0, and Stock cannot be negative.', 'Validation Error');
        return;
    }

    addEditProductBtn.disabled = true;
    const originalButtonHTML = addEditProductBtn.innerHTML;
    addEditProductBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const imageUrls = [...existingImageUrls];
        // Upload new images
        for (const file of newFilesToUpload) {
            const url = await uploadImage(file);
            if (url) {
                imageUrls.push(url);
            }
        }

        const productData = {
            title,
            brand,
            description,
            category,
            price,
            stock,
            featured,
            videoUrl,
            images: imageUrls
        };

        if (id) {
            // Edit existing product
            await set(ref(database, 'products/' + id), productData);
            await showAlert('Product updated successfully!', 'Success');
        } else {
            // Add new product
            const newProductRef = push(ref(database, 'products'));
            const currentProductId = newProductRef.key;
            // Set ID and set createdAt
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

clearFormBtn.addEventListener('click', clearProductForm);

function clearProductForm() {
    productIdInput.value = '';
    productTitleInput.value = '';
    productBrandInput.value = '';
    productDescriptionInput.value = '';
    productCategorySelect.value = 'Fabric';
    productPriceInput.value = '';
    productStockInput.value = '';
    productFeaturedCheckbox.checked = false;
    productVideoInput.value = '';
    resetImagePreviews();
    addEditProductBtn.textContent = 'Save Product';
    addEditProductBtn.querySelector('i').className = 'fas fa-save';
}

function listenForProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        allAdminProducts = {};
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const product = childSnapshot.val();
                allAdminProducts[product.id] = product;
            });
        }
        displayAdminProducts(allAdminProducts);
        updateDashboardCounts(Object.keys(allAdminProducts).length, pendingOrdersCountEl.textContent, completedOrdersCountEl.textContent);
        populateCompareProductSelects(allAdminProducts); // Populate selects for comparison
    }, (error) => {
        console.error("Error listening for products:", error);
        productListContainer.innerHTML = `<p class="no-items-message error-message">Error loading products. Firebase: ${error.message}.</p>`;
        showAlert(`Error loading products: ${error.message}.`, 'Data Error');
    });
}

function displayAdminProducts(products) {
    productListContainer.innerHTML = '';
    if (Object.keys(products).length === 0) {
        productListContainer.innerHTML = '<p class="no-items-message">No products available.</p>';
        return;
    }
    const productListHtml = Object.values(products).map(product => {
        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/65x65.png?text=No+Image';
        const stockStatus = product.stock > 0 ? `<span class="status-badge success">In Stock (${product.stock})</span>` : `<span class="status-badge danger">Out of Stock</span>`;
        const featuredBadge = product.featured ? `<span class="status-badge info">Featured</span>` : '';
        const averageRating = typeof product.averageRating === 'number' ? product.averageRating.toFixed(1) : (product.averageRating || 'N/A');

        return `
            <div class="admin-product-item">
                <img src="${imageUrl}" alt="${product.title}">
                <div class="admin-product-details">
                    <h4>${product.title} ${featuredBadge}</h4>
                    <p><strong>Brand:</strong> ${product.brand || 'N/A'}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Price:</strong> PKR ${product.price.toLocaleString()}</p>
                    <p><strong>Stock:</strong> ${stockStatus}</p>
                    <p><strong>Rating:</strong> ${averageRating} / 7 (${product.numberOfRatings || 0} reviews)</p>
                </div>
                <div class="admin-product-actions">
                    <button class="admin-button primary small-button" onclick="editProduct('${product.id}')"><i class="fas fa-edit"></i> Edit</button>
                    <button class="admin-button danger small-button" onclick="confirmDeleteProduct('${product.id}', '${product.title}')"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    }).join('');
    productListContainer.innerHTML = productListHtml;
}

adminProductSearchBtn.addEventListener('click', () => {
    const searchTerm = adminProductSearchInput.value.toLowerCase().trim();
    if (searchTerm === '') {
        displayAdminProducts(allAdminProducts);
        return;
    }
    const filtered = {};
    for (const productId in allAdminProducts) {
        const product = allAdminProducts[productId];
        if (product.title.toLowerCase().includes(searchTerm) || (product.brand && product.brand.toLowerCase().includes(searchTerm))) {
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
        addEditProductBtn.textContent = 'Update Product';
        addEditProductBtn.querySelector('i').className = 'fas fa-save'; // Ensure correct icon
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
                    removeBtn.style.display = 'inline-block';
                }
            });
        }
    }
}

async function confirmDeleteProduct(id, title) {
    const confirmed = await showConfirm(`Are you sure you want to delete product "${title}"? This action cannot be undone.`, 'Confirm Delete', 'Delete', 'Cancel', 'danger');
    if (confirmed) {
        deleteProduct(id);
    }
}

async function deleteProduct(id) {
    try {
        const product = allAdminProducts[id];
        if (product && product.images) {
            // Delete images from storage first
            for (const imageUrl of product.images) {
                try {
                    const imageRef = storageRef(storage, imageUrl);
                    await deleteObject(imageRef);
                } catch (imgError) {
                    // Ignore errors if image doesn't exist in storage (e.g., placeholder or external URL)
                    console.warn(`Could not delete image ${imageUrl}:`, imgError.message);
                }
            }
        }
        await remove(ref(database, 'products/' + id));
        await showAlert('Product deleted successfully!', 'Success');
    } catch (error) {
        await showAlert('Error deleting product: ' + error.message, 'Delete Error');
        console.error('Product delete error:', error);
    }
}

// --- Firebase Order Operations ---
function listenForOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        allOrders = {};
        const pendingOrders = {};
        const completedOrders = {};
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const orderId = childSnapshot.key;
                allOrders[orderId] = childSnapshot.val();
                const order = { id: orderId, ...allOrders[orderId] };
                if (order.status === 'completed' || order.status === 'cancelled') {
                    completedOrders[orderId] = order;
                } else {
                    pendingOrders[orderId] = order;
                }
            });
        }
        displayOrders(pendingOrders, orderListContainer, false);
        displayOrders(completedOrders, completedOrderListContainer, true);
        updateDashboardCounts(totalProductsCountEl.textContent, Object.keys(pendingOrders).length, Object.keys(completedOrders).length);
    }, (error) => {
        console.error("Error listening for orders:", error);
        orderListContainer.innerHTML = `<p class="no-items-message error-message">Error loading orders. Firebase: ${error.message}.</p>`;
        completedOrderListContainer.innerHTML = `<p class="no-items-message error-message">Error loading completed orders. Firebase: ${error.message}.</p>`;
        showAlert(`Error loading orders: ${error.message}.`, 'Data Error');
    });
}

function displayOrders(orders, containerEl, isCompletedTab) {
    containerEl.innerHTML = '';
    if (Object.keys(orders).length === 0) {
        containerEl.innerHTML = `<p class="no-items-message">${isCompletedTab ? 'No completed orders.' : 'No pending orders.'}</p>`;
        return;
    }

    const orderListHtml = Object.values(orders).map(order => {
        const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
        const completedDate = order.completedDate ? new Date(order.completedDate).toLocaleString() : 'N/A';
        const productName = allAdminProducts[order.productId] ? allAdminProducts[order.productId].title : 'Product Not Found';
        const productPrice = allAdminProducts[order.productId] ? allAdminProducts[order.productId].price.toLocaleString() : 'N/A';
        const statusBadgeClass = order.status === 'completed' ? 'success' : (order.status === 'cancelled' ? 'danger' : 'info');

        let actionButtons = '';
        if (!isCompletedTab) {
            actionButtons = `
                <button class="admin-button primary small-button complete-order-btn" data-order-id="${order.id}"><i class="fas fa-check"></i> Complete</button>
                <button class="admin-button danger small-button cancel-order-btn" data-order-id="${order.id}"><i class="fas fa-times"></i> Cancel</button>
            `;
        }

        return `
            <div class="admin-order-item">
                <div class="order-details">
                    <h4>Order ID: ${order.id.substring(0, 8)}...</h4>
                    <p><strong>Product:</strong> ${productName} (PKR ${productPrice})</p>
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone}</p>
                    <p><strong>Address:</strong> ${order.customerAddress}</p>
                    <p><strong>Order Date:</strong> ${orderDate}</p>
                    ${isCompletedTab ? `<p><strong>Completion Date:</strong> ${completedDate}</p>` : ''}
                    <p><strong>Status:</strong> <span class="status-badge ${statusBadgeClass}">${order.status.toUpperCase()}</span></p>
                </div>
                <div class="order-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
    }).join('');
    containerEl.innerHTML = orderListHtml;

    if (!isCompletedTab) {
        // Add event listeners for new complete/cancel buttons
        containerEl.querySelectorAll('.complete-order-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const confirmed = await showConfirm(`Mark order ...${e.target.dataset.orderId.substring(e.target.dataset.orderId.length - 6)} as completed?`, 'Confirm Completion', 'Complete', 'No', 'primary');
                if (confirmed) {
                    completeOrder(e.target.dataset.orderId);
                }
            });
        });
        containerEl.querySelectorAll('.cancel-order-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const confirmed = await showConfirm(`Cancel order ...${e.target.dataset.orderId.substring(e.target.dataset.orderId.length - 6)}? This action cannot be undone.`, 'Confirm Cancellation', 'Cancel Order', 'No', 'danger');
                if (confirmed) {
                    cancelOrder(e.target.dataset.orderId);
                }
            });
        });
    }
}

async function completeOrder(orderId) {
    if (!orderId) {
        await showAlert('Error: Order ID is missing for completion.', 'Error');
        return;
    }
    try {
        const orderRef = ref(database, 'orders/' + orderId);
        const snapshot = await get(child(orderRef, '')); // Use child('') to get the ref for 'orderId' itself
        const orderData = snapshot.val();
        if (orderData) {
            // Update status and add completion timestamp
            await set(orderRef, { ...orderData, status: 'completed', completedDate: serverTimestamp() }); // Use set to update the whole object
            await showAlert(`Order ...${orderId.substring(orderId.length - 6)} marked as completed and moved to history.`, 'Order Completed');
        } else {
            await showAlert('Order not found in pending list. It might have been processed already or does not exist.', 'Order Not Found');
        }
    } catch (error) {
        await showAlert('Error completing order: ' + error.message, 'Completion Error');
        console.error('Error completing order:', error);
    }
}

async function cancelOrder(orderId) {
    if (!orderId) {
        await showAlert('Error: Order ID is missing for cancellation.', 'Error');
        return;
    }
    try {
        const orderRef = ref(database, 'orders/' + orderId);
        const snapshot = await get(child(orderRef, '')); // Use child('') to get the ref for 'orderId' itself
        const orderData = snapshot.val();
        if (orderData) {
            // Update status to cancelled and add completion timestamp
            await set(orderRef, { ...orderData, status: 'cancelled', completedDate: serverTimestamp() }); // Use set to update the whole object
            await showAlert(`Order ...${orderId.substring(orderId.length - 6)} cancelled and moved to history.`, 'Order Cancelled');
        } else {
            await showAlert('Order not found. It might have been processed already or does not exist.', 'Order Not Found');
        }
    } catch (error) {
        await showAlert('Error cancelling order: ' + error.message, 'Cancellation Error');
        console.error('Error cancelling order:', error);
    }
}


function updateDashboardCounts(totalProducts, pendingOrders, completedOrders) {
    totalProductsCountEl.textContent = totalProducts;
    pendingOrdersCountEl.textContent = pendingOrders;
    completedOrdersCountEl.textContent = completedOrders;
}

// --- Firebase Analytics Operations ---
function listenForRatings() {
    const ratingsRef = ref(database, 'ratings');
    onValue(ratingsRef, (snapshot) => {
        allRatings = {};
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const rating = childSnapshot.val();
                allRatings[rating.id] = rating;
            });
        }
        refreshAnalytics(); // Refresh analytics charts/data whenever ratings change
    }, (error) => {
        console.error("Error listening for ratings:", error);
        showAlert(`Error loading ratings: ${error.message}.`, 'Data Error');
    });
}

analyticsTimeframeSelect.addEventListener('change', refreshAnalytics);
refreshAnalyticsBtn.addEventListener('click', refreshAnalytics);

function refreshAnalytics() {
    const timeframe = analyticsTimeframeSelect.value;
    const filteredRatings = filterRatingsByTimeframe(timeframe);
    const productAggregates = getProductAggregates(filteredRatings);
    renderProductRatingsChart(productAggregates);
    updateWinnerProduct(productAggregates);
    // Don't call populateCompareProductSelects here, it's called in listenForProducts
    // because products are needed for the options, which are less frequent than ratings changes.
    // When comparison is triggered by button, it will use the current allAdminProducts.
}


function filterRatingsByTimeframe(timeframe) {
    const now = Date.now();
    let cutoffDate = 0; // Default to all time

    if (timeframe === 'week') {
        cutoffDate = now - (7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'month') {
        cutoffDate = now - (30 * 24 * 60 * 60 * 1000);
    }

    const filtered = {};
    for (const ratingId in allRatings) {
        const rating = allRatings[ratingId];
        // Firebase server timestamps are objects, convert to milliseconds
        const ratingTimestamp = rating.timestamp;
        if (ratingTimestamp >= cutoffDate) {
            filtered[ratingId] = rating;
        }
    }
    return filtered;
}

function getProductAggregates(ratings) {
    const productAggregates = {}; // { productId: { totalStars: X, count: Y, orders: Z } }

    // Aggregate ratings
    for (const ratingId in ratings) {
        const rating = ratings[ratingId];
        if (!productAggregates[rating.productId]) {
            productAggregates[rating.productId] = { totalStars: 0, count: 0, orderCount: 0 };
        }
        productAggregates[rating.productId].totalStars += rating.stars;
        productAggregates[rating.productId].count += 1;
    }

    // Aggregate order counts for products within the same timeframe as ratings
    const timeframe = analyticsTimeframeSelect.value;
    for (const orderId in allOrders) {
        const order = allOrders[orderId];
        const orderTimestamp = order.orderDate; // Assuming orderDate is a timestamp
        const now = Date.now();
        let cutoffDate = 0;
        if (timeframe === 'week') {
            cutoffDate = now - (7 * 24 * 60 * 60 * 1000);
        } else if (timeframe === 'month') {
            cutoffDate = now - (30 * 24 * 60 * 60 * 1000);
        }

        if (orderTimestamp >= cutoffDate && productAggregates[order.productId]) {
            productAggregates[order.productId].orderCount += 1;
        }
    }
    return productAggregates;
}


function renderProductRatingsChart(productAggregates) {
    if (productRatingsChart) {
        productRatingsChart.destroy();
    }

    const labels = [];
    const data = [];
    const productData = []; // To store product info for tooltips

    // Sort products by average rating (descending)
    const sortedProductIds = Object.keys(productAggregates).sort((a, b) => {
        const avgA = productAggregates[a].count > 0 ? productAggregates[a].totalStars / productAggregates[a].count : 0;
        const avgB = productAggregates[b].count > 0 ? productAggregates[b].totalStars / productAggregates[b].count : 0;
        return avgB - avgA;
    });

    sortedProductIds.forEach(productId => {
        const aggregate = productAggregates[productId];
        const product = allAdminProducts[productId];
        if (product) {
            const averageRating = aggregate.count > 0 ? (aggregate.totalStars / aggregate.count) : 0;
            labels.push(product.title);
            data.push(averageRating);
            productData.push({
                numberOfRatings: aggregate.count,
                orderCount: aggregate.orderCount
            });
        }
    });

    productRatingsChart = new Chart(productRatingsChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Rating',
                data: data,
                backgroundColor: 'rgba(23, 162, 184, 0.7)', // Cyan
                borderColor: 'rgba(23, 162, 184, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Product Ratings - ${analyticsTimeframeSelect.options[analyticsTimeframeSelect.selectedIndex].text}`,
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) { label += context.parsed.y.toFixed(2); }
                            const product = productData[context.dataIndex];
                            if (product) {
                                label += ` (${product.numberOfRatings} reviews, ${product.orderCount} orders)`;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 7, // Assuming 7-star rating
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

function updateWinnerProduct(productAggregates) {
    let winner = null;
    let maxRating = 0;
    let maxOrders = 0;

    for (const productId in productAggregates) {
        const aggregate = productAggregates[productId];
        const product = allAdminProducts[productId];

        if (product && aggregate.count > 0) { // Only consider products with ratings
            const averageRating = aggregate.totalStars / aggregate.count;
            if (averageRating > maxRating) {
                maxRating = averageRating;
                winner = { product, averageRating, orders: aggregate.orderCount };
            } else if (averageRating === maxRating && aggregate.orderCount > (winner ? winner.orders : -1)) {
                // If ratings are tied, prioritize by more orders
                winner = { product, averageRating, orders: aggregate.orderCount };
            }
        }
    }

    if (winner) {
        winnerProductName.textContent = winner.product.title;
        winnerRatingInfo.textContent = `Rating: ${winner.averageRating.toFixed(2)} / 7`;
        winnerOrdersInfo.textContent = `Orders in timeframe: ${winner.orders}`;
    } else {
        winnerProductName.textContent = 'N/A';
        winnerRatingInfo.textContent = 'Rating: N/A';
        winnerOrdersInfo.textContent = 'Orders: N/A';
    }
}

function populateCompareProductSelects(products) {
    compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';

    Object.values(products).forEach(product => {
        const option1 = document.createElement('option');
        option1.value = product.id;
        option1.textContent = product.title;
        compareProduct1Select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = product.id;
        option2.textContent = product.title;
        compareProduct2Select.appendChild(option2);
    });
}

compareProductsBtn.addEventListener('click', () => {
    const product1Id = compareProduct1Select.value;
    const product2Id = compareProduct2Select.value;

    if (!product1Id || !product2Id) {
        showAlert('Please select two products to compare.', 'Selection Error');
        return;
    }
    if (product1Id === product2Id) {
        showAlert('Please select two different products to compare.', 'Selection Error');
        return;
    }

    const product1 = allAdminProducts[product1Id];
    const product2 = allAdminProducts[product2Id];

    if (!product1 || !product2) {
        showAlert('Selected products not found.', 'Error');
        return;
    }

    const timeframe = analyticsTimeframeSelect.value;
    const filteredRatings = filterRatingsByTimeframe(timeframe);
    const productAggregates = getProductAggregates(filteredRatings);

    const product1Agg = productAggregates[product1Id] || { totalStars: 0, count: 0, orderCount: 0 };
    const product2Agg = productAggregates[product2Id] || { totalStars: 0, count: 0, orderCount: 0 };

    const product1AvgRating = product1Agg.count > 0 ? (product1Agg.totalStars / product1Agg.count) : 0;
    const product2AvgRating = product2Agg.count > 0 ? (product2Agg.totalStars / product2Agg.count) : 0;

    renderProductComparisonChart(product1, product2, product1AvgRating, product1Agg.orderCount, product2AvgRating, product2Agg.orderCount);
});

function renderProductComparisonChart(product1, product2, product1AvgRating, product1Orders, product2AvgRating, product2Orders) {
    const labels = ['Average Rating', 'Orders in Timeframe'];
    const data1 = [product1AvgRating.toFixed(2), product1Orders];
    const data2 = [product2AvgRating.toFixed(2), product2Orders];

    if (productComparisonChart) {
        productComparisonChart.destroy();
    }

    productComparisonChart = new Chart(productComparisonChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: product1.title,
                    data: data1,
                    backgroundColor: 'rgba(0, 123, 255, 0.7)', // Info Blue
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                },
                {
                    label: product2.title,
                    data: data2,
                    backgroundColor: 'rgba(232, 62, 140, 0.7)', // Pink
                    borderColor: 'rgba(232, 62, 140, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Product Comparison - ${analyticsTimeframeSelect.options[analyticsTimeframeSelect.selectedIndex].text}`,
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
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

// Function to get orders for product in a specific timeframe (used by winner function)
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
        const orderTimestamp = order.orderDate; // Assuming orderDate is a timestamp
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
