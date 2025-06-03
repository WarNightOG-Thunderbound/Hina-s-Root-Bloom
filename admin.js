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
  appId: "1:967448486557:web:2c89223921f6479010495f", // IMPORTANT: Corrected App ID
  measurementId: "G-TT31HC3NZ3" // IMPORTANT: Correct Measurement ID
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
const adminErrorMessage = document.getElementById('admin-error-message'); // For login errors
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
const productStockInput = document.getElementById('product-stock');
const productBrandInput = document.getElementById('product-brand');
const productCategorySelect = document.getElementById('product-category-select'); // For add/edit form
const productImageUrlInput = document.getElementById('product-image-url');
const productVideoUrlInput = document.getElementById('product-video-url');
const productImageUploadInput = document.getElementById('product-image-upload');
const productImagePreview = document.getElementById('product-image-preview');
const saveProductBtn = document.getElementById('save-product-btn');
const productListTableBody = document.getElementById('product-list');
const productSearchInput = document.getElementById('product-search-input');
const productCategoryFilter = document.getElementById('product-category-filter');
const productSortSelect = document.getElementById('product-sort-select');


// Order Management
const orderListTableBody = document.getElementById('order-list');
const orderSearchInput = document.getElementById('order-search-input');
const orderStatusFilter = document.getElementById('order-status-filter');

// Rating Management
const ratingListTableBody = document.getElementById('rating-list');

// Category Management
const categoryNameInput = document.getElementById('category-name-input');
const addCategoryBtn = document.getElementById('add-category-btn');
const manageCategorySelect = document.getElementById('manage-category-select'); // For managing categories
const editCategoryNameInput = document.getElementById('edit-category-name-input'); // For editing categories
const updateCategoryBtn = document.getElementById('update-category-btn'); // For editing categories
const deleteCategoryBtn = document.getElementById('delete-category-btn'); // For editing categories
const categoryListDisplay = document.getElementById('category-list-display'); // To display all categories

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


let allProducts = []; // To store all products for filtering/sorting/analytics
let allOrders = []; // To store all orders for filtering/sorting/analytics
let allRatings = []; // To store all ratings for analytics and product display
let allCategories = []; // To store all categories


// --- Firebase Authentication ---
onAuthStateChanged(auth, (user) => {
    // IMPORTANT: Implement robust admin check here (e.g., custom claims)
    // For simplicity, let's assume a hardcoded admin UID for now.
    // Replace "YOUR_ADMIN_UID" with the actual UID of your admin user from Firebase Authentication.
    // You can find your UID in the Firebase console under Authentication -> Users.
    const adminUids = ["YOUR_ADMIN_UID_HERE"]; // <--- REPLACE THIS WITH YOUR ACTUAL ADMIN UID(s)
    
    if (user && adminUids.includes(user.uid)) {
        console.log('[Admin] User logged in:', user.email);
        if (adminAuthSection) adminAuthSection.style.display = 'none';
        if (adminDashboardSection) adminDashboardSection.style.display = 'block';
        if (adminErrorMessage) adminErrorMessage.textContent = ''; // Clear any previous error
        loadAdminData(); // Load data only when admin is authenticated
        showTab('products'); // Default to products tab
    } else {
        console.log('[Admin] User logged out or not authorized.');
        if (adminAuthSection) adminAuthSection.style.display = 'flex';
        if (adminDashboardSection) adminDashboardSection.style.display = 'none';
        if (adminErrorMessage) adminErrorMessage.textContent = 'You are not authorized to access the admin panel. Please log in with an admin account.';
        // If not an admin, ensure login form is visible and cleared
        if (adminLoginEmailInput) adminLoginEmailInput.value = '';
        if (adminLoginPasswordInput) adminLoginPasswordInput.value = '';
    }
});

if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', async () => {
        const email = adminLoginEmailInput ? adminLoginEmailInput.value : '';
        const password = adminLoginPasswordInput ? adminLoginPasswordInput.value : '';
        if (!email || !password) {
            if (adminErrorMessage) adminErrorMessage.textContent = 'Please enter both email and password.';
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle UI update
        } catch (error) {
            console.error("Admin Login Failed:", error);
            if (adminErrorMessage) adminErrorMessage.textContent = `Login failed: ${error.message}`;
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
            console.error("Admin Logout Error:", error);
            showAlert('Logout Error', error.message);
        }
    });
}

