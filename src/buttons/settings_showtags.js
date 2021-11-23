const memory = require("../database/data_work.js");
const { getTranslateTagsText, getshowTagsText } = require("../someFuncs.js");

module.exports.showtags = async function (ctx) {
  await memory.updateSettings(ctx.from.id, "showtag");
  let settings = await memory.getSettings(ctx.from.id);
  await ctx.editMessageReplyMarkup({
    inline_keyboard: [
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
  }).catch(err=>{
    console.log(err)
  });
};
