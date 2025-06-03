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
  appId: "1:967448486557:web:2c89223921f6479010495f" // Ensure this matches your Firebase Console web app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize analytics early
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);


// --- Utility Functions ---

// Custom Alert/Confirm Modal
function showCustomModal(title, message, type = 'alert', onConfirm = null) {
    const modal = document.getElementById('custom-alert-modal');
    document.getElementById('custom-modal-title').textContent = title;
    document.getElementById('custom-modal-message').textContent = message;

    const okBtn = document.getElementById('custom-modal-ok-btn');
    const cancelBtn = document.getElementById('custom-modal-cancel-btn');

    modal.style.display = 'flex'; // Use flex to center

    okBtn.onclick = () => {
        modal.style.display = 'none';
        if (type === 'confirm' && onConfirm) {
            onConfirm(true);
        }
    };

    if (type === 'confirm') {
        cancelBtn.style.display = 'inline-block';
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            if (onConfirm) {
                onConfirm(false);
            }
        };
    } else {
        cancelBtn.style.display = 'none';
    }
}


// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginErrorMessage = document.getElementById('login-error-message');
const logoutButton = document.getElementById('logout-btn');

// Admin Controls
const addProductForm = document.getElementById('add-product-form');
const editProductForm = document.getElementById('edit-product-form');
const addCategoryForm = document.getElementById('add-category-form');
const addProductImageInput = document.getElementById('add-product-image');
const addProductVideoInput = document.getElementById('add-product-video');
const editProductImageInput = document.getElementById('edit-product-image');
const editProductVideoInput = document.getElementById('edit-product-video');

const productListDiv = document.getElementById('product-list');
const categoryListDiv = document.getElementById('category-list');
const orderListDiv = document.getElementById('order-list');

const editProductIdInput = document.getElementById('edit-product-id');
const editProductTitleInput = document.getElementById('edit-product-title');
const editProductDescriptionInput = document.getElementById('edit-product-description');
const editProductPriceInput = document.getElementById('edit-product-price');
const editProductCategorySelect = document.getElementById('edit-product-category');
const editProductStockInput = document.getElementById('edit-product-stock');
const editProductFeaturedCheckbox = document.getElementById('edit-product-featured');
const editProductCurrentImageUrl = document.getElementById('edit-product-current-image-url');
const editProductCurrentVideoUrl = document.getElementById('edit-product-current-video-url');


// Product Comparison Chart
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');
const productComparisonChartCanvas = document.getElementById('productComparisonChart');
let productComparisonChart; // To store the Chart.js instance

// Analytics Section
const productAnalyticsSelect = document.getElementById('product-analytics-select');
const productSalesChartCanvas = document.getElementById('productSalesChart');
const categorySalesChartCanvas = document.getElementById('categorySalesChart');
const salesOverTimeChartCanvas = document.getElementById('salesOverTimeChart');
const popularProductsChartCanvas = document.getElementById('popularProductsChart');

let productSalesChart;
let categorySalesChart;
let salesOverTimeChart;
let popularProductsChart;

// Variables to hold data
let allProducts = {};
let allCategories = {};
let allOrders = {};
let allRatings = {}; // Store ratings data

// --- Authentication ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, check if they are admin
        const adminRef = ref(database, `admins/${user.uid}`);
        onValue(adminRef, (snapshot) => {
            if (snapshot.exists()) {
                console.log('[Admin] User is admin. Logging in...');
                loginSection.style.display = 'none';
                adminSection.style.display = 'block';
                loadAdminData();
            } else {
                console.warn('[Admin] User is not an admin. Logging out.');
                signOut(auth);
                loginSection.style.display = 'flex'; // Use flex to center
                adminSection.style.display = 'none';
                showCustomModal('Access Denied', 'You do not have administrative privileges.', 'alert');
            }
        });
    } else {
        console.log('[Admin] User logged out or not authorized.');
        loginSection.style.display = 'flex'; // Use flex to center
        adminSection.style.display = 'none';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle UI update
    } catch (error) {
        console.error('Login Error:', error);
        loginErrorMessage.textContent = error.message;
        loginErrorMessage.style.display = 'block';
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('[Admin] User logged out.');
        // onAuthStateChanged will handle UI update
    } catch (error) {
        console.error('Logout Error:', error);
        showCustomModal('Logout Error', 'Failed to log out: ' + error.message, 'alert');
    }
});

