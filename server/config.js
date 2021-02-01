require('dotenv').config();

module.exports = {
	"PRODUCTION": process.env.NODE_ENV === "production",
	"PORT": 3000,
	"SENTRY_DSN": process.env.SENTRY_DSN,

	"API_KEY": process.env.API_KEY,
	"API_SECRET": process.env.API_SECRET,
	"PASSPHRASE": process.env.PASSPHRASE,
	"SANDBOX": process.env.SANDBOX,
	"INITIAL_INVESTMENT": 2000,

	"DISCORD_WEBHOOK": "https://discord.com/api/webhooks/805682700752519178/SxmRyFldwtWcD7tmCktOCya8TUy7ZmnKTprKseP_33dLSNU0biQN44qLP3NCkymf2PhO",
	"SHARED_SECRET": process.env.SHARED_SECRET
}