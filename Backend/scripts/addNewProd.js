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

        console.log("Generating products...");

        let i = 200000;
        while(i<200005) {
            i++;
            const product = new Product({
                name: `Product ${i}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                price: Math.floor(Math.random() * 1000) + 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await product.save();
        }

        console.log("5 products inserted successfully");

        await mongoose.connection.close();
        process.exit(0);


    } 
    
    catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

seedProducts();
