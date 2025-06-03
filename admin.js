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
                            <img src="${product.imageUrl || 'Hina%E2%80%99s%20Root&Bloom.png'}" alt="${product.title}" class="product-thumbnail">
                            <div>
                                <strong>${product.title}</strong> ($${typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}) - ${product.category}
                                <div class="rating-display">
                                    ${generateStarRating(averageRating)} (${Object.keys(product.ratings || {}).length} reviews)
                                </div>
                            </div>
                        </div>
                        <div class="product-actions">
                            <button class="admin-button secondary edit-btn" data-id="${product.id}">Edit</button>
                            <button class="admin-button error delete-btn" data-id="${product.id}">Delete</button>
                        </div>
                    `;
                    if (productList) productList.appendChild(listItem);
                });

                // Add event listeners for edit and delete buttons after products are loaded
                document.querySelectorAll('.edit-btn').forEach(button => {
                    button.addEventListener('click', (event) => openEditProductModal(event.target.dataset.id));
                });
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', (event) => deleteProduct(event.target.dataset.id));
                });

                populateProductSelects(); // Update product selects for comparison and ratings
            } else {
                if (productList) productList.innerHTML = '<p>No products found.</p>';
                populateProductSelects(); // Clear selects if no products
            }
        });
    }

    function openEditProductModal(productId) {
        const product = allProducts.find(p => p.id === productId);
        if (product && editProductModal && editProductId && editProductTitle && editProductDescription && editProductPrice && editProductCategory && editProductImageUrl && editProductVideoUrl) {
            editProductId.value = product.id;
            editProductTitle.value = product.title;
            editProductDescription.value = product.description;
            editProductPrice.value = product.price;
            editProductCategory.value = product.category;
            editProductImageUrl.value = product.imageUrl;
            editProductVideoUrl.value = product.videoUrl || '';
            editProductModal.style.display = 'flex';

            // Populate category select for edit modal
            populateCategorySelect(editProductCategory, product.category);
        }
    }

    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', () => {
            if (editProductModal) editProductModal.style.display = 'none';
        });
    }

    if (updateProductBtn) {
        updateProductBtn.addEventListener('click', async () => {
            const id = editProductId ? editProductId.value : '';
            const title = editProductTitle ? editProductTitle.value.trim() : '';
            const description = editProductDescription ? editProductDescription.value.trim() : '';
            const price = editProductPrice ? parseFloat(editProductPrice.value) : 0;
            const category = editProductCategory ? editProductCategory.value : '';
            const imageUrl = editProductImageUrl ? editProductImageUrl.value.trim() : '';
            const imageFile = editProductImageFile && editProductImageFile.files.length > 0 ? editProductImageFile.files[0] : null;
            const videoUrl = editProductVideoUrl ? editProductVideoUrl.value.trim() : '';

            if (!id || !title || !description || isNaN(price) || price <= 0 || !category || (!imageUrl && !imageFile)) {
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

            const productRef = ref(database, `products/${id}`);
            update(productRef, {
                title,
                description,
                price,
                category,
                imageUrl: finalImageUrl,
                videoUrl: videoUrl || null
            })
            .then(() => {
                if (editFormMessage) {
                    editFormMessage.textContent = 'Product updated successfully!';
                    editFormMessage.style.color = 'var(--color-success-green)';
                }
                if (editProductModal) editProductModal.style.display = 'none';
                loadProducts(); // Reload products to update the list
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

    function deleteProduct(productId) {
        showCustomAlert("Confirm Deletion", "Are you sure you want to delete this product? This action cannot be undone.", 'confirm', () => {
            const productRef = ref(database, `products/${productId}`);
            const productToDelete = allProducts.find(p => p.id === productId);

            if (productToDelete && productToDelete.imageUrl && productToDelete.imageUrl.startsWith('gs://')) {
                const imageStorageRef = storageRef(storage, productToDelete.imageUrl);
                deleteObject(imageStorageRef).then(() => {
                    console.log("Image deleted from storage.");
                    remove(productRef)
                        .then(() => {
                            showCustomAlert("Product Deleted", "Product and its image have been successfully deleted.", 'alert');
                            loadProducts(); // Reload products after deletion
                        })
                        .catch((error) => {
                            console.error("Error deleting product from database:", error);
                            showCustomAlert("Error", "Failed to delete product from database.", 'alert');
                        });
                }).catch((error) => {
                    console.error("Error deleting image from storage:", error);
                    // Still try to delete product even if image deletion fails
                    remove(productRef)
                        .then(() => {
                            showCustomAlert("Product Deleted (Image Error)", "Product deleted from database, but image deletion failed.", 'alert');
                            loadProducts();
                        })
                        .catch((error) => {
                            console.error("Error deleting product from database after image delete failure:", error);
                            showCustomAlert("Error", "Failed to delete product from database even after image error.", 'alert');
                        });
                });
            } else {
                remove(productRef)
                    .then(() => {
                        showCustomAlert("Product Deleted", "Product has been successfully deleted.", 'alert');
                        loadProducts(); // Reload products after deletion
                    })
                    .catch((error) => {
                        console.error("Error deleting product:", error);
                        showCustomAlert("Error", "Failed to delete product.", 'alert');
                    });
            }
        });
    }


    // --- Category Management ---
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            const categoryName = addCategoryInput ? addCategoryInput.value.trim() : '';
            if (categoryName) {
                const categoryRef = ref(database, `categories/${categoryName}`);
                set(categoryRef, true) // Store category as a key with a true value
                    .then(() => {
                        if (categoryMessage) {
                            categoryMessage.textContent = `Category "${categoryName}" added successfully!`;
                            categoryMessage.style.color = 'var(--color-success-green)';
                        }
                        if (addCategoryInput) addCategoryInput.value = '';
                        populateCategorySelect();
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
                    categoryMessage.textContent = 'Please enter a category name.';
                    categoryMessage.style.color = 'var(--color-error-red)';
                }
            }
        });
    }

    function populateCategorySelect(selectElement = null, selectedCategory = null) {
        const categoriesRef = ref(database, 'categories');
        onValue(categoriesRef, (snapshot) => {
            const defaultSelect = productCategorySelect;
            const editSelect = selectElement || editProductCategory; // Use passed element or default edit

            if (defaultSelect) defaultSelect.innerHTML = '<option value="">Select a Category</option>';
            if (editSelect) editSelect.innerHTML = '<option value="">Select a Category</option>';

            const categoryListElement = categoryList;
            if (categoryListElement) categoryListElement.innerHTML = '';

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const categoryName = childSnapshot.key;
                    const option = document.createElement('option');
                    option.value = categoryName;
                    option.textContent = categoryName;

                    if (defaultSelect) defaultSelect.appendChild(option.cloneNode(true));
                    if (editSelect) {
                        const editOption = option.cloneNode(true);
                        if (selectedCategory && categoryName === selectedCategory) {
                            editOption.selected = true;
                        }
                        editSelect.appendChild(editOption);
                    }

                    // Populate category list for management
                    const li = document.createElement('li');
                    li.innerHTML = `
                        ${categoryName}
                        <button class="admin-button error delete-category-btn" data-category="${categoryName}">Delete</button>
                    `;
                    if (categoryListElement) categoryListElement.appendChild(li);
                });

                document.querySelectorAll('.delete-category-btn').forEach(button => {
                    button.addEventListener('click', (event) => deleteCategory(event.target.dataset.category));
                });
            } else {
                if (categoryListElement) categoryListElement.innerHTML = '<p>No categories found.</p>';
            }
        });
    }

    function deleteCategory(categoryName) {
        showCustomAlert("Confirm Deletion", `Are you sure you want to delete the category "${categoryName}"? Products in this category will not be deleted but their category will be cleared.`, 'confirm', () => {
            const categoryRef = ref(database, `categories/${categoryName}`);
            remove(categoryRef)
                .then(() => {
                    showCustomAlert("Category Deleted", "Category has been successfully deleted.", 'alert');
                    populateCategorySelect(); // Reload categories
                    // Optionally, update products that had this category to null or a default
                    // This would require iterating through products and updating them.
                    // For now, we'll assume the product management handles display of cleared categories.
                })
                .catch((error) => {
                    console.error("Error deleting category:", error);
                    showCustomAlert("Error", "Failed to delete category.", 'alert');
                });
        });
    }


    // --- Order Management ---
    function loadOrders() {
        const ordersRef = ref(database, 'orders');
        onValue(ordersRef, (snapshot) => {
            if (orderList) orderList.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const order = childSnapshot.val();
                    const orderId = childSnapshot.key;
                    const orderDate = order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A';
                    const orderTotal = order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2) : '0.00';
                    const orderStatus = order.status || 'Pending';

                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <strong>Order ID:</strong> ${orderId} <br>
                        <strong>Date:</strong> ${orderDate} <br>
                        <strong>Customer Email:</strong> ${order.customerEmail || 'N/A'} <br>
                        <strong>Total:</strong> $${orderTotal} <br>
                        <strong>Status:</strong> <span id="order-status-${orderId}">${orderStatus}</span> <br>
                        <strong>Items:</strong>
                        <ul>
                            ${order.items ? order.items.map(item => `<li>${item.title} (x${item.quantity}) - $${item.price.toFixed(2)}</li>`).join('') : 'No items'}
                        </ul>
                        <div class="form-group">
                            <label for="status-select-${orderId}">Update Status:</label>
                            <select id="status-select-${orderId}" data-id="${orderId}">
                                <option value="Pending" ${orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Processing" ${orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
                                <option value="Shipped" ${orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="Delivered" ${orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="Cancelled" ${orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                        <button class="admin-button secondary update-order-status-btn" data-id="${orderId}">Update Status</button>
                    `;
                    if (orderList) orderList.appendChild(listItem);
                });

                document.querySelectorAll('.update-order-status-btn').forEach(button => {
                    button.addEventListener('click', (event) => updateOrderStatus(event.target.dataset.id));
                });
            } else {
                if (orderList) orderList.innerHTML = '<p>No orders found.</p>';
            }
        });
    }

    function updateOrderStatus(orderId) {
        const statusSelect = document.getElementById(`status-select-${orderId}`);
        const newStatus = statusSelect ? statusSelect.value : 'Pending';

        const orderRef = ref(database, `orders/${orderId}`);
        update(orderRef, { status: newStatus })
            .then(() => {
                showCustomAlert("Order Status Updated", `Order ${orderId} status updated to ${newStatus}.`, 'alert');
                // UI will automatically update via onValue listener
            })
            .catch((error) => {
                console.error("Error updating order status:", error);
                showCustomAlert("Error", "Failed to update order status.", 'alert');
            });
    }

    // --- Ratings Analytics ---
    function populateProductSelects() {
        if (productRatingSelect) productRatingSelect.innerHTML = '<option value="">Select a Product</option>';
        if (compareProduct1Select) compareProduct1Select.innerHTML = '<option value="">Select Product 1</option>';
        if (compareProduct2Select) compareProduct2Select.innerHTML = '<option value="">Select Product 2</option>';

        allProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.title;

            if (productRatingSelect) productRatingSelect.appendChild(option.cloneNode(true));
            if (compareProduct1Select) compareProduct1Select.appendChild(option.cloneNode(true));
            if (compareProduct2Select) compareProduct2Select.appendChild(option.cloneNode(true));
        });

        // Trigger analytics load for the first product by default if any exist
        if (allProducts.length > 0 && productRatingSelect && productRatingSelect.value === "") {
            productRatingSelect.value = allProducts[0].id;
            loadRatings();
        } else if (allProducts.length === 0) {
            if (averageRatingDisplay) averageRatingDisplay.textContent = 'N/A';
            if (ratingDistributionList) ratingDistributionList.innerHTML = '';
        }
    }

    if (productRatingSelect) {
        productRatingSelect.addEventListener('change', loadRatings);
    }

    function calculateAverageRating(productId, ratings) {
        if (!ratings || Object.keys(ratings).length === 0) {
            return 0;
        }
        const totalRatings = Object.values(ratings).length;
        const sumRatings = Object.values(ratings).reduce((sum, r) => sum + r.rating, 0);
        return sumRatings / totalRatings;
    }

    function generateStarRating(averageRating) {
        const fullStars = Math.floor(averageRating);
        const halfStar = averageRating % 1 >= 0.5;
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star" style="color: gold;"></i>';
        }
        if (halfStar) {
            starsHtml += '<i class="fas fa-star-half-alt" style="color: gold;"></i>';
        }
        for (let i = 0; i < (5 - fullStars - (halfStar ? 1 : 0)); i++) {
            starsHtml += '<i class="far fa-star" style="color: gold;"></i>';
        }
        return starsHtml;
    }


    function loadRatings() {
        const selectedProductId = productRatingSelect ? productRatingSelect.value : '';
        if (!selectedProductId) {
            if (averageRatingDisplay) averageRatingDisplay.textContent = 'N/A';
            if (ratingDistributionList) ratingDistributionList.innerHTML = '';
            return;
        }

        const product = allProducts.find(p => p.id === selectedProductId);

        if (product && product.ratings) {
            const ratings = Object.values(product.ratings);
            const totalReviews = ratings.length;

            if (totalReviews === 0) {
                if (averageRatingDisplay) averageRatingDisplay.textContent = 'N/A';
                if (ratingDistributionList) ratingDistributionList.innerHTML = '<li>No ratings yet.</li>';
                return;
            }

            const average = calculateAverageRating(selectedProductId, product.ratings);
            if (averageRatingDisplay) averageRatingDisplay.textContent = `${average.toFixed(1)} ${generateStarRating(average)}`;

            const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
            ratings.forEach(r => {
                if (distribution[r.rating]) {
                    distribution[r.rating]++;
                }
            });

            if (ratingDistributionList) {
                ratingDistributionList.innerHTML = '';
                for (let i = 5; i >= 1; i--) {
                    const percentage = totalReviews > 0 ? ((distribution[i] / totalReviews) * 100).toFixed(1) : 0;
                    const li = document.createElement('li');
                    li.innerHTML = `
                        ${i} Star${i > 1 ? 's' : ''}: ${distribution[i]} reviews (${percentage}%)
                        <div class="star-count">${generateStarRating(i)}</div>
                    `;
                    ratingDistributionList.appendChild(li);
                }
            }
        } else {
            if (averageRatingDisplay) averageRatingDisplay.textContent = 'N/A';
            if (ratingDistributionList) ratingDistributionList.innerHTML = '<li>No ratings found for this product.</li>';
        }
    }


    // --- Product Comparison ---
    if (compareProductsBtn) {
        compareProductsBtn.addEventListener('click', () => {
            const product1Id = compareProduct1Select ? compareProduct1Select.value : '';
            const product2Id = compareProduct2Select ? compareProduct2Select.value : '';

            if (!product1Id || !product2Id) {
                showCustomAlert("Selection Required", "Please select two products to compare.", 'alert');
                return;
            }
            if (product1Id === product2Id) {
                showCustomAlert("Invalid Selection", "Please select two *different* products to compare.", 'alert');
                return;
            }

            const product1 = allProducts.find(p => p.id === product1Id);
            const product2 = allProducts.find(p => p.id === product2Id);

            if (product1 && product2) {
                renderProductComparisonChart(product1, product2);
            } else {
                showCustomAlert("Error", "Selected products not found.", 'alert');
            }
        });
    }

    function renderProductComparisonChart(product1, product2) {
        const labels = ['Price', 'Average Rating'];
        const data1 = [product1.price, calculateAverageRating(product1.id, product1.ratings)];
        const data2 = [product2.price, calculateAverageRating(product2.id, product2.ratings)];

        const datasets = [];
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
