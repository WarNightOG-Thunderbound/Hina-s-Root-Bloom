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
  appId: "1:967448486557:web:fb730596395b0986701b3b",
  measurementId: "G-9D72L3W4Z6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements ---
// Admin Section
const adminContent = document.getElementById('admin-content');
const adminLogoutButton = document.getElementById('admin-logout-button');

// Dashboard elements
const totalProductsSpan = document.getElementById('total-products');
const totalOrdersSpan = document.getElementById('total-orders');
const pendingOrdersSpan = document.getElementById('pending-orders');
const totalUsersSpan = document.getElementById('total-users');
const salesChartCanvas = document.getElementById('salesChart');
let salesChart; // To hold the Chart.js instance

// Product Management elements
const productTitleInput = document.getElementById('product-title');
const productCategorySelect = document.getElementById('product-category');
const productPriceInput = document.getElementById('product-price');
const productDescriptionTextarea = document.getElementById('product-description');
const productImageInput = document.getElementById('product-image');
const productVideoUrlInput = document.getElementById('product-video-url');
const addProductButton = document.getElementById('add-product-button');
const updateProductButton = document.getElementById('update-product-button');
const cancelEditProductButton = document.getElementById('cancel-edit-product-button');
const productsTableBody = document.getElementById('products-table-body');

// Order Management elements
const ordersTableBody = document.getElementById('orders-table-body');

// Category Management elements
const categoryNameInput = document.getElementById('category-name');
const addCategoryButton = document.getElementById('add-category-button');
const categoriesTableBody = document.getElementById('categories-table-body');

// User Management elements
const usersTableBody = document.getElementById('users-table-body');

// Modals
const orderDetailsModal = document.getElementById('order-details-modal');
const closeOrderDetailsModalBtn = document.getElementById('close-order-details-modal-btn');
const detailOrderId = document.getElementById('detail-order-id');
const detailUserEmail = document.getElementById('detail-user-email');
const detailAddress = document.getElementById('detail-address');
const detailPhoneNumber = document.getElementById('detail-phone-number');
const detailOrderDate = document.getElementById('detail-order-date');
const detailOrderStatus = document.getElementById('detail-order-status');
const detailProductImage = document.getElementById('detail-product-image');
const detailProductTitle = document.getElementById('detail-product-title');
const detailProductPrice = document.getElementById('detail-product-price');
const markShippedBtn = document.getElementById('mark-shipped-btn');
const markDeliveredBtn = document.getElementById('mark-delivered-btn');
const cancelOrderBtn = document.getElementById('cancel-order-btn');

// Custom Alert/Login Modal elements for Admin
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn'); // Though not always displayed
const authEmailInput = document.getElementById('auth-email-input');
const authPasswordInput = document.getElementById('auth-password-input');

// Product Comparison elements
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');
const comparisonResultsDiv = document.getElementById('comparison-results');


let editingProductId = null;
let currentOrderIdForDetails = null; // To store the order ID when viewing details

// --- Utility Functions ---

/**
 * Displays a custom alert/confirmation modal specifically for admin panel.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message content of the modal.
 * @param {boolean} isConfirm - If true, displays a cancel button.
 * @param {boolean} showAuthInputs - If true, displays email and password input fields.
 * @returns {Promise<boolean|object>} Resolves to true/false for confirm, or an object {email, password} for auth inputs.
 */
function showCustomAlert(title, message, isConfirm = false, showAuthInputs = false) {
    return new Promise((resolve) => {
        customModalTitle.textContent = title;
        customModalMessage.textContent = message;

        authEmailInput.style.display = showAuthInputs ? 'block' : 'none';
        authPasswordInput.style.display = showAuthInputs ? 'block' : 'none';
        
        // Clear previous input values if showing auth inputs
        if (showAuthInputs) {
            authEmailInput.value = '';
            authPasswordInput.value = '';
        }

        customModalOkBtn.textContent = showAuthInputs ? 'Login' : 'OK'; // Change button text
        customModalCancelBtn.style.display = isConfirm ? 'block' : 'none';

        customAlertModal.classList.add('active'); // Show modal

        const handleOk = () => {
            customAlertModal.classList.remove('active');
            customModalOkBtn.removeEventListener('click', handleOk);
            customModalCancelBtn.removeEventListener('click', handleCancel);

            if (showAuthInputs) {
                resolve({ email: authEmailInput.value, password: authPasswordInput.value });
            } else {
                resolve(true);
            }
        };

        const handleCancel = () => {
            customAlertModal.classList.remove('active');
            customModalOkBtn.removeEventListener('click', handleOk);
            customModalCancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };

        customModalOkBtn.addEventListener('click', handleOk);
        if (isConfirm) {
            customModalCancelBtn.addEventListener('click', handleCancel);
        }
    });
}


