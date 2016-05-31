import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;
import crypto from "crypto";
import md5 from "md5";

import {UserDAO} from "../model/user.model";

export class UserService {
	
	constructor(mongo, cache) {
    this._users = mongo.collection("users");
    this._cache = cache;
  }

  * addUser(currUser, newUser) {
  	if (currUser.userType < 9) {
  		throw { status: 501, message:"permission denied, you are not admin"};
  	}
  	var email = newUser.email;
  	newUser.password = md5(newUser.password);
  	var existUser = yield UserDAO.getByEmail(email);
  	if (!existUser) {
  		var result = yield UserDAO.insert(newUser);
	  	newUser._id = result;
	  	return newUser;
  	}
	  throw { status: 501, message: "email existed!!!"};	
  }

  * delUser(currUser, id) {
    if (currUser.userType < 9) {
      throw { status: 501, message:"permission denied, you are not admin"};
    }
    var result = yield UserDAO.del(id);
    if (result == true)
      return true;
    return result;
  }

  * signin(email, password) {
  	var existUser = yield UserDAO.getByEmail(email);
  	if (!existUser) throw { status: 501, message: "email does not exist"};
  	var md5password = md5(password);
  	if (md5password == existUser.password) {
  		var token = md5(existUser.id + " " + new Date().getTime() + Math.random());
  		delete existUser.password;
  		existUser.id = existUser._id;
  		yield this._cache.$set(token, JSON.stringify(existUser),  7200);
  		var clientUser = existUser.toClient();
  		clientUser.token = token;
  		return clientUser;
  	}
  	throw { status: 501, message: "password error"};
  }

  * resetPassword(id, nickName, password, brief, userType) {
  	var existUser = yield UserDAO.get(id);
  	var update = {};
  	if (nickName) update.nickName = nickName;
  	if (password) update.password = md5(password);
  	if (brief) update.brief = brief;
  	if (userType) update.userType = userType;

  	var result = yield UserDAO.updateProperty(id, update);
  	existUser.toClient();
  	return existUser.toClient();
  }

  * getAll(currUser) {
  	var users = yield UserDAO.getList();
    var result = [];
    for (var user of users) {
      result.push(user.toClient());
    }
  	return result;
  }
}