// --- CRUD Operations - Categories ---
addCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const categoryName = document.getElementById('category-name').value;
    if (!categoryName) {
        showCustomModal('Error', 'Category name cannot be empty.', 'alert');
        return;
    }

    try {
        const categoriesRef = ref(database, 'categories');
        const newCategoryRef = push(categoriesRef); // Generate a unique key
        await set(newCategoryRef, { name: categoryName, timestamp: serverTimestamp() });
        showCustomModal('Success', 'Category added successfully!', 'alert');
        addCategoryForm.reset();
    } catch (error) {
        console.error('Error adding category:', error);
        showCustomModal('Error', 'Failed to add category: ' + error.message, 'alert');
    }
});

function populateCategorySelect() {
    const categorySelects = [
        document.getElementById('add-product-category'),
        document.getElementById('edit-product-category'),
        compareProduct1Select,
        compareProduct2Select
    ];

    categorySelects.forEach(select => {
        // Clear existing options, but keep the first "Select Category" if it exists
        const firstOption = select.querySelector('option[disabled][selected]');
        select.innerHTML = '';
        if (firstOption) {
            select.appendChild(firstOption);
        } else {
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "Select Category";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);
        }
    });


    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        allCategories = snapshot.val() || {};
        categorySelects.forEach(select => {
            // Keep first option
            const firstOption = select.querySelector('option[disabled][selected]');
            select.innerHTML = '';
            if(firstOption) select.appendChild(firstOption);

            for (let id in allCategories) {
                const category = allCategories[id];
                const option = document.createElement('option');
                option.value = id;
                option.textContent = category.name;
                select.appendChild(option);
            }
        });
        displayCategories();
    }, (error) => {
        console.error('Error loading categories:', error);
        showCustomModal('Error', 'Failed to load categories: ' + error.message, 'alert');
    });
}

function displayCategories() {
    categoryListDiv.innerHTML = '';
    for (let id in allCategories) {
        const category = allCategories[id];
        const categoryItem = document.createElement('div');
        categoryItem.className = 'list-item';
        categoryItem.innerHTML = `
            <span>${category.name}</span>
            <div class="actions">
                <button class="admin-button danger" onclick="deleteCategory('${id}')"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;
        categoryListDiv.appendChild(categoryItem);
    }
}

window.deleteCategory = async (id) => {
    showCustomModal('Confirm Delete', 'Are you sure you want to delete this category? This action cannot be undone.', 'confirm', async (confirmed) => {
        if (confirmed) {
            try {
                // Check if any products are associated with this category
                const productsWithCategory = Object.values(allProducts).filter(product => product.category === id);
                if (productsWithCategory.length > 0) {
                    showCustomModal('Error', 'Cannot delete category. Products are associated with this category. Please reassign or delete them first.', 'alert');
                    return;
                }

                await remove(ref(database, `categories/${id}`));
                showCustomModal('Success', 'Category deleted successfully!', 'alert');
            } catch (error) {
                console.error('Error deleting category:', error);
                showCustomModal('Error', 'Failed to delete category: ' + error.message, 'alert');
            }
        }
    });
};


// --- CRUD Operations - Products ---
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('add-product-title').value;
    const description = document.getElementById('add-product-description').value;
    const price = parseFloat(document.getElementById('add-product-price').value);
    const category = document.getElementById('add-product-category').value;
    const stock = parseInt(document.getElementById('add-product-stock').value);
    const imageFile = addProductImageInput.files[0];
    const videoFile = addProductVideoInput.files[0];
    const isFeatured = document.getElementById('add-product-featured').checked;

    if (!title || !description || isNaN(price) || !category || isNaN(stock) || !imageFile) {
        showCustomModal('Error', 'Please fill in all required product fields (Title, Description, Price, Category, Stock, Image).', 'alert');
        return;
    }

    try {
        // Upload image
        let imageUrl = '';
        if (imageFile) {
            const imageRef = storageRef(storage, `product_images/${Date.now()}_${imageFile.name}`);
            const imageSnapshot = await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(imageSnapshot.ref);
        }

        // Upload video (optional)
        let videoUrl = '';
        if (videoFile) {
            const videoRef = storageRef(storage, `product_videos/${Date.now()}_${videoFile.name}`);
            const videoSnapshot = await uploadBytes(videoRef, videoFile);
            videoUrl = await getDownloadURL(videoSnapshot.ref);
        }

        const productsRef = ref(database, 'products');
        const newProductRef = push(productsRef);
        await set(newProductRef, {
            title,
            description,
            price,
            category,
            stock,
            imageUrl,
            videoUrl,
            isFeatured,
            createdAt: serverTimestamp()
        });

        showCustomModal('Success', 'Product added successfully!', 'alert');
        addProductForm.reset();
        addProductImageInput.value = ''; // Clear file input
        addProductVideoInput.value = ''; // Clear file input
    } catch (error) {
        console.error('Error adding product:', error);
        showCustomModal('Error', 'Failed to add product: ' + error.message, 'alert');
    }
});

function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        allProducts = snapshot.val() || {};
        displayProducts();
        populateProductAnalyticsSelect(); // Update analytics select
        populateProductComparisonSelects(); // Update comparison selects
    }, (error) => {
        console.error('Error loading products:', error);
        showCustomModal('Error', 'Failed to load products: ' + error.message, 'alert');
    });
}

function displayProducts() {
    productListDiv.innerHTML = '';
    for (let id in allProducts) {
        const product = allProducts[id];
        const categoryName = allCategories[product.category] ? allCategories[product.category].name : 'N/A';
        const productItem = document.createElement('div');
        productItem.className = 'list-item product-item';
        productItem.innerHTML = `
            <img src="${product.imageUrl || 'https://via.placeholder.com/50'}" alt="${product.title}" class="list-item-thumbnail">
            <div class="list-item-details">
                <h3>${product.title}</h3>
                <p><strong>Price:</strong> $${product.price ? product.price.toFixed(2) : '0.00'}</p>
                <p><strong>Category:</strong> ${categoryName}</p>
                <p><strong>Stock:</strong> ${product.stock}</p>
                <p><strong>Featured:</strong> ${product.isFeatured ? 'Yes' : 'No'}</p>
            </div>
            <div class="actions">
                <button class="admin-button primary" onclick="editProduct('${id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="admin-button danger" onclick="deleteProduct('${id}')"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;
        productListDiv.appendChild(productItem);
    }
}