// --- Authentication Functions ---

/**
 * Handles admin login. This function is called when the admin page loads and no admin is authenticated,
 * or when the login button in the admin login modal is clicked.
 */
async function adminLogin() {
    // Show the login modal and wait for user input
    const { email, password } = await showCustomAlert('Admin Login', 'Enter your admin credentials:', false, true);

    // If user cancelled or provided empty credentials
    if (!email || !password) {
        // If the modal was just opened (i.e., no previous attempt), don't show "Invalid credentials"
        // Simply ensure the admin content is hidden and potentially redirect if they don't try to log in.
        adminContent.style.display = 'none';
        // If they explicitly cancelled, or didn't provide input, redirect them to index.html
        if (!email && !password) { // Check if both are empty (implies cancel or no input)
             window.location.href = 'index.html';
        } else {
            // If they provided partial input, show error in the same modal
            showCustomAlert('Login Failed', 'Email and password are required. Please try again.', false, true);
        }
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (user.email === 'Hina@admin.com') { // Check if it's the specific admin email
            console.log('Admin logged in:', user.email);
            adminContent.style.display = 'block'; // Show admin content
            loadAdminData(); // Load all data for admin
            customAlertModal.classList.remove('active'); // Hide login modal
        } else {
            // Logged in as a regular user, but not admin. Log them out and redirect.
            await signOut(auth);
            showCustomAlert('Access Denied', 'You are not authorized to access the admin panel. Redirecting to home page.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    } catch (error) {
        console.error("Admin login error:", error.code, error.message);
        let errorMessage = "Invalid credentials. Please try again.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = "Invalid admin email or password.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email format.";
        }
        // Show error in the same modal and keep it open for retry
        showCustomAlert('Login Failed', errorMessage, false, true);
    }
}


/**
 * Handles admin logout.
 */
adminLogoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log("Admin logged out.");
        adminContent.style.display = 'none'; // Hide admin content
        window.location.href = 'index.html'; // Redirect to home page after logout
    } catch (error) {
        console.error("Error logging out:", error);
        showCustomAlert('Logout Error', 'Failed to log out. Please try again.');
    }
});

// --- Dashboard Data Loading ---

/**
 * Loads all data for the admin dashboard.
 */
function loadAdminData() {
    loadTotalProducts();
    loadTotalOrders();
    loadPendingOrders();
    loadTotalUsers();
    loadProductsTable();
    loadOrdersTable();
    loadCategoriesTable();
    loadUsersTable();
    populateProductComparisonSelects();
    renderSalesChart();
}

function loadTotalProducts() {
    onValue(ref(database, 'products'), (snapshot) => {
        const products = snapshot.val();
        totalProductsSpan.textContent = products ? Object.keys(products).length : 0;
    });
}

function loadTotalOrders() {
    onValue(ref(database, 'orders'), (snapshot) => {
        const orders = snapshot.val();
        totalOrdersSpan.textContent = orders ? Object.keys(orders).length : 0;
    });
}

function loadPendingOrders() {
    onValue(ref(database, 'orders'), (snapshot) => {
        const orders = snapshot.val();
        if (orders) {
            const pending = Object.values(orders).filter(order => order.status === 'Pending').length;
            pendingOrdersSpan.textContent = pending;
        } else {
            pendingOrdersSpan.textContent = 0;
        }
    });
}

function loadTotalUsers() {
    // Note: Firebase Auth doesn't provide direct count. This will count users who have placed orders.
    // For a true user count, you'd need Cloud Functions or iterate Auth users on server.
    onValue(ref(database, 'users'), (snapshot) => {
        const users = snapshot.val();
        totalUsersSpan.textContent = users ? Object.keys(users).length : 0;
    });
}

