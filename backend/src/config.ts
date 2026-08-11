import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  clientUrls: string[];
}

function parseClientUrls(value: string | undefined): string[] {
  return (value ?? "http://localhost:5173")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "insecure-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientUrls: parseClientUrls(process.env.CLIENT_URL),
};

export const isProduction = config.nodeEnv === "production";