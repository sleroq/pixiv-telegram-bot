import { Bot } from 'grammy'
import { parseMode } from '@grammyjs/parse-mode'

export default function initBot(token: string) {
	const bot = new Bot(token)

	bot.catch((error) => { console.error(error) })
	bot.api.config.use(parseMode('HTML'))

	// Commands:
	bot.command('start', async ctx => await handleStart(ctx))

	return bot
}
