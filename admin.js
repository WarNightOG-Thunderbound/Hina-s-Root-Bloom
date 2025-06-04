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
  appId: "1:967448486557:web:2c77a83709b6ffb40097a8",
  measurementId: "G-CM67R9X13G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// --- DOM Elements ---
const adminLoginForm = document.getElementById('admin-login-form');
const adminEmailInput = document.getElementById('admin-email');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginSection = document.getElementById('admin-login-section');
const dashboardSection = document.getElementById('dashboard-section');
const productsSection = document.getElementById('products-section');
const categoriesSection = document.getElementById('categories-section');
const ordersSection = document.getElementById('orders-section');
const ratingsSection = document.getElementById('ratings-section');
const navLinks = document.querySelectorAll('.nav-link');
const userAuthSection = document.getElementById('user-auth-section');
const loginBtn = document.getElementById('login-btn');
const userProfileSection = document.getElementById('user-profile-section');
const welcomeMessage = document.getElementById('welcome-message');
const logoutBtn = document.getElementById('logout-btn');
const adminNavLinks = document.getElementById('admin-nav-links');

// Product Management
const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const productTitleInput = document.getElementById('product-title');
const productDescriptionInput = document.getElementById('product-description');
const productPriceInput = document.getElementById('product-price');
const productCategorySelect = document.getElementById('product-category');
const productImageUrlInput = document.getElementById('product-image-url');
const productImageUploadInput = document.getElementById('product-image-upload');
const productVideoUrlInput = document.getElementById('product-video-url');
const productListDiv = document.getElementById('product-list');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// Category Management
const categoryForm = document.getElementById('category-form');
const categoryNameInput = document.getElementById('category-name');
const categoryListUl = document.getElementById('category-list');

// Order Management
const orderListDiv = document.getElementById('order-list');

// Ratings Management
const ratingListDiv = document.getElementById('rating-list');

// Dashboard Analytics
const totalRevenueDisplay = document.getElementById('total-revenue');
const totalOrdersDisplay = document.getElementById('total-orders');
const totalProductsDisplay = document.getElementById('total-products');
const totalUsersDisplay = document.getElementById('total-users');
const salesChartCanvas = document.getElementById('salesChart');
let salesChart = null; // To hold the Chart.js instance

// Product Comparison
const compareProduct1Select = document.getElementById('compare-product-1');
const compareProduct2Select = document.getElementById('compare-product-2');
const compareProductsBtn = document.getElementById('compare-products-btn');
const productComparisonChartCanvas = document.getElementById('productComparisonChart');
let productComparisonChart = null;

// --- Global Variables ---
let currentProductEditId = null; // Stores the ID of the product being edited
let allProducts = {}; // To store all products fetched from DB
let allOrders = {}; // To store all orders fetched from DB
let allRatings = {}; // To store all ratings fetched from DB


// --- Utility Functions ---
function showCustomAlert(title, message, isConfirm = false, onOk = null, onCancel = null) {
    const customModal = document.getElementById('custom-alert-modal');
    const customModalTitle = document.getElementById('custom-modal-title');
    const customModalMessage = document.getElementById('custom-modal-message');
    const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
    const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');

    if (!customModal || !customModalTitle || !customModalMessage || !customModalOkBtn || !customModalCancelBtn) {
        console.error("Custom alert modal elements not found.");
        alert(`${title}: ${message}`); // Fallback to browser alert
        return;
    }

    customModalTitle.textContent = title;
    customModalMessage.textContent = message;

    customModalOkBtn.onclick = () => {
        customModal.style.display = 'none';
        if (onOk) onOk();
    };

    if (isConfirm) {
        customModalCancelBtn.style.display = 'inline-block';
        customModalCancelBtn.onclick = () => {
            customModal.style.display = 'none';
            if (onCancel) onCancel();
        };
    } else {
        customModalCancelBtn.style.display = 'none';
    }

    customModal.style.display = 'flex'; // Use flex to center
}

