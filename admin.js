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
  appId: "1:967448486557:web:2c89223921f6479010495f", // Ensure this is correct from Firebase Console
  measurementId: "G-TT31HC3NZ3" // IMPORTANT: Update this to match your Firebase Analytics Measurement ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize analytics here
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const emailInput = document.getElementById('admin-email');
const passwordInput = document.getElementById('admin-password');
const loginButton = document.getElementById('admin-login-btn');
const logoutButton = document.getElementById('admin-logout-btn');
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');

// Product Management
const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const productNameInput = document.getElementById('product-name');
const productDescriptionInput = document.getElementById('product-description');
const productPriceInput = document.getElementById('product-price');
const productCategorySelect = document.getElementById('product-category');
const productImageInput = document.getElementById('product-image');
const productImageUrlInput = document.getElementById('product-image-url');
const productVideoUrlInput = document.getElementById('product-video-url');
const productIsFeaturedCheckbox = document.getElementById('product-is-featured');
const addProductButton = document.getElementById('add-product-btn');
const updateProductButton = document.getElementById('update-product-btn');
const productList = document.getElementById('product-list');

// Category Management
const categoryNameInput = document.getElementById('category-name');
const addCategoryButton = document.getElementById('add-category-btn');
const categoryList = document.getElementById('category-list');
const editCategoryModal = document.getElementById('edit-category-modal');
const editCategoryNameInput = document.getElementById('edit-category-name');
const saveCategoryButton = document.getElementById('save-category-btn');
const cancelCategoryEditButton = document.getElementById('cancel-category-edit-btn');
let currentEditingCategoryKey = null;

// Order Management
const orderList = document.getElementById('order-list');

// Product Comparison
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');
const productComparisonChartCanvas = document.getElementById('productComparisonChart');
let productComparisonChart = null; // To store the Chart.js instance

// Analytics Section (existing but ensuring all parts are initialized)
const salesChartCanvas = document.getElementById('salesChart');
const ordersOverTimeChartCanvas = document.getElementById('ordersOverTimeChart');
const topProductsChartCanvas = document.getElementById('topProductsChart');
const categorySalesChartCanvas = document.getElementById('categorySalesChart');
const ratingDistributionChartCanvas = document.getElementById('ratingDistributionChart');


let salesChart, ordersOverTimeChart, topProductsChart, categorySalesChart, ratingDistributionChart;


// --- Utility Functions ---
function showAlert(title, message, isConfirm = false, onConfirm = null) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customAlertModal.style.display = 'flex'; // Use flex to center

    if (isConfirm) {
        customModalCancelBtn.style.display = 'inline-block';
        customModalOkBtn.onclick = () => {
            if (onConfirm) onConfirm();
            closeAlertModal();
        };
        customModalCancelBtn.onclick = () => {
            closeAlertModal();
        };
    } else {
        customModalCancelBtn.style.display = 'none';
        customModalOkBtn.onclick = closeAlertModal;
    }
}

function closeAlertModal() {
    customAlertModal.style.display = 'none';
}

// --- Authentication ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginSection.style.display = 'none';
        adminSection.style.display = 'block';
        loadAdminData();
        console.log('[Admin] User logged in:', user.email);
    } else {
        // User is signed out
        loginSection.style.display = 'block';
        adminSection.style.display = 'none';
        console.log('[Admin] User logged out.');
    }
});

loginButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        showAlert('Login Error', 'Please enter both email and password.');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle UI update
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login Failed', `Error: ${error.message}`);
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // onAuthStateChanged will handle UI update
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Logout Failed', `Error: ${error.message}`);
    }
});

// --- Category Management ---
function addCategory() {
    const categoryName = categoryNameInput.value.trim();
    if (categoryName) {
        const categoriesRef = ref(database, 'categories');
        const newCategoryRef = push(categoriesRef);
        set(newCategoryRef, {
            name: categoryName,
            createdAt: serverTimestamp()
        })
            .then(() => {
                categoryNameInput.value = '';
                showAlert('Success', 'Category added successfully!');
            })
            .catch((error) => {
                console.error('Error adding category:', error);
                showAlert('Error', `Failed to add category: ${error.message}`);
            });
    } else {
        showAlert('Input Error', 'Please enter a category name.');
    }
}

