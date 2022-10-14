import express from "express";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import { generateToken, isAdmin, isAuth } from "../utils.js";

const userRouter = express.Router();

userRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find(); //列出所有用戶 Adminuser列表用
    res.send(users);
  })
);

userRouter.get(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id); //用網址的ID去資料庫找該用戶  管理者顯示用戶資料用
    if (user) {
      res.send(user); //如果有就回傳
    } else {
      res.status(404).send({ message: "找不到用戶" });
    }
  })
);
//會員登入
userRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }); //用email去User裡找該筆帳號資料
    if (user) {
      //比對 傳進來的密碼 跟 資料庫密碼是否相同
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          //通過驗證回傳帳號資料和產出token  經過isAuth會用到
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          token: generateToken(user),
        });
      }
    }
    res.status(401).send({ message: "帳號或密碼錯誤" });
  })
);
//會員註冊
userRouter.post(
  "/signup",
  expressAsyncHandler(async (req, res) => {
    const newUser = new User({
      //以req.body的資料new一個User
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password),
    });
    const user = await newUser.save(); //保存至資料庫
    res.send({
      //通過驗證回傳帳號資料和token
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
  })
);
//修改資料
userRouter.put(
  //put取代
  "/profile",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    //req.body
    // { name: '牛奶', email: 'admin@example.com', password: '123456' }
    const user = await User.findById(req.user._id); //依靠isAuth解析會員id
    if (user) {
      user.name = req.body.name || user.name; //如果有修改以修改為主 否則維持原狀
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 8);
      }
      const updatedUser = await user.save();
      //回傳 更改過的資料以及新的token
      res.send({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser),
      });
    } else {
      res.status(404).send({ message: "找不到該用戶" });
    }
  })
);

userRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    //用網址的ID去資料庫找該用戶 管理者修改用戶資料用
    if (req.user._id === user._id.toString()) {
      // id本來是object // 如果是修改管理者本人
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isAdmin = req.body.isAdmin;
      const updatedUser = await user.save();
      res.send({
        message: "修改成功",
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          token: generateToken(updatedUser), //重發新的token
        },
      });
      return;
    }
    if (user) {
      //如果是其他用戶 直接做修改
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isAdmin = req.body.isAdmin;
      const updatedUser = await user.save();
      res.send({ message: "修改成功", user: updatedUser });
    } else {
      res.status(404).send({ message: "找不到用戶" });
    }
  })
);
//刪除用戶
userRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user.isAdmin) {
      res.status(404).send({ message: "管理者帳號不可刪除" });
      return;
    }
    if (user) {
      await user.remove();
      res.send({ message: "刪除成功" });
    } else {
      res.status(404).send({ message: "找不到用戶" });
    }
  })
);
export default userRouter;
