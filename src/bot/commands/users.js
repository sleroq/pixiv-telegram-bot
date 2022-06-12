const memory = require('../database/data_work.js')

module.exports.users = async function(ctx) {
	const req = await memory.listUsers()
	const list = req.list
	let result = ''
	for (let i = 0; i < list.length; i++) {
		const fromU = JSON.parse(list[i].fromu)
		const req = await ctx.telegram.getChat(fromU.id)
		const uname = req.username
		if (!uname) {
			result += '\n' + fromU.first_name + '  ' + '`' + fromU.id + '`'
		} else {
			result +=
        '\n[' +
        fromU.first_name +
        '](https://t.me/' +
        uname +
        ')  ' +
        '`' +
        fromU.id +
        '`'
		}
	}
	ctx.reply(result, {
		parse_mode: 'Markdown',
		disable_web_page_preview: true,
	})
}