// --- Sales Chart ---
function renderSalesChart() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        const ordersData = snapshot.val();
        const salesData = {}; // { 'YYYY-MM-DD': totalSales }

        if (ordersData) {
            Object.values(ordersData).forEach(order => {
                // Ensure orderDate exists and is a number (timestamp)
                if (order.orderDate && typeof order.orderDate === 'object' && order.orderDate.toMillis) {
                    const date = new Date(order.orderDate.toMillis());
                    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    const price = order.productPrice || 0; // Ensure price is a number

                    if (salesData[dateString]) {
                        salesData[dateString] += price;
                    } else {
                        salesData[dateString] = price;
                    }
                }
            });
        }

        // Get last 7 days for the chart
        const labels = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            labels.push(dateString);
            data.push(salesData[dateString] || 0);
        }

        if (salesChart) {
            salesChart.destroy(); // Destroy existing chart before creating a new one
        }

        const ctx = salesChartCanvas.getContext('2d');
        salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Sales ($)',
                    data: data,
                    backgroundColor: 'rgba(23, 162, 184, 0.7)', // var(--color-cyan-primary) with alpha
                    borderColor: 'rgba(23, 162, 184, 1)',
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
                            text: 'Sales ($)'
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
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    });
}

// --- Product Management ---

/**
 * Populates the category dropdown for adding/editing products.
 */
function populateProductCategories() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        const categories = snapshot.val();
        productCategorySelect.innerHTML = '<option value="">Select Category</option>'; // Default option
        if (categories) {
            for (let id in categories) {
                const option = document.createElement('option');
                option.value = categories[id].name;
                option.textContent = categories[id].name;
                productCategorySelect.appendChild(option);
            }
        }
    });
}

/**
 * Adds a new product to Firebase.
 */