// --- Tab Management ---
function showTab(tabId) {
    tabContents.forEach(content => {
        if (content && content.id === `${tabId}-tab`) {
            content.classList.add('active');
        } else if (content) {
            content.classList.remove('active');
        }
    });

    tabButtons.forEach(button => {
        if (button && button.dataset.tab === tabId) {
            button.classList.add('active');
        } else if (button) {
            button.classList.remove('active');
        }
    });

    // Specific actions for analytics charts to re-render when tab is active
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
    // Specific actions for category management tab
    if (tabId === 'categories') {
        displayCategoriesList(); // Refresh the list of categories
    }
}

tabButtons.forEach(button => {
    if (button) {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            showTab(tabId);
        });
    }
});


// --- Category Management ---
if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => {
        const categoryName = categoryNameInput ? categoryNameInput.value.trim() : '';
        if (categoryName) {
            const categoryRef = ref(database, 'categories');
            const newCategoryRef = push(categoryRef);
            set(newCategoryRef, {
                name: categoryName
            })
            .then(() => {
                showAlert('Success', 'Category added successfully!');
                if (categoryNameInput) categoryNameInput.value = ''; // Clear input
            })
            .catch((error) => {
                console.error("Error adding category:", error);
                showAlert('Error', `Error adding category: ${error.message}`);
            });
        } else {
            showAlert('Warning', 'Category name cannot be empty.');
        }
    });
}

function loadCategories() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        allCategories = []; // Clear previous categories
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const category = childSnapshot.val();
                category.id = childSnapshot.key;
                allCategories.push(category);
            });
        }
        populateCategoryDropdowns(); // Update all category dropdowns
        displayCategoriesList(); // Update the list in category tab
        loadProducts(); // Reload products to show updated categories
        loadOrders(); // Reload orders as they might depend on product categories for analytics
        loadRatings(); // Reload ratings as they might depend on product categories for analytics
    }, (error) => {
        console.error("Error loading categories:", error);
        showAlert('Error', 'Failed to load categories.');
    });
}

function populateCategoryDropdowns() {
    // Clear existing options and add default
    const dropdowns = [
        productCategorySelect,
        productCategoryFilter,
        manageCategorySelect
    ];

    dropdowns.forEach(dropdown => {
        if (dropdown) {
            dropdown.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = (dropdown === productCategoryFilter) ? 'All Categories' : 'Select Category';
            dropdown.appendChild(defaultOption);
        }
    });

    // Populate with actual categories
    allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;

        dropdowns.forEach(dropdown => {
            if (dropdown) {
                dropdown.appendChild(option.cloneNode(true));
            }
        });
    });
}

function displayCategoriesList() {
    if (!categoryListDisplay) return;
    categoryListDisplay.innerHTML = ''; // Clear current list
    if (allCategories.length === 0) {
        categoryListDisplay.innerHTML = '<li>No categories found.</li>';
        return;
    }
    allCategories.forEach(category => {
        const li = document.createElement('li');
        li.textContent = category.name;
        categoryListDisplay.appendChild(li);
    });
}

if (manageCategorySelect) {
    manageCategorySelect.addEventListener('change', (e) => {
        const selectedCategoryId = e.target.value;
        if (selectedCategoryId) {
            const selectedCategory = allCategories.find(cat => cat.id === selectedCategoryId);
            if (selectedCategory && editCategoryNameInput && updateCategoryBtn && deleteCategoryBtn) {
                editCategoryNameInput.value = selectedCategory.name;
                updateCategoryBtn.disabled = false;
                deleteCategoryBtn.disabled = false;
            }
        } else {
            if (editCategoryNameInput) editCategoryNameInput.value = '';
            if (updateCategoryBtn) updateCategoryBtn.disabled = true;
            if (deleteCategoryBtn) deleteCategoryBtn.disabled = true;
        }
    });
}

