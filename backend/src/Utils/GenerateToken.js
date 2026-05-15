import jwt from "jsonwebtoken";
import { TOKEN_EXPIRY } from "../Config/Constants.js";

const generateTokens = (userId, role) => {
  //Access token
  const accessToken = jwt.sign(
    { _id: userId, role: role },
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

export default generateTokens;
