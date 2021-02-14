require('dotenv').config();

module.exports = {
	// General stuff
	"PRODUCTION": process.env.NODE_ENV === "production",
	"PORT": 3000,
	"SENTRY_DSN": process.env.SENTRY_DSN,
	"DB_URL": process.env.DB_URL,
	"SHARED_SECRET": process.env.SHARED_SECRET,

	// Robinhood stuff
	"ROBINHOOD_ENABLED": process.env.ROBINHOOD_ENABLED,
	"USERNAME": process.env.USERNAME,
	"PASSWORD": process.env.PASSWORD,
	"OTP_CODE": process.env.OTP_CODE,
	"DEVICE_TOKEN": process.env.DEVICE_TOKEN,
	"ROBINHOOD_DISCORD_WEBHOOK": process.env.ROBINHOOD_DISCORD_WEBHOOK,

	// Simulated Stuff
	"SIMULATED_ENABLED": process.env.SIMULATED_ENABLED,
	"SIMULATED_DISCORD_WEBHOOK": process.env.SIMULATED_DISCORD_WEBHOOK
}