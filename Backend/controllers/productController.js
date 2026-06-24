// const Product = require('../models/Product');

// const ALLOWED_CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Sports', 'Home'];

// // GET /products — always returns the top 20 newest products (by updatedAt)
// const getProducts = async (req, res) => {
//   try {

//     const { category } = req.query;

//     // Validate category if provided
//     if (category && !ALLOWED_CATEGORIES.includes(category)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid category. Allowed values: ${ALLOWED_CATEGORIES.join(', ')}`,
//       });
//     }

//     // Build filter
//     const filter = {};
//     if (category) {
//       filter.category = category;
//     }

//     // Fetch top 20 products sorted by most recently updated
//     const products = await Product
//       .find(filter)
//       .sort({ updatedAt: -1, _id: -1 })
//       .limit(20)
//       .lean();

//     res.status(200).json({
//       success: true,
//       count: products.length,
//       products,
//     });

//   } catch (error) {
//     console.error('getProducts error:', error);
//     res.status(500).json({ success: false, message: 'Internal server error.' });
//   }
// };

// module.exports = { getProducts };


const Product = require("../models/Product");

const ALLOWED_CATEGORIES = ["Electronics","Clothing","Books","Sports","Home"];

const PAGE_SIZE = 20;

const getProducts = async (req, res) => {
    try {
        const { category, cursor, snapshotTime,limit } = req.query;

        
        if (category && !ALLOWED_CATEGORIES.includes(category)) {
          return res.status(400).json({
            success: false,
            message: "Invalid category",
          });
        }

        // First request creates snapshot time
        const snapshot = snapshotTime || new Date().toISOString();

        const filter = {
          updatedAt: {
            $lte: new Date(snapshot),
          },
        };

        if (category) {
          filter.category = category;
        }

        // Cursor pagination
        if (cursor) {
          const cursorData = JSON.parse(
            Buffer.from(cursor, "base64").toString()
          );

          filter.$or = [
            {
              updatedAt: {
                $lt: new Date(cursorData.updatedAt),
              },
            },
            {
              updatedAt: new Date(cursorData.updatedAt),
              _id: {
                $lt: cursorData._id,
              },
            },
          ];
        }

        let fetchLimit = limit > 0 && limit <= 100 ? limit : PAGE_SIZE;

        const products = await Product.find(filter).sort({updatedAt: -1,_id: -1,}).limit(fetchLimit).lean();

        let nextCursor = null;

        if (products.length > 0) {
          const lastProduct = products[products.length - 1];

          nextCursor = Buffer.from(
            JSON.stringify({
              updatedAt: lastProduct.updatedAt,
              _id: lastProduct._id,
            })
          ).toString("base64");
        }

        res.status(200).json({
          success: true,
          products,
          nextCursor,
          snapshotTime: snapshot,
        });
    } 

    catch (error) {
        console.error(error);   
        res.status(500).json({
          success: false,
          message: "Server Error",
        });
    }
};

module.exports = { getProducts };