function populateCategoryList(categories) {
    categoryList.innerHTML = '';
    if (categories) {
        Object.entries(categories).forEach(([key, category]) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${category.name}</span>
                <div>
                    <button class="admin-button secondary edit-button" data-key="${key}" data-name="${category.name}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="admin-button danger delete-button" data-key="${key}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            categoryList.appendChild(li);
        });

        document.querySelectorAll('#category-list .edit-button').forEach(button => {
            button.addEventListener('click', (event) => {
                currentEditingCategoryKey = event.currentTarget.dataset.key;
                editCategoryNameInput.value = event.currentTarget.dataset.name;
                editCategoryModal.style.display = 'flex'; // Show modal
            });
        });

        document.querySelectorAll('#category-list .delete-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const categoryKeyToDelete = event.currentTarget.dataset.key;
                showAlert('Confirm Deletion', 'Are you sure you want to delete this category? This will also remove products in this category.', true, () => {
                    deleteCategory(categoryKeyToDelete);
                });
            });
        });
    } else {
        categoryList.innerHTML = '<p>No categories found.</p>';
    }
}

function deleteCategory(categoryKey) {
    const categoryRef = ref(database, `categories/${categoryKey}`);
    remove(categoryRef)
        .then(() => {
            // Also remove products associated with this category
            const productsRef = ref(database, 'products');
            onValue(productsRef, (snapshot) => {
                const products = snapshot.val();
                if (products) {
                    Object.entries(products).forEach(([productKey, product]) => {
                        if (product.category === categoryKey) {
                            remove(ref(database, `products/${productKey}`));
                        }
                    });
                }
            }, {
                onlyOnce: true
            });
            showAlert('Success', 'Category and associated products deleted!');
        })
        .catch((error) => {
            console.error('Error deleting category:', error);
            showAlert('Error', `Failed to delete category: ${error.message}`);
        });
}

function updateCategory() {
    const newName = editCategoryNameInput.value.trim();
    if (currentEditingCategoryKey && newName) {
        const categoryRef = ref(database, `categories/${currentEditingCategoryKey}`);
        update(categoryRef, { name: newName })
            .then(() => {
                showAlert('Success', 'Category updated successfully!');
                editCategoryModal.style.display = 'none'; // Hide modal
                currentEditingCategoryKey = null;
            })
            .catch((error) => {
                console.error('Error updating category:', error);
                showAlert('Error', `Failed to update category: ${error.message}`);
            });
    } else {
        showAlert('Input Error', 'Please enter a valid category name.');
    }
}

function populateCategorySelect() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        const categories = snapshot.val();
        productCategorySelect.innerHTML = '<option value="">Select Category</option>';
        if (categories) {
            Object.entries(categories).forEach(([key, category]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = category.name;
                productCategorySelect.appendChild(option);
            });
        }
        populateCategoryList(categories); // Also update the category list here
    });
}


// --- Product Management ---
let productsData = {}; // Store products for easy access

function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        productsData = snapshot.val() || {}; // Ensure it's an object, even if empty
        populateProductList(productsData);
        populateProductComparisonSelects(productsData); // Populate comparison selects on product load
    });
}

function populateProductList(products) {
    productList.innerHTML = '';
    if (products) {
        Object.entries(products).forEach(([key, product]) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <img src="${product.imageUrl || 'placeholder.png'}" alt="${product.title}" class="product-thumb">
                <div class="product-info">
                    <h4>${product.title}</h4>
                    <p>Price: $${product.price.toFixed(2)}</p>
                    <p>Category: ${product.categoryName || 'N/A'}</p>
                </div>
                <div class="product-actions-admin">
                    <button class="admin-button secondary edit-product-btn" data-key="${key}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="admin-button danger delete-product-btn" data-key="${key}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            productList.appendChild(li);
        });

        document.querySelectorAll('.edit-product-btn').forEach(button => {
            button.addEventListener('click', (event) => editProduct(event.currentTarget.dataset.key));
        });
        document.querySelectorAll('.delete-product-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productKeyToDelete = event.currentTarget.dataset.key;
                showAlert('Confirm Deletion', 'Are you sure you want to delete this product?', true, () => {
                    deleteProduct(productKeyToDelete);
                });
            });
        });
    } else {
        productList.innerHTML = '<p>No products found.</p>';
    }
}

