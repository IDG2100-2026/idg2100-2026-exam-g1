import multer from "multer";
import path from "path";
import AppError from "../Utils/AppError.js";

//Allowed file types
const imageTypes = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (imageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only images are allowed (jpg, png, webp)", 400), false);
  }
};

//Profile picture storage
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profiles/");
  },
  //unique name
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

//Trophy image storage
const trophyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/trophies/");
  },
  //Unique name
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const uploadProfile = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, //max 5 mb
});

export const uploadTrophy = multer({
  storage: trophyStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, //max 5 mb
});
