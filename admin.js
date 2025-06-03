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
  appId: "G-TT31HC3NZ3" // Updated to match the server-fetched ID from your logs
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// DOM Elements
const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const adminConsole = document.getElementById('admin-console');
const logoutBtn = document.getElementById('logout-btn');

// Sidebar Navigation
const sidebar = document.querySelector('.sidebar');
const navLinks = document.querySelectorAll('.nav-link');
const mainContentSections = document.querySelectorAll('.main-content-section');

// Category Management
const categoryNameInput = document.getElementById('category-name');
const addCategoryBtn = document.getElementById('add-category-btn');
const categoryList = document.getElementById('category-list');
const categorySelectProduct = document.getElementById('category-select-product');
const categorySelectFilter = document.getElementById('category-select-filter');
const categorySelectEdit = document.getElementById('edit-category-select'); // For editing categories
const editCategoryNameInput = document.getElementById('edit-category-name'); // For editing categories
const updateCategoryBtn = document.getElementById('update-category-btn'); // For editing categories
const deleteCategoryBtn = document.getElementById('delete-category-btn'); // For editing categories
const manageCategoriesSection = document.getElementById('manage-categories');

// Product Management
const addProductForm = document.getElementById('add-product-form');
const productNameInput = document.getElementById('product-name');
const productDescriptionInput = document.getElementById('product-description');
const productPriceInput = document.getElementById('product-price');
const productStockInput = document.getElementById('product-stock');
const productCategorySelect = document.getElementById('product-category');
const productImageUrlInput = document.getElementById('product-image-url');
const productVideoUrlInput = document.getElementById('product-video-url');
const productImageUpload = document.getElementById('product-image-upload');
const addProductBtn = document.getElementById('add-product-btn');
const productList = document.getElementById('product-list');
const productSearchInput = document.getElementById('product-search');
const productSortSelect = document.getElementById('product-sort');

// Edit Product Modal Elements
const editProductModal = document.getElementById('edit-product-modal');
const closeEditProductModalBtn = document.querySelector('#edit-product-modal .close-button');
const editProductId = document.getElementById('edit-product-id');
const editProductNameInput = document.getElementById('edit-product-name');
const editProductDescriptionInput = document.getElementById('edit-product-description');
const editProductPriceInput = document.getElementById('edit-product-price');
const editProductStockInput = document.getElementById('edit-product-stock');
const editProductCategorySelect = document.getElementById('edit-product-category');
const editProductImageUrlInput = document.getElementById('edit-product-image-url');
const editProductVideoUrlInput = document.getElementById('edit-product-video-url');
const editProductImageUpload = document.getElementById('edit-product-image-upload');
const updateProductBtn = document.getElementById('update-product-btn');
const deleteProductBtn = document.getElementById('delete-product-btn');
const currentProductImage = document.getElementById('current-product-image'); // To show current image
const currentProductVideo = document.getElementById('current-product-video'); // To show current video

// Order Management
const orderList = document.getElementById('order-list');
const orderStatusFilter = document.getElementById('order-status-filter');
const orderSearchInput = document.getElementById('order-search');

// Analytics & Reports
const totalRevenueSpan = document.getElementById('total-revenue');
const totalProductsSpan = document.getElementById('total-products');
const totalOrdersSpan = document.getElementById('total-orders');
const totalCustomersSpan = document.getElementById('total-customers');
const salesChartCanvas = document.getElementById('salesChart');
const productSalesChartCanvas = document.getElementById('productSalesChart');
const categorySalesChartCanvas = document.getElementById('categorySalesChart');
const productComparisonChartCanvas = document.getElementById('productComparisonChart');
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');

// Custom Alert Modal
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


// Global variables to store data
let allProducts = [];
let allCategories = [];
let allOrders = [];
let allRatings = []; // Ensure allRatings is initialized globally

let salesChart;
let productSalesChart;
let categorySalesChart;
let productComparisonChart;

