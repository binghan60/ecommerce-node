import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { isAdmin, isAuth } from "../utils.js";

const upload = multer();

const uploadRouter = express.Router();

uploadRouter.post(
  "/",
  isAuth,
  isAdmin,
  upload.single("file"), //上傳單檔 Formdata裡的file
  async (req, res) => {
    cloudinary.config({
      //連線cloudinary
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);//傳進來檔案的buffer轉成ReadableStream 複製到stream
      });
    };
    const result = await streamUpload(req);
    res.send(result);//上傳圖片詳細資料 網址在secure_url
  }
);

export default uploadRouter;
