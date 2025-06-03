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
const logoutButton = document.getElementById('logout-button');

// Dashboard elements
const totalProductsCount = document.getElementById('total-products-count');
const totalCategoriesCount = document.getElementById('total-categories-count');
const totalOrdersCount = document.getElementById('total-orders-count');
const averageRatingDisplay = document.getElementById('average-rating-display');

// Product Management elements
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

// Category Management elements
const categoryNameInput = document.getElementById('category-name');
const addCategoryBtn = document.getElementById('add-category-btn');
const updateCategoryBtn = document.getElementById('update-category-btn');
const cancelCategoryUpdateBtn = document.getElementById('cancel-category-update-btn');
const categoriesTableBody = document.getElementById('categories-table-body');

// Order Management elements
const ordersTableBody = document.getElementById('orders-table-body');

// Ratings Analytics elements
const ratingsDistributionChartCanvas = document.getElementById('ratingsDistributionChart');
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');
const productComparisonChartCanvas = document.getElementById('productComparisonChart');

// Custom Alert Modal elements
const customAlertModal = document.getElementById('custom-alert-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMessage = document.getElementById('custom-modal-message');
const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');

// Order Details Modal elements
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


let editingProductId = null;
let editingCategoryId = null;
let currentProductsData = {}; // Store products data for charts and comparison
let currentOrdersData = {}; // Store orders data

let ratingsDistributionChart;
let productComparisonChart;


// --- Utility Functions ---

function showCustomAlert(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        customModalTitle.textContent = title;
        customModalMessage.textContent = message;
        customModalCancelBtn.style.display = isConfirm ? 'block' : 'none';
        customAlertModal.classList.add('active'); // Use class for animation

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
        if (isConfirm) {
            customModalCancelBtn.addEventListener('click', handleCancel);
        }
    });
}

function showOrderDetailsModal(order) {
    detailOrderId.textContent = order.id;
    detailCustomerName.textContent = order.userName || 'N/A';
    detailCustomerEmail.textContent = order.userName || 'N/A'; // Assuming userName is email for now
    detailAddress.textContent = order.address;
    detailPhoneNumber.textContent = order.phoneNumber;
    detailOrderDate.textContent = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
    detailOrderStatus.textContent = order.status;
    detailProductImage.src = order.productImageUrl;
    detailProductTitle.textContent = order.productTitle;
    detailProductPrice.textContent = `$${order.productPrice.toFixed(2)}`;

    markShippedBtn.onclick = () => updateOrderStatus(order.id, 'Shipped');
    markDeliveredBtn.onclick = () => updateOrderStatus(order.id, 'Delivered');
    cancelOrderBtn.onclick = () => updateOrderStatus(order.id, 'Cancelled');

    orderDetailsModal.classList.add('active');
}

function closeOrderDetailsModal() {
    orderDetailsModal.classList.remove('active');
}

// --- Authentication ---
onAuthStateChanged(auth, (user) => {
    if (user && user.email === 'admin@hina.com') { // Replace with your actual admin email
        console.log("Admin logged in:", user.email);
        loadAdminData();
    } else {
        console.log("Not admin or not logged in. Redirecting to index.html");
        window.location.href = 'index.html'; // Redirect to public site
    }
});

logoutButton.addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("Admin logged out.");
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error("Error logging out:", error);
        showCustomAlert('Logout Error', 'Failed to log out. Please try again.');
    });
});

// --- Product Management ---

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

