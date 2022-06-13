import express from 'express'
import { Bot, webhookCallback } from 'grammy'

export default async function setWebhook(
	bot: Bot,
	urlForWebhook: string
): Promise<void> {
	const server = express()
	// Register a handler for the bot
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	server.post('/webhook', webhookCallback(bot, 'express'))

	server.listen(80)

	const webhookURL = new URL('/webhook', urlForWebhook)

	// Set webhook for handler in Bot API
	await bot.api.setWebhook(webhookURL.toString(), {
		drop_pending_updates: true,
	})
}
