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
  appId: "1:967448486557:web:c0b31e19d7d24268e36780",
  measurementId: "G-G6Q7K8Q9C1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements (Authentication) ---
const authSection = document.getElementById('auth-section');
const adminEmailInput = document.getElementById('admin-email');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminContent = document.getElementById('admin-content');
const adminEmailDisplay = document.getElementById('admin-email-display');
const adminLogoutLink = document.getElementById('admin-logout-link');

// --- DOM Elements (Navigation) ---
const homeNavLink = document.getElementById('home-nav-link');
const productManagementLink = document.getElementById('admin-product-link');
const categoryManagementLink = document.getElementById('admin-category-link');
const orderManagementLink = document.getElementById('admin-order-link'); // New
const analyticsLink = document.getElementById('admin-analytics-link');

const productManagementSection = document.getElementById('product-management');
const categoryManagementSection = document.getElementById('category-management');
const orderManagementSection = document.getElementById('order-management'); // New
const analyticsSection = document.getElementById('analytics-section');

// --- DOM Elements (Product Management) ---
const productCategorySelect = document.getElementById('product-category');
const productImageInput = document.getElementById('product-image');
const productImagePreview = document.getElementById('product-image-preview');
const productVideoUrlInput = document.getElementById('product-video-url');
const productTitleInput = document.getElementById('product-title');
const productDescriptionInput = document.getElementById('product-description');
const productPriceInput = document.getElementById('product-price');
const productStockInput = document.getElementById('product-stock');
const addProductBtn = document.getElementById('add-product-btn');
const updateProductBtn = document.getElementById('update-product-btn');
const cancelEditProductBtn = document.getElementById('cancel-edit-product-btn');
const productListTableBody = document.querySelector('#product-list-table tbody');

// --- DOM Elements (Category Management) ---
const categoryNameInput = document.getElementById('category-name');
const addCategoryBtn = document.getElementById('add-category-btn');
const updateCategoryBtn = document.getElementById('update-category-btn');
const cancelEditCategoryBtn = document.getElementById('cancel-edit-category-btn');
const categoryListTableBody = document.querySelector('#category-list-table tbody');

// --- DOM Elements (Order Management) ---
const orderListTableBody = document.querySelector('#order-list-table tbody'); // New

// --- DOM Elements (Analytics) ---
const salesChartCanvas = document.getElementById('salesChart');
const productSalesChartCanvas = document.getElementById('productSalesChart');
const productRatingsChartCanvas = document.getElementById('productRatingsChart');
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');
const productComparisonChartCanvas = document.getElementById('productComparisonChart');


// --- Custom Alert Modal elements ---
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


// --- Global Variables ---
let currentProductId = null; // Used for editing products
let currentCategoryId = null; // Used for editing categories
let products = []; // Cache for products data
let orders = []; // Cache for orders data
let categories = []; // Cache for categories data
let salesChart;
let productSalesChart;
let productRatingsChart;
let productComparisonChart;


// --- Firebase Refs ---
const productsRef = ref(database, 'products');
const categoriesRef = ref(database, 'categories');
const ordersRef = ref(database, 'orders');
const ratingsRef = ref(database, 'ratings');


// --- Functions ---

// Custom Alert Function
function showCustomAlert(title, message, isConfirm = false, onConfirm = null, onCancel = null) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    
    if (isConfirm) {
        customModalOkBtn.style.display = 'inline-block';
        customModalCancelBtn.style.display = 'inline-block';
        customModalOkBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            if (onConfirm) onConfirm();
        };
        customModalCancelBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            if (onCancel) onCancel();
        };
    } else {
        customModalOkBtn.style.display = 'inline-block';
        customModalCancelBtn.style.display = 'none';
        customModalOkBtn.onclick = () => {
            customAlertModal.style.display = 'none';
            if (onConfirm) onConfirm(); // Still allow a single callback for OK
        };
    }
    customAlertModal.style.display = 'flex';
}

