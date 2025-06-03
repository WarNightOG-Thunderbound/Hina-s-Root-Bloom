// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, set, remove, onValue, serverTimestamp, update, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBr6A2OGh-nwfMzOwmVOWs1-u5ylZ2Vemw", // Replace with your actual API Key
  authDomain: "hina-s-rootandbloomstore.firebaseapp.com",
  databaseURL: "https://hina-s-rootandbloomstore-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hina-s-rootandbloomstore",
  storageBucket: "hina-s-rootandbloomstore.firebasestorage.app",
  messagingSenderId: "967448486557",
  appId: "1:967448486557:web:2c89223921f6479010495f", // <--- IMPORTANT: Replace with your actual Firebase App ID
  measurementId: "G-TT31HC3NZ3" // <--- IMPORTANT: Replace with your actual Firebase Measurement ID (if using Analytics)
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize analytics
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);


// --- DOM Elements ---
const adminAuthSection = document.getElementById('admin-auth-section');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginEmailInput = document.getElementById('admin-login-email');
const adminLoginPasswordInput = document.getElementById('admin-login-password');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminDashboardSection = document.getElementById('admin-dashboard-section');
const adminLogoutLink = document.getElementById('admin-logout-link');

// Tab buttons and content
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Product Management
const addProductBtn = document.getElementById('add-product-btn');
const productModal = document.getElementById('product-modal');
const closeProductModalBtn = document.getElementById('close-product-modal');
const productModalTitle = document.getElementById('product-modal-title');
const productIdInput = document.getElementById('product-id');
const productTitleInput = document.getElementById('product-title');
const productDescriptionInput = document.getElementById('product-description');
const productPriceInput = document.getElementById('product-price');
const productCategoryInput = document.getElementById('product-category');
const productBrandInput = document.getElementById('product-brand');
const productImageUrlInput = document.getElementById('product-image-url');
const productVideoUrlInput = document.getElementById('product-video-url');
const productImageUploadInput = document.getElementById('product-image-upload');
const productImagePreview = document.getElementById('product-image-preview');
const saveProductBtn = document.getElementById('save-product-btn');
const productListTableBody = document.getElementById('product-list');

// Order Management
const orderListTableBody = document.getElementById('order-list');

// Rating Management
const ratingListTableBody = document.getElementById('rating-list');

// Analytics
let ordersChartInstance = null;
let salesByCategoryChartInstance = null;
let productComparisonChartInstance = null;
const ordersChartCanvas = document.getElementById('ordersChart');
const salesByCategoryChartCanvas = document.getElementById('salesByCategoryChart');
const productComparisonChartCanvas = document.getElementById('productComparisonChart');
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');

// Custom Alert/Confirm Modals
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


let allProducts = []; // To store all products for analytics and comparison
let allOrders = []; // To store all orders for analytics
let allRatings = {}; // To store ratings for products


// --- Firebase Authentication ---
onAuthStateChanged(auth, (user) => {
    // IMPORTANT: Implement robust admin check here (e.g., custom claims)
    // For now, a simple check by UID.
    const adminUids = ["YOUR_ADMIN_UID_1"]; // Replace with your actual admin UID(s)
    if (user && adminUids.includes(user.uid)) {
        console.log('[Admin] User logged in:', user.email);
        if (adminAuthSection) adminAuthSection.style.display = 'none';
        if (adminDashboardSection) adminDashboardSection.style.display = 'block';
        loadAdminData(); // Load data only when admin is authenticated
        showTab('products'); // Default to products tab
    } else {
        console.log('[Admin] User logged out or not authorized.');
        if (adminAuthSection) adminAuthSection.style.display = 'flex';
        if (adminDashboardSection) adminDashboardSection.style.display = 'none';
        showAlert('Unauthorized Access', 'Please log in with an admin account.');
    }
});

if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', async () => {
        const email = adminLoginEmailInput ? adminLoginEmailInput.value : '';
        const password = adminLoginPasswordInput ? adminLoginPasswordInput.value : '';
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle UI update
        } catch (error) {
            showAlert('Login Failed', error.message);
        }
    });
}

if (adminLogoutLink) {
    adminLogoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            console.log('[Admin] User logged out.');
            showAlert('Logged Out', 'You have been successfully logged out from admin panel.');
            // onAuthStateChanged will handle UI update
        } catch (error) {
            showAlert('Logout Error', error.message);
        }
    });
}

