# Raydium Swap Parser Bot

A simple Telegram bot to parse Raydium swap transactions and get Solana wallet balances.

## Features

- **Parse Swap Transaction**: Provide a transaction signature to parse Raydium swap details.
- **Get Wallet Balance**: Enter a Solana wallet address to retrieve its balance.

## Installation

1. **Clone the repository**

   \`\`\`bash
   git clone https://github.com/yourusername/raydium-swap-parser-bot.git
   cd raydium-swap-parser-bot
   \`\`\`

2. **Install dependencies**

   \`\`\`bash
   npm install
   \`\`\`

3. **Configure the bot**

   Create a \`config.ts\` file in the \`src\` directory:

   \`\`\`typescript
   // src/config.ts
   export const TELEGRAM_BOT_TOKEN = 'your-telegram-bot-token';
   export const RPC_ENDPOINT = 'your-solana-rpc-endpoint';
   \`\`\`

4. **Build the project**

   \`\`\`bash
   npm run build
   \`\`\`

## Usage

Start the bot:

\`\`\`bash
npm start
\`\`\`

Interact with the bot on Telegram:

- Send \`/start\` to begin.
- Choose an option from the menu:
  - **Parse Swap Tx**: Enter a transaction signature.
  - **Get Wallet Balance**: Enter a wallet address.

## License

MIT License