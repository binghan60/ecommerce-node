import express from "express";
import data from "../data.js"
import Product from "../models/productModel.js";


const seedRouter = express.Router();

seedRouter.get("/", async (req, res) => {
  //先初始化Product
  await Product.remove({});
  // 把data塞進Product
  const createdProducts = await Product.insertMany(data.products);
  res.send({ createdProducts });
});

export default seedRouter;
