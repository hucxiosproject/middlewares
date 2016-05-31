import session from "koa-generic-session";
import MongoStore from "koa-generic-session-mongo";
import wrap from "co-monk";
import monk from "monk";
import parseEnv from "parse-env";
import tpl from "./config.template";
import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;

function setupSession(app, config) {
  app.keys = config.keys.split(',');
  app.use(session({
    store: new MongoStore({url: config.mongoUrl})
  }));
}


export default function(app) {
  process.env["VERBOSE_PARSE_ENV"] = 1;
  var config = parseEnv(process.env, {"wechat-auth-session": tpl})["wechat-auth-session"];

  setupSession(app, config);
  if(process.env.NODE_ENV != "production" && process.env.NODE_ENV != "staging") {
    return function *(next) {
      this.session.fakeUserId = ObjectID();
      return yield next;
    };
  }

  
  var db = monk(config.mongoUrl);
  var users = wrap(db.get("users"));

  // Ensure index
  users.index({ "wechat.openid" : 1});

  return function *(next) {
    if(this.path === "/") {
      if(this.session.userId) {
        return yield next;
      } else {
        if(this.request.query.data) {
          let queryData = decodeURIComponent(this.request.query.data);
          // User came to site with some wechat data
          var data = JSON.parse(new Buffer(queryData, "base64").toString());
          var user = yield users.findOne({"wechat.openid": data.auth.openid});
          if(!user) {
            user = {}
            user.wechat = data.user;
            user.wechat.accessToken = data.auth.accessToken;  
            var result = yield users.insert(user);
          } else {
            user.wechat = data.user;
            user.wechat.accessToken = data.auth.accessToken;
            var result = yield users.update({"_id": user._id}, user);
          }
          this.session.userId = user._id;
        } else {
          // No user data so we need to redirect to authentcation
          let url = config.wechat.authUrl+ "?fromUrl=" + config.wechat.authFromUrl;
          this.redirect(url);
        }
      }
    }
    return yield next;
  };

}
