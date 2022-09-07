import express from "express";
import Product from "../models/productModel.js";

const productRouter = express.Router();

productRouter.get("/", async (req, res) => {
  const products = await Product.find();
  res.send(products);
});

//從列表進入指定slug的產品頁
productRouter.get("/slug/:slug", async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (product) {
    res.send(product);
  } else {
    res.send({ message: "找不到該產品" });
  }
});
//加對應ID的產品進購物車
productRouter.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  //x.id是字串只能兩個==
  if (product) {
    res.send(product);
  } else {
    res.send({ message: "找不到該產品" });
  }
});

export default productRouter;