// --- Authentication ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        authSection.style.display = 'none';
        adminConsole.style.display = 'flex';
        console.log("[Admin] User logged in.");
        loadAdminData(); // Load data once logged in
        // Select the first sidebar link by default
        if (navLinks.length > 0) {
            navLinks[0].click();
        }
    } else {
        // User is signed out
        authSection.style.display = 'flex';
        adminConsole.style.display = 'none';
        console.log("[Admin] User logged out.");
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            console.log("Logged in as:", userCredential.user.email);
            errorMessage.textContent = '';
        })
        .catch((error) => {
            const errorCode = error.code;
            const message = error.message;
            console.error("Login Error:", errorCode, message);
            errorMessage.textContent = `Login failed: ${message}`;
        });
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        // Sign-out successful.
        console.log("User signed out.");
        // Clear forms/lists on logout
        loginForm.reset();
        categoryNameInput.value = '';
        productNameInput.value = '';
        // Clear displayed data
        categoryList.innerHTML = '';
        productList.innerHTML = '';
        orderList.innerHTML = '';
        // Destroy charts to prevent issues on re-login
        if (salesChart) salesChart.destroy();
        if (productSalesChart) productSalesChart.destroy();
        if (categorySalesChart) categorySalesChart.destroy();
        if (productComparisonChart) productComparisonChart.destroy();

    }).catch((error) => {
        console.error("Logout Error:", error);
    });
});


// --- Sidebar Navigation ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links
        navLinks.forEach(nav => nav.classList.remove('active'));
        // Add active class to clicked link
        e.currentTarget.classList.add('active');

        // Hide all main content sections
        mainContentSections.forEach(section => section.style.display = 'none');

        // Show the target section
        const targetId = e.currentTarget.dataset.target;
        document.getElementById(targetId).style.display = 'block';

        // Specific actions for analytics section to re-render charts
        if (targetId === 'analytics-reports') {
            updateAnalytics();
        }
    });
});

// --- Category Management ---
addCategoryBtn.addEventListener('click', () => {
    const categoryName = categoryNameInput.value.trim();
    if (categoryName) {
        const categoryRef = ref(database, 'categories');
        const newCategoryRef = push(categoryRef);
        set(newCategoryRef, {
            name: categoryName
        })
        .then(() => {
            console.log("Category added successfully!");
            showAlert('Success', 'Category added successfully!');
            categoryNameInput.value = ''; // Clear input
        })
        .catch((error) => {
            console.error("Error adding category:", error);
            showAlert('Error', `Error adding category: ${error.message}`);
        });
    } else {
        showAlert('Warning', 'Category name cannot be empty.');
    }
});

function populateCategorySelect() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        allCategories = []; // Clear previous categories
        categorySelectProduct.innerHTML = '<option value="">Select Category</option>'; // For adding products
        categorySelectFilter.innerHTML = '<option value="">All Categories</option>'; // For filtering products
        productCategorySelect.innerHTML = '<option value="">Select Category</option>'; // For add product form
        editProductCategorySelect.innerHTML = '<option value="">Select Category</option>'; // For edit product form
        categorySelectEdit.innerHTML = '<option value="">Select Category to Edit</option>'; // For edit category form

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const category = childSnapshot.val();
                category.id = childSnapshot.key;
                allCategories.push(category);

                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;

                categorySelectProduct.appendChild(option.cloneNode(true));
                categorySelectFilter.appendChild(option.cloneNode(true));
                productCategorySelect.appendChild(option.cloneNode(true));
                editProductCategorySelect.appendChild(option.cloneNode(true));
                categorySelectEdit.appendChild(option.cloneNode(true));
            });
        }
        displayCategories();
        // After categories are loaded, re-populate product category selects
        loadProducts(); // This will ensure products are displayed with correct categories
        // Also update product comparison selects
        populateProductComparisonSelects();
    });
}

function displayCategories() {
    categoryList.innerHTML = ''; // Clear current list
    allCategories.forEach(category => {
        const li = document.createElement('li');
        li.textContent = category.name;
        categoryList.appendChild(li);
    });
}

// Event listener for category selection change in edit section
categorySelectEdit.addEventListener('change', (e) => {
    const selectedCategoryId = e.target.value;
    if (selectedCategoryId) {
        const selectedCategory = allCategories.find(cat => cat.id === selectedCategoryId);
        if (selectedCategory) {
            editCategoryNameInput.value = selectedCategory.name;
            updateCategoryBtn.disabled = false;
            deleteCategoryBtn.disabled = false;
        }
    } else {
        editCategoryNameInput.value = '';
        updateCategoryBtn.disabled = true;
        deleteCategoryBtn.disabled = true;
    }
});

