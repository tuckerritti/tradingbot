require('dotenv').config();

module.exports = {
	"PRODUCTION": process.env.NODE_ENV === "production",
	"PORT": 3000,
	"SENTRY_DSN": process.env.SENTRY_DSN,

	"USERNAME": process.env.USERNAME,
	"PASSWORD": process.env.PASSWORD,
	"OTP_CODE": process.env.OTP_CODE,
	"DEVICE_TOKEN": process.env.DEVICE_TOKEN,
	"INITIAL_INVESTMENT": process.env.INITIAL_INVESTMENT,

	"DISCORD_WEBHOOK": process.env.DISCORD_WEBHOOK,
	"SHARED_SECRET": process.env.SHARED_SECRET
}