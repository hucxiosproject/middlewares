import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;

import crypto from "crypto";
import md5 from "md5";
import querystring from "querystring";
import request from "cofy-request";

import {PhoneUtil} from "../util/phone.util.js";
import {RandomUtil} from "../util/random.util.js";
import {SmsUtil} from "../util/sms.util.js";
import {EasyChat} from "../util/easychat.util";

var HALF_DAY = 43200;
var TWO_HOURS = 7200;
var HALF_HOUR = 1800;
var ONE_HOUR = 3600;
var ONE_MINUTE = 60;

export class ServiceError {
  constructor(status, message) {
    this.status = status;
    this.message = message;
  }
}

export class UserService {

  constructor(mongo, cache) {
    this._users = mongo.collection("users");
    this._cache = cache;
  }

  /**
   * @param phone
   * @returns {{phone: *, smsCode: *, expireTime: number}}
   */
  * getSmsCode(phone) {
    var url = process.env.THIRDPARTY_INNER_SERVER + "/phone/sms/" + phone + "/" + process.env.SERVER_TOKEN;
    var res = yield request.$request(url);
    if (res[0].statusCode == 200) {
      var passport = JSON.parse(res[0].body);
      return passport;
    } else if (res[0].statusCode == 501) {
      throw new ServiceError(501, "验证码重复发送");
    } else {
      throw new ServiceError(res[0].statusCode, res[0].body);
    }
  }

  /**
   * @param user
   * @returns {*}
   */
  * signUp(adduser) {
    var url = process.env.THIRDPARTY_INNER_SERVER + "/phone/sms/" + adduser.phone + "/" + adduser.smsCode + "/" + process.env.SERVER_TOKEN;
    var res = yield request.$request(url);
    if (res[0].statusCode == 200) {
      adduser.password = md5(adduser.password);
      var doc = yield this._users.$findOne({phone: adduser.phone});
      if(doc && doc._id){
        throw new ServiceError(501, "该手机已注册");
      }
      if (!adduser.loc || !adduser.loc.length || !adduser.loc[0]) {
        adduser.loc = [0, 0];
      }
      var result = yield this._users.$insert({
        phone: adduser.phone,
        password: adduser.password,
        loc: adduser.loc
      });

      var now = new Date();
      adduser.id = String(result.ops[0]._id);
      adduser.token = md5(adduser.id + " " + now.getTime());

      yield this._cache.$set(adduser.token, adduser.id,  TWO_HOURS);
      var createResult = yield EasyChat.createUser(adduser.id, adduser.password);
      return {
        phone: adduser.phone,
        token: adduser.token,
        password: "",
        id: adduser.id
      };
    } else if (res[0].statusCode == 501) {
      throw new ServiceError(501, "验证码错误");
    } else if (res[0].statusCode == 502) {
      throw new ServiceError(501, "验证码过期");
    } else {
      throw new ServiceError(res[0].statusCode, res[0].body);
    }
  }

  /**
   * @param adduser
   * @returns {*}
   */
  * resetPassword(adduser) {
    var url = process.env.THIRDPARTY_INNER_SERVER + "/phone/sms/" + adduser.phone + "/" + adduser.smsCode + "/" + process.env.SERVER_TOKEN;
    var res = yield request.$request(url);
    if (res[0].statusCode == 200) {
      // var oldUser = yield UserDAO.getByPhone(adduser.phone);
      var doc = yield this._users.$findOne({'phone': adduser.phone});
      if (!doc) {
        throw new ServiceError(this._errorCode.ERROR_CODE_CLIENT_PARAMS_ERROR, "用户不存在，请检查手机号码");
      }
      var oldUser = {
        id: String(doc._id),
        password: doc.password,
        phone: doc.phone
      };
      oldUser.password = md5(adduser.password);
      oldUser.phone = adduser.phone;

      try {
        var result = yield this._users.$update({phone: adduser.phone}, {
          phone: adduser.phone,
          password: adduser.password
        });
        var now = new Date();
        oldUser.token = md5(oldUser.id + " " + now.getTime() );

        var oldToken = yield this._cache.$get(adduser.phone );
        yield this._cache.$del(oldToken);
        yield this._cache.$set(oldUser.token,oldUser.id, TWO_HOURS);
        yield this._cache.$set(oldUser.phone,oldUser.token, TWO_HOURS);

        yield EasyChat.resetPassword(oldUser.id,oldUser.password);

        return {
          phone: adduser.phone,
          token: oldUser.token,
          password: "",
        };
      } catch (err) {
        throw err;
      }
    } else if (res[0].statusCode == 501) {
      throw new ServiceError(501, "验证码错误");
    } else if (res[0].statusCode == 502) {
      throw new ServiceError(501, "验证码过期");
    } else {
      throw new ServiceError(res[0].statusCode, res[0].body);
    }
  }

  /**
   * @param user
   * @returns {*}
   */
  * signIn(addUser) {
    var doc = yield this._users.$findOne({phone: addUser.phone});
    if (!doc) {
      throw new ServiceError(501, "账户不存在");
    }
    var oldUser = {
      id: String(doc._id),
      phone: doc.phone,
      password: doc.password,
      avatar: doc.avatar,
      gender: doc.gender,
      username: doc.username
    };

    //test
    addUser.password = md5(addUser.password);
    if (addUser.password == oldUser.password) {
      var now = new Date();
      oldUser.token = md5(oldUser.id + " " + now.getTime());
      var oldToken = yield this._cache.$get(addUser.phone );
      yield this._cache.$del(oldToken);
      yield this._cache.$set(oldUser.phone ,oldUser.token, TWO_HOURS);
      yield this._cache.$set(oldUser.token ,oldUser.id, TWO_HOURS);

      var result = {
        phone: addUser.phone,
        password: "",
        token: oldUser.token,
        id: oldUser.id,
        username: oldUser.username
      };
      result.avatar = oldUser.avatar;
      result.gender = oldUser.gender;

      return result;
    } else {
      throw new ServiceError(501, "用户登陆失败，密码不正确");
    }
  }
}