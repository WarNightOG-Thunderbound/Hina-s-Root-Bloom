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
  measurementId: "G-CM67R2L60J" // ADDED: Measurement ID for Firebase Analytics
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
const comparisonMetricSelect = document.getElementById('comparison-metric'); // NEW: Get the metric select dropdown

// Chart instance
let productComparisonChart;

// Global data stores
let allProducts = {};
let allOrders = {};
let allRatings = {}; // NEW: Initialize allRatings
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
    imagePreviewContainer.innerHTML = '';
    currentProductImageFiles.forEach((file, index) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.classList.add('image-preview-item');
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Image Preview">
                    <button class="remove-image-btn" data-index="${index}">&times;</button>
                `;
                imagePreviewContainer.appendChild(previewItem);

                previewItem.querySelector('.remove-image-btn').addEventListener('click', (event) => {
                    const idxToRemove = parseInt(event.currentTarget.dataset.index);
                    currentProductImageFiles[idxToRemove] = null; // Clear the file
                    productImageInputs[idxToRemove].value = ''; // Clear the input
                    renderImagePreviews(); // Re-render previews
                });
            };
            reader.readAsDataURL(file);
        }
    });
}


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
        showAlert('Please fill in all required product fields.', 'Validation Error');
        return;
    }

    // Check if at least one image file is selected for new product
    const hasImageFile = currentProductImageFiles.some(file => file !== null);
    const isEditing = addProductButton.dataset.editId;

    if (!isEditing && !hasImageFile) {
        showAlert('Please select at least one image file for the product.', 'Image Required');
        return;
    }

    try {
        let imageUrls = [];
        // Upload new images
        for (const file of currentProductImageFiles) {
            if (file) {
                const imageRef = storageRef(storage, `product_images/${file.name}_${Date.now()}`);
                await uploadBytes(imageRef, file);
                const downloadURL = await getDownloadURL(imageRef);
                imageUrls.push(downloadURL);
            }
        }

        const productData = {
            title,
            description,
            price,
            stock,
            brand,
            category,
            videoUrl: videoUrl || null,
            featured,
            imageUrl: imageUrls[0] || null, // Store the first image URL as the main one
            allImageUrls: imageUrls // Store all image URLs
        };

        if (isEditing) {
            // Update existing product
            const productId = isEditing;
            const productRef = ref(database, `products/${productId}`);
            await update(productRef, productData);
            showAlert('Product Updated!', 'Product details have been successfully updated.');
            addProductButton.textContent = 'Add Product';
            addProductButton.dataset.editId = '';
        } else {
            // Add new product
            await push(ref(database, 'products'), productData);
            showAlert('Product Added!', 'New product has been successfully added.');
        }

        // Clear form
        productTitleInput.value = '';
        productDescriptionInput.value = '';
        productPriceInput.value = '';
        productStockInput.value = '';
        productBrandInput.value = '';
        productCategorySelect.value = '';
        productVideoUrlInput.value = '';
        productFeaturedCheckbox.checked = false;
        productImageInputs.forEach(input => input.value = ''); // Clear file inputs
        currentProductImageFiles = [null, null, null, null, null]; // Reset stored files
        renderImagePreviews(); // Clear previews

    } catch (error) {
        console.error("Error adding/updating product:", error);
        showAlert(`Error: ${error.message}`, "Operation Failed");
    }
});


function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        productList.innerHTML = '';
        allProducts = {}; // Clear global products object
        snapshot.forEach((childSnapshot) => {
            const product = { id: childSnapshot.key, ...childSnapshot.val() };
            allProducts[product.id] = product; // Store in global object
            
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            productItem.innerHTML = `
                <div class="product-item-details">
                    <h4>${product.title}</h4>
                    <p>Price: PKR ${product.price.toFixed(2)} | Stock: ${product.stock} | Category: ${product.category}</p>
                </div>
                <div class="product-item-actions">
                    <button class="admin-button info edit-product-btn" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="admin-button error delete-product-btn" data-id="${product.id}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            productList.appendChild(productItem);
        });
        populateCompareProductSelects(); // Update comparison selects whenever products load
        updateAnalytics(); // Update analytics metrics
    }, (error) => {
        console.error("Error loading products:", error);
        showAlert('Error', 'Failed to load products.');
    });
}