function resetProductForm() {
    productTitleInput.value = '';
    productDescriptionInput.value = '';
    productPriceInput.value = '';
    productStockInput.value = '';
    productCategorySelect.value = '';
    productImageInput.value = ''; // Clear file input
    productImagePreview.style.display = 'none';
    productImagePreview.src = '#';
    productVideoUrlInput.value = '';

    addProductBtn.style.display = 'inline-block';
    updateProductBtn.style.display = 'none';
    cancelEditProductBtn.style.display = 'none';
    currentProductId = null;
}

function resetCategoryForm() {
    categoryNameInput.value = '';
    addCategoryBtn.style.display = 'inline-block';
    updateCategoryBtn.style.display = 'none';
    cancelEditCategoryBtn.style.display = 'none';
    currentCategoryId = null;
}

async function addProduct() {
    const category = productCategorySelect.value;
    const title = productTitleInput.value.trim();
    const description = productDescriptionInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const stock = parseInt(productStockInput.value);
    const imageFile = productImageInput.files[0];
    const videoUrl = productVideoUrlInput.value.trim();

    if (!category || !title || !description || isNaN(price) || isNaN(stock)) {
        showCustomAlert('Input Error', 'Please fill in all product fields correctly.');
        return;
    }

    if (imageFile) {
        const imageRef = storageRef(storage, `product_images/${imageFile.name}`);
        try {
            await uploadBytes(imageRef, imageFile);
            const imageUrl = await getDownloadURL(imageRef);
            await push(productsRef, { category, title, description, price, stock, imageUrl, videoUrl, sumRatings: 0, totalRatings: 0 });
            showCustomAlert('Success', 'Product added successfully!');
            resetProductForm();
        } catch (error) {
            showCustomAlert('Error', 'Failed to upload image or add product: ' + error.message);
        }
    } else {
        try {
            await push(productsRef, { category, title, description, price, stock, imageUrl: '', videoUrl, sumRatings: 0, totalRatings: 0 });
            showCustomAlert('Success', 'Product added successfully (no image).');
            resetProductForm();
        } catch (error) {
            showCustomAlert('Error', 'Failed to add product: ' + error.message);
        }
    }
}

async function updateProduct() {
    if (!currentProductId) return;

    const category = productCategorySelect.value;
    const title = productTitleInput.value.trim();
    const description = productDescriptionInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const stock = parseInt(productStockInput.value);
    const imageFile = productImageInput.files[0];
    const videoUrl = productVideoUrlInput.value.trim();

    if (!category || !title || !description || isNaN(price) || isNaN(stock)) {
        showCustomAlert('Input Error', 'Please fill in all product fields correctly.');
        return;
    }

    const productUpdate = { category, title, description, price, stock, videoUrl };

    if (imageFile) {
        const imageRef = storageRef(storage, `product_images/${imageFile.name}`);
        try {
            await uploadBytes(imageRef, imageFile);
            productUpdate.imageUrl = await getDownloadURL(imageRef);
        } catch (error) {
            showCustomAlert('Error', 'Failed to upload new image: ' + error.message);
            return;
        }
    } else if (productImagePreview.src === '#') { // If image was cleared
        productUpdate.imageUrl = '';
    }

    try {
        await update(ref(database, `products/${currentProductId}`), productUpdate);
        showCustomAlert('Success', 'Product updated successfully!');
        resetProductForm();
    } catch (error) {
        showCustomAlert('Error', 'Failed to update product: ' + error.message);
    }
}

async function deleteProduct(productId) {
    showCustomAlert('Confirm Deletion', 'Are you sure you want to delete this product? This action cannot be undone.', true, async () => {
        try {
            await remove(ref(database, `products/${productId}`));
            showCustomAlert('Success', 'Product deleted successfully!');
            resetProductForm();
        } catch (error) {
            showCustomAlert('Error', 'Failed to delete product: ' + error.message);
        }
    });
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        currentProductId = productId;
        productCategorySelect.value = product.category || '';
        productTitleInput.value = product.title;
        productDescriptionInput.value = product.description;
        productPriceInput.value = product.price;
        productStockInput.value = product.stock;
        productVideoUrlInput.value = product.videoUrl || '';

        if (product.imageUrl) {
            productImagePreview.src = product.imageUrl;
            productImagePreview.style.display = 'block';
        } else {
            productImagePreview.src = '#';
            productImagePreview.style.display = 'none';
        }

        addProductBtn.style.display = 'none';
        updateProductBtn.style.display = 'inline-block';
        cancelEditProductBtn.style.display = 'inline-block';
    }
}