addProductBtn.addEventListener('click', async () => {
    const title = productTitleInput.value.trim();
    const category = productCategorySelect.value;
    const price = parseFloat(productPriceInput.value);
    const description = productDescriptionTextarea.value.trim();
    const imageFile = productImageInput.files[0];
    const videoUrl = productVideoUrlInput.value.trim();

    if (!title || !category || isNaN(price) || price <= 0 || !imageFile) {
        showCustomAlert('Input Error', 'Please fill in all required product fields (Title, Category, Price, Image).');
        return;
    }

    try {
        const imageRef = storageRef(storage, `product_images/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(imageRef);

        const newProductRef = push(ref(database, 'products'));
        await set(newProductRef, {
            title,
            category,
            price,
            description,
            imageUrl,
            videoUrl: videoUrl || null,
            createdAt: serverTimestamp()
        });

        showCustomAlert('Success', 'Product added successfully!');
        clearProductForm();
    } catch (error) {
        console.error("Error adding product:", error);
        showCustomAlert('Error', 'Failed to add product: ' + error.message);
    }
});

updateProductBtn.addEventListener('click', async () => {
    if (!editingProductId) return;

    const title = productTitleInput.value.trim();
    const category = productCategorySelect.value;
    const price = parseFloat(productPriceInput.value);
    const description = productDescriptionTextarea.value.trim();
    const imageFile = productImageInput.files[0];
    const videoUrl = productVideoUrlInput.value.trim();

    if (!title || !category || isNaN(price) || price <= 0) {
        showCustomAlert('Input Error', 'Please fill in all required product fields (Title, Category, Price).');
        return;
    }

    try {
        let imageUrl = currentProductsData[editingProductId].imageUrl; // Keep existing image if no new file
        if (imageFile) {
            const imageRef = storageRef(storage, `product_images/${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(imageRef);
        }

        const productRef = ref(database, `products/${editingProductId}`);
        await update(productRef, {
            title,
            category,
            price,
            description,
            imageUrl,
            videoUrl: videoUrl || null,
        });

        showCustomAlert('Success', 'Product updated successfully!');
        clearProductForm();
        editingProductId = null;
        addProductBtn.style.display = 'inline-block';
        updateProductBtn.style.display = 'none';
        cancelUpdateBtn.style.display = 'none';
    } catch (error) {
        console.error("Error updating product:", error);
        showCustomAlert('Error', 'Failed to update product: ' + error.message);
    }
});

cancelUpdateBtn.addEventListener('click', () => {
    clearProductForm();
    editingProductId = null;
    addProductBtn.style.display = 'inline-block';
    updateProductBtn.style.display = 'none';
    cancelUpdateBtn.style.display = 'none';
});

function clearProductForm() {
    productTitleInput.value = '';
    productCategorySelect.value = '';
    productPriceInput.value = '';
    productDescriptionTextarea.value = '';
    productImageInput.value = '';
    productImagePreview.src = '#';
    productImagePreview.style.display = 'none';
    productVideoUrlInput.value = '';
}

function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        productsTableBody.innerHTML = '';
        currentProductsData = {}; // Clear previous data
        let productCount = 0;
        snapshot.forEach(childSnapshot => {
            const product = { id: childSnapshot.key, ...childSnapshot.val() };
            currentProductsData[product.id] = product; // Store for later use
            productCount++;

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
        totalProductsCount.textContent = productCount;
        addProductsEventListeners();
        populateProductSelects(); // For comparison charts
    });
}

function addProductsEventListeners() {
    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', (event) => editProduct(event.target.dataset.id));
    });
    document.querySelectorAll('.delete-product-btn').forEach(button => {
        button.addEventListener('click', (event) => deleteProduct(event.target.dataset.id));
    });
}

function editProduct(productId) {
    const product = currentProductsData[productId];
    if (product) {
        editingProductId = productId;
        productTitleInput.value = product.title;
        productCategorySelect.value = product.category;
        productPriceInput.value = product.price;
        productDescriptionTextarea.value = product.description;
        productImagePreview.src = product.imageUrl;
        productImagePreview.style.display = 'block';
        productImageInput.value = ''; // Clear file input so user can choose new file if needed
        productVideoUrlInput.value = product.videoUrl || '';

        addProductBtn.style.display = 'none';
        updateProductBtn.style.display = 'inline-block';
        cancelUpdateBtn.style.display = 'inline-block';
    }
}

async function deleteProduct(productId) {
    const confirmDelete = await showCustomAlert('Confirm Delete', 'Are you sure you want to delete this product?', true);
    if (confirmDelete) {
        try {
            // Optionally delete image from storage as well
            const product = currentProductsData[productId];
            if (product && product.imageUrl) {
                const imageRef = storageRef(storage, product.imageUrl);
                // Check if image exists before deleting to avoid errors
                await getDownloadURL(imageRef).then(() => remove(imageRef)).catch(() => console.log("Image not found or already deleted."));
            }

            await remove(ref(database, `products/${productId}`));
            showCustomAlert('Success', 'Product deleted successfully!');
        } catch (error) {
            console.error("Error deleting product:", error);
            showCustomAlert('Error', 'Failed to delete product: ' + error.message);
        }
    }
}

