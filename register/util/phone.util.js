export class PhoneUtil {
  static checkPhoneFormat(telphone) {
    var isPhone = /^0?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;

    telphone.trim();

    if (telphone.length !== 11) {
      return this._setReturnJson(false, '未检测到正确的手机号码:长度错误');
    }
    else {
      if (isPhone.test(telphone)) {
        return this._setReturnJson(true, '成功验证');
      }
      else {
        return this._setReturnJson(false, '手机号格式未匹配');
      }
    }
  }

  static _setReturnJson(status, msg, data) {
    if (typeof status !== 'boolean' && typeof status !== 'number') {
      status = false;
    }
    if (typeof msg !== 'string') {
      msg = '';
    }
    return {
      'status': status,
      'msg': msg,
      'data': data
    };
  }
}