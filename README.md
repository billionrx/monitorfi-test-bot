# Raydium Swap Parser Bot

A simple Telegram bot to parse Raydium swap transactions and get Solana wallet balances.

## Features

- **Parse Swap Transaction**: Provide a transaction signature to parse Raydium swap details.
- **Get Wallet Balance**: Enter a Solana wallet address to retrieve its balance.

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/billionrx/monitorfi-test-bot.git
   cd monitorfi-test-bot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure the bot**

   Create a `.env` file in the root directory with the following content:

   ```env
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   RPC_ENDPOINT=https://api.mainnet-beta.solana.com
   EXCHANGE_RATE_API_URL=https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd
   ```

   - Replace `your-telegram-bot-token` with your actual Telegram bot token.
   - Ensure that the `RPC_ENDPOINT` and `EXCHANGE_RATE_API_URL` are set correctly.


## Usage

Start the bot:

```bash
npm run dev
```

Interact with the bot on Telegram:

- Send `/start` to begin.
- Choose an option from the menu:
  - **Parse Swap Tx**: Enter a transaction signature.
  - **Get Wallet Balance**: Enter a wallet address.

## License

MIT License