updateCategoryBtn.addEventListener('click', () => {
    const selectedCategoryId = categorySelectEdit.value;
    const newCategoryName = editCategoryNameInput.value.trim();

    if (selectedCategoryId && newCategoryName) {
        const categoryRef = ref(database, `categories/${selectedCategoryId}`);
        update(categoryRef, { name: newCategoryName })
            .then(() => {
                showAlert('Success', 'Category updated successfully!');
            })
            .catch((error) => {
                console.error('Error updating category:', error);
                showAlert('Error', `Error updating category: ${error.message}`);
            });
    } else {
        showAlert('Warning', 'Please select a category and enter a new name.');
    }
});

deleteCategoryBtn.addEventListener('click', () => {
    const selectedCategoryId = categorySelectEdit.value;

    if (selectedCategoryId) {
        showConfirm('Confirm Deletion', 'Are you sure you want to delete this category? This action cannot be undone and will not automatically delete associated products.', () => {
            const categoryRef = ref(database, `categories/${selectedCategoryId}`);
            remove(categoryRef)
                .then(() => {
                    showAlert('Success', 'Category deleted successfully!');
                    categorySelectEdit.value = '';
                    editCategoryNameInput.value = '';
                    updateCategoryBtn.disabled = true;
                    deleteCategoryBtn.disabled = true;
                })
                .catch((error) => {
                    console.error('Error deleting category:', error);
                    showAlert('Error', `Error deleting category: ${error.message}`);
                });
        });
    } else {
        showAlert('Warning', 'Please select a category to delete.');
    }
});


// --- Product Management ---
addProductForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = productNameInput.value.trim();
    const description = productDescriptionInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const stock = parseInt(productStockInput.value);
    const categoryId = productCategorySelect.value;
    let imageUrl = productImageUrlInput.value.trim();
    const videoUrl = productVideoUrlInput.value.trim();
    const imageFile = productImageUpload.files[0];

    if (!name || !description || isNaN(price) || isNaN(stock) || !categoryId) {
        showAlert('Warning', 'Please fill in all required product fields.');
        return;
    }

    if (imageFile) {
        const storageRefPath = storageRef(storage, `product_images/${imageFile.name}`);
        uploadBytes(storageRefPath, imageFile).then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downloadURL) => {
                imageUrl = downloadURL;
                saveProduct(name, description, price, stock, categoryId, imageUrl, videoUrl);
            });
        }).catch((error) => {
            console.error("Error uploading image:", error);
            showAlert('Error', `Error uploading image: ${error.message}`);
        });
    } else {
        saveProduct(name, description, price, stock, categoryId, imageUrl, videoUrl);
    }
});

function saveProduct(name, description, price, stock, categoryId, imageUrl, videoUrl) {
    const productsRef = ref(database, 'products');
    const newProductRef = push(productsRef);
    set(newProductRef, {
        name,
        description,
        price,
        stock,
        categoryId,
        imageUrl: imageUrl || '', // Save empty string if no URL
        videoUrl: videoUrl || '', // Save empty string if no URL
        createdAt: serverTimestamp()
    })
    .then(() => {
        showAlert('Success', 'Product added successfully!');
        addProductForm.reset(); // Clear form
        productImageUpload.value = ''; // Clear file input
    })
    .catch((error) => {
        console.error("Error adding product:", error);
        showAlert('Error', `Error adding product: ${error.message}`);
    });
}

function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        allProducts = []; // Clear current products
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const product = childSnapshot.val();
                product.id = childSnapshot.key;
                allProducts.push(product);
            });
        }
        filterAndDisplayProducts();
    });
}

productSearchInput.addEventListener('input', filterAndDisplayProducts);
productSortSelect.addEventListener('change', filterAndDisplayProducts);
categorySelectFilter.addEventListener('change', filterAndDisplayProducts);