async function addOrUpdateProduct() {
    const id = productIdInput.value;
    const title = productNameInput.value.trim();
    const description = productDescriptionInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const categoryKey = productCategorySelect.value;
    const isFeatured = productIsFeaturedCheckbox.checked;
    const videoUrl = productVideoUrlInput.value.trim();
    let imageUrl = productImageUrlInput.value.trim();

    if (!title || !description || isNaN(price) || price <= 0 || !categoryKey) {
        showAlert('Input Error', 'Please fill all product fields correctly (Title, Description, Price, Category).');
        return;
    }

    let imageUploadPromise = Promise.resolve(imageUrl); // Default to existing URL or empty

    if (productImageInput.files.length > 0) {
        const imageFile = productImageInput.files[0];
        const imageRef = storageRef(storage, `product_images/${imageFile.name}`);
        imageUploadPromise = uploadBytes(imageRef, imageFile)
            .then(snapshot => getDownloadURL(snapshot.ref))
            .catch(error => {
                console.error('Error uploading image:', error);
                showAlert('Upload Error', `Failed to upload image: ${error.message}`);
                return null; // Indicate upload failure
            });
    }

    try {
        imageUrl = await imageUploadPromise;
        if (productImageInput.files.length > 0 && !imageUrl) {
            // If there was a file to upload but upload failed, stop here.
            return;
        }

        const productData = {
            title,
            description,
            price,
            category: categoryKey,
            isFeatured,
            imageUrl: imageUrl || '', // Use uploaded URL or empty string
            videoUrl: videoUrl || '', // Use provided video URL or empty string
            createdAt: serverTimestamp()
        };

        const categorySnapshot = await get(ref(database, `categories/${categoryKey}`));
        if (categorySnapshot.exists()) {
            productData.categoryName = categorySnapshot.val().name;
        }

        if (id) {
            // Update existing product
            const productRef = ref(database, `products/${id}`);
            await update(productRef, productData);
            showAlert('Success', 'Product updated successfully!');
            updateProductButton.style.display = 'none';
            addProductButton.style.display = 'block';
        } else {
            // Add new product
            const newProductRef = push(ref(database, 'products'));
            await set(newProductRef, productData);
            showAlert('Success', 'Product added successfully!');
        }
        clearProductForm();
    } catch (error) {
        console.error('Error adding/updating product:', error);
        showAlert('Error', `Failed to save product: ${error.message}`);
    }
}

function editProduct(productKey) {
    const product = productsData[productKey];
    if (product) {
        productIdInput.value = productKey;
        productNameInput.value = product.title;
        productDescriptionInput.value = product.description;
        productPriceInput.value = product.price;
        productCategorySelect.value = product.category;
        productImageUrlInput.value = product.imageUrl || ''; // Pre-fill image URL
        productVideoUrlInput.value = product.videoUrl || ''; // Pre-fill video URL
        productIsFeaturedCheckbox.checked = product.isFeatured || false;

        addProductButton.style.display = 'none';
        updateProductButton.style.display = 'block';
    }
}

function deleteProduct(productKey) {
    const productRef = ref(database, `products/${productKey}`);
    remove(productRef)
        .then(() => {
            showAlert('Success', 'Product deleted successfully!');
        })
        .catch((error) => {
            console.error('Error deleting product:', error);
            showAlert('Error', `Failed to delete product: ${error.message}`);
        });
}

