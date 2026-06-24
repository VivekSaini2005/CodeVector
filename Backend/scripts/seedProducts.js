require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Product = require("../models/Product");
const connectDB = require("../config/db");

const TOTAL_PRODUCTS = 200000;
const BATCH_SIZE = 10000;

const categories = ["Electronics","Books","Sports","Clothing","Home"];

async function seedProducts() {
    try {
        await connectDB();

        console.log("Deleting old products...");
        await Product.deleteMany({});

        console.log("Generating products...");

        for (let start = 1; start <= TOTAL_PRODUCTS; start += BATCH_SIZE) {
          const products = [];

          for (let i = start;i < start + BATCH_SIZE && i <= TOTAL_PRODUCTS;i++) {
            products.push({
              name: `Product ${i}`,
              category:categories[Math.floor(Math.random() * categories.length)],
              price: Math.floor(Math.random() * 1000) + 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          await Product.insertMany(products);

          console.log(`Inserted ${Math.min(start + BATCH_SIZE - 1,TOTAL_PRODUCTS)} products`);
        }

        console.log("✅ 200,000 products inserted successfully");

        await mongoose.connection.close();
        process.exit(0);


    } 
    
    catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

seedProducts();