if (updateCategoryBtn) {
    updateCategoryBtn.addEventListener('click', () => {
        const selectedCategoryId = manageCategorySelect ? manageCategorySelect.value : '';
        const newCategoryName = editCategoryNameInput ? editCategoryNameInput.value.trim() : '';

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
}

if (deleteCategoryBtn) {
    deleteCategoryBtn.addEventListener('click', () => {
        const selectedCategoryId = manageCategorySelect ? manageCategorySelect.value : '';

        if (selectedCategoryId) {
            showConfirm('Confirm Deletion', 'Are you sure you want to delete this category? This action cannot be undone and will not automatically delete associated products.', () => {
                const categoryRef = ref(database, `categories/${selectedCategoryId}`);
                remove(categoryRef)
                    .then(() => {
                        showAlert('Success', 'Category deleted successfully!');
                        if (manageCategorySelect) manageCategorySelect.value = '';
                        if (editCategoryNameInput) editCategoryNameInput.value = '';
                        if (updateCategoryBtn) updateCategoryBtn.disabled = true;
                        if (deleteCategoryBtn) deleteCategoryBtn.disabled = true;
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
}


// --- Product Management ---
if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
        if (productModal) productModal.style.display = 'block';
        if (productModalTitle) productModalTitle.textContent = 'Add New Product';
        // Clear form
        if (productIdInput) productIdInput.value = '';
        if (productTitleInput) productTitleInput.value = '';
        if (productDescriptionInput) productDescriptionInput.value = '';
        if (productPriceInput) productPriceInput.value = '';
        if (productStockInput) productStockInput.value = '';
        if (productBrandInput) productBrandInput.value = '';
        if (productCategorySelect) productCategorySelect.value = ''; // Reset category dropdown
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
        const stock = parseInt(productStockInput ? productStockInput.value : 0);
        const brand = productBrandInput ? productBrandInput.value.trim() : '';
        const categoryId = productCategorySelect ? productCategorySelect.value : '';
        let imageUrl = productImageUrlInput ? productImageUrlInput.value.trim() : '';
        const videoUrl = productVideoUrlInput ? productVideoUrlInput.value.trim() : '';
        const imageFile = productImageUploadInput && productImageUploadInput.files.length > 0 ? productImageUploadInput.files[0] : null;

        if (!title || !description || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0 || !brand || !categoryId) {
            showAlert('Validation Error', 'Please fill in all required fields (Title, Description, Price, Stock, Brand, Category). Price and Stock must be valid numbers.');
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
                stock,
                brand,
                category: allCategories.find(cat => cat.id === categoryId)?.name || 'Unknown', // Save category name
                categoryId, // Save category ID for linking
                imageUrl: imageUrl || '',
                videoUrl: videoUrl || ''
            };

            if (id) {
                // Update existing product
                await update(ref(database, `products/${id}`), productData);
                showAlert('Product Updated', 'Product has been successfully updated.');
            } else {
                // Add new product
                const newProductRef = push(ref(database, 'products'));
                await set(newProductRef, { ...productData, createdAt: serverTimestamp() });
                showAlert('Product Added', 'New product has been successfully added.');
            }
            if (productModal) productModal.style.display = 'none';
        } catch (error) {
            console.error("Error saving product:", error);
            showAlert('Save Error', 'Failed to save product: ' + error.message);
        }
    });
}

function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        allProducts = []; // Clear for fresh load
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const product = childSnapshot.val();
                product.id = childSnapshot.key;
                allProducts.push(product);
            });
        }
        filterAndDisplayProducts();
        populateProductComparisonSelects(); // Update comparison selects whenever products load
    }, (error) => {
        console.error("Error loading products:", error);
        showAlert('Error', 'Failed to load products.');
    });
}

if (productSearchInput) productSearchInput.addEventListener('input', filterAndDisplayProducts);
if (productSortSelect) productSortSelect.addEventListener('change', filterAndDisplayProducts);
if (productCategoryFilter) productCategoryFilter.addEventListener('change', filterAndDisplayProducts);

function filterAndDisplayProducts() {
    let filteredProducts = [...allProducts];
    const searchTerm = productSearchInput ? productSearchInput.value.toLowerCase() : '';
    const sortBy = productSortSelect ? productSortSelect.value : 'name-asc';
    const filterCategory = productCategoryFilter ? productCategoryFilter.value : 'all';

    // Filter by search term
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            (product.title || '').toLowerCase().includes(searchTerm) ||
            (product.description || '').toLowerCase().includes(searchTerm) ||
            (product.brand || '').toLowerCase().includes(searchTerm)
        );
    }

    // Filter by category
    if (filterCategory !== 'all' && filterCategory !== '') {
        filteredProducts = filteredProducts.filter(product => product.categoryId === filterCategory);
    }

    // Sort products
    filteredProducts.sort((a, b) => {
        if (sortBy === 'name-asc') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'name-desc') return (b.title || '').localeCompare(a.title || '');
        if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'stock-asc') return (a.stock || 0) - (b.stock || 0);
        if (sortBy === 'stock-desc') return (b.stock || 0) - (a.stock || 0);
        return 0;
    });

    displayProductsTable(filteredProducts);
}