function clearProductForm() {
    productIdInput.value = '';
    productNameInput.value = '';
    productDescriptionInput.value = '';
    productPriceInput.value = '';
    productCategorySelect.value = '';
    productImageInput.value = ''; // Clear file input
    productImageUrlInput.value = ''; // Clear URL input
    productVideoUrlInput.value = ''; // Clear video URL input
    productIsFeaturedCheckbox.checked = false;
    addProductButton.style.display = 'block';
    updateProductButton.style.display = 'none';
}

// --- Order Management ---
function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        const orders = snapshot.val();
        populateOrderList(orders);
        updateSalesCharts(orders); // Update sales charts when orders change
    });
}

function populateOrderList(orders) {
    orderList.innerHTML = '';
    if (orders) {
        Object.entries(orders).forEach(([key, order]) => {
            const li = document.createElement('li');
            const itemsHtml = order.items.map(item => `<li>${item.title} (x${item.quantity}) - $${item.price.toFixed(2)}</li>`).join('');
            const statusClass = getStatusClass(order.status);

            li.innerHTML = `
                <div class="order-header">
                    <span>Order ID: ${key}</span>
                    <span>Date: ${new Date(order.timestamp).toLocaleString()}</span>
                    <span>Total: $${order.total.toFixed(2)}</span>
                    <span class="order-status ${statusClass}">${order.status}</span>
                </div>
                <div class="order-details">
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Email:</strong> ${order.customerEmail}</p>
                    <p><strong>Address:</strong> ${order.customerAddress}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Items:</strong></p>
                    <ul>${itemsHtml}</ul>
                    <div class="order-actions">
                        <select class="order-status-select" data-key="${key}">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <button class="admin-button danger delete-order-btn" data-key="${key}"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </div>
            `;
            orderList.appendChild(li);
        });

        document.querySelectorAll('.order-status-select').forEach(select => {
            select.addEventListener('change', (event) => {
                const orderKey = event.currentTarget.dataset.key;
                const newStatus = event.currentTarget.value;
                updateOrderStatus(orderKey, newStatus);
            });
        });

        document.querySelectorAll('.delete-order-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const orderKeyToDelete = event.currentTarget.dataset.key;
                showAlert('Confirm Deletion', 'Are you sure you want to delete this order?', true, () => {
                    deleteOrder(orderKeyToDelete);
                });
            });
        });
    } else {
        orderList.innerHTML = '<p>No orders found.</p>';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'Pending':
            return 'status-pending';
        case 'Processing':
            return 'status-processing';
        case 'Shipped':
            return 'status-shipped';
        case 'Delivered':
            return 'status-delivered';
        case 'Cancelled':
            return 'status-cancelled';
        default:
            return '';
    }
}

function updateOrderStatus(orderKey, newStatus) {
    const orderRef = ref(database, `orders/${orderKey}`);
    update(orderRef, { status: newStatus })
        .then(() => {
            showAlert('Success', `Order ${orderKey} status updated to ${newStatus}.`);
        })
        .catch((error) => {
            console.error('Error updating order status:', error);
            showAlert('Error', `Failed to update order status: ${error.message}`);
        });
}

function deleteOrder(orderKey) {
    const orderRef = ref(database, `orders/${orderKey}`);
    remove(orderRef)
        .then(() => {
            showAlert('Success', 'Order deleted successfully!');
        })
        .catch((error) => {
            console.error('Error deleting order:', error);
            showAlert('Error', `Failed to delete order: ${error.message}`);
        });
}

