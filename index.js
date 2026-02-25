const mongoose = require('mongoose');
const express = require('express');
const helmet = require('helmet'); // New security import
const cors = require('cors');     // FIX: You forgot to require cors
require('dotenv').config();

const app = express();

// Security and Middleware 
app.use(helmet());           // Protects against common web vulnerabilities
app.use(cors());             // Allows your mobile app to talk to this server [cite: 243]
app.use(express.json({ limit: '10mb' }));      // Standard for receiving JSON data, increased limit for base64 images

// Environment Variables
const MONGO_URI = process.env.MONGO_URI; 
const PORT = process.env.PORT || 3000;

// Mongoose Schema and Model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  description: { type: String },
  image: { type: String } // Store Base64 string here
});

const Product = mongoose.model('Product', productSchema);


// Routes
app.get('/api/status', (req, res) => {
  res.json({ 
    status: "Online",
    message: "AWS Backend is reachable!",
    owner: "Fergus Downey", // Change this to your name!!!
    timestamp: new Date()
  });
});


// CREATE a new product
app.post('/products', async (req, res) => {
  try {
    const { name, price, description, image } = req.body; // include image from client
    const newProduct = await Product.create({ name, price, description, image });
    
    //const newProduct = new Product({ name, price, description });
    //await newProduct.save();

    res.status(201).json({
      message: "Product added successfully!", // Requirement satisfied
      product: newProduct
    });
  } catch (err) {
    res.status(500).json({ message: "Error adding product", error: err.message });
  }
});

// READ all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

// UPDATE a product by ID
app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated', product: updatedProduct });
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

// DELETE a product by ID
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted', product: deleted });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Successfully connected to MongoDB");

    // Seed initial products if none exist
    const seedProducts = [
      { name: 'tshirt', price: 20, description: 'Large green tshirt', image: 'base64string...' }
    ];

    try {
      const count = await Product.countDocuments();
      if (count === 0) {
        await Product.insertMany(seedProducts);
        console.log('🟢 Seeded initial products');
      }
    } catch (seedErr) {
      console.error('Seed error:', seedErr.message);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); // Stop the server if the password is wrong
  });