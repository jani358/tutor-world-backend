import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || "your-secret-key";
  const expiresIn = process.env.JWT_EXPIRE || "24h";

  return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
  const expiresIn = process.env.JWT_REFRESH_EXPIRE || "7d";

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET || "your-secret-key";

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateResetToken = (): string => {
  return jwt.sign(
    { random: Math.random() },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "1h" }
  );
};