addProductButton.addEventListener('click', async () => {
    const title = productTitleInput.value.trim();
    const category = productCategorySelect.value;
    const price = parseFloat(productPriceInput.value);
    const description = productDescriptionTextarea.value.trim();
    const imageFile = productImageInput.files[0];
    const videoUrl = productVideoUrlInput.value.trim();

    if (!title || !category || isNaN(price) || price <= 0 || !description || !imageFile) {
        showCustomAlert('Input Error', 'Please fill all required product fields (Title, Category, Price, Description, Image).');
        return;
    }

    try {
        // 1. Upload Image to Firebase Storage
        const imageRef = storageRef(storage, `product_images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(imageRef);

        // 2. Add product data to Realtime Database
        const newProductRef = push(ref(database, 'products'));
        await set(newProductRef, {
            title,
            category,
            price,
            description,
            imageUrl,
            videoUrl: videoUrl || null, // Store null if no video URL
            createdAt: serverTimestamp()
        });

        showCustomAlert('Success', 'Product added successfully!');
        clearProductForm();
    } catch (error) {
        console.error("Error adding product:", error);
        showCustomAlert('Error', 'Failed to add product. Please try again.');
    }
});

/**
 * Loads products into the products management table.
 */
function loadProductsTable() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        productsTableBody.innerHTML = '';
        const products = snapshot.val();
        if (products) {
            for (let id in products) {
                const product = { id, ...products[id] };
                const row = productsTableBody.insertRow();
                row.innerHTML = `
                    <td><img src="${product.imageUrl}" alt="${product.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                    <td>${product.title}</td>
                    <td>${product.category}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td class="table-actions">
                        <button class="admin-button warning edit-product-btn" data-id="${product.id}">Edit</button>
                        <button class="admin-button danger delete-product-btn" data-id="${product.id}">Delete</button>
                    </td>
                `;
            }
            addProductsTableListeners();
        }
    });
}

/**
 * Adds event listeners for edit and delete buttons in the products table.
 */
function addProductsTableListeners() {
    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.removeEventListener('click', handleEditProduct); // Prevent duplicate listeners
        button.addEventListener('click', handleEditProduct);
    });
    document.querySelectorAll('.delete-product-btn').forEach(button => {
        button.removeEventListener('click', handleDeleteProduct); // Prevent duplicate listeners
        button.addEventListener('click', handleDeleteProduct);
    });
}

/**
 * Fills the product form with data for editing.
 * @param {Event} event - The click event from the edit button.
 */
async function handleEditProduct(event) {
    editingProductId = event.target.dataset.id;
    const productRef = ref(database, `products/${editingProductId}`);
    const snapshot = await get(productRef);
    const product = snapshot.val();

    if (product) {
        productTitleInput.value = product.title;
        productCategorySelect.value = product.category;
        productPriceInput.value = product.price;
        productDescriptionTextarea.value = product.description;
        productVideoUrlInput.value = product.videoUrl || ''; // Fill video URL

        addProductButton.style.display = 'none';
        updateProductButton.style.display = 'inline-block';
        cancelEditProductButton.style.display = 'inline-block';
        productImageInput.value = ''; // Clear file input for security, user re-uploads if needed
        showCustomAlert('Edit Product', `Now editing: ${product.title}. Re-upload image if you want to change it.`, false, false);
    } else {
        showCustomAlert('Error', 'Product not found for editing.');
        editingProductId = null;
    }
}

/**
 * Updates an existing product in Firebase.
 */
updateProductButton.addEventListener('click', async () => {
    if (!editingProductId) {
        showCustomAlert('Error', 'No product selected for update.');
        return;
    }

    const title = productTitleInput.value.trim();
    const category = productCategorySelect.value;
    const price = parseFloat(productPriceInput.value);
    const description = productDescriptionTextarea.value.trim();
    const imageFile = productImageInput.files[0];
    const videoUrl = productVideoUrlInput.value.trim();

    if (!title || !category || isNaN(price) || price <= 0 || !description) {
        showCustomAlert('Input Error', 'Please fill all required product fields (Title, Category, Price, Description).');
        return;
    }

    try {
        let imageUrl = '';
        // If a new image is selected, upload it
        if (imageFile) {
            const imageRef = storageRef(storage, `product_images/${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(imageRef);
        } else {
            // Otherwise, retrieve the existing image URL
            const productSnapshot = await get(ref(database, `products/${editingProductId}`));
            imageUrl = productSnapshot.val().imageUrl;
        }

        await update(ref(database, `products/${editingProductId}`), {
            title,
            category,
            price,
            description,
            imageUrl,
            videoUrl: videoUrl || null,
            updatedAt: serverTimestamp()
        });

        showCustomAlert('Success', 'Product updated successfully!');
        clearProductForm();
        editingProductId = null;
        addProductButton.style.display = 'inline-block';
        updateProductButton.style.display = 'none';
        cancelEditProductButton.style.display = 'none';
    } catch (error) {
        console.error("Error updating product:", error);
        showCustomAlert('Error', 'Failed to update product. Please try again.');
    }
});

/**
 * Cancels product editing and clears the form.
 */
cancelEditProductButton.addEventListener('click', () => {
    clearProductForm();
    editingProductId = null;
    addProductButton.style.display = 'inline-block';
    updateProductButton.style.display = 'none';
    cancelEditProductButton.style.display = 'none';
});

/**
 * Deletes a product from Firebase.
 * @param {Event} event - The click event from the delete button.
 */
async function handleDeleteProduct(event) {
    const productId = event.target.dataset.id;
    const confirmDelete = await showCustomAlert('Confirm Delete', 'Are you sure you want to delete this product?', true);

    if (confirmDelete) {
        try {
            // Optional: Delete image from storage first if you store image URLs
            const productSnapshot = await get(ref(database, `products/${productId}`));
            const product = productSnapshot.val();
            if (product && product.imageUrl) {
                // You might need to parse the URL to get the storage path if it's not directly the path
                // Example: const imagePath = product.imageUrl.split('?')[0].split('%2F').pop();
                // const imageRefToDelete = storageRef(storage, `product_images/${imagePath}`);
                // await deleteObject(imageRefToDelete); // Uncomment if you want to delete images
            }
            await remove(ref(database, `products/${productId}`));
            showCustomAlert('Success', 'Product deleted successfully!');
        } catch (error) {
            console.error("Error deleting product:", error);
            showCustomAlert('Error', 'Failed to delete product. Please try again.');
        }
    }
}

/**
 * Clears the product input form.
 */
function clearProductForm() {
    productTitleInput.value = '';
    productCategorySelect.value = '';
    productPriceInput.value = '';
    productDescriptionTextarea.value = '';
    productImageInput.value = ''; // Clear selected file
    productVideoUrlInput.value = '';
}


// --- Order Management ---

/**
 * Loads orders into the orders management table.
 */
function loadOrdersTable() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        ordersTableBody.innerHTML = '';
        const orders = snapshot.val();
        if (orders) {
            // Convert to array and sort by order date (most recent first)
            const sortedOrders = Object.entries(orders).sort(([, a], [, b]) => {
                // Ensure orderDate exists and is a number
                const dateA = a.orderDate && typeof a.orderDate === 'object' && a.orderDate.toMillis ? a.orderDate.toMillis() : a.orderDate || 0;
                const dateB = b.orderDate && typeof b.orderDate === 'object' && b.orderDate.toMillis ? b.orderDate.toMillis() : b.orderDate || 0;
                return dateB - dateA;
            });

            sortedOrders.forEach(([id, order]) => {
                const row = ordersTableBody.insertRow();
                const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
                row.innerHTML = `
                    <td>${id}</td>
                    <td>${order.userName || 'N/A'}</td>
                    <td>${order.productTitle}</td>
                    <td>$${order.productPrice.toFixed(2)}</td>
                    <td><span class="order-status ${order.status.toLowerCase()}">${order.status}</span></td>
                    <td>${orderDate}</td>
                    <td class="table-actions">
                        <button class="admin-button primary view-order-btn" data-id="${id}">View Details</button>
                    </td>
                `;
            });
            addOrdersTableListeners();
        }
    });
}

