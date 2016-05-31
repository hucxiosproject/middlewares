var uaParser = require("ua-parser2")();

export default function() {
  return function *(next) {
    if (this.request.path == "/") {
      var uagent = this.request.headers["user-agent"] || "";
      this.session.useragent = (uaParser.parse(uagent));
    }
    yield next;
  }
}