window.editProduct = (id) => {
    const product = allProducts[id];
    if (product) {
        editProductIdInput.value = id;
        editProductTitleInput.value = product.title;
        editProductDescriptionInput.value = product.description;
        editProductPriceInput.value = product.price;
        editProductCategorySelect.value = product.category;
        editProductStockInput.value = product.stock;
        editProductFeaturedCheckbox.checked = product.isFeatured || false;
        editProductCurrentImageUrl.textContent = product.imageUrl ? `Current: ${product.imageUrl.split('/').pop().split('?')[0]}` : 'No current image';
        editProductCurrentVideoUrl.textContent = product.videoUrl ? `Current: ${product.videoUrl.split('/').pop().split('?')[0]}` : 'No current video';

        document.getElementById('edit-product-section').style.display = 'block';
        // Scroll to edit section
        document.getElementById('edit-product-section').scrollIntoView({ behavior: 'smooth' });
    } else {
        showCustomModal('Error', 'Product not found for editing.', 'alert');
    }
};

editProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editProductIdInput.value;
    const title = editProductTitleInput.value;
    const description = editProductDescriptionInput.value;
    const price = parseFloat(editProductPriceInput.value);
    const category = editProductCategorySelect.value;
    const stock = parseInt(editProductStockInput.value);
    const imageFile = editProductImageInput.files[0];
    const videoFile = editProductVideoInput.files[0];
    const isFeatured = editProductFeaturedCheckbox.checked;

    if (!id || !title || !description || isNaN(price) || !category || isNaN(stock)) {
        showCustomModal('Error', 'Please fill in all required product fields for editing.', 'alert');
        return;
    }

    try {
        let imageUrl = allProducts[id].imageUrl || '';
        if (imageFile) {
            const imageRef = storageRef(storage, `product_images/${Date.now()}_${imageFile.name}`);
            const imageSnapshot = await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(imageSnapshot.ref);
        }

        let videoUrl = allProducts[id].videoUrl || '';
        if (videoFile) {
            const videoRef = storageRef(storage, `product_videos/${Date.now()}_${videoFile.name}`);
            const videoSnapshot = await uploadBytes(videoRef, videoFile);
            videoUrl = await getDownloadURL(videoSnapshot.ref);
        }

        await update(ref(database, `products/${id}`), {
            title,
            description,
            price,
            category,
            stock,
            imageUrl,
            videoUrl,
            isFeatured,
            updatedAt: serverTimestamp()
        });

        showCustomModal('Success', 'Product updated successfully!', 'alert');
        editProductForm.reset();
        editProductImageInput.value = '';
        editProductVideoInput.value = '';
        document.getElementById('edit-product-section').style.display = 'none';
    } catch (error) {
        console.error('Error updating product:', error);
        showCustomModal('Error', 'Failed to update product: ' + error.message, 'alert');
    }
});