/**
 * Adds event listeners for view details buttons in the orders table.
 */
function addOrdersTableListeners() {
    document.querySelectorAll('.view-order-btn').forEach(button => {
        button.removeEventListener('click', handleViewOrderDetails); // Prevent duplicate listeners
        button.addEventListener('click', handleViewOrderDetails);
    });
}

/**
 * Displays order details in a modal.
 * @param {Event} event - The click event from the view details button.
 */
async function handleViewOrderDetails(event) {
    currentOrderIdForDetails = event.target.dataset.id;
    const orderRef = ref(database, `orders/${currentOrderIdForDetails}`);
    const snapshot = await get(orderRef);
    const order = snapshot.val();

    if (order) {
        detailOrderId.textContent = currentOrderIdForDetails;
        detailUserEmail.textContent = order.userName || 'N/A';
        detailAddress.textContent = order.address;
        detailPhoneNumber.textContent = order.phoneNumber;
        detailOrderDate.textContent = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
        detailOrderStatus.textContent = order.status;
        detailProductImage.src = order.productImageUrl;
        detailProductTitle.textContent = order.productTitle;
        detailProductPrice.textContent = `$${order.productPrice.toFixed(2)}`;

        // Set button states based on current status
        markShippedBtn.style.display = 'inline-block';
        markDeliveredBtn.style.display = 'inline-block';
        cancelOrderBtn.style.display = 'inline-block';

        if (order.status === 'Shipped') {
            markShippedBtn.style.display = 'none';
        } else if (order.status === 'Delivered' || order.status === 'Cancelled') {
            markShippedBtn.style.display = 'none';
            markDeliveredBtn.style.display = 'none';
            cancelOrderBtn.style.display = 'none';
        }

        orderDetailsModal.classList.add('active');
    } else {
        showCustomAlert('Error', 'Order details not found.');
    }
}

/**
 * Updates the status of an order.
 * @param {string} newStatus - The new status to set (e.g., 'Shipped', 'Delivered', 'Cancelled').
 */
async function updateOrderStatus(newStatus) {
    if (!currentOrderIdForDetails) {
        showCustomAlert('Error', 'No order selected.');
        return;
    }

    try {
        await update(ref(database, `orders/${currentOrderIdForDetails}`), {
            status: newStatus,
            lastUpdated: serverTimestamp()
        });
        showCustomAlert('Success', `Order status updated to "${newStatus}"!`);
        orderDetailsModal.classList.remove('active'); // Close modal
        currentOrderIdForDetails = null; // Clear selected order
    } catch (error) {
        console.error("Error updating order status:", error);
        showCustomAlert('Error', 'Failed to update order status. Please try again.');
    }
}

// --- Category Management ---

/**
 * Adds a new category to Firebase.
 */