function displayProductsTable(productsToDisplay) {
    if (!productListTableBody) return;
    productListTableBody.innerHTML = ''; // Clear current list

    if (productsToDisplay.length === 0) {
        productListTableBody.innerHTML = '<tr><td colspan="7">No products found.</td></tr>';
        return;
    }

    productsToDisplay.forEach(product => {
        const categoryName = allCategories.find(cat => cat.id === product.categoryId)?.name || 'N/A';
        const { average, count } = getProductAverageRating(product.id);

        const row = productListTableBody.insertRow();
        row.innerHTML = `
            <td><img src="${product.imageUrl || 'https://placehold.co/50x50?text=No+Image'}" alt="${product.title}" class="admin-thumbnail"></td>
            <td>${product.title || 'N/A'}</td>
            <td>${categoryName}</td>
            <td>$${product.price ? product.price.toFixed(2) : '0.00'}</td>
            <td>${product.stock || '0'}</td>
            <td>${average.toFixed(1)}/5 (${count})</td>
            <td>
                <button class="admin-button secondary edit-product-btn" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="admin-button danger delete-product-btn" data-id="${product.id}"><i class="fas fa-trash-alt"></i> Delete</button>
            </td>
        `;
    });

    // Attach event listeners to new edit and delete buttons
    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            editProduct(productId);
        });
    });
    document.querySelectorAll('.delete-product-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            showConfirm('Delete Product', 'Are you sure you want to delete this product?', () => deleteProduct(productId));
        });
    });
}

async function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        if (productModal) productModal.style.display = 'block';
        if (productModalTitle) productModalTitle.textContent = 'Edit Product';
        if (productIdInput) productIdInput.value = product.id;
        if (productTitleInput) productTitleInput.value = product.title || '';
        if (productDescriptionInput) productDescriptionInput.value = product.description || '';
        if (productPriceInput) productPriceInput.value = product.price || '';
        if (productStockInput) productStockInput.value = product.stock || '';
        if (productBrandInput) productBrandInput.value = product.brand || '';
        if (productCategorySelect) productCategorySelect.value = product.categoryId || ''; // Set category dropdown
        if (productImageUrlInput) productImageUrlInput.value = product.imageUrl || '';
        if (productVideoUrlInput) productVideoUrlInput.value = product.videoUrl || '';

        // Display current image/video if available
        if (productImagePreview) {
            if (product.imageUrl) {
                productImagePreview.src = product.imageUrl;
                productImagePreview.style.display = 'block';
            } else {
                productImagePreview.src = '';
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
        allOrders = []; // Clear current orders
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                order.id = childSnapshot.key;
                allOrders.push(order);
            });
        }
        filterAndDisplayOrders();
    }, (error) => {
        console.error("Error loading orders:", error);
        showAlert('Error', 'Failed to load orders.');
    });
}

if (orderSearchInput) orderSearchInput.addEventListener('input', filterAndDisplayOrders);
if (orderStatusFilter) orderStatusFilter.addEventListener('change', filterAndDisplayOrders);

function filterAndDisplayOrders() {
    let filteredOrders = [...allOrders];
    const searchTerm = orderSearchInput ? orderSearchInput.value.toLowerCase() : '';
    const filterStatus = orderStatusFilter ? orderStatusFilter.value : 'all';

    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order =>
            (order.customerName || '').toLowerCase().includes(searchTerm) ||
            (order.customerEmail || '').toLowerCase().includes(searchTerm) ||
            (order.id || '').toLowerCase().includes(searchTerm) ||
            (order.items && Object.values(order.items).some(item => (item.productTitle || '').toLowerCase().includes(searchTerm)))
        );
    }

    if (filterStatus !== 'all' && filterStatus !== '') {
        filteredOrders = filteredOrders.filter(order => order.status === filterStatus);
    }

    // Sort orders by timestamp, newest first
    filteredOrders.sort((a, b) => {
        const dateA = a.orderDate ? (a.orderDate.timestamp || a.orderDate) : 0;
        const dateB = b.orderDate ? (b.orderDate.timestamp || b.orderDate) : 0;
        return dateB - dateA;
    });

    displayOrdersTable(filteredOrders);
}