window.deleteProduct = (id) => {
    showCustomModal('Confirm Delete', 'Are you sure you want to delete this product? This action cannot be undone.', 'confirm', async (confirmed) => {
        if (confirmed) {
            try {
                // Delete associated image and video if they exist
                const product = allProducts[id];
                if (product.imageUrl) {
                    const imgRef = storageRef(storage, product.imageUrl);
                    // Check if the ref truly points to a file, then delete
                    // (Note: direct deletion of URL derived ref can be tricky if not careful with paths)
                    // For simplicity, we'll assume the URL implies the storage path
                    // A more robust solution would store original storage path/name
                }
                if (product.videoUrl) {
                    const vidRef = storageRef(storage, product.videoUrl);
                    // Same note as above for video
                }
                await remove(ref(database, `products/${id}`));
                showCustomModal('Success', 'Product deleted successfully!', 'alert');
            } catch (error) {
                console.error('Error deleting product:', error);
                showCustomModal('Error', 'Failed to delete product: ' + error.message, 'alert');
            }
        }
    });
};


// --- Order Management ---
function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        allOrders = snapshot.val() || {};
        displayOrders();
        updateSalesAnalytics(); // Update sales analytics whenever orders change
    }, (error) => {
        console.error('Error loading orders:', error);
        showCustomModal('Error', 'Failed to load orders: ' + error.message, 'alert');
    });
}

