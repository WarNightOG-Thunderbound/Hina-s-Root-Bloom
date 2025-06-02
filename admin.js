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
const adminEmailInput = document.getElementById('admin-email');
const adminPasswordInput = document.getElementById('admin-password');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const adminDashboard = document.getElementById('admin-dashboard');

const productTitleInput = document.getElementById('product-title');
const productDescriptionInput = document.getElementById('product-description');
const productPriceInput = document.getElementById('product-price');
const productStockInput = document.getElementById('product-stock');
const productBrandInput = document.getElementById('product-brand');
const productCategorySelect = document.getElementById('product-category');
// Updated to handle multiple image inputs
const productImageInputs = [
    document.getElementById('product-image-1'),
    document.getElementById('product-image-2'),
    document.getElementById('product-image-3'),
    document.getElementById('product-image-4'),
    document.getElementById('product-image-5')
];
const imagePreviewContainer = document.getElementById('image-preview-container');
const productVideoUrlInput = document.getElementById('product-video-url');
const productFeaturedCheckbox = document.getElementById('product-featured');
const addProductButton = document.getElementById('add-product-button');
const productList = document.getElementById('product-list');

const orderList = document.getElementById('order-list');

const analyticsTimeframeSelect = document.getElementById('analytics-timeframe');
const totalProductsMetric = document.getElementById('total-products-metric');
const totalOrdersMetric = document.getElementById('total-orders-metric');
const pendingOrdersMetric = document.getElementById('pending-orders-metric');
const totalRevenueMetric = document.getElementById('total-revenue-metric');
const totalSalesSummary = document.getElementById('total-sales-summary');
const totalOrdersSummary = document.getElementById('total-orders-summary');
const avgRatingSummary = document.getElementById('avg-rating-summary');
const winnerProductName = document.getElementById('winner-product-name');
const winnerRatingInfo = document.getElementById('winner-rating-info');
const winnerOrdersInfo = document.getElementById('winner-orders-info');
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');
const productComparisonChartCanvas = document.getElementById('productComparisonChart');

// Chart instance
let productComparisonChart;

// Global data stores
let allProducts = {};
let allOrders = {};
let allRatings = {};
// Store File objects for new uploads and URLs for existing images
let currentProductImageFiles = [null, null, null, null, null]; 

// Define all possible categories
const allCategories = [
    "Fabric", "Organic", "Other Brands", "Other Products", "Perfumes", "Tools",
    "electronics", "clothing", "books", "home", "beauty", "toys", "sports"
];

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


// --- Firebase Authentication ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, display admin dashboard
        authSection.style.display = 'none';
        adminDashboard.style.display = 'block';
        loadAdminData();
    } else {
        // User is signed out, display login form
        authSection.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
});

loginButton.addEventListener('click', async () => {
    const email = adminEmailInput.value;
    const password = adminPasswordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert("Logged in successfully!", "Success");
    } catch (error) {
        console.error("Login Error:", error);
        showAlert(`Login Failed: ${error.message}`, "Error");
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showAlert("Logged out successfully!", "Success");
    } catch (error) {
        console.error("Logout Error:", error);
        showAlert(`Logout Failed: ${error.message}`, "Error");
    }
});

// --- Product Management ---
function populateCategorySelect() {
    productCategorySelect.innerHTML = '<option value="">Select a Category</option>';
    allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        productCategorySelect.appendChild(option);
    });
}

// Event listener for all product image inputs
productImageInputs.forEach((input, index) => {
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            currentProductImageFiles[index] = file; // Store the File object
        } else {
            currentProductImageFiles[index] = null; // Clear if no file selected
        }
        renderImagePreviews();
    });
});

// Function to render image previews based on currentProductImageFiles
function renderImagePreviews() {
    imagePreviewContainer.innerHTML = ''; // Clear existing previews
    currentProductImageFiles.forEach((fileOrUrl, index) => {
        if (fileOrUrl) {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'image-preview';
            const imageUrl = (typeof fileOrUrl === 'string') ? fileOrUrl : URL.createObjectURL(fileOrUrl);
            previewDiv.innerHTML = `
                <img src="${imageUrl}" alt="Image Preview">
                <button class="remove-image-btn" data-index="${index}">×</button>
            `;
            imagePreviewContainer.appendChild(previewDiv);
        }
    });
}

imagePreviewContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-image-btn')) {
        const indexToRemove = parseInt(event.target.dataset.index);
        currentProductImageFiles[indexToRemove] = null; // Clear the specific image slot
        productImageInputs[indexToRemove].value = ''; // Clear the corresponding file input
        renderImagePreviews(); // Re-render previews
    }
});


addProductButton.addEventListener('click', async () => {
    const title = productTitleInput.value;
    const description = productDescriptionInput.value;
    const price = parseFloat(productPriceInput.value);
    const stock = parseInt(productStockInput.value);
    const brand = productBrandInput.value;
    const category = productCategorySelect.value;
    const videoUrl = productVideoUrlInput.value;
    const featured = productFeaturedCheckbox.checked;

    if (!title || !description || isNaN(price) || isNaN(stock) || !brand || !category) {
        showAlert("Please fill all product fields correctly.", "Validation Error");
        return;
    }

    let imageUrls = [];
    // Iterate through currentProductImageFiles (which can contain File objects or URLs)
    for (let i = 0; i < currentProductImageFiles.length; i++) {
        const fileOrUrl = currentProductImageFiles[i];
        if (fileOrUrl) {
            if (typeof fileOrUrl === 'string') {
                imageUrls.push(fileOrUrl); // It's an existing URL, just add it
            } else {
                // It's a new File object, upload it
                const imageRef = storageRef(storage, `product_images/${Date.now()}_${fileOrUrl.name}`);
                await uploadBytes(imageRef, fileOrUrl);
                const downloadURL = await getDownloadURL(imageRef);
                imageUrls.push(downloadURL);
            }
        }
    }
    console.log("Final Image URLs to save:", imageUrls); // Debugging: Check URLs before saving

    const productId = addProductButton.dataset.productId || push(ref(database, 'products/')).key; // Use existing ID for edit, new for add

    const productData = {
        id: productId,
        title,
        description,
        price,
        stock,
        brand,
        category,
        imageUrls: imageUrls, // Save the array of URLs
        videoUrl,
        featured,
        createdAt: serverTimestamp()
    };

    try {
        await set(ref(database, `products/${productId}`), productData);
        showAlert("Product saved successfully!", "Success");
        clearProductForm();
        loadProducts(); // Refresh list
    } catch (error) {
        console.error("Error saving product:", error);
        showAlert(`Failed to save product: ${error.message}`, "Error");
    }
});

function clearProductForm() {
    productTitleInput.value = '';
    productDescriptionInput.value = '';
    productPriceInput.value = '';
    productStockInput.value = '';
    productBrandInput.value = '';
    productCategorySelect.value = '';
    productVideoUrlInput.value = '';
    productFeaturedCheckbox.checked = false;
    addProductButton.textContent = 'Add Product';
    addProductButton.dataset.productId = ''; // Clear product ID for next add operation

    // Clear all image inputs and previews
    productImageInputs.forEach(input => input.value = '');
    currentProductImageFiles = [null, null, null, null, null];
    imagePreviewContainer.innerHTML = '';
}

function loadProducts() {
    const productsRef = ref(database, 'products/');
    onValue(productsRef, (snapshot) => {
        allProducts = {};
        productList.innerHTML = '';
        if (!snapshot.exists()) {
            productList.innerHTML = '<p>No products added yet.</p>';
            updateDashboardMetrics();
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            allProducts[product.id] = product;
            displayProductListItem(product);
        });
        updateDashboardMetrics();
        populateComparisonSelects();
    }, (error) => {
        console.error("Error loading products:", error);
        showAlert("Failed to load products.", "Error");
    });
}

function displayProductListItem(product) {
    const listItem = document.createElement('div');
    listItem.className = 'product-list-item';
    listItem.innerHTML = `
        <div class="product-info">
            <h4>${product.title}</h4>
            <p>Price: PKR ${product.price.toLocaleString()}</p>
            <p>Stock: ${product.stock}</p>
            <p>Category: ${product.category}</p>
        </div>
        <div class="product-actions">
            <button class="admin-button info edit-product-btn" data-product-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
            <button class="admin-button error delete-product-btn" data-product-id="${product.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
    `;
    productList.appendChild(listItem);
}

