// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, set, remove, onValue, serverTimestamp, update, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebase/9.6.1/firebase-storage.js";


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
const totalProductsCount = document.getElementById('total-products-count');
const totalCategoriesCount = document.getElementById('total-categories-count');
const totalOrdersCount = document.getElementById('total-orders-count');
const averageRatingDisplay = document.getElementById('average-rating-display');

// Product Management
const productTitleInput = document.getElementById('product-title');
const productCategorySelect = document.getElementById('product-category');
const productPriceInput = document.getElementById('product-price');
const productDescriptionTextarea = document.getElementById('product-description');
const productImageInput = document.getElementById('product-image');
const productImagePreview = document.getElementById('product-image-preview');
const productVideoUrlInput = document.getElementById('product-video-url');
const addProductBtn = document.getElementById('add-product-btn');
const updateProductBtn = document.getElementById('update-product-btn');
const cancelUpdateBtn = document.getElementById('cancel-update-btn');
const productsTableBody = document.getElementById('products-table-body');

// Category Management
const categoryNameInput = document.getElementById('category-name');
const addCategoryBtn = document.getElementById('add-category-btn');
const updateCategoryBtn = document.getElementById('update-category-btn');
const cancelCategoryUpdateBtn = document.getElementById('cancel-category-update-btn');
const categoriesTableBody = document.getElementById('categories-table-body');

// Order Management
const ordersTableBody = document.getElementById('orders-table-body');

// Ratings Analytics
const ratingsDistributionChartCanvas = document.getElementById('ratingsDistributionChart');
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');
const productComparisonChartCanvas = document.getElementById('productComparisonChart');

// Modals
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');

const orderDetailsModal = document.getElementById('order-details-modal');
const closeOrderDetailsModalBtn = document.getElementById('close-order-details-modal');
const detailOrderId = document.getElementById('detail-order-id');
const detailCustomerName = document.getElementById('detail-customer-name');
const detailCustomerEmail = document.getElementById('detail-customer-email');
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

// --- Global Variables ---
let editingProductId = null;
let editingCategoryId = null;
let allProducts = [];
let ratingsChart = null;
let productComparisonChart = null;


// --- Utility Functions ---

function showCustomAlert(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        customModalTitle.textContent = title;
        customModalMessage.textContent = message;
        customModalCancelBtn.style.display = isConfirm ? 'block' : 'none';
        customAlertModal.classList.add('active');

        const handleOk = () => {
            customAlertModal.classList.remove('active');
            customModalOkBtn.removeEventListener('click', handleOk);
            customModalCancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            customAlertModal.classList.remove('active');
            customModalOkBtn.removeEventListener('click', handleOk);
            customModalCancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };

        customModalOkBtn.addEventListener('click', handleOk);
        customModalCancelBtn.addEventListener('click', handleCancel); // Attach always, display controlled by style
    });
}

function clearProductForm() {
    productTitleInput.value = '';
    productCategorySelect.value = '';
    productPriceInput.value = '';
    productDescriptionTextarea.value = '';
    productImageInput.value = ''; // Clear file input
    productImagePreview.src = '#';
    productImagePreview.style.display = 'none';
    productVideoUrlInput.value = '';
    addProductBtn.style.display = 'inline-block';
    updateProductBtn.style.display = 'none';
    cancelUpdateBtn.style.display = 'none';
    editingProductId = null;
}

function clearCategoryForm() {
    categoryNameInput.value = '';
    addCategoryBtn.style.display = 'inline-block';
    updateCategoryBtn.style.display = 'none';
    cancelCategoryUpdateBtn.style.display = 'none';
    editingCategoryId = null;
}


// --- Product Management ---

