import jwt from "jsonwebtoken";
import { TOKEN_EXPIRY } from "../Config/Constants.js";
import crypto from "crypto";

//--------------JWT TOKENS--------------
const generateTokens = (userId, role, ip) => {
  //Access token
  const accessToken = jwt.sign(
    { _id: userId, role: role, ip: ip },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: TOKEN_EXPIRY.ACCESS },
  );

  //Refresh token
  const refreshToken = jwt.sign(
    { _id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: TOKEN_EXPIRY.REFRESH },
  );

  return { accessToken, refreshToken };
};

//--------------EMAIL TOKEN--------------
export const generateVerificationCode = () => {
  return crypto.randomInt(1000, 9999).toString();
};

export default generateTokens;