addCategoryButton.addEventListener('click', async () => {
    const categoryName = categoryNameInput.value.trim();
    if (!categoryName) {
        showCustomAlert('Input Error', 'Category name cannot be empty.');
        return;
    }

    try {
        // Check if category already exists
        const categoriesRef = ref(database, 'categories');
        const snapshot = await get(categoriesRef);
        const existingCategories = snapshot.val();
        let exists = false;
        if (existingCategories) {
            for (let id in existingCategories) {
                if (existingCategories[id].name.toLowerCase() === categoryName.toLowerCase()) {
                    exists = true;
                    break;
                }
            }
        }

        if (exists) {
            showCustomAlert('Error', `Category "${categoryName}" already exists.`);
            return;
        }

        const newCategoryRef = push(ref(database, 'categories'));
        await set(newCategoryRef, { name: categoryName });
        showCustomAlert('Success', 'Category added successfully!');
        categoryNameInput.value = ''; // Clear input
        populateProductCategories(); // Refresh product category dropdowns
    } catch (error) {
        console.error("Error adding category:", error);
        showCustomAlert('Error', 'Failed to add category. Please try again.');
    }
});

/**
 * Loads categories into the categories management table.
 */
function loadCategoriesTable() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        categoriesTableBody.innerHTML = '';
        const categories = snapshot.val();
        if (categories) {
            for (let id in categories) {
                const category = { id, ...categories[id] };
                const row = categoriesTableBody.insertRow();
                row.innerHTML = `
                    <td>${category.name}</td>
                    <td class="table-actions">
                        <button class="admin-button danger delete-category-btn" data-id="${category.id}">Delete</button>
                    </td>
                `;
            }
            addCategoriesTableListeners();
        }
    });
}

/**
 * Adds event listeners for delete buttons in the categories table.
 */
function addCategoriesTableListeners() {
    document.querySelectorAll('.delete-category-btn').forEach(button => {
        button.removeEventListener('click', handleDeleteCategory); // Prevent duplicate listeners
        button.addEventListener('click', handleDeleteCategory);
    });
}

/**
 * Deletes a category from Firebase.
 * @param {Event} event - The click event from the delete button.
 */
async function handleDeleteCategory(event) {
    const categoryId = event.target.dataset.id;
    const confirmDelete = await showCustomAlert('Confirm Delete', 'Are you sure you want to delete this category? Products in this category will become un-categorized.', true);

    if (confirmDelete) {
        try {
            await remove(ref(database, `categories/${categoryId}`));
            showCustomAlert('Success', 'Category deleted successfully!');
            populateProductCategories(); // Refresh product category dropdowns
        } catch (error) {
            console.error("Error deleting category:", error);
            showCustomAlert('Error', 'Failed to delete category. Please try again.');
        }
    }
}

// --- User Management ---

/**
 * Loads users into the users management table.
 */
function loadUsersTable() {
    const usersRef = ref(database, 'users'); // Assuming 'users' node exists with user profiles
    // If you only rely on Firebase Auth for users, you'd need Cloud Functions to list them.
    // This assumes you save basic user profiles to RTDB upon registration.
    onValue(usersRef, (snapshot) => {
        usersTableBody.innerHTML = '';
        const users = snapshot.val();
        if (users) {
            for (let uid in users) {
                const user = { uid, ...users[uid] };
                const row = usersTableBody.insertRow();
                row.innerHTML = `
                    <td>${user.uid}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td class="table-actions">
                        <button class="admin-button danger delete-user-btn" data-id="${user.uid}">Delete</button>
                    </td>
                `;
            }
            addUsersTableListeners();
        }
    });
}

/**
 * Adds event listeners for delete buttons in the users table.
 */
function addUsersTableListeners() {
    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.removeEventListener('click', handleDeleteUser); // Prevent duplicate listeners
        button.addEventListener('click', handleDeleteUser);
    });
}

/**
 * Deletes a user. Note: Deleting a user from Realtime Database does NOT delete them from Firebase Authentication.
 * For full user deletion, Firebase Admin SDK (server-side) or Cloud Functions are required.
 * This function only removes their profile from the 'users' node in RTDB.
 * @param {Event} event - The click event from the delete button.
 */
async function handleDeleteUser(event) {
    const userId = event.target.dataset.id;
    const confirmDelete = await showCustomAlert('Confirm Delete', 'Are you sure you want to delete this user profile? (This does not delete their Firebase Authentication account)', true);

    if (confirmDelete) {
        try {
            await remove(ref(database, `users/${userId}`));
            showCustomAlert('Success', 'User profile deleted successfully!');
        } catch (error) {
            console.error("Error deleting user:", error);
            showCustomAlert('Error', 'Failed to delete user. Please try again.');
        }
    }
}

// --- Product Comparison ---

/**
 * Populates the product select dropdowns for comparison.
 */
