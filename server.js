import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import data from "./data.js";
import cors from "cors";
import seedRouter from "./routes/seedRoutes.js";
import productRouter from "./routes/productRoutes.js";
import userRouter from "./routes/userRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";

//讀取連線設定檔
dotenv.config();

mongoose//連線至資料庫
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("資料庫連線成功");
  })
  .catch(() => {
    console.log("資料庫連線失敗");
  });

const app = express();
// Top-level middlewares
const corsOptions = {
  // CORS全部允許
  credentials: true,
  origin: (origin, cb) => {
    cb(null, true);
  },
};
app.use(cors(corsOptions));
//req.body預設是undefined(拆解成封包再組裝回原本)
//必須透過解析req.body裡的urlencoded及json
//post 跟 put 有傳資料近來才需要
// 將傳入的request識別為string或array
app.use(express.urlencoded({ extended: false }));
// 將傳入的 Request Object 識別為JSON Object
app.use(express.json());

app.use("/api/keys/paypal", (req, res) => {//前端來拿PAYAPL CLIENT ID
  res.send(process.env.PAYPAL_CLIENT_ID || "sb");
});
//設定Router
app.use("/api/seed", seedRouter);//data匯入資料
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/upload", uploadRouter);

//expressAsyncHandler有錯誤 會將客製化錯誤訊息設定至這裡
app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`server start at http://localhost:${port}`);
});

// GET: 請求資源
// POST: 新增資源
// PUT: 取代資源
// PATCH: 更新資源
// DELETE: 刪除資源