// --- Analytics ---
function updateSalesCharts(orders) {
    if (!orders) {
        console.log('No orders data for analytics.');
        if (salesChart) salesChart.destroy();
        if (ordersOverTimeChart) ordersOverTimeChart.destroy();
        if (topProductsChart) topProductsChart.destroy();
        if (categorySalesChart) categorySalesChart.destroy();
        return;
    }

    const salesByMonth = {};
    const ordersByDate = {};
    const productSales = {};
    const categorySales = {};

    Object.values(orders).forEach(order => {
        const orderDate = new Date(order.timestamp);
        const monthYear = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const dateString = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD

        salesByMonth[monthYear] = (salesByMonth[monthYear] || 0) + order.total;
        ordersByDate[dateString] = (ordersByDate[dateString] || 0) + 1;

        order.items.forEach(item => {
            productSales[item.title] = (productSales[item.title] || 0) + item.price * item.quantity;
            categorySales[item.categoryName] = (categorySales[item.categoryName] || 0) + item.price * item.quantity;
        });
    });

    // Sort data for charts
    const sortedMonths = Object.keys(salesByMonth).sort();
    const salesData = sortedMonths.map(month => salesByMonth[month]);

    const sortedDates = Object.keys(ordersByDate).sort();
    const ordersData = sortedDates.map(date => ordersByDate[date]);

    const sortedProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5 products
    const topProductLabels = sortedProducts.map(([name]) => name);
    const topProductSales = sortedProducts.map(([, sales]) => sales);

    const sortedCategories = Object.entries(categorySales)
        .sort(([, a], [, b]) => b - a);
    const categoryLabels = sortedCategories.map(([name]) => name);
    const categorySalesData = sortedCategories.map(([, sales]) => sales);


    // Render Sales Chart
    if (salesChart) salesChart.destroy();
    salesChart = new Chart(salesChartCanvas, {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Total Sales',
                data: salesData,
                backgroundColor: 'rgba(0, 188, 212, 0.6)',
                borderColor: '#00BCD4',
                borderWidth: 1,
                fill: true
            }]
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

    // Render Orders Over Time Chart
    if (ordersOverTimeChart) ordersOverTimeChart.destroy();
    ordersOverTimeChart = new Chart(ordersOverTimeChartCanvas, {
        type: 'bar',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Number of Orders',
                data: ordersData,
                backgroundColor: 'rgba(233, 30, 99, 0.6)',
                borderColor: '#E91E63',
                borderWidth: 1
            }]
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

    // Render Top Products Chart
    if (topProductsChart) topProductsChart.destroy();
    topProductsChart = new Chart(topProductsChartCanvas, {
        type: 'doughnut',
        data: {
            labels: topProductLabels,
            datasets: [{
                label: 'Sales by Product',
                data: topProductSales,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
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
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Top 5 Product Sales'
                }
            }
        }
    });

    // Render Category Sales Chart
    if (categorySalesChart) categorySalesChart.destroy();
    categorySalesChart = new Chart(categorySalesChartCanvas, {
        type: 'pie',
        data: {
            labels: categoryLabels,
            datasets: [{
                label: 'Sales by Category',
                data: categorySalesData,
                backgroundColor: [
                    'rgba(0, 188, 212, 0.6)', // Cyan
                    'rgba(233, 30, 99, 0.6)', // Pink
                    'rgba(76, 175, 80, 0.6)', // Green
                    'rgba(255, 152, 0, 0.6)', // Orange
                    'rgba(103, 58, 183, 0.6)',// Deep Purple
                    'rgba(3, 169, 244, 0.6)', // Light Blue
                    'rgba(139, 195, 74, 0.6)', // Light Green
                ],
                borderColor: [
                    '#00BCD4',
                    '#E91E63',
                    '#4CAF50',
                    '#FF9800',
                    '#673AB7',
                    '#03A9F4',
                    '#8BC34A',
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Sales by Category'
                }
            }
        }
    });
}

// --- Ratings Analytics ---
let allRatings = [];

function loadRatings() {
    const ratingsRef = ref(database, 'ratings');
    onValue(ratingsRef, (snapshot) => {
        const ratings = snapshot.val();
        allRatings = [];
        if (ratings) {
            Object.values(ratings).forEach(productRatings => {
                if (productRatings) {
                    Object.values(productRatings).forEach(rating => {
                        allRatings.push(rating.rating);
                    });
                }
            });
        }
        updateRatingDistributionChart(allRatings);
    });
}

function updateRatingDistributionChart(ratings) {
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => {
        if (rating >= 1 && rating <= 5) {
            ratingCounts[rating]++;
        }
    });

    const labels = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
    const data = labels.map((_, index) => ratingCounts[index + 1]);

    if (ratingDistributionChart) {
        ratingDistributionChart.destroy();
    }

    ratingDistributionChart = new Chart(ratingDistributionChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Ratings',
                data: data,
                backgroundColor: [
                    'rgba(220, 53, 69, 0.6)',  // Red for 1 star
                    'rgba(255, 193, 7, 0.6)',  // Yellow for 2 stars
                    'rgba(23, 162, 184, 0.6)', // Info blue for 3 stars
                    'rgba(40, 167, 69, 0.6)',  // Green for 4 stars
                    'rgba(0, 123, 255, 0.6)'   // Blue for 5 stars
                ],
                borderColor: [
                    '#dc3545',
                    '#ffc107',
                    '#17a2b8',
                    '#28a745',
                    '#007bff'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0 // Ensure integer ticks for count
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Rating Distribution'
                }
            }
        }
    });
}


