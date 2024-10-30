import dotenv from 'dotenv';

dotenv.config();

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN as string;
export const RPC_ENDPOINT = process.env.RPC_ENDPOINT as string;
export const EXCHANGE_RATE_API_URL = process.env.EXCHANGE_RATE_API_URL as string;

if (!TELEGRAM_BOT_TOKEN || !RPC_ENDPOINT || !EXCHANGE_RATE_API_URL) {
    throw new Error("Missing environment variables in .env file");
}
