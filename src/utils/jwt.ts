import jwt, { SignOptions } from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const ALGORITHM = "HS512";

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRE || "24h") as SignOptions["expiresIn"];

  return jwt.sign(payload, secret, { expiresIn, algorithm: ALGORITHM });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET!;
  const expiresIn = (process.env.JWT_REFRESH_EXPIRE || "7d") as SignOptions["expiresIn"];

  return jwt.sign(payload, secret, { expiresIn, algorithm: ALGORITHM });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET!;

  try {
    return jwt.verify(token, secret, { algorithms: [ALGORITHM] }) as TokenPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET!;

  try {
    return jwt.verify(token, secret, { algorithms: [ALGORITHM] }) as TokenPayload;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateResetToken = (): string => {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(
    { random: Math.random() },
    secret,
    { expiresIn: "1h", algorithm: ALGORITHM }
  );
};