productList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('edit-product-btn')) {
        const productId = event.target.dataset.productId;
        loadProductForEdit(productId);
    } else if (event.target.classList.contains('delete-product-btn')) {
        const productId = event.target.dataset.productId;
        const confirmDelete = await showConfirm("Are you sure you want to delete this product?", "Confirm Delete", "Delete", "Cancel", "danger");
        if (confirmDelete) {
            deleteProduct(productId);
        }
    }
});

function loadProductForEdit(productId) {
    const product = allProducts[productId];
    if (product) {
        productTitleInput.value = product.title;
        productDescriptionInput.value = product.description;
        productPriceInput.value = product.price;
        productStockInput.value = product.stock;
        productBrandInput.value = product.brand;
        productCategorySelect.value = product.category;
        productVideoUrlInput.value = product.videoUrl || '';
        productFeaturedCheckbox.checked = product.featured || false;
        addProductButton.textContent = 'Update Product';
        addProductButton.dataset.productId = productId; // Set ID for update

        // Clear and populate image inputs/previews
        productImageInputs.forEach(input => input.value = ''); // Clear file inputs
        currentProductImageFiles = [null, null, null, null, null]; // Reset stored files/URLs

        if (product.imageUrls && Array.isArray(product.imageUrls)) {
            product.imageUrls.forEach((url, index) => {
                if (index < 5) { // Only load up to 5 images
                    currentProductImageFiles[index] = url; // Store URL for existing images
                }
            });
        }
        renderImagePreviews(); // Render previews based on currentProductImageFiles
    } else {
        showAlert("Product not found for editing.", "Error");
    }
}

async function deleteProduct(productId) {
    try {
        await remove(ref(database, `products/${productId}`));
        showAlert("Product deleted successfully!", "Success");
        loadProducts(); // Refresh list
    } catch (error) {
        console.error("Error deleting product:", error);
        showAlert(`Failed to delete product: ${error.message}`, "Error");
    }
}

// --- Order Management ---
function loadOrders() {
    const ordersRef = ref(database, 'orders/');
    onValue(ordersRef, (snapshot) => {
        allOrders = {};
        orderList.innerHTML = '';
        if (!snapshot.exists()) {
            orderList.innerHTML = '<p>No orders received yet.</p>';
            updateDashboardMetrics();
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            order.id = childSnapshot.key; // Store the Firebase key as order ID
            allOrders[order.id] = order;
            displayOrderListItem(order);
        });
        updateDashboardMetrics();
    }, (error) => {
        console.error("Error loading orders:", error);
        showAlert("Failed to load orders.", "Error");
    });
}

function displayOrderListItem(order) {
    const listItem = document.createElement('div');
    listItem.className = 'order-list-item';
    const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
    listItem.innerHTML = `
        <div class="order-info">
            <h4>Order ID: ${order.id}</h4>
            <p>Product: ${order.productTitle} (x${order.quantity})</p>
            <p>Total: PKR ${order.totalPrice.toLocaleString()}</p>
            <p>Date: ${orderDate}</p>
            <p>User: ${order.userEmail || order.userId}</p>
        </div>
        <div class="order-actions">
            <select class="order-status-select" data-order-id="${order.id}">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
            <button class="admin-button error delete-order-btn" data-order-id="${order.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
    `;
    orderList.appendChild(listItem);
}

orderList.addEventListener('change', async (event) => {
    if (event.target.classList.contains('order-status-select')) {
        const orderId = event.target.dataset.orderId;
        const newStatus = event.target.value;
        await updateOrderStatus(orderId, newStatus);
    }
});

orderList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-order-btn')) {
        const orderId = event.target.dataset.orderId;
        const confirmDelete = await showConfirm("Are you sure you want to delete this order?", "Confirm Delete", "Delete", "Cancel", "danger");
        if (confirmDelete) {
            deleteOrder(orderId);
        }
    }
});

