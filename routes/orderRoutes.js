import express from "express";
import expressAsyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import { isAuth, isAdmin } from "../utils.js";

const orderRouter = express.Router();

orderRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find().populate("user", "name"); //orderModel裡的user ref 關連到user的name 第二參數沒寫會整個user全部資訊都關聯
    res.send(orders);
  })
);

orderRouter.post(
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

orderRouter.get(
  "/summary",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: null, //表示全部訂單
          numOrders: { $sum: 1 }, //訂單筆數
          totalSales: { $sum: "$totalPrice" }, //totalPrice加總
        },
      },
    ]);
    const users = await User.aggregate([
      {
        $group: {
          _id: null, //表示全部
          numUsers: { $sum: 1 }, //用戶筆數
        },
      },
    ]);
    const dailyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, //以建立日期為條件一組
          orders: { $sum: 1 }, //一天的訂單數
          sales: { $sum: "$totalPrice" }, //一天的金額
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const productCategories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);
    res.send({ orders, users, dailyOrders, productCategories });
  })
);

orderRouter.get(
  "/mine",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    //req.user._id isAuth解出來的用戶資料
    const orders = await Order.find({ user: req.user._id });
    res.send(orders);
  })
);

orderRouter.get(
  "/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    //mongoose 的 findById
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: "找不到該訂單" });
    }
  })
);

orderRouter.put(
  "/:id/deliver",
  isAuth,
  expressAsyncHandler(async (req, res) => {

    const order = await Order.findById(req.params.id);
    console.log(order)
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

//更新付款狀態
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

export default orderRouter;