function filterAndDisplayProducts() {
    let filteredProducts = [...allProducts];
    const searchTerm = productSearchInput.value.toLowerCase();
    const sortBy = productSortSelect.value;
    const filterCategory = categorySelectFilter.value;

    // Filter by search term
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }

    // Filter by category
    if (filterCategory) {
        filteredProducts = filteredProducts.filter(product => product.categoryId === filterCategory);
    }

    // Sort products
    if (sortBy === 'name-asc') {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock-asc') {
        filteredProducts.sort((a, b) => a.stock - b.stock);
    } else if (sortBy === 'stock-desc') {
        filteredProducts.sort((a, b) => b.stock - a.stock);
    }

    displayProducts(filteredProducts);
}

function displayProducts(productsToDisplay) {
    productList.innerHTML = ''; // Clear current list

    if (productsToDisplay.length === 0) {
        productList.innerHTML = '<p>No products found.</p>';
        return;
    }

    productsToDisplay.forEach(product => {
        const category = allCategories.find(cat => cat.id === product.categoryId);
        const categoryName = category ? category.name : 'Unknown Category';

        const li = document.createElement('li');
        li.className = 'product-card';
        li.dataset.id = product.id; // Set data-id for selection/editing

        li.innerHTML = `
            <img src="${product.imageUrl || 'https://via.placeholder.com/100'}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h4>${product.name}</h4>
                <p><strong>Category:</strong> ${categoryName}</p>
                <p><strong>Price:</strong> $${product.price.toFixed(2)}</p>
                <p><strong>Stock:</strong> ${product.stock}</p>
                <p><strong>Rating:</strong> <span class="product-rating-average">N/A</span></p>
            </div>
            <div class="product-actions">
                <button class="admin-button secondary edit-product-btn" data-id="${product.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        `;
        productList.appendChild(li);
    });

    // Update product ratings after products are displayed
    updateProductRatingsDisplay();

    // Attach event listeners to new edit buttons
    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            openEditProductModal(productId);
        });
    });
}

function openEditProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        editProductId.value = product.id;
        editProductNameInput.value = product.name;
        editProductDescriptionInput.value = product.description;
        editProductPriceInput.value = product.price;
        editProductStockInput.value = product.stock;
        editProductCategorySelect.value = product.categoryId;
        editProductImageUrlInput.value = product.imageUrl;
        editProductVideoUrlInput.value = product.videoUrl;

        // Display current image/video if available
        if (product.imageUrl) {
            currentProductImage.src = product.imageUrl;
            currentProductImage.style.display = 'block';
        } else {
            currentProductImage.src = '';
            currentProductImage.style.display = 'none';
        }

        if (product.videoUrl) {
            currentProductVideo.src = product.videoUrl;
            currentProductVideo.style.display = 'block';
        } else {
            currentProductVideo.src = '';
            currentProductVideo.style.display = 'none';
        }

        editProductModal.style.display = 'block';
    } else {
        showAlert('Error', 'Product not found.');
    }
}

closeEditProductModalBtn.addEventListener('click', () => {
    editProductModal.style.display = 'none';
    editProductImageUpload.value = ''; // Clear file input
});

window.addEventListener('click', (event) => {
    if (event.target === editProductModal) {
        editProductModal.style.display = 'none';
        editProductImageUpload.value = ''; // Clear file input
    }
});