async function updateOrderStatus(orderId, status) {
    try {
        await update(ref(database, `orders/${orderId}`), { status: status });
        showAlert(`Order ${orderId} status updated to ${status}!`, "Success");
    } catch (error) {
        console.error("Error updating order status:", error);
        showAlert(`Failed to update order status: ${error.message}`, "Error");
    }
}

async function deleteOrder(orderId) {
    try {
        await remove(ref(database, `orders/${orderId}`));
        showAlert("Order deleted successfully!", "Success");
        loadOrders(); // Refresh list
    } catch (error) {
        console.error("Error deleting order:", error);
        showAlert(`Failed to delete order: ${error.message}`, "Error");
    }
}

// --- Rating Management ---
function loadRatings() {
    const ratingsRef = ref(database, 'productRatings/');
    onValue(ratingsRef, (snapshot) => {
        allRatings = {};
        snapshot.forEach((productRatingSnapshot) => {
            const productId = productRatingSnapshot.key;
            allRatings[productId] = {};
            productRatingSnapshot.forEach((userRatingSnapshot) => {
                const userId = userRatingSnapshot.key;
                allRatings[productId][userId] = userRatingSnapshot.val();
            });
        });
        updateDashboardMetrics(); // Recalculate avg rating
        updateAnalytics(); // Update analytics charts
    }, (error) => {
        console.error("Error loading ratings:", error);
    });
}

// --- Analytics ---
analyticsTimeframeSelect.addEventListener('change', updateAnalytics);
compareProductsBtn.addEventListener('click', updateAnalytics);

function updateDashboardMetrics() {
    const totalProducts = Object.keys(allProducts).length;
    totalProductsMetric.textContent = totalProducts;

    let totalOrders = 0;
    let pendingOrders = 0;
    let totalRevenue = 0;

    for (const orderId in allOrders) {
        const order = allOrders[orderId];
        totalOrders++;
        if (order.status === 'pending') {
            pendingOrders++;
        }
        totalRevenue += order.totalPrice || 0;
    }

    totalOrdersMetric.textContent = totalOrders;
    pendingOrdersMetric.textContent = pendingOrders;
    totalRevenueMetric.textContent = `PKR ${totalRevenue.toLocaleString()}`;

    updateAnalytics(); // Ensure analytics are updated with latest data
}