// --- Category Management ---

addCategoryBtn.addEventListener('click', async () => {
    const categoryName = categoryNameInput.value.trim();
    if (!categoryName) {
        showCustomAlert('Input Error', 'Please enter a category name.');
        return;
    }

    try {
        const newCategoryRef = push(ref(database, 'categories'));
        await set(newCategoryRef, { name: categoryName });
        showCustomAlert('Success', 'Category added successfully!');
        categoryNameInput.value = '';
    } catch (error) {
        console.error("Error adding category:", error);
        showCustomAlert('Error', 'Failed to add category: ' + error.message);
    }
});

updateCategoryBtn.addEventListener('click', async () => {
    if (!editingCategoryId) return;

    const categoryName = categoryNameInput.value.trim();
    if (!categoryName) {
        showCustomAlert('Input Error', 'Please enter a category name.');
        return;
    }

    try {
        await update(ref(database, `categories/${editingCategoryId}`), { name: categoryName });
        showCustomAlert('Success', 'Category updated successfully!');
        categoryNameInput.value = '';
        editingCategoryId = null;
        addCategoryBtn.style.display = 'inline-block';
        updateCategoryBtn.style.display = 'none';
        cancelCategoryUpdateBtn.style.display = 'none';
    } catch (error) {
        console.error("Error updating category:", error);
        showCustomAlert('Error', 'Failed to update category: ' + error.message);
    }
});

cancelCategoryUpdateBtn.addEventListener('click', () => {
    categoryNameInput.value = '';
    editingCategoryId = null;
    addCategoryBtn.style.display = 'inline-block';
    updateCategoryBtn.style.display = 'none';
    cancelCategoryUpdateBtn.style.display = 'none';
});

function populateCategorySelect() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        productCategorySelect.innerHTML = '<option value="">Select a Category</option>'; // Default option
        let categoryCount = 0;
        snapshot.forEach(childSnapshot => {
            const category = { id: childSnapshot.key, ...childSnapshot.val() };
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            productCategorySelect.appendChild(option);
            categoryCount++;
        });
        totalCategoriesCount.textContent = categoryCount;
    });
}

function loadCategories() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        categoriesTableBody.innerHTML = '';
        snapshot.forEach(childSnapshot => {
            const category = { id: childSnapshot.key, ...childSnapshot.val() };
            const row = categoriesTableBody.insertRow();
            row.innerHTML = `
                <td>${category.name}</td>
                <td class="action-buttons-cell">
                    <button class="admin-button secondary edit-category-btn" data-id="${category.id}" data-name="${category.name}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="admin-button danger delete-category-btn" data-id="${category.id}"><i class="fas fa-trash"></i> Delete</button>
                </td>
            `;
        });
        addCategoriesEventListeners();
    });
}

function addCategoriesEventListeners() {
    document.querySelectorAll('.edit-category-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            editingCategoryId = event.target.dataset.id;
            categoryNameInput.value = event.target.dataset.name;
            addCategoryBtn.style.display = 'none';
            updateCategoryBtn.style.display = 'inline-block';
            cancelCategoryUpdateBtn.style.display = 'inline-block';
        });
    });
    document.querySelectorAll('.delete-category-btn').forEach(button => {
        button.addEventListener('click', (event) => deleteCategory(event.target.dataset.id));
    });
}

async function deleteCategory(categoryId) {
    const confirmDelete = await showCustomAlert('Confirm Delete', 'Are you sure you want to delete this category? This will not delete products in this category.', true);
    if (confirmDelete) {
        try {
            await remove(ref(database, `categories/${categoryId}`));
            showCustomAlert('Success', 'Category deleted successfully!');
        } catch (error) {
            console.error("Error deleting category:", error);
            showCustomAlert('Error', 'Failed to delete category: ' + error.message);
        }
    }
}

// --- Order Management ---