function populateProductComparisonSelects() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const products = snapshot.val();
        compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
        compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';

        if (products) {
            for (let id in products) {
                const product = products[id];
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
    });
}

/**
 * Compares two selected products and displays their details.
 */
async function compareProducts() {
    const product1Id = compareProduct1Select.value;
    const product2Id = compareProduct2Select.value;

    if (!product1Id || !product2Id) {
        showCustomAlert('Selection Error', 'Please select two products to compare.');
        return;
    }

    if (product1Id === product2Id) {
        showCustomAlert('Selection Error', 'Please select two different products to compare.');
        return;
    }

    comparisonResultsDiv.innerHTML = ''; // Clear previous results

    try {
        const product1Snapshot = await get(ref(database, `products/${product1Id}`));
        const product2Snapshot = await get(ref(database, `products/${product2Id}`));

        const product1 = { id: product1Id, ...product1Snapshot.val() };
        const product2 = { id: product2Id, ...product2Snapshot.val() };

        if (!product1 || !product2) {
            showCustomAlert('Error', 'One or both selected products not found.');
            return;
        }

        const displayProductComparison = (product) => {
            const card = document.createElement('div');
            card.classList.add('comparison-card');
            card.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.title}">
                <h4>${product.title}</h4>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Price:</strong> $${product.price.toFixed(2)}</p>
                <p><strong>Description:</strong> ${product.description}</p>
                ${product.videoUrl ? `<p><strong>Video:</strong> <a href="${product.videoUrl}" target="_blank">View Video</a></p>` : ''}
            `;
            comparisonResultsDiv.appendChild(card);
        };

        displayProductComparison(product1);
        displayProductComparison(product2);

    } catch (error) {
        console.error("Error comparing products:", error);
        showCustomAlert('Error', 'Failed to compare products. Please try again.');
    }
}


// --- Event Listeners ---
closeOrderDetailsModalBtn.addEventListener('click', () => {
    orderDetailsModal.classList.remove('active');
    currentOrderIdForDetails = null; // Clear the stored ID
});

markShippedBtn.addEventListener('click', () => updateOrderStatus('Shipped'));
markDeliveredBtn.addEventListener('click', () => updateOrderStatus('Delivered'));
cancelOrderBtn.addEventListener('click', () => updateOrderStatus('Cancelled'));

compareProductsBtn.addEventListener('click', compareProducts);

// Close custom alert modal when clicking outside (only if not an auth modal)
window.addEventListener('click', (event) => {
    // Only close if the click is on the overlay itself, not inside the modal content
    if (event.target === customAlertModal) {
        // If it's the admin login modal, and it's active, we want to keep it open
        // unless explicitly cancelled or successfully logged in.
        // So, if it's the customAlertModal overlay and it's currently showing auth inputs,
        // do not close it by clicking outside.
        if (authEmailInput.style.display === 'block' && authPasswordInput.style.display === 'block') {
            // Do nothing, keep the login modal open
        } else {
            // For other types of custom alerts (non-auth), allow closing by clicking outside
            customAlertModal.classList.remove('active');
        }
    }
    if (event.target === orderDetailsModal) {
        orderDetailsModal.classList.remove('active');
        currentOrderIdForDetails = null;
    }
});


// --- Authentication Check (Admin Panel Specific) ---
onAuthStateChanged(auth, (user) => {
    if (user && user.email === 'Hina@admin.com') { // Check for the specific admin email
        console.log("Admin logged in successfully.");
        adminContent.style.display = 'block'; // Show the admin panel
        loadAdminData(); // Load all admin-related data
        customAlertModal.classList.remove('active'); // Ensure login modal is hidden
    } else if (user && user.email !== 'Hina@admin.com') {
        // User is logged in, but not the admin. Redirect them.
        showCustomAlert('Access Denied', 'You are not authorized to access the admin panel. Redirecting to home page.');
        signOut(auth).then(() => { // Log out the non-admin user
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        });
    }
    else {
        // No user is signed in. Prompt for admin login.
        console.log("No user signed in. Prompting for admin login.");
        adminContent.style.display = 'none'; // Hide admin content until logged in
        adminLogin(); // Trigger the admin login flow
    }
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    populateProductCategories(); // Load categories for product form
    // The onAuthStateChanged listener handles showing/hiding admin content and loading data
});