// --- Admin Authentication ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Assuming specific admin UID or role checking (for now, any logged-in user is admin)
        // In a real app, you'd check user.uid against a list of authorized admins or custom claims.
        // For this project, any authenticated user can access admin panel.
        adminLoginSection.style.display = 'none';
        dashboardSection.style.display = 'block'; // Show dashboard by default
        userAuthSection.style.display = 'none'; // Hide login button
        userProfileSection.style.display = 'flex'; // Show profile section
        welcomeMessage.textContent = `Welcome, Admin (${user.email})!`;
        adminNavLinks.style.display = 'flex'; // Show nav links

        loadAdminData(); // Load all data for admin sections
    } else {
        adminLoginSection.style.display = 'flex'; // Show login form
        dashboardSection.style.display = 'none'; // Hide dashboard
        productsSection.style.display = 'none';
        categoriesSection.style.display = 'none';
        ordersSection.style.display = 'none';
        ratingsSection.style.display = 'none';
        userAuthSection.style.display = 'block'; // Show login button
        userProfileSection.style.display = 'none'; // Hide profile section
        welcomeMessage.textContent = '';
        adminNavLinks.style.display = 'none'; // Hide nav links
        // Clear any charts or data displays
        if (salesChart) salesChart.destroy();
        if (productComparisonChart) productComparisonChart.destroy();
    }
});

adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = adminEmailInput.value;
    const password = adminPasswordInput.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showCustomAlert('Success', 'Admin logged in successfully!');
    } catch (error) {
        showCustomAlert('Login Failed', error.message);
    }
});

loginBtn.addEventListener('click', () => {
    adminLoginSection.style.display = 'flex';
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showCustomAlert('Success', 'Admin logged out successfully!');
        // No explicit redirect, onAuthStateChanged will handle UI changes
    } catch (error) {
        showCustomAlert('Error', error.message);
    }
});


// --- Navigation ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSectionId = e.target.getAttribute('href').substring(1);

        // Hide all sections
        dashboardSection.style.display = 'none';
        productsSection.style.display = 'none';
        categoriesSection.style.display = 'none';
        ordersSection.style.display = 'none';
        ratingsSection.style.display = 'none';

        // Show the target section
        document.getElementById(targetSectionId + '-section').style.display = 'block';

        // Update active class
        navLinks.forEach(nav => nav.classList.remove('active'));
        e.target.classList.add('active');

        // Re-render charts if going to dashboard
        if (targetSectionId === 'dashboard') {
            updateDashboardCharts();
            populateProductComparisonSelects();
        }
    });
});

// --- Product Management ---
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = productTitleInput.value;
    const description = productDescriptionInput.value;
    const price = parseFloat(productPriceInput.value);
    const category = productCategorySelect.value;
    let imageUrl = productImageUrlInput.value;
    const videoUrl = productVideoUrlInput.value;
    const imageFile = productImageUploadInput.files[0];

    if (!title || !description || isNaN(price) || !category) {
        showCustomAlert('Validation Error', 'Please fill in all required product fields.');
        return;
    }

    try {
        if (imageFile) {
            // Upload image to Firebase Storage
            const imageRef = storageRef(storage, `product_images/${imageFile.name}`);
            const snapshot = await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
            showCustomAlert('Image Uploaded', 'Product image uploaded successfully!');
        }

        const productData = {
            title,
            description,
            price,
            category,
            imageUrl,
            videoUrl,
            createdAt: serverTimestamp()
        };

        if (currentProductEditId) {
            // Update existing product
            await update(ref(database, `products/${currentProductEditId}`), productData);
            showCustomAlert('Success', 'Product updated successfully!');
            currentProductEditId = null; // Clear edit state
            productForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-plus"></i> Add Product';
            cancelEditBtn.style.display = 'none';
        } else {
            // Add new product
            const newProductRef = push(ref(database, 'products'));
            await set(newProductRef, productData);
            showCustomAlert('Success', 'Product added successfully!');
        }
        productForm.reset();
        productImageUploadInput.value = ''; // Clear file input
    } catch (error) {
        showCustomAlert('Error', 'Failed to save product: ' + error.message);
    }
});

