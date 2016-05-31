import bunyan from "bunyan";

export class LogUtil {

  static init(appName, workerId) {
    this._log = bunyan.createLogger({name: `${appName}-${workerId}`});
  }

  static info(className, message, infos, userId) {
    if (!userId) userId = -1;
    if (!message && className) { 
      message = className;
      className = null;
    } else if (className && message && typeof message === 'object') {
      infos = message;
      message = className;
      className = null;
    }
    this._log.info({class: className, userId: `${userId}`, infos: infos, message: message});
    this._afterLog(userId, infos);
  }

  static error(className, message, infos, userId) {
    if (!userId) userId = -1;
    if (!message && className) { 
      message = className;
      className = null;
    } else if (className && message && typeof message === 'object') {
      infos = message;
      message = className;
      className = null;
    }
    this._log.error({class: className, userId: `${userId}`, infos: infos, message: message});
    this._afterLog(userId, infos);
  }

  static _afterLog(userId, infos) {
    //TODO maybe send log to mq
  }
}