// --- Tab Management ---
function showTab(tabId) {
    tabContents.forEach(content => {
        if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    tabButtons.forEach(button => {
        if (button.dataset.tab === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Special handling for analytics charts
    if (tabId === 'analytics') {
        renderOrdersChart();
        renderSalesByCategoryChart();
        populateCompareProductSelects();
    } else {
        // Destroy chart instances when not on analytics tab to save resources
        if (ordersChartInstance) ordersChartInstance.destroy();
        if (salesByCategoryChartInstance) salesByCategoryChartInstance.destroy();
        if (productComparisonChartInstance) productComparisonChartInstance.destroy();
    }
}

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        showTab(tabId);
    });
});


// --- Product Management ---
function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const productsData = snapshot.val();
        productListTableBody.innerHTML = '';
        allProducts = []; // Clear for fresh load
        if (productsData) {
            for (const id in productsData) {
                const product = { id, ...productsData[id] };
                allProducts.push(product); // Add to allProducts array
                const row = productListTableBody.insertRow();
                row.innerHTML = `
                    <td><img src="${product.imageUrl || 'placeholder.png'}" alt="${product.title}" class="admin-thumbnail"></td>
                    <td>${product.title}</td>
                    <td>${product.category}</td>
                    <td>$${product.price ? product.price.toFixed(2) : '0.00'}</td>
                    <td>
                        <button class="admin-button secondary edit-product-btn" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="admin-button danger delete-product-btn" data-id="${product.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                    </td>
                `;
            }
        }
        addEditDeleteProductListeners();
    }, {
        onlyOnce: false // Listen for real-time updates
    });
}

function addEditDeleteProductListeners() {
    productListTableBody.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            editProduct(productId);
        });
    });

    productListTableBody.querySelectorAll('.delete-product-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            showConfirm('Delete Product', 'Are you sure you want to delete this product?', () => deleteProduct(productId));
        });
    });
}

if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
        if (productModal) productModal.style.display = 'block';
        if (productModalTitle) productModalTitle.textContent = 'Add New Product';
        // Clear form
        if (productIdInput) productIdInput.value = '';
        if (productTitleInput) productTitleInput.value = '';
        if (productDescriptionInput) productDescriptionInput.value = '';
        if (productPriceInput) productPriceInput.value = '';
        if (productCategoryInput) productCategoryInput.value = '';
        if (productBrandInput) productBrandInput.value = '';
        if (productImageUrlInput) productImageUrlInput.value = '';
        if (productVideoUrlInput) productVideoUrlInput.value = '';
        if (productImageUploadInput) productImageUploadInput.value = '';
        if (productImagePreview) productImagePreview.style.display = 'none';
        if (productImagePreview) productImagePreview.src = '';
    });
}

if (closeProductModalBtn) {
    closeProductModalBtn.addEventListener('click', () => {
        if (productModal) productModal.style.display = 'none';
    });
}

if (productImageUploadInput) {
    productImageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (productImagePreview) {
                    productImagePreview.src = e.target.result;
                    productImagePreview.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        } else {
            if (productImagePreview) {
                productImagePreview.src = '';
                productImagePreview.style.display = 'none';
            }
        }
    });
}

