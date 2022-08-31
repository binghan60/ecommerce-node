import express from "express";
import data from "./data.js";
import cors from "cors";

const app = express();

// Top-level middlewares
const corsOptions = {
  // 全部允許
  credentials: true,
  origin: (origin, cb) => {
    cb(null, true);
  },
};
app.use(cors(corsOptions));

app.get("/api/products", (req, res) => {
  res.send(data.products);
});
app.get("/api/products/slug/:slug", (req, res) => {
  const product = data.products.find((x) => x.slug === req.params.slug);
  if (product) {
    res.send(product);
  } else {
    res.send({message:'找不到該產品'})
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`server start at http://localhost:${port}`);
});