async function addOrUpdateProduct() {
    const title = productTitleInput.value.trim();
    const category = productCategorySelect.value;
    const price = parseFloat(productPriceInput.value);
    const description = productDescriptionTextarea.value.trim();
    const videoUrl = productVideoUrlInput.value.trim();
    const imageFile = productImageInput.files[0];

    if (!title || !category || isNaN(price) || price <= 0) {
        showCustomAlert('Input Error', 'Please fill in product title, category, and a valid price.');
        return;
    }

    let imageUrl = productImagePreview.src && productImagePreview.style.display !== 'none' ? productImagePreview.src : '';

    try {
        if (imageFile) {
            // Upload new image
            const imageRef = storageRef(storage, `product_images/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        } else if (!imageUrl) {
            // If no new image and no existing image URL, use a placeholder or show error
            // For now, let's assume a placeholder might be handled later or an image is required
            // For this example, we'll just allow it if no image is selected for update,
            // but if adding, it might need one.
            // If adding and no image:
            if (!editingProductId) {
                showCustomAlert('Input Error', 'Please select an image for the new product.');
                return;
            }
        }

        const productData = {
            title,
            category,
            price,
            description,
            imageUrl,
            videoUrl
        };

        if (editingProductId) {
            // Update existing product
            await update(ref(database, `products/${editingProductId}`), productData);
            showCustomAlert('Success', 'Product updated successfully!');
        } else {
            // Add new product
            const newProductRef = push(ref(database, 'products'));
            await set(newProductRef, productData);
            showCustomAlert('Success', 'Product added successfully!');
        }
        clearProductForm();
    } catch (error) {
        console.error("Error adding/updating product:", error);
        showCustomAlert('Error', 'Failed to save product. ' + error.message);
    }
}

function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        productsTableBody.innerHTML = '';
        allProducts = []; // Clear previous products for comparison charts
        const productsData = snapshot.val();
        if (productsData) {
            Object.keys(productsData).forEach(id => {
                const product = { id, ...productsData[id] };
                allProducts.push(product); // Add to global list

                const row = productsTableBody.insertRow();
                row.innerHTML = `
                    <td><img src="${product.imageUrl}" alt="${product.title}"></td>
                    <td>${product.title}</td>
                    <td>${product.category}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td class="action-buttons-cell">
                        <button class="admin-button secondary edit-product-btn" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="admin-button danger delete-product-btn" data-id="${product.id}"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                `;
            });
        }
        totalProductsCount.textContent = allProducts.length;
        populateProductCompareSelects();
    });
}

async function deleteProduct(productId) {
    const confirmDelete = await showCustomAlert('Confirm Delete', 'Are you sure you want to delete this product? This action cannot be undone.', true);
    if (confirmDelete) {
        try {
            await remove(ref(database, `products/${productId}`));
            showCustomAlert('Success', 'Product deleted successfully!');
        } catch (error) {
            console.error("Error deleting product:", error);
            showCustomAlert('Error', 'Failed to delete product.');
        }
    }
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        productTitleInput.value = product.title;
        productCategorySelect.value = product.category;
        productPriceInput.value = product.price;
        productDescriptionTextarea.value = product.description;
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
        cancelUpdateBtn.style.display = 'inline-block';
        editingProductId = productId;
    }
}

// --- Category Management ---

async function addOrUpdateCategory() {
    const categoryName = categoryNameInput.value.trim();
    if (!categoryName) {
        showCustomAlert('Input Error', 'Category name cannot be empty.');
        return;
    }

    try {
        if (editingCategoryId) {
            // Update existing category
            await update(ref(database, `categories/${editingCategoryId}`), { name: categoryName });
            showCustomAlert('Success', 'Category updated successfully!');
        } else {
            // Add new category
            const newCategoryRef = push(ref(database, 'categories'));
            await set(newCategoryRef, { name: categoryName });
            showCustomAlert('Success', 'Category added successfully!');
        }
        clearCategoryForm();
        populateCategorySelect(); // Refresh category dropdowns
    } catch (error) {
        console.error("Error adding/updating category:", error);
        showCustomAlert('Error', 'Failed to save category. ' + error.message);
    }
}

function loadCategories() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        categoriesTableBody.innerHTML = '';
        const categoriesData = snapshot.val();
        let count = 0;
        if (categoriesData) {
            Object.keys(categoriesData).forEach(id => {
                const category = categoriesData[id];
                count++;
                const row = categoriesTableBody.insertRow();
                row.innerHTML = `
                    <td>${category.name}</td>
                    <td class="action-buttons-cell">
                        <button class="admin-button secondary edit-category-btn" data-id="${id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="admin-button danger delete-category-btn" data-id="${id}"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                `;
            });
        }
        totalCategoriesCount.textContent = count;
    });
}

async function deleteCategory(categoryId) {
    const confirmDelete = await showCustomAlert('Confirm Delete', 'Are you sure you want to delete this category? Products associated with this category will remain, but their category filter might break if not updated.', true);
    if (confirmDelete) {
        try {
            await remove(ref(database, `categories/${categoryId}`));
            showCustomAlert('Success', 'Category deleted successfully!');
            populateCategorySelect(); // Refresh category dropdowns
        } catch (error) {
            console.error("Error deleting category:", error);
            showCustomAlert('Error', 'Failed to delete category.');
        }
    }
}

