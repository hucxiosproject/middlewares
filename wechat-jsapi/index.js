import request from "request";
import monk from "monk";
import wrap from "co-monk";
import mongodb from "mongodb";
import crypto from "crypto"
import parseEnv from "parse-env";
import tpl from "./config.template";
var ObjectID = mongodb.ObjectID;


var GET_ACCESS_TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token";
var GET_JSAPI_TICKET_URL = "https://api.weixin.qq.com/cgi-bin/ticket/getticket";
var GET_IMAGE_URL = "http://file.api.weixin.qq.com/cgi-bin/media/get";


function _generateNonceString() {
  return Math.random().toString(36).substr(2,15);
}

function _generateTimestamp() {
  return parseInt(Date.now()/1000);
}

function _getAccessToken(appId, secret) {
  return (next) => {
    let url = GET_ACCESS_TOKEN_URL + 
      "?grant_type=client_credential&appid=" + appId + 
      "&secret=" + secret;
    request(url,  (error, response, body) => {
      if(error) {
        return next(error);
      }
      return next(null, JSON.parse(body));
    });
  };
}

function _getJSAPITicket(accessToken) {
  return (next) => {
    let url = GET_JSAPI_TICKET_URL + 
      "?access_token=" + accessToken +
      "&type=jsapi"; 
    request(url,  (error, response, body) => {
      if(error) {
        return next(error);
      }
      return next(null, JSON.parse(body));
    });
  };
}

function _makeSignature(ticket, nonceStr, timestamp, fromURL) {
  var str = "jsapi_ticket=" + ticket + 
            "&noncestr=" + nonceStr + 
            "&timestamp=" + timestamp + 
            "&url=" + fromURL; 
  return crypto.createHash("sha1").update(str).digest("hex");
}

function _downloadImage(imageDownloaderUrl, accessToken, mediaId) {
  return (next) => {
    var url = GET_IMAGE_URL + "?access_token=" + accessToken + "&media_id=" + mediaId;
    var options = {
      method: 'post',
      body: {url: url},
      json: true,
      url: imageDownloaderUrl
    };
    request(options, function (err, res, body) {
      if(err) {
        return next(err);
      }
      try {
        return next(null, body);
      } catch(ex) {
        return next(ex);
      }
    });
  };
}

function _generateConfig(appId, ticket, fromURL, jsApiList) {
  var noncestr = _generateNonceString();
  var timestamp = _generateTimestamp();
  var sign = _makeSignature(ticket, noncestr, timestamp, fromURL);
  return {
    debug: process.env.NODE_ENV != "production",
    appId: appId,
    jsapi_ticket: ticket,
    nonceStr: noncestr,
    timestamp: timestamp,
    signature: sign,
    jsApiList: jsApiList 
  } 
}

export default function() {
  process.env["VERBOSE_PARSE_ENV"] = 1;
  var config = parseEnv(process.env, {"wechat-jsapi": tpl})["wechat-jsapi"];

  var db = monk(config.mongoUrl); 
  var wxjsapi = wrap(db.get("wxjsapi"));

  return function *(next) {
    var accessToken = null;
    if(this.path === "/wx/downloadImage") {
      var token = yield wxjsapi.findOne({}, {limit: 2, sort: [["_id", "desc"]]});
      var res = yield _downloadImage(config.imageDownloaderUrl, token.accessToken, this.request.query.mediaId);
      this.body = res;
    }
    if(this.path === "/wx/jsapi") {
      if(this.request.query.fromUrl) {
        config.wechat.fromUrl = this.request.query.fromUrl;
      }
      var token = yield wxjsapi.findOne({}, {limit: 1, sort: [["_id", "desc"]]});
      // Check for valid token
      if(token && (token._id.getTimestamp().getTime()/1000+token.expiresIn) -  (new Date().getTime()/1000) >= 0) {
        accessToken = token;
      } else {
        // No valid token found
        var token = yield _getAccessToken(config.wechat.appId, config.wechat.secret);
        var ticket = yield _getJSAPITicket(token.access_token);
        // Got our ticket, put in mongo
        var result = yield wxjsapi.insert({
          ticket: ticket.ticket,
          accessToken: token.access_token, 
          expiresIn: ticket.expires_in
        });
        accessToken = result;
      }
      // Hand config to client
      this.body = _generateConfig(config.wechat.appId, accessToken.ticket, config.wechat.fromUrl, config.wechat.apiList);
    }
    yield next;
  };
}