if (saveProductBtn) {
    saveProductBtn.addEventListener('click', async () => {
        const id = productIdInput ? productIdInput.value : '';
        const title = productTitleInput ? productTitleInput.value.trim() : '';
        const description = productDescriptionInput ? productDescriptionInput.value.trim() : '';
        const price = parseFloat(productPriceInput ? productPriceInput.value : 0);
        const category = productCategoryInput ? productCategoryInput.value.trim() : '';
        const brand = productBrandInput ? productBrandInput.value.trim() : '';
        let imageUrl = productImageUrlInput ? productImageUrlInput.value.trim() : '';
        const videoUrl = productVideoUrlInput ? productVideoUrlInput.value.trim() : '';
        const imageFile = productImageUploadInput && productImageUploadInput.files.length > 0 ? productImageUploadInput.files[0] : null;

        if (!title || !description || isNaN(price) || price <= 0 || !category || !brand) {
            showAlert('Validation Error', 'Please fill in all required fields (Title, Description, Price, Category, Brand). Price must be a positive number.');
            return;
        }

        try {
            if (imageFile) {
                const imageRef = storageRef(storage, `product_images/${imageFile.name}_${Date.now()}`);
                const snapshot = await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            const productData = {
                title,
                description,
                price,
                category,
                brand,
                imageUrl,
                videoUrl
            };

            if (id) {
                // Update existing product
                await update(ref(database, `products/${id}`), productData);
                showAlert('Product Updated', 'Product has been successfully updated.');
            } else {
                // Add new product
                const newProductRef = push(ref(database, 'products'));
                await set(newProductRef, productData);
                showAlert('Product Added', 'New product has been successfully added.');
            }
            if (productModal) productModal.style.display = 'none';
        } catch (error) {
            console.error("Error saving product:", error);
            showAlert('Save Error', 'Failed to save product: ' + error.message);
        }
    });
}

async function editProduct(productId) {
    const productRef = ref(database, `products/${productId}`);
    const snapshot = await get(productRef);
    if (snapshot.exists()) {
        const product = snapshot.val();
        if (productModal) productModal.style.display = 'block';
        if (productModalTitle) productModalTitle.textContent = 'Edit Product';
        if (productIdInput) productIdInput.value = productId;
        if (productTitleInput) productTitleInput.value = product.title || '';
        if (productDescriptionInput) productDescriptionInput.value = product.description || '';
        if (productPriceInput) productPriceInput.value = product.price || '';
        if (productCategoryInput) productCategoryInput.value = product.category || '';
        if (productBrandInput) productBrandInput.value = product.brand || '';
        if (productImageUrlInput) productImageUrlInput.value = product.imageUrl || '';
        if (productVideoUrlInput) productVideoUrlInput.value = product.videoUrl || '';
        if (productImagePreview) {
            if (product.imageUrl) {
                productImagePreview.src = product.imageUrl;
                productImagePreview.style.display = 'block';
            } else {
                productImagePreview.style.display = 'none';
            }
        }
        if (productImageUploadInput) productImageUploadInput.value = ''; // Clear file input for new upload
    } else {
        showAlert('Error', 'Product not found.');
    }
}

async function deleteProduct(productId) {
    try {
        await remove(ref(database, `products/${productId}`));
        showAlert('Product Deleted', 'Product has been successfully deleted.');
    } catch (error) {
        console.error("Error deleting product:", error);
        showAlert('Delete Error', 'Failed to delete product: ' + error.message);
    }
}


// --- Order Management ---
function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        const ordersData = snapshot.val();
        orderListTableBody.innerHTML = '';
        allOrders = []; // Clear for fresh load
        if (ordersData) {
            // Convert object to array and sort by timestamp (newest first)
            allOrders = Object.values(ordersData).map(order => ({
                ...order,
                timestamp: order.timestamp || Date.now() // Ensure timestamp exists for sorting
            })).sort((a, b) => b.timestamp - a.timestamp);

            allOrders.forEach(order => {
                const row = orderListTableBody.insertRow();
                const orderDate = order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A';
                row.innerHTML = `
                    <td>${order.orderId}</td>
                    <td>${order.customerName}</td>
                    <td>$${order.total ? order.total.toFixed(2) : '0.00'}</td>
                    <td>
                        <select class="order-status-select" data-id="${order.orderId}">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>${orderDate}</td>
                    <td>
                        <button class="admin-button secondary view-order-details-btn" data-id="${order.orderId}"><i class="fas fa-eye"></i> View Details</button>
                        <button class="admin-button danger delete-order-btn" data-id="${order.orderId}"><i class="fas fa-trash-alt"></i> Delete</button>
                    </td>
                `;
            });
        }
        addOrderActionListeners();
    }, {
        onlyOnce: false
    });
}

function addOrderActionListeners() {
    orderListTableBody.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const orderId = e.target.dataset.id;
            const newStatus = e.target.value;
            updateOrderStatus(orderId, newStatus);
        });
    });

    orderListTableBody.querySelectorAll('.view-order-details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = e.target.dataset.id;
            viewOrderDetails(orderId);
        });
    });

    orderListTableBody.querySelectorAll('.delete-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = e.target.dataset.id;
            showConfirm('Delete Order', 'Are you sure you want to delete this order?', () => deleteOrder(orderId));
        });
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await update(ref(database, `orders/${orderId}`), { status: newStatus });
        showAlert('Order Status Updated', `Order ${orderId} status changed to ${newStatus}.`);
    } catch (error) {
        console.error("Error updating order status:", error);
        showAlert('Update Error', 'Failed to update order status: ' + error.message);
    }
}