function editCategory(categoryId) {
    const categoriesRef = ref(database, `categories/${categoryId}`);
    get(categoriesRef).then((snapshot) => {
        if (snapshot.exists()) {
            const category = snapshot.val();
            categoryNameInput.value = category.name;
            addCategoryBtn.style.display = 'none';
            updateCategoryBtn.style.display = 'inline-block';
            cancelCategoryUpdateBtn.style.display = 'inline-block';
            editingCategoryId = categoryId;
        } else {
            showCustomAlert('Error', 'Category not found.');
        }
    }).catch(error => {
        console.error("Error fetching category for edit:", error);
        showCustomAlert('Error', 'Failed to fetch category data.');
    });
}


function populateCategorySelect() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        productCategorySelect.innerHTML = '<option value="">Select Category</option>'; // Reset
        const categoriesData = snapshot.val();
        if (categoriesData) {
            Object.keys(categoriesData).forEach(id => {
                const categoryName = categoriesData[id].name;
                const option = document.createElement('option');
                option.value = categoryName;
                option.textContent = categoryName;
                productCategorySelect.appendChild(option);
            });
        }
    });
}

// --- Order Management ---

function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        ordersTableBody.innerHTML = '';
        const ordersData = snapshot.val();
        let count = 0;
        if (ordersData) {
            // Convert to array and sort by orderDate descending
            const sortedOrders = Object.entries(ordersData).sort(([, a], [, b]) => b.orderDate - a.orderDate);

            sortedOrders.forEach(([id, order]) => {
                count++;
                const row = ordersTableBody.insertRow();
                const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
                row.innerHTML = `
                    <td>${id}</td>
                    <td>${order.userName || 'N/A'}</td>
                    <td>${order.productTitle || 'N/A'}</td>
                    <td>$${order.productPrice ? order.productPrice.toFixed(2) : '0.00'}</td>
                    <td>${orderDate}</td>
                    <td>${order.status || 'Unknown'}</td>
                    <td class="action-buttons-cell">
                        <button class="admin-button secondary view-order-details-btn" data-id="${id}"><i class="fas fa-info-circle"></i> Details</button>
                    </td>
                `;
            });
        }
        totalOrdersCount.textContent = count;
    });
}

let currentOrderIdForDetails = null; // To hold the ID of the order being viewed

function viewOrderDetails(orderId) {
    currentOrderIdForDetails = orderId; // Store the current order ID
    const orderRef = ref(database, `orders/${orderId}`);
    get(orderRef).then((snapshot) => {
        if (snapshot.exists()) {
            const order = snapshot.val();
            detailOrderId.textContent = orderId;
            detailCustomerName.textContent = order.userName || 'N/A';
            detailCustomerEmail.textContent = order.userEmail || 'N/A'; // Assuming userEmail might be stored
            detailAddress.textContent = order.address || 'N/A';
            detailPhoneNumber.textContent = order.phoneNumber || 'N/A';
            detailOrderDate.textContent = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
            detailOrderStatus.textContent = order.status || 'Unknown';
            detailProductImage.src = order.productImageUrl || '';
            detailProductTitle.textContent = order.productTitle || 'N/A';
            detailProductPrice.textContent = order.productPrice ? `$${order.productPrice.toFixed(2)}` : '$0.00';

            // Update button visibility based on status
            markShippedBtn.style.display = (order.status === 'Pending') ? 'inline-flex' : 'none';
            markDeliveredBtn.style.display = (order.status === 'Shipped') ? 'inline-flex' : 'none';
            cancelOrderBtn.style.display = (order.status === 'Pending' || order.status === 'Shipped') ? 'inline-flex' : 'none';


            orderDetailsModal.classList.add('active'); // Show modal
        } else {
            showCustomAlert('Error', 'Order details not found.');
        }
    }).catch(error => {
        console.error("Error fetching order details:", error);
        showCustomAlert('Error', 'Failed to load order details.');
    });
}

async function updateOrderStatus(newStatus) {
    if (!currentOrderIdForDetails) return;

    const confirmUpdate = await showCustomAlert('Confirm Action', `Are you sure you want to change the status to "${newStatus}"?`, true);
    if (confirmUpdate) {
        try {
            await update(ref(database, `orders/${currentOrderIdForDetails}`), { status: newStatus });
            showCustomAlert('Success', `Order status updated to ${newStatus}.`);
            orderDetailsModal.classList.remove('active'); // Close modal after update
            loadOrders(); // Refresh orders table
        } catch (error) {
            console.error("Error updating order status:", error);
            showCustomAlert('Error', 'Failed to update order status.');
        }
    }
}


// --- Ratings Analytics ---

