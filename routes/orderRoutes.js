import express from "express";
import expressAsyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import { isAuth, isAdmin } from "../utils.js";

const orderRouter = express.Router();

//管理後臺取得所有人的訂單
orderRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find().populate("user", "name").sort({
      //"name email"可放入不只一個參數
      //order裡本來只有userId
      createdAt: -1,
    }); //orderModel裡的user ref 關連到user的name 掛在user裡 第二參數(name)沒寫會整個user全部資訊都關聯
    res.send(orders);
  })
);

orderRouter.post(
  //結帳
  "/",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const newOrder = new Order({
      //購物車商品product欄是orderItems的ID
      orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      itemsPrice: req.body.itemsPrice,
      shippingPrice: req.body.shippingPrice,
      totalPrice: req.body.totalPrice,
      //通過isAuth後解密出帳號資料包括_id
      user: req.user._id,
    });
    const order = await newOrder.save();
    res.status(201).send({ message: "成功建立新訂單", order });
  })
);
//管理面板dashboard
orderRouter.get(
  "/summary",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.aggregate([
      {
        $group: {
          _id: null, //表示全部
          numUsers: { $sum: 1 }, //用戶筆數*1
        },
      },
    ]);
    const orders = await Order.aggregate([
      {
        $group: {
          _id: null, //表示全部訂單為一組
          numOrders: { $sum: 1 }, //Order裡的筆數*1
          totalSales: { $sum: "$totalPrice" }, //Order裡的訂單totalPrice加總
        },
      },
    ]);
    const dailyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, //以建立日期為條件一組  //format沒有也OK
          orders: { $sum: 1 }, //一天的訂單數*1
          sales: { $sum: "$totalPrice" }, //一天的金額
        },
      },
      { $sort: { _id: 1 } }, //ID升冪排序
    ]);
    const productCategories = await Product.aggregate([
      //Porduct的商品種類
      {
        $group: {
          _id: "$category", //以種類分組
          count: { $sum: 1 }, //筆數*1
        },
      },
    ]);
    res.send({ orders, users, dailyOrders, productCategories });
  })
);

orderRouter.get(
  //個人訂單查詢
  "/mine",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    //req.user._id isAuth解出來的用戶資料
    const orders = await Order.find({ user: req.user._id }).sort({
      //isAuth解析出來的用戶ID 為條件 去Order裡找
      createdAt: -1, //訂單時間降冪排序
    });
    res.send(orders);
  })
);

orderRouter.get(
  //訂單詳細頁 用網址訂單ID去資料庫找
  "/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: "找不到該訂單" });
    }
  })
);

orderRouter.put(
  //put取代 模擬送達 付過款 或 管理者 可以操作
  "/:id/deliver",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      await order.save();
      res.send({ message: "配送成功" });
    } else {
      res.status(404).send({ message: "找不到訂單" });
    }
  })
);

//更新付款狀態  paypalButton
//用params ID去抓訂單 並修改其中幾項
orderRouter.put(
  "/:id/pay",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };
      const updatedOrder = await order.save();
      res.send({ message: "訂單已付款", order: updatedOrder });
    } else {
      res.status(404).send({ message: "找不到該訂單" });
    }
  })
);

orderRouter.delete(
  //刪除訂單
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.remove();
      res.send({ message: "刪除成功" });
    } else {
      res.status(404).send({ message: "找不到訂單" });
    }
  })
);

export default orderRouter;
