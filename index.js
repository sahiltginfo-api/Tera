import express from 'express';
import { Telegraf, Markup } from 'telegraf';

const PORT = process.env.PORT || 8080;
const app = express();

// ✅ Webhook ke liye body parser chahiye
app.use(express.json());

// ✅ Root route
app.get('/', (req, res) => {
    res.send('🤖 Bot is running on Vercel!');
});

// ✅ Telegram webhook endpoint
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body);
    res.send('OK');
});

// ✅ Bot Token
const BOT_TOKEN = '7751886103:AAFDtG8oyzsc1jhwXsFKVKT2-KJe3FLPTEI';
const bot = new Telegraf(BOT_TOKEN);

// ❌ POLLING MODE HATANA HAI - ye mat use karna
// bot.launch() nahi chalega Vercel pe

// ✅ TeraBox URL Validation  
const teraboxUrlRegex = /^https:\/\/(terabox\.com|1024terabox\.com|teraboxapp\.com|teraboxlink\.com|terasharelink\.com|terafileshare\.com)\/s\/[A-Za-z0-9-_]+$/;

const CHANNEL_ID = "-1002661857120";

// ✅ /start Command  
bot.start((ctx) => {
    const welcomeMessage = '👋 Welcome! Send a TeraBox link to download.';
    const imageUrl = 'https://graph.org/file/4e8a1172e8ba4b7a0bdfa.jpg';

    ctx.replyWithPhoto(
        { url: imageUrl },
        {
            caption: welcomeMessage,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url('📌 US ❖ 𝐖𝐃 𝐙𝐎𝐍𝐄 ❖', 'https://t.me/offx_sahil')]
            ])
        }
    );
});

// ✅ Message Handler (tera wahi code)
bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;

    if (!teraboxUrlRegex.test(messageText)) {
        return ctx.reply('❌ Invalid TeraBox link!');
    }

    await ctx.reply('🔄 Processing your link...');

    try {
        const apiUrl = `https://wdzone-terabox-api.vercel.app/api?url=${encodeURIComponent(messageText)}`;
        const apiResponse = await fetch(apiUrl);
        const apiData = await apiResponse.json();

        if (!apiResponse.ok || !apiData["📜 Extracted Info"]?.length) {
            return ctx.reply('⚠️ Download link not found.');
        }

        const fileInfo = apiData["📜 Extracted Info"][0];
        const downloadLink = fileInfo["🔽 Direct Download Link"];
        const filename = fileInfo["📂 Title"] || `video_${Date.now()}.mp4`;

        let fileSize = "Unknown Size";
        let estimatedTime = "N/A";
        if (fileInfo["📏 Size"]) {
            fileSize = fileInfo["📏 Size"];
            estimatedTime = calculateDownloadTime(fileSize);
        }

        const imageUrl = 'https://graph.org/file/120e174a9161afae40914.jpg';
        const caption = `🎬 **File Processing Done!**\n✅ **Download Link Found:**\n📁 **File:** ${filename}\n⚖ **Size:** ${fileSize}\n⏳ **Estimated Time:** ${estimatedTime}`;

        await ctx.replyWithPhoto(imageUrl, {
            caption: caption,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url(`⬇️ 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 (${fileSize})`, downloadLink)]
            ])
        });

        await bot.telegram.sendMessage(CHANNEL_ID, `📥 **New Download Request**\n\n📁 **File:** ${filename}\n⚖ **Size:** ${fileSize}\n⏳ **Estimated Time:** ${estimatedTime}\n🔗 **Download Link:** [Click Here](${downloadLink})`, {
            parse_mode: "Markdown",
            disable_web_page_preview: true
        });

    } catch (error) {
        console.error('API Error:', error);
        ctx.reply('❌ An error occurred while processing your request.');
    }
});

function calculateDownloadTime(sizeStr) {
    const speedMbps = 10;
    const sizeUnits = { "B": 1, "KB": 1024, "MB": 1024 ** 2, "GB": 1024 ** 3 };

    let sizeValue = parseFloat(sizeStr);
    let sizeUnit = sizeStr.replace(/[0-9.]/g, '').trim();

    if (!sizeUnits[sizeUnit]) return "N/A";

    let sizeInBytes = sizeValue * sizeUnits[sizeUnit];
    let downloadTimeSec = (sizeInBytes * 8) / (speedMbps * 1024 * 1024);

    if (downloadTimeSec < 60) return `${Math.round(downloadTimeSec)} sec`;
    else return `${(downloadTimeSec / 60).toFixed(1)} min`;
}

bot.catch((err) => {
    console.error('🤖 Bot Error:', err);
});

// ✅ Vercel ke liye - polling nahi, sirf express app export karo
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

// ✅ Webhook set karna bhool mat (ek baar karna hai)
// https://api.telegram.org/bot7751886103:AAFDtG8oyzsc1jhwXsFKVKT2-KJe3FLPTEI/setWebhook?url=https://tera-indol.vercel.app/webhook/7751886103:AAFDtG8oyzsc1jhwXsFKVKT2-KJe3FLPTEI

export default app;