async function viewOrderDetails(orderId) {
    const orderRef = ref(database, `orders/${orderId}`);
    const snapshot = await get(orderRef);
    if (snapshot.exists()) {
        const order = snapshot.val();
        let itemsHtml = '';
        for (const productId in order.items) {
            const item = order.items[productId];
            itemsHtml += `<li>${item.title} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</li>`;
        }
        showAlert(
            `Order Details: ${order.orderId}`,
            `
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Address:</strong> ${order.customerAddress}</p>
            <p><strong>Phone:</strong> ${order.customerPhone}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
            <p><strong>Date:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
            <p><strong>Items:</strong></p>
            <ul>${itemsHtml}</ul>
            `
        );
    } else {
        showAlert('Error', 'Order not found.');
    }
}

async function deleteOrder(orderId) {
    try {
        await remove(ref(database, `orders/${orderId}`));
        showAlert('Order Deleted', 'Order has been successfully deleted.');
    } catch (error) {
        console.error("Error deleting order:", error);
        showAlert('Delete Error', 'Failed to delete order: ' + error.message);
    }
}


// --- Rating Management ---
function loadRatings() {
    const ratingsRef = ref(database, 'ratings');
    onValue(ratingsRef, (snapshot) => {
        const ratingsData = snapshot.val();
        ratingListTableBody.innerHTML = '';
        allRatings = ratingsData || {}; // Store all ratings for analytics
        if (ratingsData) {
            for (const id in ratingsData) {
                const rating = ratingsData[id];
                const productTitle = allProducts.find(p => p.id === rating.productId)?.title || 'N/A';
                const row = ratingListTableBody.insertRow();
                row.innerHTML = `
                    <td>${productTitle}</td>
                    <td>${rating.userName || 'Anonymous'}</td>
                    <td>${rating.rating}/5</td>
                    <td>${rating.comment || '-'}</td>
                    <td>${new Date(rating.timestamp).toLocaleString()}</td>
                    <td>
                        <button class="admin-button danger delete-rating-btn" data-id="${id}"><i class="fas fa-trash-alt"></i> Delete</button>
                    </td>
                `;
            }
        }
        addDeleteRatingListeners();
    }, {
        onlyOnce: false
    });
}

function addDeleteRatingListeners() {
    ratingListTableBody.querySelectorAll('.delete-rating-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const ratingId = e.target.dataset.id;
            showConfirm('Delete Rating', 'Are you sure you want to delete this rating?', () => deleteRating(ratingId));
        });
    });
}

async function deleteRating(ratingId) {
    try {
        await remove(ref(database, `ratings/${ratingId}`));
        showAlert('Rating Deleted', 'Rating has been successfully deleted.');
    } catch (error) {
        console.error("Error deleting rating:", error);
        showAlert('Delete Error', 'Failed to delete rating: ' + error.message);
    }
}


