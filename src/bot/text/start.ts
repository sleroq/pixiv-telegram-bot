import { Context } from 'grammy'

export default async function (ctx: Context) {
	await ctx.reply(
		'Send me link to illustration from Pixiv\nFor example:  `https://pixiv.net/en/artworks/73711661`\nYou can send multiple links in one message\nOpen settings - /settings\n',
		{
			disable_web_page_preview: true,
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Русский',
							callback_data: 'ru',
						},
					],
				],
			},
		}
	)
	await ctx.reply('Found bug? - @sleroq')
}