function displayOrders() {
    orderListDiv.innerHTML = '';
    const ordersArray = Object.entries(allOrders).map(([id, order]) => ({ id, ...order }));
    ordersArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Sort by newest first

    if (ordersArray.length === 0) {
        orderListDiv.innerHTML = '<p>No orders to display.</p>';
        return;
    }

    ordersArray.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'list-item order-item';
        const orderDate = order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A';
        const productDetails = order.products ? Object.values(order.products).map(p => `${p.title} (x${p.quantity})`).join(', ') : 'No products';

        orderItem.innerHTML = `
            <div class="list-item-details">
                <h3>Order ID: ${order.id}</h3>
                <p><strong>Customer Email:</strong> ${order.userEmail || 'N/A'}</p>
                <p><strong>Total:</strong> $${order.total ? order.total.toFixed(2) : '0.00'}</p>
                <p><strong>Date:</strong> ${orderDate}</p>
                <p><strong>Status:</strong> <span id="order-status-${order.id}">${order.status}</span></p>
                <p><strong>Products:</strong> ${productDetails}</p>
            </div>
            <div class="actions">
                <select onchange="updateOrderStatus('${order.id}', this.value)" class="status-select">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button class="admin-button danger" onclick="deleteOrder('${order.id}')"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;
        orderListDiv.appendChild(orderItem);
    });
}

window.updateOrderStatus = async (orderId, newStatus) => {
    try {
        await update(ref(database, `orders/${orderId}`), { status: newStatus });
        showCustomModal('Success', `Order ${orderId} status updated to ${newStatus}!`, 'alert');
        // No need to reload orders explicitly, onValue listener will handle it.
    } catch (error) {
        console.error('Error updating order status:', error);
        showCustomModal('Error', 'Failed to update order status: ' + error.message, 'alert');
    }
};

window.deleteOrder = (id) => {
    showCustomModal('Confirm Delete', 'Are you sure you want to delete this order? This action cannot be undone.', 'confirm', async (confirmed) => {
        if (confirmed) {
            try {
                await remove(ref(database, `orders/${id}`));
                showCustomModal('Success', 'Order deleted successfully!', 'alert');
            } catch (error) {
                console.error('Error deleting order:', error);
                showCustomModal('Error', 'Failed to delete order: ' + error.message, 'alert');
            }
        }
    });
};

// --- Ratings Management (for display and analytics) ---
function loadRatings() {
    const ratingsRef = ref(database, 'ratings');
    onValue(ratingsRef, (snapshot) => {
        allRatings = snapshot.val() || {};
        // You might want to display ratings in a dedicated section or use them for analytics
        updateProductAnalyticsChart(); // Update product analytics chart after ratings are loaded
    }, (error) => {
        console.error('Error loading ratings:', error);
    });
}


// --- Analytics & Reporting ---

function updateSalesAnalytics() {
    const productSalesData = {};
    const categorySalesData = {};
    const salesOverTimeData = {}; // For daily/monthly sales trend

    // Initialize product and category sales to 0
    for (const productId in allProducts) {
        productSalesData[productId] = 0;
    }
    for (const categoryId in allCategories) {
        categorySalesData[categoryId] = 0;
    }

    Object.values(allOrders).forEach(order => {
        // Sales over time
        if (order.timestamp) {
            const date = new Date(order.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
            salesOverTimeData[date] = (salesOverTimeData[date] || 0) + (order.total || 0);
        }

        if (order.products) {
            Object.values(order.products).forEach(productInOrder => {
                const productId = productInOrder.id;
                const quantity = productInOrder.quantity;
                const pricePerItem = productInOrder.price; // Assuming price is stored with product in order
                const productCategory = productInOrder.category; // Assuming category is stored with product in order

                if (productId && quantity && pricePerItem) {
                    productSalesData[productId] = (productSalesData[productId] || 0) + (quantity * pricePerItem);
                }

                if (productCategory && quantity && pricePerItem) {
                    categorySalesData[productCategory] = (categorySalesData[productCategory] || 0) + (quantity * pricePerItem);
                }
            });
        }
    });

    // Sort sales over time by date
    const sortedSalesOverTimeLabels = Object.keys(salesOverTimeData).sort();
    const sortedSalesOverTimeValues = sortedSalesOverTimeLabels.map(label => salesOverTimeData[label]);


    // Convert productSalesData to format suitable for charts (filter out products with 0 sales if desired)
    const topSellingProducts = Object.entries(productSalesData)
        .filter(([, sales]) => sales > 0)
        .sort((a, b) => b[1] - a[1]) // Sort by sales descending
        .slice(0, 10); // Top 10 products

    const topSellingProductLabels = topSellingProducts.map(([id,]) => allProducts[id] ? allProducts[id].title : `Product ${id}`);
    const topSellingProductValues = topSellingProducts.map(([, sales]) => sales);


    // Prepare data for Category Sales Chart
    const categorySalesLabels = Object.keys(categorySalesData).map(id => allCategories[id] ? allCategories[id].name : `Category ${id}`);
    const categorySalesValues = Object.values(categorySalesData);


    renderProductSalesChart(topSellingProductLabels, topSellingProductValues);
    renderCategorySalesChart(categorySalesLabels, categorySalesValues);
    renderSalesOverTimeChart(sortedSalesOverTimeLabels, sortedSalesOverTimeValues);
    updateProductAnalyticsChart(); // Call this here to make sure it also updates after order changes
}

function renderProductSalesChart(labels, data) {
    if (productSalesChart) {
        productSalesChart.destroy();
    }
    productSalesChart = new Chart(productSalesChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue by Product',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Top Product Revenue'
                }
            }
        }
    });
}

function renderCategorySalesChart(labels, data) {
    if (categorySalesChart) {
        categorySalesChart.destroy();
    }
    categorySalesChart = new Chart(categorySalesChartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue by Category',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Revenue Distribution by Category'
                }
            }
        }
    });
}

function renderSalesOverTimeChart(labels, data) {
    if (salesOverTimeChart) {
        salesOverTimeChart.destroy();
    }
    salesOverTimeChart = new Chart(salesOverTimeChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Revenue',
                data: data,
                backgroundColor: 'rgba(0, 188, 212, 0.2)', // Light cyan
                borderColor: '#17a2b8', // Primary cyan
                borderWidth: 2,
                tension: 0.3, // Smooth the line
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Sales Trend Over Time'
                }
            }
        }
    });
}


function populateProductAnalyticsSelect() {
    productAnalyticsSelect.innerHTML = '<option value="">All Products (Average Rating)</option>';
    for (let id in allProducts) {
        const product = allProducts[id];
        const option = document.createElement('option');
        option.value = id;
        option.textContent = product.title;
        productAnalyticsSelect.appendChild(option);
    }
}

productAnalyticsSelect.addEventListener('change', updateProductAnalyticsChart);

function updateProductAnalyticsChart() {
    const selectedProductId = productAnalyticsSelect.value;
    const labels = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
    const ratingCounts = [0, 0, 0, 0, 0];
    let totalRatings = 0;
    let sumOfRatings = 0;

    for (let ratingId in allRatings) {
        const rating = allRatings[ratingId];
        if (!selectedProductId || rating.productId === selectedProductId) {
            const star = rating.rating;
            if (star >= 1 && star <= 5) {
                ratingCounts[star - 1]++;
                totalRatings++;
                sumOfRatings += star;
            }
        }
    }

    const averageRating = totalRatings > 0 ? (sumOfRatings / totalRatings).toFixed(2) : 'N/A';

    renderPopularProductsChart(labels, ratingCounts, selectedProductId ? `Rating Distribution for ${allProducts[selectedProductId]?.title || 'Unknown Product'} (Avg: ${averageRating})` : `Overall Rating Distribution (Avg: ${averageRating})`);
}

function renderPopularProductsChart(labels, data, titleText) {
    if (popularProductsChart) {
        popularProductsChart.destroy();
    }
    popularProductsChart = new Chart(popularProductsChartCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Ratings',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)', // 1 star (Red)
                    'rgba(255, 159, 64, 0.6)', // 2 stars (Orange)
                    'rgba(255, 206, 86, 0.6)', // 3 stars (Yellow)
                    'rgba(75, 192, 192, 0.6)', // 4 stars (Green-ish Cyan)
                    'rgba(153, 102, 255, 0.6)'  // 5 stars (Purple)
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: titleText
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed + ' ratings';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}


// --- Product Comparison ---
function populateProductComparisonSelects() {
    // Clear existing options
    compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';

    for (let id in allProducts) {
        const product = allProducts[id];
        const option1 = document.createElement('option');
        option1.value = id;
        option1.textContent = product.title;
        compareProduct1Select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = id;
        option2.textContent = product.title;
        compareProduct2Select.appendChild(option2);
    }
}

compareProductsBtn.addEventListener('click', () => {
    const product1Id = compareProduct1Select.value;
    const product2Id = compareProduct2Select.value;

    if (!product1Id && !product2Id) {
        showCustomModal('Comparison Error', 'Please select at least one product to compare.', 'alert');
        return;
    }

    const product1 = allProducts[product1Id];
    const product2 = allProducts[product2Id];

    if ((product1Id && !product1) || (product2Id && !product2)) {
        showCustomModal('Comparison Error', 'Selected product(s) not found.', 'alert');
        return;
    }

    renderProductComparisonChart(product1, product2);
});


function renderProductComparisonChart(product1, product2) {
    const labels = ['Price', 'Stock', 'Average Rating'];
    const datasets = [];

    const getAverageRating = (productId) => {
        let total = 0;
        let count = 0;
        for (let ratingId in allRatings) {
            const rating = allRatings[ratingId];
            if (rating.productId === productId) {
                total += rating.rating;
                count++;
            }
        }
        return count > 0 ? (total / count) : 0; // Return 0 if no ratings to avoid NaN
    };

    if (product1) {
        const data1 = [
            product1.price,
            product1.stock,
            getAverageRating(product1.id) // Ensure product.id is used here
        ];
        datasets.push({
            label: product1.title,
            data: data1,
            backgroundColor: 'rgba(0, 188, 212, 0.6)',
            borderColor: '#17a2b8', // Corresponds to --color-cyan-primary
            borderWidth: 1
        });
    }
    if (product2) {
        const data2 = [
            product2.price,
            product2.stock,
            getAverageRating(product2.id) // Ensure product.id is used here
        ];
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
    loadProducts();
    loadOrders();
    loadRatings(); // Load ratings for analytics
}


document.addEventListener('DOMContentLoaded', () => {
    // Initial check for auth state is handled by onAuthStateChanged
    // No need to call loadAdminData here, as onAuthStateChanged will trigger it...
});
