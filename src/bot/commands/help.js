const memory = require('../database/data_work.js')
const {getTranslateTagsText, getshowTagsText} = require('../someFuncs.js')

module.exports.help_reply = async function(ctx) {
	let settings = await memory.getSettings(ctx.from.id)
	if (!settings) {
		await memory.updateSettings(ctx.from.id)
		settings = await memory.getSettings(ctx.from.id)
	}
	await ctx.reply(
		'Send me link to illustration from Pixiv\nFor example:  `https://pixiv.net/en/artworks/73711661`\nYou can send multiple links in one message\nOpen settings - /settings\n',
		{
			disable_link_preview: true,
			parse_mode: 'markdown',
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
							text: getshowTagsText(settings),
							callback_data: 'showtags',
						},
						{
							text: getTranslateTagsText(settings),
							callback_data: 'translatetags',
						},
					],
				],
			},
		},
	)
	ctx.reply('Found bug? - @sleeper_ok')
}
