const memory = require("../database/data_work.js");
const { getTranslateTagsText, getshowTagsText } = require("../someFuncs.js");

module.exports.to_ru = async function (ctx) {
  let settings = await memory.getSettings(ctx.from.id);
  await ctx.editMessageText(
    `Отправь мне ссылкy на иллюстрацию с Pixiv\nНапример: \`https://pixiv.net/en/artworks/73711661\`\nТы можешь отправлять несколько ссылок одним сообщением\nОткрыть настройки - /settings`,
    {
      disable_link_preview: true,
      parse_mode: "markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "English",
              callback_data: "en",
            },
          ],
          [
            {
              text: getshowTagsText(settings),
              callback_data: "showtags",
            },
            {
              text: getTranslateTagsText(settings),
              callback_data: "translatetags",
            },
          ],
        ],
      },
    }
  ).catch(err=>{
    console.log(err)
  });
};
