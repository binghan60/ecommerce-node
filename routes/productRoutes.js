import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import { isAdmin, isAuth } from "../utils.js";

const productRouter = express.Router();

productRouter.get("/", async (req, res) => {
  const products = await Product.find();
  res.send(products);
});
productRouter.post(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Product({
      name: "smaple name " + Date.now(),
      slug: "sample-name-" + Date.now(),
      image: "product1.jpg",
      price: 0,
      category: "sample category",
      brand: "sample brand",
      countInStock: 0,
      rating: 0,
      numReviews: 0,
      description: "sample description",
    });
    const product = await newProduct.save();
    res.send({ message: "Producr Created", product });
  })
);

productRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id; //網址的:id
    const product = await Product.findById(productId);
    if (product) {
      //找到該商品  傳進來的值等於商品的值 再save保存
      product.name = req.body.name;
      product.slug = req.body.slug;
      product.price = req.body.price;
      product.image = req.body.image;
      product.category = req.body.category;
      product.brand = req.body.brand;
      product.countInStock = req.body.countInStock;
      product.description = req.body.description;
      await product.save();
      res.send({ message: "修改成功" });
    } else {
      res.send({ message: "找不到該商品" });
    }
  })
);
productRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    //req.params  {id : 6329f118e5c83738ef36b984}
    if (product) {
      const deleteProduct = await product.remove();
      res.send({ message: "刪除成功" });
    } else {
      res.status(404).send({ message: "找不到商品" });
    }
  })
);

const PAGE_SIZE = 6;
const ADMINPAGE_SIZE = 15;
productRouter.get(
  "/admin",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || ADMINPAGE_SIZE;
    const products = await Product.find()
      .skip(pageSize * (page - 1)) ////如果目前第3頁 跳過6*(3-1)=12  從第13筆開始顯示6筆
      .limit(pageSize);
    const countProducts = await Product.countDocuments();
    res.send({
      products,
      countProducts, //商品數量
      page, //現在第幾頁
      pages: Math.ceil(countProducts / pageSize), //總共有幾頁
    });
  })
);

productRouter.get(
  "/search",
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || "";
    const price = query.price || "";
    const rating = query.rating || "";
    const order = query.order || "";
    //搜尋欄位的值
    const searchQuery = query.query || "";

    //有篩選條件且非all
    const queryFilter =
      searchQuery && searchQuery !== "all"
        ? {
            //regex  option"i" 搜尋不區分大小寫
            name: {
              $regex: searchQuery,
              $options: "i",
            },
          }
        : {};
    const categoryFilter = category && category !== "all" ? { category } : {};
    const ratingFilter =
      rating && rating !== "all"
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};
    const priceFilter =
      price && price !== "all"
        ? {
            // 1-50 用減號做分隔
            //greater than or equal 大於等於
            //less than or equal    小於等於
            price: {
              $gte: Number(price.split("-")[0]),
              $lte: Number(price.split("-")[1]),
            },
          }
        : {};
    const sortOrder =
      //1是升冪 -1是降冪
      order === "featured"
        ? { featured: -1 }
        : order === "lowest"
        ? { price: 1 }
        : order === "highest"
        ? { price: -1 }
        : order === "toprated"
        ? { rating: -1 }
        : order === "newest"
        ? { createdAt: -1 }
        : { _id: -1 };

    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1)) //如果目前第3頁 跳過6*(3-1)=12  從第13筆開始顯示
      .limit(pageSize);

    const countProducts = await Product.countDocuments({
      //取得篩選條件下的筆數 做頁碼
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  "/brands",
  expressAsyncHandler(async (req, res) => {
    const brands = await Product.find().distinct("brand");
    res.send(brands);
  })
);
productRouter.get(
  "/categories",
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct("category");
    res.send(categories);
  })
);

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
