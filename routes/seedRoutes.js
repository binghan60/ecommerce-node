import express from "express";
import data from "../data.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

const seedRouter = express.Router();
//拜訪http://localhost:5000/api/seed手動匯入資料
seedRouter.get("/", async (req, res) => {
  //先清空Product
  await Product.deleteMany({});
  // 從data把資料寫入mongodb
  const createdProducts = await Product.insertMany(data.products);
  await User.deleteMany({});
  const createdUsers = await User.insertMany(data.users);
  res.send({ createdProducts, createdUsers });
});

export default seedRouter;