// --- Product Comparison ---
function populateProductComparisonSelects(products) {
    compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';

    if (products) {
        Object.entries(products).forEach(([key, product]) => {
            const option1 = document.createElement('option');
            option1.value = key;
            option1.textContent = product.title;
            compareProduct1Select.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = key;
            option2.textContent = product.title;
            compareProduct2Select.appendChild(option2);
        });
    }
}

compareProductsBtn.addEventListener('click', () => {
    const product1Key = compareProduct1Select.value;
    const product2Key = compareProduct2Select.value;

    if (!product1Key && !product2Key) {
        showAlert('Comparison Error', 'Please select at least one product to compare.');
        return;
    }

    const product1 = productsData[product1Key];
    const product2 = productsData[product2Key];

    drawProductComparisonChart(product1, product2);
});


function drawProductComparisonChart(product1, product2) {
    const labels = ['Price', 'Featured', 'Ratings Count', 'Average Rating'];
    const datasets = [];

    // Helper to get average rating for a product
    const getProductAverageRating = (productKey) => {
        const productRatings = allRatings.filter(rating => rating.productId === productKey); // Assuming 'allRatings' holds product IDs
        if (productRatings.length === 0) return 0;
        const sum = productRatings.reduce((acc, r) => acc + r.rating, 0);
        return sum / productRatings.length;
    };

    // Helper to get total ratings count for a product
    const getProductRatingsCount = (productKey) => {
        const productRatings = allRatings.filter(rating => rating.productId === productKey);
        return productRatings.length;
    };


    if (product1) {
        const data1 = [
            product1.price,
            product1.isFeatured ? 100 : 0, // Represent boolean as a value for chart
            getProductRatingsCount(product1Key),
            getProductAverageRating(product1Key) * 20 // Scale average rating (out of 5) to 0-100 for better comparison
        ];
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
        const data2 = [
            product2.price,
            product2.isFeatured ? 100 : 0, // Represent boolean as a value for chart
            getProductRatingsCount(product2Key),
            getProductAverageRating(product2Key) * 20 // Scale average rating (out of 5) to 0-100 for better comparison
        ];
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
    // No need to call loadAdminData here, as onAuthStateChanged will trigger it after login

    // Event Listeners for Product Management
    addProductButton.addEventListener('click', addOrUpdateProduct);
    updateProductButton.addEventListener('click', addOrUpdateProduct);
    document.getElementById('clear-product-form-btn').addEventListener('click', clearProductForm);

    // Event Listeners for Category Management
    addCategoryButton.addEventListener('click', addCategory);
    saveCategoryButton.addEventListener('click', updateCategory);
    cancelCategoryEditButton.addEventListener('click', () => {
        editCategoryModal.style.display = 'none'; // Hide modal
        currentEditingCategoryKey = null;
    });

    // Close alert modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === customAlertModal) {
            closeAlertModal();
        }
        if (event.target === editCategoryModal) {
            editCategoryModal.style.display = 'none';
        }
    });
});
