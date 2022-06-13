import Composer from '../composer.js'
const composer = new Composer()

composer.command('start', async (ctx) => {
	await ctx.reply(ctx.t('welcome'), {
		disable_web_page_preview: true,
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: 'Русский',
						callback_data: 'ru',
					},
				],
				[
					{
						text: ctx.t('settings-button'),
						callback_data: 'settings',
					},
				],
			],
		},
	})
	await ctx.reply(ctx.t('found-bug'))
})

export default composer