productList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('edit-product-btn')) {
        const productId = event.target.dataset.id;
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

            // Populate image previews for editing
            currentProductImageFiles = [null, null, null, null, null]; // Reset files
            imagePreviewContainer.innerHTML = ''; // Clear existing previews
            if (product.allImageUrls && product.allImageUrls.length > 0) {
                product.allImageUrls.forEach((url, index) => {
                    if (url && index < 5) {
                        const previewItem = document.createElement('div');
                        previewItem.classList.add('image-preview-item');
                        previewItem.innerHTML = `
                            <img src="${url}" alt="Image Preview">
                            <button class="remove-image-btn" data-index="${index}">&times;</button>
                        `;
                        imagePreviewContainer.appendChild(previewItem);
                        // Store existing URLs as 'files' for rendering, but mark them as not needing re-upload
                        currentProductImageFiles[index] = { name: url.split('/').pop(), type: 'url', url: url }; 
                        
                        previewItem.querySelector('.remove-image-btn').addEventListener('click', (event) => {
                            const idxToRemove = parseInt(event.currentTarget.dataset.index);
                            currentProductImageFiles[idxToRemove] = null; // Clear the entry
                            productImageInputs[idxToRemove].value = ''; // Clear associated file input
                            renderImagePreviews(); // Re-render to show removal
                        });
                    }
                });
            }


            addProductButton.textContent = 'Update Product';
            addProductButton.dataset.editId = productId;
        }
    } else if (event.target.classList.contains('delete-product-btn')) {
        const productId = event.target.dataset.id;
        const confirmDelete = await showConfirm('Are you sure you want to delete this product?', 'Confirm Delete', 'Delete', 'Cancel', 'danger');
        if (confirmDelete) {
            try {
                await remove(ref(database, `products/${productId}`));
                showAlert('Product Deleted!', 'Product has been successfully deleted.');
            } catch (error) {
                console.error("Error deleting product:", error);
                showAlert(`Error: ${error.message}`, "Deletion Failed");
            }
        }
    }
});


// --- Order Management ---
function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        orderList.innerHTML = '';
        allOrders = {}; // Clear global orders object
        snapshot.forEach((childSnapshot) => {
            const order = { id: childSnapshot.key, ...childSnapshot.val() };
            allOrders[order.id] = order; // Store in global object

            const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
            const orderStatusClass = order.status === 'pending' ? 'warning' : order.status === 'completed' ? 'success' : 'error';

            let itemsHtml = order.items.map(item => `
                <li>${item.title} (x${item.quantity}) - PKR ${(item.price * item.quantity).toFixed(2)}</li>
            `).join('');

            const orderItem = document.createElement('div');
            orderItem.classList.add('order-item');
            orderItem.innerHTML = `
                <div class="order-item-details">
                    <h4>Order ID: ${order.id}</h4>
                    <p>Customer: ${order.userName} (${order.userEmail})</p>
                    <p>Total: PKR ${order.total.toFixed(2)}</p>
                    <p>Date: ${orderDate}</p>
                    <p>Status: <span class="order-status ${orderStatusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
                    <ul>${itemsHtml}</ul>
                </div>
                <div class="order-item-actions">
                    <button class="admin-button info view-order-btn" data-id="${order.id}"><i class="fas fa-eye"></i> View</button>
                    <button class="admin-button primary complete-order-btn" data-id="${order.id}" ${order.status === 'completed' ? 'disabled' : ''}><i class="fas fa-check"></i> Complete</button>
                    <button class="admin-button error cancel-order-btn" data-id="${order.id}" ${order.status === 'cancelled' ? 'disabled' : ''}><i class="fas fa-times"></i> Cancel</button>
                </div>
            `;
            orderList.appendChild(orderItem);
        });
        updateAnalytics(); // Update analytics metrics
    }, (error) => {
        console.error("Error loading orders:", error);
        showAlert('Error', 'Failed to load orders.');
    });
}

