require('dotenv').config();

module.exports = {
	"PRODUCTION": process.env.NODE_ENV === "production",
	"PORT": 3000,
	"SENTRY_DSN": process.env.SENTRY_DSN,

	"USERNAME": "tuckerritti@gmail.com",
	"PASSWORD": "2DPCdUvPQMdr{XsMnjgobbT{",
	"OTP_CODE": "B6H7ZXERENR6MRU3",
	"DEVICE_TOKEN": "958ac53d-4b47-e81c-1ca3-8d06a34a2b10",
	"INITIAL_INVESTMENT": 1000,

	"DISCORD_WEBHOOK": "https://discord.com/api/webhooks/808741601466908743/O57BeEulR47ceSWfiLhdcyrFI3qtZ9Mq0zARkNFrc_mDiTTpN2B-5QaO544QBYgkwDdA",
	"SHARED_SECRET": process.env.SHARED_SECRET
}