cancelEditBtn.addEventListener('click', () => {
    productForm.reset();
    productImageUploadInput.value = '';
    currentProductEditId = null;
    productForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-plus"></i> Add Product';
    cancelEditBtn.style.display = 'none';
});

function loadProducts() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        productListDiv.innerHTML = ''; // Clear existing products
        allProducts = {}; // Clear global products object
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const productId = childSnapshot.key;
                const product = childSnapshot.val();
                allProducts[productId] = product; // Store product in global object
                displayProductItem(productId, product);
            });
        } else {
            productListDiv.innerHTML = '<p>No products added yet.</p>';
        }
        updateDashboardCards(); // Update dashboard with new product count
        populateProductComparisonSelects(); // Update comparison selects
    }, (error) => {
        showCustomAlert('Error', 'Failed to load products: ' + error.message);
    });
}

function displayProductItem(id, product) {
    const productItem = document.createElement('div');
    productItem.classList.add('product-item');
    productItem.innerHTML = `
        <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" alt="${product.title}">
        <h3>${product.title}</h3>
        <p>${product.description.substring(0, 100)}...</p>
        <p><strong>Price:</strong> $${product.price.toFixed(2)}</p>
        <p><strong>Category:</strong> ${product.category}</p>
        <div class="product-item-actions">
            <button class="admin-button secondary edit-product-btn" data-id="${id}"><i class="fas fa-edit"></i> Edit</button>
            <button class="admin-button danger delete-product-btn" data-id="${id}"><i class="fas fa-trash-alt"></i> Delete</button>
        </div>
    `;
    productListDiv.appendChild(productItem);
}

productListDiv.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-product-btn')) {
        const productId = e.target.dataset.id;
        editProduct(productId);
    } else if (e.target.classList.contains('delete-product-btn')) {
        const productId = e.target.dataset.id;
        showCustomAlert('Confirm Delete', 'Are you sure you want to delete this product?', true, () => {
            deleteProduct(productId);
        });
    }
});

function editProduct(productId) {
    const product = allProducts[productId];
    if (product) {
        currentProductEditId = productId;
        productTitleInput.value = product.title;
        productDescriptionInput.value = product.description;
        productPriceInput.value = product.price;
        productCategorySelect.value = product.category;
        productImageUrlInput.value = product.imageUrl || '';
        productVideoUrlInput.value = product.videoUrl || '';
        // Clear file input as it's for new uploads
        productImageUploadInput.value = '';

        productForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Update Product';
        cancelEditBtn.style.display = 'inline-block';
    }
}

async function deleteProduct(productId) {
    try {
        await remove(ref(database, `products/${productId}`));
        showCustomAlert('Success', 'Product deleted successfully!');
    } catch (error) {
        showCustomAlert('Error', 'Failed to delete product: ' + error.message);
    }
}

// --- Category Management ---
categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const categoryName = categoryNameInput.value.trim();
    if (categoryName) {
        try {
            // Push to a 'categories' node
            const newCategoryRef = push(ref(database, 'categories'));
            await set(newCategoryRef, { name: categoryName });
            showCustomAlert('Success', `Category "${categoryName}" added!`);
            categoryNameInput.value = '';
        } catch (error) {
            showCustomAlert('Error', 'Failed to add category: ' + error.message);
        }
    } else {
        showCustomAlert('Validation Error', 'Category name cannot be empty.');
    }
});

