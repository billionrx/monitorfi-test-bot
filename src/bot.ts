import { Bot, Context, InlineKeyboard, session } from 'grammy';
import { TELEGRAM_BOT_TOKEN } from './config.js';
import { parseRaydiumSwapTransaction } from './services/swapService.js';
import { getWalletBalance } from './services/balanceService.js';

interface SessionData {
    awaitingInput?: 'parse_swap' | 'get_balance';
}

type MyContext = Context & { session: SessionData };

const bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN!);

bot.use(session({ initial: () => ({}) }));

async function sendMainMenu(ctx: MyContext, message?: string) {
    const keyboard = new InlineKeyboard()
        .text('Parse Swap Tx', 'parse_swap')
        .text('Get Wallet Balance', 'get_balance');

    if (message) {
        await ctx.reply(message, {
            reply_markup: keyboard,
        });
    } else {
        await ctx.reply("Welcome back! What would you like to do next?", {
            reply_markup: keyboard,
        });
    }
}

bot.command('start', async (ctx) => {
    await sendMainMenu(ctx, "Welcome! What do you want to do?");
});

bot.callbackQuery('parse_swap', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Sure! Please enter the transaction signature:");
    ctx.session.awaitingInput = 'parse_swap';
});

bot.callbackQuery('get_balance', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("No problem! Please enter your wallet address:");
    ctx.session.awaitingInput = 'get_balance';
});

bot.on('message:text', async (ctx) => {
    if (ctx.session.awaitingInput === 'parse_swap') {
        const signature = ctx.message.text.trim();
        await ctx.reply("Processing your transaction signature...");
        try {
            const swap = await parseRaydiumSwapTransaction(signature);
            if (swap) {
                await ctx.reply(`✅ **Parsed Swap Transaction Details:**\n\`\`\`json\n${JSON.stringify(swap, null, 2)}\n\`\`\``, {
                    parse_mode: 'MarkdownV2',
                });
            } else {
                await ctx.reply("❌ Couldn't parse the transaction as a Raydium swap. Please make sure the signature is correct.");
            }
        } catch (error) {
            if (error instanceof Error) {
                await ctx.reply(`❌ Error parsing transaction: ${error.message}`);
            } else {
                await ctx.reply("❌ An unknown error occurred while parsing the transaction.");
            }
        }
        ctx.session.awaitingInput = undefined;
        await sendMainMenu(ctx);
    } else if (ctx.session.awaitingInput === 'get_balance') {
        const address = ctx.message.text.trim();
        await ctx.reply("Fetching your wallet balance...");
        try {
            const balance = await getWalletBalance(address);
            await ctx.reply(`✅ **Wallet Balance:**\n${balance}`);
        } catch (error) {
            if (error instanceof Error) {
                await ctx.reply(`❌ Error fetching wallet balance: ${error.message}`);
            } else {
                await ctx.reply("❌ An unknown error occurred while fetching the wallet balance.");
            }
        }
        ctx.session.awaitingInput = undefined;
        await sendMainMenu(ctx);
    } else {
        await ctx.reply("ℹ️ Please select an option from the menu using /start or the buttons below.");
        await sendMainMenu(ctx);
    }
});

bot.catch((error) => {
    console.error('Bot encountered an error:', error);
});

bot.start();

export { bot };
