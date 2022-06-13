import 'dotenv/config'
import { pino } from 'pino'
import Werror from './lib/errors.js'

import initBot from './bot/index.js'
import setWebhook from './server.js'

const token = process.env['BOT_TOKEN']
if (!token) {
	throw new Werror('Bot token not specified')
}

const logger = pino()

let bot
try {
	bot = initBot(token, logger)
} catch (error) {
	throw new Werror(error, 'Initializing the bot')
}

const urlForWebhook = getUrlForWebhook()
if (urlForWebhook) {
	try {
		await setWebhook(bot, urlForWebhook)
	} catch (error) {
		throw new Werror(error, 'Starting with webhook')
	}
	logger.info('Webhook is set')
} else {
	logger.info('Url for webhook not specified, starting polling')
	void bot.start({
		drop_pending_updates: true,
	})
}

function getUrlForWebhook() {
	if (process.env['HEROKU_APP_NAME']) {
		return `https://${process.env['HEROKU_APP_NAME']}.herokuapp.com`
	} else if (process.env['REPL_SLUG'] && process.env['REPL_OWNER']) {
		return `https://${process.env['REPL_SLUG']}.${process.env[
			'REPL_OWNER'
		].toLowerCase()}.repl.co`
	}
	return
}
