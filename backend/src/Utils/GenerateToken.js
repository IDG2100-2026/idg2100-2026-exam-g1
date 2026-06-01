import jwt from "jsonwebtoken";
import { TOKEN_EXPIRY } from "../Config/Constants.js";
import crypto from "crypto";

const generateTokens = (userId, role, ip) => {
  const accessToken = jwt.sign(
    { _id: userId, role: role, ip: ip },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: TOKEN_EXPIRY.ACCESS },
  );

  const refreshToken = jwt.sign(
    { _id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: TOKEN_EXPIRY.REFRESH },
  );

  return { accessToken, refreshToken };
};

export const generateVerificationCode = () => {
  return crypto.randomInt(1000, 9999).toString();
};

export default generateTokens;
