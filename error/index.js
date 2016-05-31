import bunyan from "bunyan";
import {LogUtil} from "../log/index.js";

export default function(app, appName) {
  app.on('error', (err, context) => {
    ErrorRecorder.recordError(context, err);
  });
  app.on('info', (err, context) => {
    ErrorRecorder.recordInfo(context, err);
  });

  return function *(next) {
    try {
      yield next;
    } catch (err) {

      if (err.status == 501 || err.status == 502) {
        this.status = err.status;
        this.body = err.message;
        this.app.emit('info', err, this);
      } else {
        this.status = err.status || 500;
        this.body = err.message;
        this.app.emit('error', err, this);
      }
    }
  }
}

export class ErrorRecorder {
  static recordInfo(context, err) {
    let params;
    let url = context.request.url;
    let header = context.header;
    let user = context.request.user;
    let userId = -1;
    if (user)
      userId = user._id;

    let method = context.request.method;
    if (context.request.method == 'GET' || context.request.method == 'DELETE') {
      params = context.query;
    } else if (context.request.method == 'POST' || context.request.method == 'PUT'){
      params = context.request.body;
    }
    //log.info("err type is error! err info is " + err + " url is " + url + ", method is " + method + ", params is " + JSON.stringify(params) + ", user is " + message + ", header is " + JSON.stringify(context.header));
    LogUtil.info("", userId, {params: params, url: url, message: err.stack || err});
  }

  static recordError(context, err) {
    let params;
    let url = context.request.url;
    let header = context.header;
    let user = context.request.user;
    let userId = -1;
    if (user)
      userId = user._id;

    let method = context.request.method;
    if (context.request.method == 'GET' || context.request.method == 'DELETE') {
      params = context.query;
    } else if (context.request.method == 'POST' || context.request.method == 'PUT'){
      params = context.request.body;
    }
    //log.error("err type is info! err info is " + err + "url is " + url + ", method is " + method + ", params is " + JSON.stringify(params) + ", user is " + message + ", header is " + JSON.stringify(context.header));
    LogUtil.error("", userId, {params: params, url: url, message: err.stack || err});
  }
}