function updateAnalytics() {
    const timeframe = analyticsTimeframeSelect.value;
    const now = Date.now();
    let cutoffDate = 0;

    if (timeframe === 'week') {
        cutoffDate = now - (7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'month') {
        cutoffDate = now - (30 * 24 * 60 * 60 * 1000);
    }

    let currentTotalSales = 0;
    let currentTotalOrders = 0;
    let productSales = {}; // {productId: count}
    let productRatingsCount = {}; // {productId: {sum: 0, count: 0}}

    for (const orderId in allOrders) {
        const order = allOrders[orderId];
        const orderTimestamp = order.orderDate ? new Date(order.orderDate).getTime() : 0;
        if (timeframe === 'all' || orderTimestamp >= cutoffDate) {
            currentTotalSales += order.totalPrice || 0;
            currentTotalOrders++;
            productSales[order.productId] = (productSales[order.productId] || 0) + order.quantity;
        }
    }

    for (const productId in allRatings) {
        for (const userId in allRatings[productId]) {
            const rating = allRatings[productId][userId];
            const ratingTimestamp = rating.timestamp ? new Date(rating.timestamp).getTime() : 0;
            if (timeframe === 'all' || ratingTimestamp >= cutoffDate) {
                if (!productRatingsCount[productId]) {
                    productRatingsCount[productId] = { sum: 0, count: 0 };
                }
                productRatingsCount[productId].sum += rating.rating;
                productRatingsCount[productId].count++;
            }
        }
    }

    totalSalesSummary.textContent = currentTotalSales.toLocaleString();
    totalOrdersSummary.textContent = currentTotalOrders;

    let overallAvgRating = 0;
    let totalRatingSum = 0;
    let totalRatingCount = 0;

    for (const productId in productRatingsCount) {
        totalRatingSum += productRatingsCount[productId].sum;
        totalRatingCount += productRatingsCount[productId].count;
    }

    if (totalRatingCount > 0) {
        overallAvgRating = (totalRatingSum / totalRatingCount).toFixed(1);
    }
    avgRatingSummary.textContent = overallAvgRating !== 0 ? `${overallAvgRating}/7` : 'N/A';


    // Determine top product
    let bestProduct = null;
    let maxSales = 0;
    for (const productId in productSales) {
        if (productSales[productId] > maxSales) {
            maxSales = productSales[productId];
            bestProduct = allProducts[productId];
        }
    }

    if (bestProduct) {
        winnerProductName.textContent = bestProduct.title;
        const currentProductRatingData = productRatingsCount[bestProduct.id];
        if (currentProductRatingData && currentProductRatingData.count > 0) {
            const avgRating = (currentProductRatingData.sum / currentProductRatingData.count).toFixed(1);
            winnerRatingInfo.textContent = `Rating: ${avgRating}/7 (${currentProductRatingData.count} reviews)`;
        } else {
            winnerRatingInfo.textContent = `No ratings in selected timeframe.`;
        }

        const ordersCount = productSales[bestProduct.id] || 0;
        winnerOrdersInfo.textContent = `Orders: ${ordersCount}`;

    } else {
        winnerProductName.textContent = 'N/A';
        winnerRatingInfo.textContent = 'No data for selected timeframe.';
        winnerOrdersInfo.textContent = 'No data for selected timeframe.';
    }

    updateProductComparisonChart();
}

function populateComparisonSelects() {
    compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';
    Object.values(allProducts).forEach(product => {
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

function updateProductComparisonChart() {
    const productId1 = compareProduct1Select.value;
    const productId2 = compareProduct2Select.value;

    const product1 = allProducts[productId1];
    const product2 = allProducts[productId2];

    const labels = ['Price', 'Stock', 'Average Rating'];
    const data1 = [];
    const data2 = [];

    if (product1) {
        data1.push(product1.price || 0);
        data1.push(product1.stock || 0);
        const p1Ratings = allRatings[productId1];
        let p1AvgRating = 0;
        if (p1Ratings) {
            let sum = 0;
            let count = 0;
            for (const userId in p1Ratings) {
                sum += p1Ratings[userId].rating;
                count++;
            }
            if (count > 0) p1AvgRating = (sum / count).toFixed(1);
        }
        data1.push(p1AvgRating);
    } else {
        data1.push(0, 0, 0);
    }

    if (product2) {
        data2.push(product2.price || 0);
        data2.push(product2.stock || 0);
        const p2Ratings = allRatings[productId2];
        let p2AvgRating = 0;
        if (p2Ratings) {
            let sum = 0;
            let count = 0;
            for (const userId in p2Ratings) {
                sum += p2Ratings[userId].rating;
                count++;
            }
            if (count > 0) p2AvgRating = (sum / count).toFixed(1);
        }
        data2.push(p2AvgRating);
    } else {
        data2.push(0, 0, 0);
    }

    const datasets = [];
    if (product1) {
        datasets.push({
            label: product1.title,
            data: data1,
            backgroundColor: 'rgba(0, 188, 212, 0.6)',
            // Fix: Use string literal for borderColor
            borderColor: '#17a2b8', // Corresponds to --color-cyan-primary
            borderWidth: 1
        });
    }
    if (product2) {
        datasets.push({
            label: product2.title,
            data: data2,
            backgroundColor: 'rgba(233, 30, 99, 0.6)',
            // Fix: Use string literal for borderColor
            borderColor: '#e83e8c', // Corresponds to --color-pink-primary
            borderWidth: 1
        });
    }

    if (productComparisonChart) {
        productComparisonChart.destroy();
    }

    productComparisonChart = new Chart(productComparisonChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
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


// --- Initial Data Load ---
function loadAdminData() {
    populateCategorySelect();
    loadProducts();
    loadOrders();
    loadRatings(); // Load ratings for analytics
}


document.addEventListener('DOMContentLoaded', () => {
    // Initial check for auth state is handled by onAuthStateChanged
    // No need to call loadAdminData here, as onAuthStateChanged will trigger it
});