function loadCategories() {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
        categoryListUl.innerHTML = '';
        productCategorySelect.innerHTML = ''; // Clear product category select
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const categoryId = childSnapshot.key;
                const category = childSnapshot.val();
                displayCategoryItem(categoryId, category.name);
                addCategoryToSelect(categoryId, category.name);
            });
        } else {
            categoryListUl.innerHTML = '<p>No categories added yet.</p>';
        }
    }, (error) => {
        showCustomAlert('Error', 'Failed to load categories: ' + error.message);
    });
}

function displayCategoryItem(id, name) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <span>${name}</span>
        <button class="admin-button danger delete-category-btn" data-id="${id}"><i class="fas fa-trash-alt"></i> Delete</button>
    `;
    categoryListUl.appendChild(listItem);
}

function addCategoryToSelect(id, name) {
    const option = document.createElement('option');
    option.value = name; // Use name as value for simplicity
    option.textContent = name;
    productCategorySelect.appendChild(option);
}

categoryListUl.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-category-btn')) {
        const categoryId = e.target.dataset.id;
        showCustomAlert('Confirm Delete', 'Are you sure you want to delete this category? This will not remove products from this category.', true, () => {
            deleteCategory(categoryId);
        });
    }
});

async function deleteCategory(categoryId) {
    try {
        await remove(ref(database, `categories/${categoryId}`));
        showCustomAlert('Success', 'Category deleted successfully!');
    } catch (error) {
        showCustomAlert('Error', 'Failed to delete category: ' + error.message);
    }
}

function populateCategorySelect() {
    // This function is now primarily handled by loadCategories which updates productCategorySelect
    // upon data changes from Firebase.
    // However, if we need to manually trigger this without a DB listener, we could add logic here.
}


// --- Order Management ---
function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        orderListDiv.innerHTML = ''; // Clear existing orders
        allOrders = {}; // Clear global orders object
        if (snapshot.exists()) {
            const ordersArray = [];
            snapshot.forEach(childSnapshot => {
                const orderId = childSnapshot.key;
                const order = childSnapshot.val();
                allOrders[orderId] = order; // Store order in global object
                ordersArray.push({ id: orderId, ...order });
            });

            // Sort orders by timestamp, newest first
            ordersArray.sort((a, b) => (b.orderTime || 0) - (a.orderTime || 0));

            ordersArray.forEach(order => {
                displayOrderItem(order.id, order);
            });
        } else {
            orderListDiv.innerHTML = '<p>No orders placed yet.</p>';
        }
        updateDashboardCards(); // Update dashboard with new order count
        updateSalesChart(); // Update sales chart with new order data
    }, (error) => {
        showCustomAlert('Error', 'Failed to load orders: ' + error.message);
    });
}

function displayOrderItem(id, order) {
    const orderItem = document.createElement('div');
    orderItem.classList.add('order-item');

    const orderDate = order.orderTime ? new Date(order.orderTime).toLocaleString() : 'N/A';

    orderItem.innerHTML = `
        <img src="${order.productImageUrl || 'https://via.placeholder.com/80'}" alt="${order.productTitle}">
        <div class="order-item-details">
            <h4>Order ID: ${id}</h4>
            <p><strong>Product:</strong> ${order.productTitle}</p>
            <p><strong>Price:</strong> $${order.productPrice ? order.productPrice.toFixed(2) : 'N/A'}</p>
            <p><strong>Ordered By:</strong> ${order.userEmail}</p>
            <p><strong>Address:</strong> ${order.deliveryAddress || 'N/A'}</p>
            <p><strong>Phone:</strong> ${order.phoneNumber || 'N/A'}</p>
            <p><strong>Time:</strong> ${orderDate}</p>
            <p class="status">Status: Pending</p> </div>
        <div class="order-item-actions">
            <button class="admin-button primary" disabled>Mark as Shipped</button>
            <button class="admin-button danger delete-order-btn" data-id="${id}"><i class="fas fa-trash-alt"></i> Delete</button>
        </div>
    `;
    orderListDiv.appendChild(orderItem);

    // Add event listener for delete button
    orderItem.querySelector('.delete-order-btn').addEventListener('click', () => {
        showCustomAlert('Confirm Delete', 'Are you sure you want to delete this order?', true, () => {
            deleteOrder(id);
        });
    });
}

async function deleteOrder(orderId) {
    try {
        await remove(ref(database, `orders/${orderId}`));
        showCustomAlert('Success', 'Order deleted successfully!');
    } catch (error) {
        showCustomAlert('Error', 'Failed to delete order: ' + error.message);
    }
}


// --- Ratings Management ---
function loadRatings() {
    const allProductRatingsRef = ref(database, 'productRatings');
    onValue(allProductRatingsRef, async (snapshot) => {
        ratingListDiv.innerHTML = '';
        allRatings = {}; // Clear global ratings object
        const ratingsToDisplay = [];

        if (snapshot.exists()) {
            for (const productId in snapshot.val()) {
                const productRatings = snapshot.val()[productId];
                // Fetch product details for title and image
                const productSnapshot = await get(ref(database, `products/${productId}`));
                const product = productSnapshot.val();

                for (const userId in productRatings) {
                    const ratingValue = productRatings[userId];
                    allRatings[`${productId}-${userId}`] = { productId, userId, rating: ratingValue }; // Store in global object

                    // Fetch user details if needed (e.g., email)
                    // For now, let's just use the user ID.
                    ratingsToDisplay.push({
                        productId: productId,
                        productTitle: product ? product.title : 'Unknown Product',
                        productImageUrl: product ? product.imageUrl : '',
                        userId: userId,
                        rating: ratingValue,
                        // You could add timestamp here if you saved it with the rating
                    });
                }
            }
            ratingsToDisplay.forEach(ratingData => displayRatingItem(ratingData));
        } else {
            ratingListDiv.innerHTML = '<p>No ratings submitted yet.</p>';
        }
        updateDashboardCards(); // Update dashboard with new rating count
    }, (error) => {
        showCustomAlert('Error', 'Failed to load ratings: ' + error.message);
    });
}

function displayRatingItem(ratingData) {
    const ratingItem = document.createElement('div');
    ratingItem.classList.add('rating-item');

    const starHTML = getStarRatingHTML(ratingData.rating);

    ratingItem.innerHTML = `
        <img src="${ratingData.productImageUrl || 'https://via.placeholder.com/80'}" alt="${ratingData.productTitle}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
        <div class="rating-item-details">
            <h4>${ratingData.productTitle}</h4>
            <p><strong>Rated by User ID:</strong> ${ratingData.userId}</p>
            <p><strong>Rating:</strong> <span class="star-display">${starHTML} (${ratingData.rating})</span></p>
        </div>
        <button class="admin-button danger delete-rating-btn" data-product-id="${ratingData.productId}" data-user-id="${ratingData.userId}"><i class="fas fa-trash-alt"></i> Delete</button>
    `;
    ratingListDiv.appendChild(ratingItem);

    ratingItem.querySelector('.delete-rating-btn').addEventListener('click', () => {
        showCustomAlert('Confirm Delete', 'Are you sure you want to delete this rating?', true, () => {
            deleteRating(ratingData.productId, ratingData.userId);
        });
    });
}

async function deleteRating(productId, userId) {
    try {
        await remove(ref(database, `productRatings/${productId}/${userId}`));
        showCustomAlert('Success', 'Rating deleted successfully!');
    } catch (error) {
        showCustomAlert('Error', 'Failed to delete rating: ' + error.message);
    }
}

function getStarRatingHTML(averageRating) {
    let ratingHTML = '';
    const fullStars = Math.floor(averageRating);
    const halfStar = averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
        ratingHTML += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        ratingHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        ratingHTML += '<i class="far fa-star"></i>';
    }
    return ratingHTML;
}


// --- Dashboard Analytics ---
function updateDashboardCards() {
    const totalProducts = Object.keys(allProducts).length;
    const totalOrders = Object.keys(allOrders).length;

    let totalRevenue = 0;
    for (const orderId in allOrders) {
        const order = allOrders[orderId];
        totalRevenue += order.productPrice || 0;
    }

    // Get total users (assuming each user has an entry in /users node from cart or orders)
    // A more robust user count would involve iterating through auth.users or a dedicated users node
    // For simplicity, let's count unique user IDs from orders for now.
    const uniqueUsers = new Set();
    for (const orderId in allOrders) {
        if (allOrders[orderId].userId) {
            uniqueUsers.add(allOrders[orderId].userId);
        }
    }
    const totalUsers = uniqueUsers.size;


    totalProductsDisplay.textContent = totalProducts;
    totalOrdersDisplay.textContent = totalOrders;
    totalRevenueDisplay.textContent = `$${totalRevenue.toFixed(2)}`;
    totalUsersDisplay.textContent = totalUsers;
}

function updateSalesChart() {
    if (!salesChartCanvas) {
        console.warn("Sales chart canvas not found.");
        return;
    }

    const salesData = {}; // { YYYY-MM: totalSales }

    for (const orderId in allOrders) {
        const order = allOrders[orderId];
        if (order.orderTime && order.productPrice) {
            const date = new Date(order.orderTime);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!salesData[yearMonth]) {
                salesData[yearMonth] = 0;
            }
            salesData[yearMonth] += order.productPrice;
        }
    }

    const labels = Object.keys(salesData).sort();
    const data = labels.map(label => salesData[label]);

    if (salesChart) {
        salesChart.destroy(); // Destroy existing chart before creating a new one
    }

    salesChart = new Chart(salesChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Sales',
                data: data,
                backgroundColor: 'rgba(23, 162, 184, 0.2)', // --color-cyan-primary with transparency
                borderColor: '#17a2b8', // --color-cyan-primary
                borderWidth: 2,
                tension: 0.3,
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
                        text: 'Month'
                    }
                }
            }
        }
    });
}

function populateProductComparisonSelects() {
    compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
    compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';

    const productsArray = Object.values(allProducts);
    productsArray.forEach(product => {
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

compareProductsBtn.addEventListener('click', () => {
    const product1Id = compareProduct1Select.value;
    const product2Id = compareProduct2Select.value;

    if (!product1Id && !product2Id) {
        showCustomAlert('Selection Needed', 'Please select at least one product to compare.');
        return;
    }

    const product1 = allProducts[product1Id];
    const product2 = allProducts[product2Id];

    if (!product1 && !product2) {
        showCustomAlert('Error', 'Selected products not found.');
        return;
    }

    updateProductComparisonChart(product1, product2);
});

function updateProductComparisonChart(product1, product2) {
    if (!productComparisonChartCanvas) {
        console.warn("Product comparison chart canvas not found.");
        return;
    }

    const labels = ['Price', 'Average Rating', 'Total Orders'];
    const datasets = [];

    const getProductOrdersCount = (productId) => {
        let count = 0;
        for (const orderId in allOrders) {
            if (allOrders[orderId].productId === productId) {
                count++;
            }
        }
        return count;
    };

    if (product1) {
        const data1 = [
            product1.price || 0,
            product1.averageRating || 0,
            getProductOrdersCount(product1.id)
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
            product2.price || 0,
            product2.averageRating || 0,
            getProductOrdersCount(product2.id)
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
    updateDashboardCharts(); // Initial chart rendering
    populateProductComparisonSelects(); // Populate comparison selects
}

function updateDashboardCharts() {
    updateSalesChart();
    // Default empty comparison chart or initial comparison
    updateProductComparisonChart(null, null);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial check for auth state is handled by onAuthStateChanged
    // No need to call loadAdminData here, as onAuthStateChanged will trigger it
});