updateProductBtn.addEventListener('click', () => {
    const productId = editProductId.value;
    const name = editProductNameInput.value.trim();
    const description = editProductDescriptionInput.value.trim();
    const price = parseFloat(editProductPriceInput.value);
    const stock = parseInt(editProductStockInput.value);
    const categoryId = editProductCategorySelect.value;
    let imageUrl = editProductImageUrlInput.value.trim();
    const videoUrl = editProductVideoUrlInput.value.trim();
    const imageFile = editProductImageUpload.files[0];

    if (!name || !description || isNaN(price) || isNaN(stock) || !categoryId) {
        showAlert('Warning', 'Please fill in all required product fields.');
        return;
    }

    const productRef = ref(database, `products/${productId}`);

    const updateData = {
        name,
        description,
        price,
        stock,
        categoryId,
        videoUrl: videoUrl || ''
    };

    if (imageFile) {
        const storageRefPath = storageRef(storage, `product_images/${imageFile.name}`);
        uploadBytes(storageRefPath, imageFile).then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downloadURL) => {
                updateData.imageUrl = downloadURL;
                update(productRef, updateData)
                    .then(() => {
                        showAlert('Success', 'Product updated successfully!');
                        editProductModal.style.display = 'none';
                        editProductImageUpload.value = ''; // Clear file input
                    })
                    .catch((error) => {
                        console.error("Error updating product with new image:", error);
                        showAlert('Error', `Error updating product: ${error.message}`);
                    });
            });
        }).catch((error) => {
            console.error("Error uploading new image for product:", error);
            showAlert('Error', `Error uploading image: ${error.message}`);
        });
    } else {
        // If no new image file, use existing imageUrl or set to empty if cleared
        updateData.imageUrl = imageUrl || '';
        update(productRef, updateData)
            .then(() => {
                showAlert('Success', 'Product updated successfully!');
                editProductModal.style.display = 'none';
            })
            .catch((error) => {
                console.error("Error updating product:", error);
                showAlert('Error', `Error updating product: ${error.message}`);
            });
    }
});

deleteProductBtn.addEventListener('click', () => {
    const productId = editProductId.value;

    if (productId) {
        showConfirm('Confirm Deletion', 'Are you sure you want to delete this product? This action cannot be undone.', () => {
            const productRef = ref(database, `products/${productId}`);
            remove(productRef)
                .then(() => {
                    showAlert('Success', 'Product deleted successfully!');
                    editProductModal.style.display = 'none';
                })
                .catch((error) => {
                    console.error('Error deleting product:', error);
                    showAlert('Error', `Error deleting product: ${error.message}`);
                });
        });
    } else {
        showAlert('Warning', 'No product selected for deletion.');
    }
});

// --- Order Management ---
function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        allOrders = []; // Clear current orders
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                order.id = childSnapshot.key;
                allOrders.push(order);
            });
        }
        filterAndDisplayOrders();
    });
}

orderSearchInput.addEventListener('input', filterAndDisplayOrders);
orderStatusFilter.addEventListener('change', filterAndDisplayOrders);

function filterAndDisplayOrders() {
    let filteredOrders = [...allOrders];
    const searchTerm = orderSearchInput.value.toLowerCase();
    const filterStatus = orderStatusFilter.value;

    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order =>
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.email.toLowerCase().includes(searchTerm) ||
            order.id.toLowerCase().includes(searchTerm) ||
            order.products.some(item => item.name.toLowerCase().includes(searchTerm))
        );
    }

    if (filterStatus) {
        filteredOrders = filteredOrders.filter(order => order.status === filterStatus);
    }

    displayOrders(filteredOrders);
}

function displayOrders(ordersToDisplay) {
    orderList.innerHTML = ''; // Clear current list

    if (ordersToDisplay.length === 0) {
        orderList.innerHTML = '<p>No orders found.</p>';
        return;
    }

    ordersToDisplay.forEach(order => {
        const orderDate = new Date(order.timestamp).toLocaleString();
        const li = document.createElement('li');
        li.className = 'order-card';
        li.innerHTML = `
            <h4>Order ID: ${order.id}</h4>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Email:</strong> ${order.email}</p>
            <p><strong>Date:</strong> ${orderDate}</p>
            <p><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
            <p><strong>Status:</strong>
                <select class="order-status-select" data-order-id="${order.id}">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </p>
            <div class="order-products-details">
                <h5>Products:</h5>
                <ul>
                    ${order.products.map(item => `<li>${item.name} (x${item.quantity}) - $${item.price.toFixed(2)}</li>`).join('')}
                </ul>
            </div>
            <button class="admin-button secondary delete-order-btn" data-id="${order.id}">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        `;
        orderList.appendChild(li);
    });

    // Attach event listeners for status change
    document.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const orderId = e.currentTarget.dataset.orderId;
            const newStatus = e.currentTarget.value;
            const orderRef = ref(database, `orders/${orderId}`);
            update(orderRef, { status: newStatus })
                .then(() => showAlert('Success', `Order ${orderId} status updated to ${newStatus}`))
                .catch(error => showAlert('Error', `Failed to update order status: ${error.message}`));
        });
    });

    // Attach event listeners for delete buttons
    document.querySelectorAll('.delete-order-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = e.currentTarget.dataset.id;
            showConfirm('Confirm Deletion', 'Are you sure you want to delete this order? This action cannot be undone.', () => {
                const orderRef = ref(database, `orders/${orderId}`);
                remove(orderRef)
                    .then(() => showAlert('Success', 'Order deleted successfully!'))
                    .catch(error => showAlert('Error', `Failed to delete order: ${error.message}`));
            });
        });
    });
}

