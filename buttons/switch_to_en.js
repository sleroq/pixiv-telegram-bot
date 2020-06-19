const memory = require("../database/data_work.js");
const { getTranslateTagsText, getshowTagsText } = require("../someFuncs.js");

module.exports.to_en = async function (ctx) {
  await ctx.reply();
  let settings = await memory.getSettings(ctx.from.id);
  await ctx.editMessageText(
    `Send me link to illustration from Pixiv\nFor example:  \`https://pixiv.net/en/artworks/73711661\`\nYou can send multiple links in one message\nOpen settings - /settings\n`,
    {
      disable_link_preview: true,
      parse_mode: "markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Русский",
              callback_data: "ru",
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
  );
};