function renderProductsTable() {
    productListTableBody.innerHTML = '';
    products.forEach(product => {
        const row = productListTableBody.insertRow();
        const averageRating = product.totalRatings > 0 ? (product.sumRatings / product.totalRatings).toFixed(1) : 'N/A';
        row.innerHTML = `
            <td><img src="${product.imageUrl || 'placeholder.png'}" alt="${product.title}" width="50"></td>
            <td>${product.category || 'N/A'}</td>
            <td>${product.title}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="admin-button secondary edit-product-btn" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="admin-button error delete-product-btn" data-id="${product.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
    });

    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', (event) => editProduct(event.target.dataset.id));
    });
    document.querySelectorAll('.delete-product-btn').forEach(button => {
        button.addEventListener('click', (event) => deleteProduct(event.target.dataset.id));
    });
}

async function addCategory() {
    const name = categoryNameInput.value.trim();
    if (!name) {
        showCustomAlert('Input Error', 'Please enter a category name.');
        return;
    }
    try {
        await push(categoriesRef, { name });
        showCustomAlert('Success', 'Category added successfully!');
        resetCategoryForm();
    } catch (error) {
        showCustomAlert('Error', 'Failed to add category: ' + error.message);
    }
}

async function updateCategory() {
    if (!currentCategoryId) return;
    const name = categoryNameInput.value.trim();
    if (!name) {
        showCustomAlert('Input Error', 'Please enter a category name.');
        return;
    }
    try {
        await update(ref(database, `categories/${currentCategoryId}`), { name });
        showCustomAlert('Success', 'Category updated successfully!');
        resetCategoryForm();
    } catch (error) {
        showCustomAlert('Error', 'Failed to update category: ' + error.message);
    }
}

async function deleteCategory(categoryId) {
    showCustomAlert('Confirm Deletion', 'Are you sure you want to delete this category? All products in this category will become unassigned.', true, async () => {
        try {
            await remove(ref(database, `categories/${categoryId}`));
            showCustomAlert('Success', 'Category deleted successfully!');
            resetCategoryForm();
        } catch (error) {
            showCustomAlert('Error', 'Failed to delete category: ' + error.message);
        }
    });
}

function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
        currentCategoryId = categoryId;
        categoryNameInput.value = category.name;
        addCategoryBtn.style.display = 'none';
        updateCategoryBtn.style.display = 'inline-block';
        cancelEditCategoryBtn.style.display = 'inline-block';
    }
}

function renderCategoriesTable() {
    categoryListTableBody.innerHTML = '';
    categories.forEach(category => {
        const row = categoryListTableBody.insertRow();
        row.innerHTML = `
            <td>${category.name}</td>
            <td>
                <button class="admin-button secondary edit-category-btn" data-id="${category.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="admin-button error delete-category-btn" data-id="${category.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
    });

    document.querySelectorAll('.edit-category-btn').forEach(button => {
        button.addEventListener('click', (event) => editCategory(event.target.dataset.id));
    });
    document.querySelectorAll('.delete-category-btn').forEach(button => {
        button.addEventListener('click', (event) => deleteCategory(event.target.dataset.id));
    });

    // Populate product category select
    productCategorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        productCategorySelect.appendChild(option);
    });

    // Populate comparison selects
    compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';
    products.forEach(product => {
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

// New: Render Orders Table
function renderOrdersTable() {
    orderListTableBody.innerHTML = '';
    orders.forEach(order => {
        const row = orderListTableBody.insertRow();
        const orderTime = new Date(order.timestamp).toLocaleString();
        
        let productDetailsHtml = '';
        order.products.forEach(p => {
            productDetailsHtml += `<div>${p.title} (x${p.quantity})</div>`;
        });

        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customerName}<br>(${order.userName})</td>
            <td>${order.customerAddress}</td>
            <td>${order.customerPhone}</td>
            <td>${productDetailsHtml}</td>
            <td>${order.products.reduce((sum, p) => sum + p.quantity, 0)}</td>
            <td>$${order.totalPrice.toFixed(2)}</td>
            <td>${orderTime}</td>
            <td><span style="color: ${order.status === 'Completed' ? 'green' : (order.status === 'Cancelled' ? 'red' : 'orange')}">${order.status || 'Pending'}</span></td>
            <td>
                <button class="admin-button primary set-order-completed-btn" data-id="${order.id}" ${order.status === 'Completed' ? 'disabled' : ''}><i class="fas fa-check-circle"></i> Complete</button>
                <button class="admin-button error set-order-cancelled-btn" data-id="${order.id}" ${order.status === 'Cancelled' ? 'disabled' : ''}><i class="fas fa-times-circle"></i> Cancel</button>
            </td>
        `;
    });

    document.querySelectorAll('.set-order-completed-btn').forEach(button => {
        button.addEventListener('click', (event) => setOrderStatus(event.target.dataset.id, 'Completed'));
    });
    document.querySelectorAll('.set-order-cancelled-btn').forEach(button => {
        button.addEventListener('click', (event) => setOrderStatus(event.target.dataset.id, 'Cancelled'));
    });
}

async function setOrderStatus(orderId, status) {
    try {
        await update(ref(database, `orders/${orderId}`), { status: status });
        showCustomAlert('Order Status Updated', `Order ${orderId} marked as ${status}.`);
    } catch (error) {
        showCustomAlert('Error', 'Failed to update order status: ' + error.message);
    }
}


// --- Chart Functions ---
function renderSalesChart() {
    const salesData = {}; // Date -> Total Sales
    orders.forEach(order => {
        if (order.status === 'Completed') {
            const date = new Date(order.timestamp).toLocaleDateString(); // Group by date
            salesData[date] = (salesData[date] || 0) + order.totalPrice;
        }
    });

    const labels = Object.keys(salesData).sort((a, b) => new Date(a) - new Date(b));
    const data = labels.map(label => salesData[label]);

    if (salesChart) {
        salesChart.destroy();
    }
    salesChart = new Chart(salesChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Sales ($)',
                data: data,
                borderColor: '#17a2b8', // Corresponds to --color-cyan-primary
                backgroundColor: 'rgba(23, 162, 184, 0.2)',
                tension: 0.1,
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
}

function renderProductSalesChart() {
    const productSales = {}; // Product Title -> Total Quantity Sold
    orders.forEach(order => {
        if (order.status === 'Completed' && order.products) {
            order.products.forEach(item => {
                productSales[item.title] = (productSales[item.title] || 0) + item.quantity;
            });
        }
    });

    const labels = Object.keys(productSales);
    const data = labels.map(label => productSales[label]);

    if (productSalesChart) {
        productSalesChart.destroy();
    }
    productSalesChart = new Chart(productSalesChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantity Sold',
                data: data,
                backgroundColor: '#e83e8c', // Corresponds to --color-pink-primary
                borderColor: '#c62a7a',
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
}

function renderProductRatingsChart() {
    const ratingsDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    products.forEach(product => {
        if (product.totalRatings > 0) {
            const averageRating = Math.round(product.sumRatings / product.totalRatings);
            if (ratingsDistribution[averageRating] !== undefined) {
                ratingsDistribution[averageRating]++;
            }
        }
    });

    const labels = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
    const data = labels.map((_, index) => ratingsDistribution[index + 1]);

    if (productRatingsChart) {
        productRatingsChart.destroy();
    }
    productRatingsChart = new Chart(productRatingsChartCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Products',
                data: data,
                backgroundColor: [
                    '#dc3545', // Red for 1 star
                    '#ffc107', // Yellow for 2 stars
                    '#17a2b8', // Cyan for 3 stars
                    '#28a745', // Green for 4 stars
                    '#00BCD4'  // Darker Cyan for 5 stars
                ],
                borderColor: '#fff',
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
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed;
                            }
                            return label + ' products';
                        }
                    }
                }
            }
        }
    });
}


function renderProductComparisonChart(product1Id, product2Id) {
    const product1 = products.find(p => p.id === product1Id);
    const product2 = products.find(p => p.id === product2Id);

    const labels = ['Price', 'Stock', 'Average Rating'];
    const datasets = [];

    // Helper to get average rating, default to 0 if no ratings
    const getAvgRating = (p) => p && p.totalRatings > 0 ? (p.sumRatings / p.totalRatings) : 0;

    if (product1) {
        const data1 = [product1.price, product1.stock, getAvgRating(product1)];
        datasets.push({
            label: product1.title,
            data: data1,
            backgroundColor: 'rgba(0, 188, 212, 0.6)',
            borderColor: '#00BCD4', // Corresponds to --color-cyan-primary
            borderWidth: 1
        });
    }
    if (product2) {
        const data2 = [product2.price, product2.stock, getAvgRating(product2)];
        datasets.push({
            label: product2.title,
            data: data2,
            backgroundColor: 'rgba(233, 30, 99, 0.6)',
            borderColor: '#E91E63', // Corresponds to --color-pink-primary
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
    // This function will be called once authentication is confirmed
    renderCategoriesTable(); // Populates select dropdowns too
    renderProductsTable();
    renderOrdersTable(); // New: Load orders
    renderSalesChart();
    renderProductSalesChart();
    renderProductRatingsChart();
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial check for auth state is handled by onAuthStateChanged
    // No need to call loadAdminData here, as onAuthStateChanged will trigger it
    
    // --- Authentication Event Listeners ---
    adminLoginBtn.addEventListener('click', async () => {
        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showCustomAlert('Login Successful', 'Welcome to the Admin Panel!', false, () => {
                // Modals are closed by showCustomAlert, just ensure display is right
                // onAuthStateChanged will handle showing admin content
            });
        } catch (error) {
            showCustomAlert('Login Failed', error.message);
        }
    });

    adminLogoutLink.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            await signOut(auth);
            showCustomAlert('Logged Out', 'You have been logged out.');
        } catch (error) {
            showCustomAlert('Logout Failed', error.message);
        }
    });

    // --- Product Management Event Listeners ---
    productImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                productImagePreview.src = e.target.result;
                productImagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            productImagePreview.src = '#';
            productImagePreview.style.display = 'none';
        }
    });

    addProductBtn.addEventListener('click', addProduct);
    updateProductBtn.addEventListener('click', updateProduct);
    cancelEditProductBtn.addEventListener('click', resetProductForm);

    // --- Category Management Event Listeners ---
    addCategoryBtn.addEventListener('click', addCategory);
    updateCategoryBtn.addEventListener('click', updateCategory);
    cancelEditCategoryBtn.addEventListener('click', resetCategoryForm);

    // --- Analytics Event Listeners ---
    compareProductsBtn.addEventListener('click', () => {
        const product1Id = compareProduct1Select.value;
        const product2Id = compareProduct2Select.value;
        if (product1Id || product2Id) {
            renderProductComparisonChart(product1Id, product2Id);
        } else {
            showCustomAlert('Selection Needed', 'Please select at least one product to compare.');
        }
    });

    // --- Navigation Event Listeners ---
    const allSections = document.querySelectorAll('main section, #admin-content > div, .iframe-container');
    const navLinks = document.querySelectorAll('.main-nav a');

    function hideAllSections() {
        allSections.forEach(section => {
            section.style.display = 'none';
        });
    }

    // Set initial display for auth section
    authSection.style.display = 'flex'; // Always visible until authenticated

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            if (targetId === 'home') {
                // Special handling for home to show all main content
                hideAllSections();
                productManagementSection.style.display = 'block';
                categoryManagementSection.style.display = 'block';
                orderManagementSection.style.display = 'block';
                analyticsSection.style.display = 'block';
                document.querySelector('.iframe-container').style.display = 'block'; // Assuming this is part of home view
                // Re-render charts on "home" view load to ensure they are drawn correctly
                renderSalesChart();
                renderProductSalesChart();
                renderProductRatingsChart();
                // Destroy and re-create comparison chart if products are selected
                const product1Id = compareProduct1Select.value;
                const product2Id = compareProduct2Select.value;
                if (product1Id || product2Id) {
                    renderProductComparisonChart(product1Id, product2Id);
                }
            } else if (targetId) {
                hideAllSections();
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            }
        });
    });

    // Initial section display based on URL hash
    const initialHash = window.location.hash.substring(1);
    if (initialHash && document.getElementById(initialHash)) {
        hideAllSections();
        document.getElementById(initialHash).style.display = 'block';
    } else {
        // Default to showing all admin content if no hash or invalid hash
        // This is handled by onAuthStateChanged after successful login
    }
});


// --- Firebase Listeners ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in (admin)
        adminEmailDisplay.textContent = user.email;
        authSection.style.display = 'none'; // Hide login form
        adminContent.style.display = 'block'; // Show admin content

        // Show navigation links
        productManagementLink.style.display = 'block';
        categoryManagementLink.style.display = 'block';
        orderManagementLink.style.display = 'block'; // New
        analyticsLink.style.display = 'block';
        adminLogoutLink.style.display = 'block';

        // Load all admin data after successful login
        loadAdminData();

        // Default to showing all main content sections on login
        productManagementSection.style.display = 'block';
        categoryManagementSection.style.display = 'block';
        orderManagementSection.style.display = 'block';
        analyticsSection.style.display = 'block';
        document.querySelector('.iframe-container').style.display = 'block'; // Show the iframe

    } else {
        // User is signed out
        adminEmailDisplay.textContent = '';
        authSection.style.display = 'flex'; // Show login form
        adminContent.style.display = 'none'; // Hide admin content

        // Hide navigation links
        productManagementLink.style.display = 'none';
        categoryManagementLink.style.display = 'none';
        orderManagementLink.style.display = 'none'; // New
        analyticsLink.style.display = 'none';
        adminLogoutLink.style.display = 'none';

        // Hide all admin sections if logged out
        document.querySelectorAll('main section').forEach(section => {
            section.style.display = 'none';
        });
    }
});

onValue(productsRef, (snapshot) => {
    products = [];
    snapshot.forEach((childSnapshot) => {
        products.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    renderProductsTable();
    // Re-render charts that depend on products data
    renderProductSalesChart();
    renderProductRatingsChart();
    
    // Update comparison select options and re-render if selected products exist
    compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';
    products.forEach(product => {
        const option1 = document.createElement('option');
        option1.value = product.id;
        option1.textContent = product.title;
        compareProduct1Select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = product.id;
        option2.textContent = product.title;
        compareProduct2Select.appendChild(option2);
    });

    // Retain previously selected comparison products if they still exist
    const selected1 = compareProduct1Select.dataset.selectedId;
    const selected2 = compareProduct2Select.dataset.selectedId;
    if (selected1 && products.some(p => p.id === selected1)) {
        compareProduct1Select.value = selected1;
    }
    if (selected2 && products.some(p => p.id === selected2)) {
        compareProduct2Select.value = selected2;
    }
    
    // Re-render comparison chart if products are still selected
    if ((compareProduct1Select.value && compareProduct1Select.value !== '') || (compareProduct2Select.value && compareProduct2Select.value !== '')) {
        renderProductComparisonChart(compareProduct1Select.value, compareProduct2Select.value);
    }
});

onValue(categoriesRef, (snapshot) => {
    categories = [];
    snapshot.forEach((childSnapshot) => {
        categories.push({ id: childSnapshot.key, name: childSnapshot.val().name });
    });
    renderCategoriesTable();
});

onValue(ordersRef, (snapshot) => {
    orders = [];
    snapshot.forEach((childSnapshot) => {
        orders.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    orders.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
    renderOrdersTable();
    renderSalesChart(); // Re-render sales chart as orders change
    renderProductSalesChart(); // Re-render product sales chart as orders change
});