function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        ordersTableBody.innerHTML = '';
        currentOrdersData = {};
        let orderCount = 0;
        snapshot.forEach(childSnapshot => {
            const order = { id: childSnapshot.key, ...childSnapshot.val() };
            currentOrdersData[order.id] = order;
            orderCount++;

            const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';

            const row = ordersTableBody.insertRow();
            row.innerHTML = `
                <td>${order.id.substring(0, 8)}...</td>
                <td>${order.userName || 'N/A'}</td>
                <td>${order.productTitle}</td>
                <td>$${order.productPrice.toFixed(2)}</td>
                <td>${orderDate}</td>
                <td>${order.status}</td>
                <td class="action-buttons-cell">
                    <button class="admin-button secondary view-order-details-btn" data-id="${order.id}"><i class="fas fa-info-circle"></i> View Details</button>
                </td>
            `;
        });
        totalOrdersCount.textContent = orderCount;
        addOrderEventListeners();
    });
}

function addOrderEventListeners() {
    document.querySelectorAll('.view-order-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const orderId = event.target.dataset.id;
            const order = currentOrdersData[orderId];
            if (order) {
                showOrderDetailsModal(order);
            }
        });
    });
}

async function updateOrderStatus(orderId, newStatus) {
    const confirmUpdate = await showCustomAlert('Confirm Status Update', `Are you sure you want to change this order's status to "${newStatus}"?`, true);
    if (confirmUpdate) {
        try {
            const orderRef = ref(database, `orders/${orderId}`);
            await update(orderRef, { status: newStatus });
            showCustomAlert('Success', `Order status updated to "${newStatus}"!`);
            closeOrderDetailsModal();
        } catch (error) {
            console.error("Error updating order status:", error);
            showCustomAlert('Error', 'Failed to update order status: ' + error.message);
        }
    }
}

// --- Ratings Analytics ---

function loadRatings() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        let ratings = [];
        let totalOverallRating = 0;
        let totalRatingCount = 0;

        snapshot.forEach(productSnapshot => {
            const product = productSnapshot.val();
            if (product.ratings) {
                for (let userId in product.ratings) {
                    const rating = product.ratings[userId];
                    ratings.push(rating);
                    totalOverallRating += rating;
                    totalRatingCount++;
                }
            }
        });

        // Calculate average rating for dashboard
        const averageOverallRating = totalRatingCount > 0 ? (totalOverallRating / totalRatingCount).toFixed(1) : '0.0';
        averageRatingDisplay.textContent = averageOverallRating;

        renderRatingsDistributionChart(ratings);
    });
}

function renderRatingsDistributionChart(ratings) {
    const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 for 1-star, 1 for 2-star, etc.
    ratings.forEach(r => {
        if (r >= 1 && r <= 5) {
            ratingCounts[r - 1]++;
        }
    });

    const data = {
        labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
        datasets: [{
            label: 'Number of Ratings',
            data: ratingCounts,
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
    };

    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Rating'
                    }
                }
            }
        }
    };

    if (ratingsDistributionChart) {
        ratingsDistributionChart.destroy();
    }
    ratingsDistributionChart = new Chart(ratingsDistributionChartCanvas, config);
}

function populateProductSelects() {
    compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';

    for (const productId in currentProductsData) {
        const product = currentProductsData[productId];
        const option1 = document.createElement('option');
        option1.value = productId;
        option1.textContent = product.title;
        compareProduct1Select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = productId;
        option2.textContent = product.title;
        compareProduct2Select.appendChild(option2);
    }
}

compareProductsBtn.addEventListener('click', () => {
    const product1Id = compareProduct1Select.value;
    const product2Id = compareProduct2Select.value;

    if (!product1Id || !product2Id) {
        showCustomAlert('Selection Error', 'Please select two products to compare.');
        return;
    }

    const product1 = currentProductsData[product1Id];
    const product2 = currentProductsData[product2Id];

    if (!product1 || !product2) {
        showCustomAlert('Error', 'Selected products not found.');
        return;
    }

    renderProductComparisonChart(product1, product2);
});

function calculateRatingDistribution(product) {
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (product.ratings) {
        for (let userId in product.ratings) {
            const rating = product.ratings[userId];
            if (rating >= 1 && rating <= 5) {
                ratingCounts[rating]++;
            }
        }
    }
    return Object.values(ratingCounts);
}

function renderProductComparisonChart(product1, product2) {
    const labels = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
    const data1 = calculateRatingDistribution(product1);
    const data2 = calculateRatingDistribution(product2);

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
    closeOrderDetailsModalBtn.addEventListener('click', closeOrderDetailsModal);
    window.addEventListener('click', (event) => {
        if (event.target === orderDetailsModal) {
            closeOrderDetailsModal();
        }
    });
});
