import express from "express";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import { generateToken } from "../utils.js";

const userRouter = express.Router();

userRouter.post(
  "/singin",
  expressAsyncHandler(async (req, res) => {
    //從User找尋該筆email的帳號資料
    const user = await User.findOne({ email: req.body.email });
    //假如有該用戶
    if (user) {
      //解析加密過後的密碼是否一樣
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          //通過驗證回傳帳號資料和token
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

export default userRouter;
