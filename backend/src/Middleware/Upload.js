import multer from "multer";
import path from "path";
import AppError from "../Utils/AppError.js";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (imageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only images are allowed (jpg, png, webp)", 400), false);
  }
};

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profiles/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const trophyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/trophies/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const uploadProfile = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadTrophy = multer({
  storage: trophyStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
