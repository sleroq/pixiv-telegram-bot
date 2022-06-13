-error = <b>{$t}</b>

# Text Commands

welcome =
    Send me link to illustration from Pixiv
    For example:  <code>https://pixiv.net/en/artworks/73711661</code>

    You can send multiple links in one message

found-bug =
    Found bug? - @sleroq

buttons =
    .settings = Settings

errors =
    .unknown        = {-error(t: "An error occurred.")}
    .error          = {-error(t: "An error occurred:")} {$message}
