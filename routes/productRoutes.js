// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
// Import the controller functions
const productController = require('../controllers/productController');

// Notice we just use '/' here, because we will mount this router on '/products' later
router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;