orderList.addEventListener('click', async (event) => {
    const orderId = event.target.dataset.id;
    if (event.target.classList.contains('complete-order-btn')) {
        const confirmComplete = await showConfirm('Mark this order as completed?', 'Confirm Action');
        if (confirmComplete) {
            try {
                await update(ref(database, `orders/${orderId}`), { status: 'completed' });
                showAlert('Order Completed!', 'Order status updated to completed.');
            } catch (error) {
                console.error("Error completing order:", error);
                showAlert(`Error: ${error.message}`, "Operation Failed");
            }
        }
    } else if (event.target.classList.contains('cancel-order-btn')) {
        const confirmCancel = await showConfirm('Cancel this order?', 'Confirm Action', 'Yes, Cancel', 'No', 'danger');
        if (confirmCancel) {
            try {
                await update(ref(database, `orders/${orderId}`), { status: 'cancelled' });
                showAlert('Order Cancelled!', 'Order status updated to cancelled.');
            } catch (error) {
                console.error("Error cancelling order:", error);
                showAlert(`Error: ${error.message}`, "Operation Failed");
            }
        }
    }
    // Add logic for 'view-order-btn' if a detailed modal is needed
});

// --- Analytics ---
function loadRatings() {
    const ratingsRef = ref(database, 'ratings');
    onValue(ratingsRef, (snapshot) => {
        allRatings = {}; // Clear previous ratings
        snapshot.forEach((childSnapshot) => {
            const rating = childSnapshot.val();
            if (!allRatings[rating.productId]) {
                allRatings[rating.productId] = [];
            }
            allRatings[rating.productId].push(rating.rating);
        });
        updateAnalytics(); // Update analytics metrics after ratings load
    }, {
        onlyOnce: false // Listen for real-time updates
    });
}

function calculateAverageRatingForProduct(productId) {
    if (allRatings[productId] && allRatings[productId].length > 0) {
        const sum = allRatings[productId].reduce((a, b) => a + b, 0);
        return (sum / allRatings[productId].length);
    }
    return 0; // No ratings yet
}


function updateAnalytics() {
    const timeframe = analyticsTimeframeSelect.value;
    const now = Date.now();
    let startDate;

    if (timeframe === 'last-7-days') {
        startDate = now - (7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'last-30-days') {
        startDate = now - (30 * 24 * 60 * 60 * 1000);
    } else { // all-time
        startDate = 0; // Epoch for all time
    }

    // Products Metric (always all time as it's static product count)
    totalProductsMetric.textContent = Object.keys(allProducts).length;

    // Filter orders by timeframe
    let filteredOrders = Object.values(allOrders).filter(order => {
        const orderTimestamp = order.orderDate; // Firebase serverTimestamp() is milliseconds since epoch
        return orderTimestamp >= startDate;
    });

    let totalOrdersCount = filteredOrders.length;
    let pendingOrdersCount = filteredOrders.filter(order => order.status === 'pending').length;
    let totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);

    totalOrdersMetric.textContent = totalOrdersCount;
    pendingOrdersMetric.textContent = pendingOrdersCount;
    totalRevenueMetric.textContent = `PKR ${totalRevenue.toFixed(2)}`;

    // Overall Summaries
    totalSalesSummary.textContent = filteredOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    totalOrdersSummary.textContent = totalOrdersCount;

    // Calculate overall average rating
    let totalAllRatingsSum = 0;
    let totalAllRatingsCount = 0;
    for (const productId in allRatings) {
        totalAllRatingsSum += allRatings[productId].reduce((a, b) => a + b, 0);
        totalAllRatingsCount += allRatings[productId].length;
    }
    const overallAvgRating = totalAllRatingsCount > 0 ? (totalAllRatingsSum / totalAllRatingsCount).toFixed(2) : '0.00';
    avgRatingSummary.textContent = overallAvgRating;


    // Top Performing Product
    let productSalesCount = {};
    let productAverageRatings = {};
    for (const order of filteredOrders) {
        for (const item of order.items) {
            productSalesCount[item.productId] = (productSalesCount[item.productId] || 0) + item.quantity;
        }
    }

    for (const productId in allProducts) {
        productAverageRatings[productId] = calculateAverageRatingForProduct(productId);
    }

    let topProduct = null;
    let maxOrders = 0;
    let bestRating = 0;

    for (const productId in allProducts) {
        const currentSales = productSalesCount[productId] || 0;
        const currentRating = productAverageRatings[productId] || 0;

        if (currentSales > maxOrders) {
            maxOrders = currentSales;
            topProduct = allProducts[productId];
            bestRating = currentRating;
        } else if (currentSales === maxOrders && currentSales > 0 && currentRating > bestRating) {
            // If sales are tied, pick the one with higher rating
            topProduct = allProducts[productId];
            bestRating = currentRating;
        }
    }

    if (topProduct) {
        winnerProductName.textContent = topProduct.title;
        winnerRatingInfo.textContent = (productAverageRatings[topProduct.id] || 0).toFixed(2);
        winnerOrdersInfo.textContent = maxOrders;
    } else {
        winnerProductName.textContent = 'N/A';
        winnerRatingInfo.textContent = '0.00';
        winnerOrdersInfo.textContent = '0';
    }
}

