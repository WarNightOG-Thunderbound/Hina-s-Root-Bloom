// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, push, set, remove, onValue, serverTimestamp, update, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBr6A2OGh-nwfMzOwmVOWs1-u5ylZ2Vemw",
  authDomain: "hina-s-rootandbloomstore.firebaseapp.com",
  databaseURL: "https://hina-s-rootandbloomstore-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hina-s-rootandbloomstore",
  storageBucket: "hina-s-rootandbloomstore.firebasestorage.app",
  messagingSenderId: "967448486557",
  appId: "1:967448486557:web:8c51a02796e62111c1d81b",
  measurementId: "G-65W55QJJF4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);


// Ensure all DOM-related code runs after the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (ONLY for admin.html) ---
    const adminContent = document.getElementById('admin-content');
    const loginRequired = document.getElementById('login-required');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    // Add Product Form
    const addProductForm = document.getElementById('add-product-form');
    const productTitleInput = document.getElementById('product-title');
    const productDescriptionInput = document.getElementById('product-description');
    const productPriceInput = document.getElementById('product-price');
    const productCategorySelect = document.getElementById('product-category');
    const productImageUrlInput = document.getElementById('product-image-url');
    const productImageFile = document.getElementById('product-image-file');
    const productVideoUrlInput = document.getElementById('product-video-url');
    const addProductBtn = document.getElementById('add-product-btn');
    const productFormMessage = document.getElementById('product-form-message');

    // Product Management
    const productList = document.getElementById('product-list');
    const editProductModal = document.getElementById('edit-product-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const editProductId = document.getElementById('edit-product-id');
    const editProductTitle = document.getElementById('edit-product-title');
    const editProductDescription = document.getElementById('edit-product-description');
    const editProductPrice = document.getElementById('edit-product-price');
    const editProductCategory = document.getElementById('edit-product-category');
    const editProductImageUrl = document.getElementById('edit-product-image-url');
    const editProductImageFile = document.getElementById('edit-product-image-file');
    const editProductVideoUrl = document.getElementById('edit-product-video-url');
    const updateProductBtn = document.getElementById('update-product-btn');
    const editFormMessage = document.getElementById('edit-form-message');

    // Category Management
    const addCategoryInput = document.getElementById('add-category-input');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryList = document.getElementById('category-list');
    const categoryMessage = document.getElementById('category-message');

    // Order Management
    const orderList = document.getElementById('order-list');

    // Ratings Analytics
    const productRatingSelect = document.getElementById('product-rating-select');
    const averageRatingDisplay = document.getElementById('average-rating-display');
    const ratingDistributionList = document.getElementById('rating-distribution-list');

    // Product Comparison Chart
    const compareProduct1Select = document.getElementById('compare-product-1');
    const compareProduct2Select = document.getElementById('compare-product-2');
    const compareProductsBtn = document.getElementById('compare-products-btn');
    const productComparisonChartCanvas = document.getElementById('productComparisonChart');
    let productComparisonChart = null; // Chart.js instance

    // Custom Alert Modal
    const customAlertModal = document.getElementById('custom-alert-modal');
    const customModalTitle = document.getElementById('custom-modal-title');
    const customModalMessage = document.getElementById('custom-modal-message');
    const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
    const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');


    let allProducts = []; // To store all products for comparison and ratings

    // --- Utility Functions ---
    function showCustomAlert(title, message, type = 'alert', onOk = null, onCancel = null) {
        if (customModalTitle) customModalTitle.textContent = title;
        if (customModalMessage) customModalMessage.textContent = message;
        if (customModalCancelBtn) customModalCancelBtn.style.display = 'none'; // Hide cancel by default

        if (customModalOkBtn) {
            customModalOkBtn.onclick = () => {
                if (customAlertModal) customAlertModal.style.display = 'none';
                if (onOk) onOk();
            };
        }

        if (type === 'confirm' && customModalCancelBtn) {
            customModalCancelBtn.style.display = 'inline-block';
            customModalCancelBtn.onclick = () => {
                if (customAlertModal) customAlertModal.style.display = 'none';
                if (onCancel) onCancel();
            };
        }

        if (customAlertModal) customAlertModal.style.display = 'flex';
    }


    // --- Admin Authentication ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, show admin content
            if (loginRequired) loginRequired.style.display = 'none';
            if (adminContent) adminContent.style.display = 'block';
            loadAdminData(); // Load all data once authenticated
        } else {
            // User is signed out, show login message
            if (loginRequired) loginRequired.style.display = 'flex';
            if (adminContent) adminContent.style.display = 'none';
            // Optionally redirect to index.html or show a login form within admin.html if user is not authenticated
        }
    });

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                showCustomAlert("Logged Out", "You have been successfully logged out.", 'alert');
                // onAuthStateChanged listener will handle UI update
            }).catch((error) => {
                console.error("Error signing out:", error);
                showCustomAlert("Logout Error", "Failed to log out. Please try again.", 'alert');
            });
        });
    }


    // --- Product Management ---
    if (addProductBtn) {
        addProductBtn.addEventListener('click', async () => {
            const title = productTitleInput ? productTitleInput.value.trim() : '';
            const description = productDescriptionInput ? productDescriptionInput.value.trim() : '';
            const price = productPriceInput ? parseFloat(productPriceInput.value) : 0;
            const category = productCategorySelect ? productCategorySelect.value : '';
            const imageUrl = productImageUrlInput ? productImageUrlInput.value.trim() : '';
            const imageFile = productImageFile && productImageFile.files.length > 0 ? productImageFile.files[0] : null;
            const videoUrl = productVideoUrlInput ? productVideoUrlInput.value.trim() : '';

            if (!title || !description || isNaN(price) || price <= 0 || !category || (!imageUrl && !imageFile)) {
                if (productFormMessage) {
                    productFormMessage.textContent = 'Please fill in all required fields and provide either an image URL or upload an image.';
                    productFormMessage.style.color = 'var(--color-error-red)';
                }
                return;
            }

            if (productFormMessage) {
                productFormMessage.textContent = 'Adding product...';
                productFormMessage.style.color = 'var(--color-info-blue)';
            }

            let finalImageUrl = imageUrl;

            if (imageFile) {
                const imageRef = storageRef(storage, `product_images/${imageFile.name}`);
                try {
                    await uploadBytes(imageRef, imageFile);
                    finalImageUrl = await getDownloadURL(imageRef);
                } catch (error) {
                    console.error("Error uploading image:", error);
                    if (productFormMessage) {
                        productFormMessage.textContent = 'Failed to upload image.';
                        productFormMessage.style.color = 'var(--color-error-red)';
                    }
                    return;
                }
            }

            const newProduct = {
                title,
                description,
                price,
                category,
                imageUrl: finalImageUrl,
                videoUrl: videoUrl || null,
                createdAt: serverTimestamp(),
                ratings: {} // Initialize ratings as an empty object
            };

            push(ref(database, 'products'), newProduct)
                .then(() => {
                    if (productFormMessage) {
                        productFormMessage.textContent = 'Product added successfully!';
                        productFormMessage.style.color = 'var(--color-success-green)';
                    }
                    if (addProductForm) addProductForm.reset();
                    // Reload products to update the list and comparison selects
                    loadProducts();
                })
                .catch((error) => {
                    console.error("Error adding product:", error);
                    if (productFormMessage) {
                        productFormMessage.textContent = 'Error adding product.';
                        productFormMessage.style.color = 'var(--color-error-red)';
                    }
                });
        });
    }

    function loadProducts() {
        const productsRef = ref(database, 'products');
        onValue(productsRef, (snapshot) => {
            if (productList) productList.innerHTML = '';
            allProducts = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const product = { id: childSnapshot.key, ...childSnapshot.val() };
                    allProducts.push(product);

                    const averageRating = calculateAverageRating(product.id, product.ratings);
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="product-info">
                            <img src="${product.imageUrl || 'placeholder.png'}" alt="${product.title}" class="product-thumbnail">
                            <div>
                                <strong>${product.title}</strong> ($${product.price.toFixed(2)}) - ${product.category}
                                <div class="rating-display">
                                    ${generateStarRating(averageRating)} (${Object.keys(product.ratings || {}).length} reviews)
                                </div>
                            </div>
                        </div>
                        <div class="product-actions">
                            <button class="admin-button edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
                            <button class="admin-button delete-btn" data-id="${product.id}" data-image-url="${product.imageUrl || ''}"><i class="fas fa-trash-alt"></i> Delete</button>
                        </div>
                    `;
                    if (productList) productList.appendChild(listItem);
                });
            } else {
                if (productList) productList.innerHTML = '<li>No products found.</li>';
            }
            populateProductSelects(allProducts); // Populate product selects for ratings and comparison
        }, (error) => {
            console.error("Error loading products:", error);
            showCustomAlert("Error", "Failed to load products.", 'alert');
        });
    }

    function calculateAverageRating(productId, ratings) {
        if (!ratings) return 0;
        const ratingValues = Object.values(ratings).map(r => r.rating);
        if (ratingValues.length === 0) return 0;
        const sum = ratingValues.reduce((acc, curr) => acc + curr, 0);
        return sum / ratingValues.length;
    }

    function generateStarRating(averageRating) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= averageRating) {
                starsHtml += '<i class="fas fa-star filled"></i>';
            } else if (i - 0.5 <= averageRating) {
                starsHtml += '<i class="fas fa-star-half-alt filled"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        return starsHtml;
    }


    // Edit Product Modal
    if (productList) {
        productList.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const productId = e.target.dataset.id;
                const productRef = ref(database, `products/${productId}`);
                get(productRef).then((snapshot) => {
                    if (snapshot.exists()) {
                        const product = snapshot.val();
                        if (editProductId) editProductId.value = productId;
                        if (editProductTitle) editProductTitle.value = product.title;
                        if (editProductDescription) editProductDescription.value = product.description;
                        if (editProductPrice) editProductPrice.value = product.price;
                        if (editProductCategory) editProductCategory.value = product.category;
                        if (editProductImageUrl) editProductImageUrl.value = product.imageUrl || '';
                        if (editProductVideoUrl) editProductVideoUrl.value = product.videoUrl || '';
                        if (editFormMessage) editFormMessage.textContent = ''; // Clear previous messages
                        if (editProductModal) editProductModal.style.display = 'flex';
                    } else {
                        showCustomAlert("Error", "Product not found.", 'alert');
                    }
                }).catch((error) => {
                    console.error("Error fetching product for edit:", error);
                    showCustomAlert("Error", "Failed to load product for editing.", 'alert');
                });
            }
        });
    }

    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', () => {
            if (editProductModal) editProductModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (editProductModal && event.target === editProductModal) {
            editProductModal.style.display = 'none';
        } else if (customAlertModal && event.target === customAlertModal) {
            customAlertModal.style.display = 'none';
        }
    });

    if (updateProductBtn) {
        updateProductBtn.addEventListener('click', async () => {
            const productId = editProductId ? editProductId.value : '';
            const title = editProductTitle ? editProductTitle.value.trim() : '';
            const description = editProductDescription ? editProductDescription.value.trim() : '';
            const price = editProductPrice ? parseFloat(editProductPrice.value) : 0;
            const category = editProductCategory ? editProductCategory.value : '';
            const imageUrl = editProductImageUrl ? editProductImageUrl.value.trim() : '';
            const imageFile = editProductImageFile && editProductImageFile.files.length > 0 ? editProductImageFile.files[0] : null;
            const videoUrl = editProductVideoUrl ? editProductVideoUrl.value.trim() : '';

            if (!title || !description || isNaN(price) || price <= 0 || !category || (!imageUrl && !imageFile)) {
                if (editFormMessage) {
                    editFormMessage.textContent = 'Please fill in all required fields and provide either an image URL or upload an image.';
                    editFormMessage.style.color = 'var(--color-error-red)';
                }
                return;
            }

            if (editFormMessage) {
                editFormMessage.textContent = 'Updating product...';
                editFormMessage.style.color = 'var(--color-info-blue)';
            }

            let finalImageUrl = imageUrl;

            if (imageFile) {
                const imageRef = storageRef(storage, `product_images/${imageFile.name}`);
                try {
                    await uploadBytes(imageRef, imageFile);
                    finalImageUrl = await getDownloadURL(imageRef);
                } catch (error) {
                    console.error("Error uploading new image:", error);
                    if (editFormMessage) {
                        editFormMessage.textContent = 'Failed to upload new image.';
                        editFormMessage.style.color = 'var(--color-error-red)';
                    }
                    return;
                }
            }

            const updatedProduct = {
                title,
                description,
                price,
                category,
                imageUrl: finalImageUrl,
                videoUrl: videoUrl || null,
                updatedAt: serverTimestamp()
            };

            update(ref(database, `products/${productId}`), updatedProduct)
                .then(() => {
                    if (editFormMessage) {
                        editFormMessage.textContent = 'Product updated successfully!';
                        editFormMessage.style.color = 'var(--color-success-green)';
                    }
                    loadProducts(); // Refresh list
                    if (editProductModal) editProductModal.style.display = 'none';
                })
                .catch((error) => {
                    console.error("Error updating product:", error);
                    if (editFormMessage) {
                        editFormMessage.textContent = 'Error updating product.';
                        editFormMessage.style.color = 'var(--color-error-red)';
                    }
                });
        });
    }


    // Delete Product
    if (productList) {
        productList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const productId = e.target.dataset.id;
                const imageUrlToDelete = e.target.dataset.imageUrl;

                showCustomAlert("Confirm Delete", "Are you sure you want to delete this product? This action cannot be undone.", 'confirm', () => {
                    // User confirmed delete
                    remove(ref(database, `products/${productId}`))
                        .then(() => {
                            // Also delete image from storage if it's not a placeholder
                            if (imageUrlToDelete && !imageUrlToDelete.includes('placeholder.png')) {
                                const imageRef = storageRef(storage, imageUrlToDelete);
                                deleteObject(imageRef).catch((error) => {
                                    console.warn("Error deleting image from storage (might not exist):", error);
                                });
                            }
                            showCustomAlert("Deleted!", "Product deleted successfully.", 'alert');
                            loadProducts(); // Refresh the list
                        })
                        .catch((error) => {
                            console.error("Error deleting product:", error);
                            showCustomAlert("Delete Error", "Failed to delete product.", 'alert');
                        });
                });
            }
        });
    }


    // --- Category Management ---
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            const categoryName = addCategoryInput ? addCategoryInput.value.trim() : '';
            if (categoryName) {
                push(ref(database, 'categories'), { name: categoryName })
                    .then(() => {
                        if (categoryMessage) {
                            categoryMessage.textContent = 'Category added!';
                            categoryMessage.style.color = 'var(--color-success-green)';
                        }
                        if (addCategoryInput) addCategoryInput.value = '';
                        populateCategorySelect(); // Refresh selects
                    })
                    .catch((error) => {
                        console.error("Error adding category:", error);
                        if (categoryMessage) {
                            categoryMessage.textContent = 'Error adding category.';
                            categoryMessage.style.color = 'var(--color-error-red)';
                        }
                    });
            } else {
                if (categoryMessage) {
                    categoryMessage.textContent = 'Category name cannot be empty.';
                    categoryMessage.style.color = 'var(--color-error-red)';
                }
            }
        });
    }

    function loadCategories() {
        const categoriesRef = ref(database, 'categories');
        onValue(categoriesRef, (snapshot) => {
            if (categoryList) categoryList.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const category = { id: childSnapshot.key, ...childSnapshot.val() };
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        ${category.name}
                        <button class="admin-button delete-category-btn" data-id="${category.id}"><i class="fas fa-trash-alt"></i></button>
                    `;
                    if (categoryList) categoryList.appendChild(listItem);
                });
            } else {
                if (categoryList) categoryList.innerHTML = '<li>No categories found.</li>';
            }
        }, (error) => {
            console.error("Error loading categories:", error);
            showCustomAlert("Error", "Failed to load categories.", 'alert');
        });
    }

    if (categoryList) {
        categoryList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-category-btn')) {
                const categoryId = e.target.dataset.id;
                showCustomAlert("Confirm Delete", "Are you sure you want to delete this category? Products assigned to this category will remain, but the category will be removed from the list.", 'confirm', () => {
                    remove(ref(database, `categories/${categoryId}`))
                        .then(() => {
                            showCustomAlert("Deleted!", "Category deleted successfully.", 'alert');
                            populateCategorySelect(); // Refresh selects
                        })
                        .catch((error) => {
                            console.error("Error deleting category:", error);
                            showCustomAlert("Delete Error", "Failed to delete category.", 'alert');
                        });
                });
            }
        });
    }

    function populateCategorySelect() {
        const categoriesRef = ref(database, 'categories');
        onValue(categoriesRef, (snapshot) => {
            // Clear existing options except the first "Select Category"
            if (productCategorySelect) productCategorySelect.innerHTML = '<option value="">Select Category</option>';
            if (editProductCategory) editProductCategory.innerHTML = '<option value="">Select Category</option>';

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const category = childSnapshot.val();
                    const optionAdd = document.createElement('option');
                    optionAdd.value = category.name;
                    optionAdd.textContent = category.name;
                    if (productCategorySelect) productCategorySelect.appendChild(optionAdd);

                    const optionEdit = document.createElement('option');
                    optionEdit.value = category.name;
                    optionEdit.textContent = category.name;
                    if (editProductCategory) editProductCategory.appendChild(optionEdit);
                });
            }
        }, { onlyOnce: true }); // Use onlyOnce to prevent continuous re-rendering
    }


    // --- Order Management ---
    function loadOrders() {
        const ordersRef = ref(database, 'orders');
        onValue(ordersRef, (snapshot) => {
            if (orderList) orderList.innerHTML = '';
            if (snapshot.exists()) {
                const orders = [];
                snapshot.forEach((childSnapshot) => {
                    orders.push({ id: childSnapshot.key, ...childSnapshot.val() });
                });

                // Sort orders by orderDate, newest first
                orders.sort((a, b) => {
                    const dateA = a.orderDate ? (typeof a.orderDate === 'object' ? a.orderDate.toMillis() : a.orderDate) : 0;
                    const dateB = b.orderDate ? (typeof b.orderDate === 'object' ? b.orderDate.toMillis() : b.orderDate) : 0;
                    return dateB - dateA;
                });

                orders.forEach(order => {
                    const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A';
                    const listItem = document.createElement('li');
                    listItem.classList.add('order-item');
                    listItem.innerHTML = `
                        <div class="order-header">
                            <strong>Order ID:</strong> ${order.id} <br>
                            <strong>Product:</strong> ${order.productTitle} ($${order.productPrice.toFixed(2)}) <br>
                            <strong>Order Date:</strong> ${orderDate} <br>
                            <strong>Status:</strong> 
                            <select class="order-status-select" data-id="${order.id}">
                                <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                        <div class="order-details">
                            <img src="${order.productImageUrl || 'placeholder.png'}" alt="${order.productTitle}" class="order-product-thumbnail">
                            <p><strong>Address:</strong> ${order.address || 'N/A'}</p>
                            <p><strong>Phone:</strong> ${order.phoneNumber || 'N/A'}</p>
                        </div>
                        <button class="admin-button delete-order-btn" data-id="${order.id}"><i class="fas fa-trash-alt"></i> Delete Order</button>
                    `;
                    if (orderList) orderList.appendChild(listItem);
                });

                document.querySelectorAll('.order-status-select').forEach(select => {
                    select.addEventListener('change', (e) => {
                        const orderId = e.target.dataset.id;
                        const newStatus = e.target.value;
                        updateOrderStatus(orderId, newStatus);
                    });
                });

                document.querySelectorAll('.delete-order-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const orderId = e.target.dataset.id;
                        showCustomAlert("Confirm Delete", "Are you sure you want to delete this order?", 'confirm', () => {
                            deleteOrder(orderId);
                        });
                    });
                });

            } else {
                if (orderList) orderList.innerHTML = '<li>No orders found.</li>';
            }
        }, (error) => {
            console.error("Error loading orders:", error);
            showCustomAlert("Error", "Failed to load orders.", 'alert');
        });
    }

    function updateOrderStatus(orderId, newStatus) {
        const orderRef = ref(database, `orders/${orderId}`);
        update(orderRef, { status: newStatus, lastUpdated: serverTimestamp() })
            .then(() => {
                showCustomAlert("Status Updated", `Order ${orderId} status updated to ${newStatus}.`, 'alert');
            })
            .catch(error => {
                console.error("Error updating order status:", error);
                showCustomAlert("Update Failed", "Failed to update order status. Please try again.", 'alert');
            });
    }

    function deleteOrder(orderId) {
        const orderRef = ref(database, `orders/${orderId}`);
        remove(orderRef)
            .then(() => {
                showCustomAlert("Order Deleted", `Order ${orderId} has been deleted.`, 'alert');
            })
            .catch(error => {
                console.error("Error deleting order:", error);
                showCustomAlert("Delete Failed", "Failed to delete order. Please try again.", 'alert');
            });
    }


    // --- Ratings Analytics ---
    function loadRatings() {
        // This function doesn't actively load ratings but prepares the UI to display them.
        // The actual ratings data is loaded with products (allProducts array)
        // and used by populateProductSelects and updateRatingsAnalytics.
    }

    function populateProductSelects(productsData) {
        // Populate rating product select
        if (productRatingSelect) productRatingSelect.innerHTML = '<option value="">Select a Product</option>';
        if (compareProduct1Select) compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
        if (compareProduct2Select) compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';

        productsData.forEach(product => {
            const optionRating = document.createElement('option');
            optionRating.value = product.id;
            optionRating.textContent = product.title;
            if (productRatingSelect) productRatingSelect.appendChild(optionRating);

            const optionCompare1 = document.createElement('option');
            optionCompare1.value = product.id;
            optionCompare1.textContent = product.title;
            if (compareProduct1Select) compareProduct1Select.appendChild(optionCompare1);

            const optionCompare2 = document.createElement('option');
            optionCompare2.value = product.id;
            optionCompare2.textContent = product.title;
            if (compareProduct2Select) compareProduct2Select.appendChild(optionCompare2);
        });
    }

    if (productRatingSelect) {
        productRatingSelect.addEventListener('change', (e) => {
            const selectedProductId = e.target.value;
            updateRatingsAnalytics(selectedProductId);
        });
    }

    function updateRatingsAnalytics(productId) {
        if (averageRatingDisplay) averageRatingDisplay.textContent = 'N/A';
        if (ratingDistributionList) ratingDistributionList.innerHTML = '';

        if (!productId) {
            return;
        }

        const product = allProducts.find(p => p.id === productId);
        if (!product || !product.ratings) {
            if (ratingDistributionList) ratingDistributionList.innerHTML = '<li>No ratings for this product.</li>';
            return;
        }

        const ratings = Object.values(product.ratings).map(r => r.rating);
        if (ratings.length === 0) {
            if (ratingDistributionList) ratingDistributionList.innerHTML = '<li>No ratings for this product.</li>';
            return;
        }

        const sum = ratings.reduce((acc, curr) => acc + curr, 0);
        const average = (sum / ratings.length).toFixed(2);
        if (averageRatingDisplay) averageRatingDisplay.textContent = average;

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach(rating => {
            distribution[rating]++;
        });

        for (let i = 5; i >= 1; i--) {
            const count = distribution[i];
            const percentage = (count / ratings.length * 100).toFixed(1);
            const listItem = document.createElement('li');
            listItem.textContent = `${i} Star: ${count} (${percentage}%)`;
            if (ratingDistributionList) ratingDistributionList.appendChild(listItem);
        }
    }


    // --- Product Comparison Chart ---
    if (compareProductsBtn) {
        compareProductsBtn.addEventListener('click', () => {
            const product1Id = compareProduct1Select ? compareProduct1Select.value : '';
            const product2Id = compareProduct2Select ? compareProduct2Select.value : '';

            if (!product1Id && !product2Id) {
                showCustomAlert("Selection Required", "Please select at least one product to compare.", 'alert');
                return;
            }

            const product1 = allProducts.find(p => p.id === product1Id);
            const product2 = allProducts.find(p => p.id === product2Id);

            if ((product1Id && !product1) || (product2Id && !product2)) {
                showCustomAlert("Error", "Selected product(s) not found.", 'alert');
                return;
            }

            renderProductComparisonChart(product1, product2);
        });
    }

    function renderProductComparisonChart(product1, product2) {
        const labels = ['Price', 'Average Rating'];
        const datasets = [];

        const data1 = [];
        const data2 = [];

        if (product1) {
            data1.push(product1.price);
            data1.push(calculateAverageRating(product1.id, product1.ratings));
        }
        if (product2) {
            data2.push(product2.price);
            data2.push(calculateAverageRating(product2.id, product2.ratings));
        }

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

        if (productComparisonChartCanvas) {
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
    }


    // --- Initial Data Load ---
    function loadAdminData() {
        populateCategorySelect();
        loadProducts();
        loadOrders();
        loadRatings(); // Load ratings for analytics
    }

    // Initial check for auth state is handled by onAuthStateChanged, which then calls loadAdminData
});