// --- Analytics ---
function renderOrdersChart() {
    if (!ordersChartCanvas) return;
    if (ordersChartInstance) ordersChartInstance.destroy(); // Destroy previous instance

    const dailyOrders = {};
    allOrders.forEach(order => {
        const date = new Date(order.timestamp).toLocaleDateString();
        dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    });

    const labels = Object.keys(dailyOrders).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const data = labels.map(label => dailyOrders[label]);

    ordersChartInstance = new Chart(ordersChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Orders',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
}

function renderSalesByCategoryChart() {
    if (!salesByCategoryChartCanvas) return;
    if (salesByCategoryChartInstance) salesByCategoryChartInstance.destroy(); // Destroy previous instance

    const salesByCategory = {};
    allOrders.forEach(order => {
        for (const itemId in order.items) {
            const item = order.items[itemId];
            const product = allProducts.find(p => p.id === item.id);
            if (product && product.category) {
                salesByCategory[product.category] = (salesByCategory[product.category] || 0) + (item.price * item.quantity);
            }
        }
    });

    const labels = Object.keys(salesByCategory);
    const data = labels.map(label => salesByCategory[label]);
    const backgroundColors = [
        'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)'
    ];

    salesByCategoryChartInstance = new Chart(salesByCategoryChartCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales by Category',
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

function populateCompareProductSelects() {
    if (!compareProduct1Select || !compareProduct2Select) return;

    compareProduct1Select.innerHTML = '<option value="">Select Product</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product</option>';

    allProducts.forEach(product => {
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

if (compareProductsBtn) {
    compareProductsBtn.addEventListener('click', () => {
        const productId1 = compareProduct1Select ? compareProduct1Select.value : '';
        const productId2 = compareProduct2Select ? compareProduct2Select.value : '';

        if (!productId1 || !productId2) {
            showAlert('Selection Required', 'Please select two products to compare.');
            return;
        }

        if (productId1 === productId2) {
            showAlert('Invalid Selection', 'Please select two different products to compare.');
            return;
        }

        renderProductComparisonChart(productId1, productId2);
    });
}

function renderProductComparisonChart(productId1, productId2) {
    if (!productComparisonChartCanvas) return;
    if (productComparisonChartInstance) productComparisonChartInstance.destroy(); // Destroy previous instance

    const product1 = allProducts.find(p => p.id === productId1);
    const product2 = allProducts.find(p => p.id === productId2);

    if (!product1 || !product2) {
        showAlert('Error', 'Selected product(s) not found.');
        return;
    }

    const ratings1 = getProductAverageRating(productId1);
    const ratings2 = getProductAverageRating(productId2);

    const labels = ['Price', 'Average Rating', 'Number of Reviews'];
    const data1 = [product1.price, ratings1.average, ratings1.count];
    const data2 = [product2.price, ratings2.average, ratings2.count];

    productComparisonChartInstance = new Chart(productComparisonChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: product1.title,
                    data: data1,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: product2.title,
                    data: data2,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function getProductAverageRating(productId) {
    let totalRating = 0;
    let ratingCount = 0;
    for (const ratingId in allRatings) {
        if (allRatings[ratingId].productId === productId) {
            totalRating += allRatings[ratingId].rating;
            ratingCount++;
        }
    }
    return ratingCount > 0 ? { average: totalRating / ratingCount, count: ratingCount } : { average: 0, count: 0 };
}


// --- Initial Data Load ---
function loadAdminData() {
    loadProducts(); // Load products first as ratings and orders depend on them
    loadOrders();
    loadRatings(); // Load ratings for analytics
}


// --- Custom Alert/Confirm Modals ---
function showAlert(title, message) {
    if (customModalTitle) customModalTitle.textContent = title;
    if (customModalMessage) customModalMessage.innerHTML = message; // Use innerHTML to allow HTML in message
    if (customModalCancelBtn) customModalCancelBtn.style.display = 'none'; // Hide cancel button for alerts
    if (customAlertModal) customAlertModal.style.display = 'block';
    if (customModalOkBtn) {
        customModalOkBtn.onclick = () => {
            if (customAlertModal) customAlertModal.style.display = 'none';
        };
    }
}

function showConfirm(title, message, onConfirm) {
    if (customModalTitle) customModalTitle.textContent = title;
    if (customModalMessage) customModalMessage.innerHTML = message;
    if (customModalCancelBtn) customModalCancelBtn.style.display = 'inline-block'; // Show cancel button for confirms
    if (customAlertModal) customAlertModal.style.display = 'block';

    if (customModalOkBtn) {
        customModalOkBtn.onclick = () => {
            if (customAlertModal) customAlertModal.style.display = 'none';
            if (onConfirm) {
                onConfirm();
            }
        };
    }

    if (customModalCancelBtn) {
        customModalCancelBtn.onclick = () => {
            if (customAlertModal) customAlertModal.style.display = 'none';
        };
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // No need to call loadAdminData here, as onAuthStateChanged will trigger it after successful login.
    // However, ensure all global event listeners for modals are attached here
    if (customModalOkBtn) customModalOkBtn.addEventListener('click', () => {
        if (customAlertModal) customAlertModal.style.display = 'none';
    });
    if (customModalCancelBtn) customModalCancelBtn.addEventListener('click', () => {
        if (customAlertModal) customAlertModal.style.display = 'none';
    });
});