analyticsTimeframeSelect.addEventListener('change', updateAnalytics);

// --- Product Comparison ---
function populateCompareProductSelects() {
    compareProduct1Select.innerHTML = '<option value="">Select Product</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product</option>';

    for (const productId in allProducts) {
        const product = allProducts[productId];
        const option1 = document.createElement('option');
        option1.value = product.id;
        option1.textContent = product.title;
        compareProduct1Select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = product.id;
        option2.textContent = product.title;
        compareProduct2Select.appendChild(option2);
    }
}

// Helper function to get average rating for comparison chart
function getAverageRating(productId) {
    if (allRatings[productId] && allRatings[productId].length > 0) {
        const sum = allRatings[productId].reduce((a, b) => a + b, 0);
        return (sum / allRatings[productId].length); // Return as number
    }
    return 0; // No ratings yet
}


function compareProducts() {
    const product1Id = compareProduct1Select.value;
    const product2Id = compareProduct2Select.value;
    const comparisonMetric = comparisonMetricSelect.value; // Get the selected metric

    const product1 = allProducts[product1Id];
    const product2 = allProducts[product2Id];

    if (!product1 && !product2) {
        showAlert('Error', 'Please select at least one product to compare.');
        return;
    }

    let labels = [];
    let data1 = [];
    let data2 = [];

    // Define which property to use based on the selected metric
    const getMetricValue = (product, metric) => {
        if (!product) return 0; // Handle cases where product might be null
        if (metric === 'ratings') {
            return parseFloat(getAverageRating(product.id));
        } else if (metric === 'price') {
            return parseFloat(product.price || 0);
        } else if (metric === 'stock') {
            return parseInt(product.stock || 0);
        }
        return 0; // Default or error case
    };

    // Populate labels and data based on the selected metric
    if (comparisonMetric === 'price') {
        labels.push('Price');
    } else if (comparisonMetric === 'stock') {
        labels.push('Stock');
    } else if (comparisonMetric === 'ratings') {
        labels.push('Average Rating');
    } else {
        showAlert('Error', 'Invalid comparison metric selected.');
        return;
    }

    if (product1) {
        data1.push(getMetricValue(product1, comparisonMetric));
    }
    if (product2) {
        data2.push(getMetricValue(product2, comparisonMetric));
    }

    let datasets = [];

    if (product1) {
        datasets.push({
            label: product1.title,
            data: data1,
            backgroundColor: 'rgba(0, 188, 212, 0.6)',
            borderColor: '#17a2b8', // Corresponds to --color-cyan-primary
            borderWidth: 1
        });
    }
    if (product2) {
        datasets.push({
            label: product2.title,
            data: data2,
            backgroundColor: 'rgba(233, 30, 99, 0.6)',
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
    loadProducts(); // This will also trigger populateCompareProductSelects and updateAnalytics
    loadOrders();   // This will also trigger updateAnalytics
    loadRatings();  // This will also trigger updateAnalytics
}


document.addEventListener('DOMContentLoaded', () => {
    // Initial check for auth state is handled by onAuthStateChanged
    // No need to call loadAdminData here, as onAuthStateChanged will trigger it

    document.getElementById('compare-products-btn').addEventListener('click', compareProducts);
    analyticsTimeframeSelect.addEventListener('change', updateAnalytics); // Ensure this is active
});
