import jwt from "jsonwebtoken";
export const generateToken = (user) => {
  //回傳用.env裡的SECRET加密的token 效期30天
  return jwt.sign(
    {
      //整個user傳進來只用以下資訊
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};