// --- Analytics & Reports ---
function updateAnalytics() {
    calculateSummaryStatistics();
    drawSalesChart();
    drawProductSalesChart();
    drawCategorySalesChart();
    populateProductComparisonSelects(); // Ensure selects are populated for comparison
}

function calculateSummaryStatistics() {
    totalProductsSpan.textContent = allProducts.length;
    totalOrdersSpan.textContent = allOrders.length;

    let totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    totalRevenueSpan.textContent = `$${totalRevenue.toFixed(2)}`;

    // Calculate total customers (unique emails)
    const uniqueCustomers = new Set(allOrders.map(order => order.email));
    totalCustomersSpan.textContent = uniqueCustomers.size;
}

function drawSalesChart() {
    if (salesChart) salesChart.destroy();

    const salesData = {}; // Format: { "YYYY-MM-DD": totalSales }
    allOrders.forEach(order => {
        const orderDate = new Date(order.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
        salesData[orderDate] = (salesData[orderDate] || 0) + order.totalAmount;
    });

    const dates = Object.keys(salesData).sort();
    const totals = dates.map(date => salesData[date]);

    salesChart = new Chart(salesChartCanvas, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Daily Sales',
                data: totals,
                borderColor: '#00BCD4',
                backgroundColor: 'rgba(0, 188, 212, 0.2)',
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

function drawProductSalesChart() {
    if (productSalesChart) productSalesChart.destroy();

    const productSales = {}; // Format: { productName: totalQuantitySold }
    allOrders.forEach(order => {
        order.products.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
    });

    const productNames = Object.keys(productSales);
    const quantitiesSold = productNames.map(name => productSales[name]);

    productSalesChart = new Chart(productSalesChartCanvas, {
        type: 'bar',
        data: {
            labels: productNames,
            datasets: [{
                label: 'Quantity Sold',
                data: quantitiesSold,
                backgroundColor: '#E91E63',
                borderColor: '#C2185B',
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

function drawCategorySalesChart() {
    if (categorySalesChart) categorySalesChart.destroy();

    const categorySales = {}; // Format: { categoryName: totalRevenue }
    allOrders.forEach(order => {
        order.products.forEach(item => {
            const product = allProducts.find(p => p.id === item.productId);
            if (product) {
                const category = allCategories.find(cat => cat.id === product.categoryId);
                if (category) {
                    const revenue = item.quantity * item.price;
                    categorySales[category.name] = (categorySales[category.name] || 0) + revenue;
                }
            }
        });
    });

    const categoryNames = Object.keys(categorySales);
    const revenues = categoryNames.map(name => categorySales[name]);

    categorySalesChart = new Chart(categorySalesChartCanvas, {
        type: 'doughnut',
        data: {
            labels: categoryNames,
            datasets: [{
                label: 'Revenue by Category',
                data: revenues,
                backgroundColor: [
                    'rgba(0, 188, 212, 0.8)', // Cyan
                    'rgba(233, 30, 99, 0.8)',  // Pink
                    'rgba(76, 175, 80, 0.8)',  // Green
                    'rgba(255, 152, 0, 0.8)',  // Orange
                    'rgba(156, 39, 176, 0.8)', // Purple
                    'rgba(33, 150, 243, 0.8)'  // Blue
                ],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}


function populateProductComparisonSelects() {
    // Clear previous options
    compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';

    allProducts.forEach(product => {
        const option1 = document.createElement('option');
        option1.value = product.id;
        option1.textContent = product.name;
        compareProduct1Select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = product.id;
        option2.textContent = product.name;
        compareProduct2Select.appendChild(option2);
    });
}

compareProductsBtn.addEventListener('click', () => {
    const product1Id = compareProduct1Select.value;
    const product2Id = compareProduct2Select.value;

    if (!product1Id || !product2Id) {
        showAlert('Warning', 'Please select two products to compare.');
        return;
    }

    if (product1Id === product2Id) {
        showAlert('Warning', 'Please select two different products to compare.');
        return;
    }

    drawProductComparisonChart(product1Id, product2Id);
});

function drawProductComparisonChart(product1Id, product2Id) {
    const product1 = allProducts.find(p => p.id === product1Id);
    const product2 = allProducts.find(p => p.id === product2Id);

    if (!product1 || !product2) {
        showAlert('Error', 'Selected products not found.');
        return;
    }

    const labels = ['Price', 'Stock', 'Average Rating'];
    const data1 = [
        product1.price,
        product1.stock,
        calculateAverageRatingForProduct(product1.id)
    ];
    const data2 = [
        product2.price,
        product2.stock,
        calculateAverageRatingForProduct(product2.id)
    ];

    const datasets = [];
    if (product1) {
        datasets.push({
            label: product1.title, // Assuming product object has 'title' or 'name' property
            data: data1,
            backgroundColor: 'rgba(0, 188, 212, 0.6)',
            borderColor: '#17a2b8', // Corresponds to --color-cyan-primary
            borderWidth: 1
        });
    }
    if (product2) {
        datasets.push({
            label: product2.title, // Assuming product object has 'title' or 'name' property
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

function calculateAverageRatingForProduct(productId) {
    const productRatings = allRatings.filter(rating => rating.productId === productId);
    let totalStars = 0;
    let numRatings = 0;

    if (Array.isArray(productRatings)) {
        productRatings.forEach(rating => {
            if (rating && typeof rating.stars === 'number') {
                totalStars += rating.stars;
                numRatings++;
            }
        });
    }

    return numRatings > 0 ? (totalStars / numRatings) : 0;
}


function loadRatings() {
    const ratingsRef = ref(database, 'ratings');
    onValue(ratingsRef, (snapshot) => {
        allRatings = []; // Clear previous ratings
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const rating = childSnapshot.val();
                rating.id = childSnapshot.key;
                allRatings.push(rating);
            });
        }
        updateProductRatingsDisplay(); // Call this after ratings are loaded
    }, (error) => {
        console.error("Error loading ratings:", error); // Added error logging for debugging
    });
}

function updateProductRatingsDisplay() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        if (snapshot.exists()) {
            const productsData = snapshot.val();
            for (const productId in productsData) {
                const product = productsData[productId];
                const productRatings = allRatings.filter(rating => rating.productId === productId);

                let totalStars = 0;
                let numRatings = 0;

                // Safely iterate over productRatings and access 'stars'
                if (Array.isArray(productRatings)) {
                    productRatings.forEach(rating => {
                        if (rating && typeof rating.stars === 'number') {
                            totalStars += rating.stars;
                            numRatings++;
                        }
                    });
                }

                const averageRating = numRatings > 0 ? (totalStars / numRatings) : 0;

                // Update UI for each product
                const productElement = document.querySelector(`.product-card[data-id="${productId}"] .product-rating-average`);
                if (productElement) {
                    productElement.textContent = averageRating.toFixed(1);
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


// --- Custom Alert/Confirm Modals ---
function showAlert(title, message) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customModalCancelBtn.style.display = 'none'; // Hide cancel button for alerts
    customAlertModal.style.display = 'block';
    customModalOkBtn.onclick = () => {
        customAlertModal.style.display = 'none';
    };
}

function showConfirm(title, message, onConfirm) {
    customModalTitle.textContent = title;
    customModalMessage.textContent = message;
    customModalCancelBtn.style.display = 'inline-block'; // Show cancel button for confirms
    customAlertModal.style.display = 'block';

    customModalOkBtn.onclick = () => {
        customAlertModal.style.display = 'none';
        if (onConfirm) {
            onConfirm();
        }
    };

    customModalCancelBtn.onclick = () => {
        customAlertModal.style.display = 'none';
    };
}


document.addEventListener('DOMContentLoaded', () => {
    // Initial check for auth state is handled by onAuthStateChanged
    // No need to call loadAdminData here, as onAuthStateChanged will trigger it after successful login.
});