function displayOrdersTable(ordersToDisplay) {
    if (!orderListTableBody) return;
    orderListTableBody.innerHTML = ''; // Clear current list

    if (ordersToDisplay.length === 0) {
        orderListTableBody.innerHTML = '<tr><td colspan="6">No orders found.</td></tr>';
        return;
    }

    ordersToDisplay.forEach(order => {
        const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
        const row = orderListTableBody.insertRow();
        row.innerHTML = `
            <td>${order.id || 'N/A'}</td>
            <td>${order.customerName || 'N/A'}</td>
            <td>$${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</td>
            <td>
                <select class="order-status-select" data-order-id="${order.id}">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>${orderDate}</td>
            <td>
                <button class="admin-button secondary view-order-details-btn" data-id="${order.id}"><i class="fas fa-eye"></i> View Details</button>
                <button class="admin-button danger delete-order-btn" data-id="${order.id}"><i class="fas fa-trash-alt"></i> Delete</button>
            </td>
        `;
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

    // Attach event listeners for view details
    document.querySelectorAll('.view-order-details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = e.currentTarget.dataset.id;
            viewOrderDetails(orderId);
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

async function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        showAlert('Error', 'Order not found.');
        return;
    }

    let itemsHtml = '';
    if (order.items) {
        // Handle both single product order and multi-item cart order structures
        if (order.productId) { // Single product order
            itemsHtml += `<li>${order.productTitle} (x${order.quantity}) - $${(order.productPrice * order.quantity).toFixed(2)}</li>`;
        } else if (Array.isArray(order.items)) { // Multi-item cart order
            order.items.forEach(item => {
                itemsHtml += `<li>${item.productTitle} (x${item.quantity}) - $${(item.productPrice * item.quantity).toFixed(2)}</li>`;
            });
        } else { // Handle older or unexpected structures
            for (const productId in order.items) {
                const item = order.items[productId];
                itemsHtml += `<li>${item.title} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</li>`;
            }
        }
    }

    showAlert(
        `Order Details: ${order.id}`,
        `
        <p><strong>Customer:</strong> ${order.customerName || 'N/A'}</p>
        <p><strong>Address:</strong> ${order.customerAddress || 'N/A'}</p>
        <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
        <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
        <p><strong>Status:</strong> ${order.status || 'N/A'}</p>
        <p><strong>Total:</strong> $${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</p>
        <p><strong>Date:</strong> ${order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}</p>
        <p><strong>Items:</strong></p>
        <ul>${itemsHtml}</ul>
        `
    );
}


// --- Rating Management ---
function loadRatings() {
    const ratingsRef = ref(database, 'products'); // Ratings are stored under products
    onValue(ratingsRef, (snapshot) => {
        allRatings = []; // Clear previous ratings
        if (snapshot.exists()) {
            snapshot.forEach((productSnapshot) => {
                const productId = productSnapshot.key;
                const productData = productSnapshot.val();
                if (productData.ratings) {
                    for (const ratingId in productData.ratings) {
                        const rating = productData.ratings[ratingId];
                        allRatings.push({ id: ratingId, productId: productId, ...rating });
                    }
                }
            });
        }
        displayRatingsTable(); // Call this after ratings are loaded
        // Also ensure product display is updated with latest ratings
        filterAndDisplayProducts();
    }, (error) => {
        console.error("Error loading ratings:", error);
        showAlert('Error', 'Failed to load ratings.');
    });
}

function displayRatingsTable() {
    if (!ratingListTableBody) return;
    ratingListTableBody.innerHTML = ''; // Clear current list

    if (allRatings.length === 0) {
        ratingListTableBody.innerHTML = '<tr><td colspan="6">No ratings found.</td></tr>';
        return;
    }

    allRatings.forEach(rating => {
        const productTitle = allProducts.find(p => p.id === rating.productId)?.title || 'N/A';
        const row = ratingListTableBody.insertRow();
        row.innerHTML = `
            <td>${productTitle}</td>
            <td>${rating.userName || 'Anonymous'}</td>
            <td>${rating.rating || '0'}/5</td>
            <td>${rating.comment || '-'}</td>
            <td>${rating.timestamp ? new Date(rating.timestamp).toLocaleString() : 'N/A'}</td>
            <td>
                <button class="admin-button danger delete-rating-btn" data-product-id="${rating.productId}" data-rating-id="${rating.id}"><i class="fas fa-trash-alt"></i> Delete</button>
            </td>
        `;
    });
    addDeleteRatingListeners();
}

function addDeleteRatingListeners() {
    document.querySelectorAll('.delete-rating-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.productId;
            const ratingId = e.currentTarget.dataset.ratingId;
            showConfirm('Delete Rating', 'Are you sure you want to delete this rating?', () => deleteRating(productId, ratingId));
        });
    });
}

