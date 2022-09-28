import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  //回傳用.env裡的SECRET加密的token
  return jwt.sign( //sign產生一組JWT
    {
      //取user中資料存放在token
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    //用env裡的SECRET加密
    process.env.JWT_SECRET,
    {
      //效期30天
      expiresIn: "30d",
    }
  );
};

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7, authorization.length); //抓取token部分  Bearer XXXXXX
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {//透過SECRET驗證token
      if (err) {
        res.status(401).send({ message: "金鑰無效" });
      } else {
        //decode是解密過後的資料 賦值至req.user
        //_id: '6318cfaa059e2c7c8fb7a360',
        // name: '秉翰',
        // email: 'admin@example.com',
        // isAdmin: true,
        // iat: 1662667148,
        // exp: 1665259148
        req.user = decode;
        next();
      }
    });
  } else {
    res.status(401).send({ message: "沒有金鑰" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    //是用戶同時是管理者才繼續
    next();
  } else {
    res.status(401).send({message: "該帳號不是管理者"})
  }
};
