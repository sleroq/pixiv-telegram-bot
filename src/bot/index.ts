import { Bot, Context } from 'grammy'
import { parseMode } from '@grammyjs/parse-mode'
import { Logger } from 'pino'
import Werror from '../lib/errors.js'

import textStart from './text/start.js'

export default function initBot(token: string, logger: Logger) {
	const bot = new Bot(token)

	bot.api.config.use(parseMode('HTML'))

	// Commands:
	bot.command('start', async (ctx) =>
		catchEverything(textStart, 'start command', ctx, logger)
	)

	return bot
}

async function catchEverything(
	task: (ctx: Context) => Promise<void>,
	taskName: string,
	ctx: Context,
	logger: Logger
) {
	try {
		return await task(ctx)
	} catch (error) {
		try {
			await ctx.reply('sorry, looks like something broke :c')
		} catch (e) {
			logger.error(e, 'can not reply about error to the user')
		}

		if (error instanceof Error) {
			logger.error({ error: error.message }, `error processing ${taskName}`)
		} else {
			throw new Werror(error, 'Error is not an instance of Error')
		}
	}
}