async function deleteRating(productId, ratingId) {
    try {
        await remove(ref(database, `products/${productId}/ratings/${ratingId}`));
        showAlert('Rating Deleted', 'Rating has been successfully deleted.');
    } catch (error) {
        console.error("Error deleting rating:", error);
        showAlert('Delete Error', 'Failed to delete rating: ' + error.message);
    }
}

function getProductAverageRating(productId) {
    const productRatings = allRatings.filter(rating => rating.productId === productId);
    let totalRating = 0;
    let ratingCount = 0;
    productRatings.forEach(rating => {
        if (typeof rating.rating === 'number') {
            totalRating += rating.rating;
            ratingCount++;
        }
    });
    return ratingCount > 0 ? { average: totalRating / ratingCount, count: ratingCount } : { average: 0, count: 0 };
}


// --- Analytics ---
function renderOrdersChart() {
    if (!ordersChartCanvas) return;
    if (ordersChartInstance) ordersChartInstance.destroy(); // Destroy previous instance

    const dailyOrders = {};
    allOrders.forEach(order => {
        const orderTimestamp = order.orderDate ? (order.orderDate.timestamp || order.orderDate) : Date.now();
        const date = new Date(orderTimestamp).toLocaleDateString();
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
        // Handle both single product order and multi-item cart order structures
        if (order.productId) { // Single product order
            const product = allProducts.find(p => p.id === order.productId);
            if (product && product.category) {
                salesByCategory[product.category] = (salesByCategory[product.category] || 0) + ((order.productPrice || 0) * (order.quantity || 0));
            }
        } else if (order.items && Array.isArray(order.items)) { // Multi-item cart order
            order.items.forEach(item => {
                const product = allProducts.find(p => p.id === item.productId);
                if (product && product.category) {
                    salesByCategory[product.category] = (salesByCategory[product.category] || 0) + ((item.productPrice || 0) * (item.quantity || 0));
                }
            });
        } else { // Handle older or unexpected structures
            for (const itemId in order.items) {
                const item = order.items[itemId];
                const product = allProducts.find(p => p.id === itemId); // Assuming itemId is productId
                if (product && product.category) {
                    salesByCategory[product.category] = (salesByCategory[product.category] || 0) + ((item.price || 0) * (item.quantity || 0));
                }
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

function populateProductComparisonSelects() {
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

    const labels = ['Price', 'Stock', 'Average Rating', 'Number of Reviews'];
    const data1 = [
        product1.price || 0,
        product1.stock || 0,
        ratings1.average,
        ratings1.count
    ];
    const data2 = [
        product2.price || 0,
        product2.stock || 0,
        ratings2.average,
        ratings2.count
    ];

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


// --- Initial Data Load ---
function loadAdminData() {
    loadCategories(); // Categories should be loaded first as products depend on them
    loadProducts(); // Products depend on categories
    loadOrders();
    loadRatings(); // Ratings depend on products
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
    // Initial check for auth state is handled by onAuthStateChanged
    // No need to call loadAdminData here, as onAuthStateChanged will trigger it after successful login.

    // Attach global event listeners for modals here
    if (customModalOkBtn) customModalOkBtn.addEventListener('click', () => {
        if (customAlertModal) customAlertModal.style.display = 'none';
    });
    if (customModalCancelBtn) customModalCancelBtn.addEventListener('click', () => {
        if (customAlertModal) customAlertModal.style.display = 'none';
    });
});