function loadRatings() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const productsData = snapshot.val();
        const ratingsCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRatingsSum = 0;
        let totalRatingsCount = 0;

        if (productsData) {
            Object.values(productsData).forEach(product => {
                if (product.ratings) {
                    Object.values(product.ratings).forEach(rating => {
                        if (rating >= 1 && rating <= 5) {
                            ratingsCount[rating]++;
                            totalRatingsSum += rating;
                            totalRatingsCount++;
                        }
                    });
                }
            });
        }

        const averageRating = totalRatingsCount > 0 ? (totalRatingsSum / totalRatingsCount).toFixed(1) : '0.0';
        averageRatingDisplay.textContent = averageRating;

        renderRatingsDistributionChart(ratingsCount);
        populateProductCompareSelects(); // Ensure selects are updated with latest product data
    });
}

function renderRatingsDistributionChart(ratingsCount) {
    const labels = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
    const data = [ratingsCount[1], ratingsCount[2], ratingsCount[3], ratingsCount[4], ratingsCount[5]];

    if (ratingsChart) {
        ratingsChart.destroy(); // Destroy previous chart instance
    }

    const ctx = ratingsDistributionChartCanvas.getContext('2d');
    ratingsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Ratings',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)'
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
                        callback: function(value) { if (Number.isInteger(value)) { return value; } }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function populateProductCompareSelects() {
    compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';

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

function compareProducts() {
    const product1Id = compareProduct1Select.value;
    const product2Id = compareProduct2Select.value;

    const product1 = allProducts.find(p => p.id === product1Id);
    const product2 = allProducts.find(p => p.id === product2Id);

    if (!product1 && !product2) {
        showCustomAlert('Selection Error', 'Please select at least one product to compare.');
        return;
    }

    const labels = ['Average Rating', 'Rating Count'];
    const datasets = [];

    const getProductRatingData = (product) => {
        let totalRating = 0;
        let ratingCount = 0;
        if (product.ratings) {
            Object.values(product.ratings).forEach(rating => {
                totalRating += rating;
                ratingCount++;
            });
        }
        const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
        return [averageRating, ratingCount];
    };

    let data1 = [0, 0];
    let data2 = [0, 0];

    if (product1) {
        data1 = getProductRatingData(product1);
        datasets.push({
            label: product1.title,
            data: data1,
            backgroundColor: 'rgba(0, 188, 212, 0.6)',
            borderColor: '#17a2b8', // Corresponds to --color-cyan-primary
            borderWidth: 1
        });
    }
    if (product2) {
        data2 = getProductRatingData(product2);
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


// --- Event Listeners ---
addProductBtn.addEventListener('click', addOrUpdateProduct);
updateProductBtn.addEventListener('click', addOrUpdateProduct);
cancelUpdateBtn.addEventListener('click', clearProductForm);

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

productsTableBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-product-btn')) {
        editProduct(event.target.dataset.id);
    } else if (event.target.classList.contains('delete-product-btn')) {
        deleteProduct(event.target.dataset.id);
    }
});

addCategoryBtn.addEventListener('click', addOrUpdateCategory);
updateCategoryBtn.addEventListener('click', addOrUpdateCategory);
cancelCategoryUpdateBtn.addEventListener('click', clearCategoryForm);

categoriesTableBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-category-btn')) {
        editCategory(event.target.dataset.id);
    } else if (event.target.classList.contains('delete-category-btn')) {
        deleteCategory(event.target.dataset.id);
    }
});

ordersTableBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('view-order-details-btn')) {
        viewOrderDetails(event.target.dataset.id);
    }
});

closeOrderDetailsModalBtn.addEventListener('click', () => {
    orderDetailsModal.classList.remove('active');
    currentOrderIdForDetails = null; // Clear the stored ID
});

markShippedBtn.addEventListener('click', () => updateOrderStatus('Shipped'));
markDeliveredBtn.addEventListener('click', () => updateOrderStatus('Delivered'));
cancelOrderBtn.addEventListener('click', () => updateOrderStatus('Cancelled'));

compareProductsBtn.addEventListener('click', compareProducts);

// Close custom alert modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === customAlertModal) {
        customAlertModal.classList.remove('active');
        // If it was a confirm dialog, resolve to false if clicked outside
        if (customModalCancelBtn.style.display === 'block') {
            customModalCancelBtn.click(); // Simulate cancel button click
        }
    }
});

// --- Authentication Check ---
onAuthStateChanged(auth, (user) => {
    if (user && user.email === 'admin@hina.com') { // Replace with your actual admin email
        // User is signed in and is the admin
        console.log("Admin logged in.");
        loadAdminData(); // Load all admin data
    } else {
        // User is not signed in or is not the admin
        console.log("Not authorized. Redirecting to index.html");
        window.location.href = 'index.html'; // Redirect to the main page
    }
});
