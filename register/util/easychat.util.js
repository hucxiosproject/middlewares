import request from "cofy-request";
import queryString from "querystring";

var INFORM_ANNOUNCE_PEOPLE = 1;
var INFORM_RECEIVE_RES = 2;
var INFORM_POST = 3;

export class EasyChat {
  static requestUrl; 
  static EasyConfig; 
  static token;
  static _constant;

  static _onlineGroup;

  static * resetPassword(username, password) {
    var param = {
      newpassword: password
    };
    var res = yield request.$post({
      url: this.requestUrl + "/users/" + username + "/password",
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + this.token,
        'Content-Type': "application/json;charset=UTF-8"
      },
      body: JSON.stringify(param)
    });
    return (JSON.parse(res[0].body));
  }

  static * isUserOnline(userId) {
    var res = yield request.$get({
      url: this.requestUrl + "/users/" + userId + "/status",
      method: 'GET',
      headers: {
        "Authorization": "Bearer " + this.token
      }
    });
    return JSON.parse(res[0].body).data;
  }

  static * createGroup(name, desc, owner) {
    var param = {
      groupname: name,
      desc: desc,
      public: true,
      maxuser: 300,
      approval: false,
      owner: owner
    };
    var res = yield request.$post({
      url: this.requestUrl + "/chatgroups",
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + this.token,
        'Content-Type': "application/json;charset=UTF-8"
      },
      body: JSON.stringify(param)
    });
    return JSON.parse(res[0].body).data.groupid;
  }

  static * getGroup(id) {
    var res = yield request.$get({
      url: this.requestUrl + "/chatgroups/"+id,
      method: 'GET',
      headers: {
        "Authorization": "Bearer " + this.token
      }
    });
    return JSON.parse(res[0].body).data[0];
  }

  static * addUsersToOnlineGroup(userIds) {
    var ownerid = "5624bab20e47ad321e81f4e5";
    return yield this.addUserToGroup(this._onlineGroup, userIds);
  }

  static * addUsersToGroup(groupId, users) {
    var body = {
      usernames: users
    };
    body = JSON.stringify(body);

    var res = yield request.$post({
      url: this.requestUrl + "/chatgroups/" + groupId + "/users",
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + this.token
      },
      body: body
    });
    return JSON.parse(res[0].body).data;
  }

  static * addUserToGroup(groupId, userId) {
    var res = yield request.$post({
      url: this.requestUrl + "/chatgroups/"+groupId+"/users/"+userId,
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + this.token
      }
    });
    return JSON.parse(res[0].body);
  }

  static * removeUsersFromOnlineGroup(userIds) {
    var ownerid = "5624bab20e47ad321e81f4e5";
    return yield this.removeUsersFromGroup(this._onlineGroup, userIds);
  }

  static * removeUsersFromGroup(groupId, userIds) {
    var userString = "";
    var i = 0;
    for (i; i < userIds.length - 2 ; i ++) {
      userString += userIds[i] + ","
    }
    userString += userIds[i];
    var res = yield request.$del({
      url: this.requestUrl + "/chatgroups/" + groupId + "/users/" + userString,
      method: 'DELETE',
      headers: {
        "Authorization": "Bearer " + this.token
      }
    });
    return JSON.parse(res[0].body);
  }

  static * removeUserFromGroup(groupId, userId) {
    var res = yield request.$del({
      url: this.requestUrl + "/chatgroups/"+groupId+"/users/"+userId,
      method: 'DELETE',
      headers: {
        "Authorization": "Bearer " + this.token
      }
    });
    return JSON.parse(res[0].body).data;
  }

  static * removeGroup(groupId) {
    var res = yield request.$del({
      url: this.requestUrl + "/chatgroups/" + groupId,
      method: 'DELETE',
      headers: {
        "Authorization": "Bearer " + this.token
      }
    });
    return JSON.parse(res[0].body).data;
  }

  static * createUser(username, password) {
    var param = {
      username: username,
      password: password
    };
    var res = yield request.$post({
      url: this.requestUrl + "/users",
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + this.token,
        'Content-Type': "application/json;charset=UTF-8"
      },
      body: JSON.stringify(param)
    });
    return (JSON.parse(res[0].body).entities[0]);
  }

  static * forceUserOffline(userId) {
    var res = yield request.$get({
      url: this.requestUrl + "/users/" + userId + "/disconnect",
      method: 'GET',
      headers: {
        "Authorization": "Bearer " + this.token,
        'Content-Type': "application/json;charset=UTF-8"
      }
    });
    return (JSON.parse(res[0].body)).data;
  }

  static * sendAnnouncedCount(targetUser, anounceCount, action){
    var msg = {
      command: INFORM_ANNOUNCE_PEOPLE,
      message: anounceCount,
      action: action
    };
    return yield this.sendCommand([targetUser], msg, "users");
  }

  static * sendReceiveRes(targetUser, groupId, action){
    var msg = {
      command: INFORM_RECEIVE_RES,
      message: "" + groupId,
      action: action
    };
    return yield this.sendCommand([targetUser], msg, "users");
  }

  static * sendGroup(groupId, action) {
    var msg = {
      command: INFORM_RECEIVE_RES,
      message: "" + groupId,
      action: action
    };
    return yield this.sendCommand([groupId], msg, "chatgroups");
  }

  static * sendPostToOnline(post, action) {
    var msg = {
      command: INFORM_POST,
      message: post,
      action: action
    };
    return yield this.sendCommand([this._onlineGroup], msg, "chatgroups");
  }

  static * sendPost(targetUser, post, action) {
    var msg = {
      command: INFORM_POST,
      message: post,
      action: action
    };
    if (targetUser instanceof Array) {
      return yield this.sendCommand(targetUser, msg, "users");
    }
    return yield this.sendCommand([targetUser], msg, "users");
  }

  static * sendCommand(targetUser, action, type) {

    var param = {
      "target_type": type, //"users",
      "target": targetUser,
      "msg":{
        "type":"cmd",
        "action": action
      },
      "ext":{

      }
    };
    var res = yield request.$post({
      url: this.requestUrl + "/messages",
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + this.token,
        'Content-Type': "application/json;charset=UTF-8"
      },
      body: JSON.stringify(param)
    });
    return (JSON.parse(res[0].body));
  }

  static * init(id, secret, type) {

    this.requestUrl = "https://a1.easemob.com/voc/hit";
    this.EasyConfig = {
      client_id: id,
      client_secret: secret,
      grant_type: type
    };

    var r = yield request.$post({
      url: this.requestUrl + "/token",
      method: 'POST',
      headers: {
        'Content-Type': "application/json;charset=UTF-8"
      },
      body: JSON.stringify(this.EasyConfig)
    });

    this.token = JSON.parse(r[0].body).access_token;

    //init
    this._onlineGroup = "119908659567264232";

    return this.token;
  }

}