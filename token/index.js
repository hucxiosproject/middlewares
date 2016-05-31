import Memcached from 'cofy-memcached';
import cofymongodb from "comongodb";
import util from "util";
import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;
var MongoClient = cofymongodb.MongoClient;

export default function(memcachedUrl, mongoUrl) {

	return function *token(next) {
		var token = this.request.body.token;
		if (!token) {
			var url = this.request.url;
			var urlparams = url.split("/");
			token = urlparams[urlparams.length-1];
		}
		if (!token) {
			this.status = 501;
			this.body = "请确认传递了token";
		} else {
			let memcached = MemcachedClient.init(memcachedUrl);
			let value = yield memcached.$get(token);
			if (value) {
				let _users = yield Mongo.init(mongoUrl);
				let user = yield Mongo.get(value);
				delete user.password;
				this.request.user = user;

				//update expire time
				yield memcached.$replace(token, value, 7200);

				yield next;
			} else {
				this.status = 501;
				this.body = "token过期，请重新登录";
			}
		}
	}
}

export class MemcachedClient {
	
	static memcached;
	static init(memcachedUrl) {
		if(!this.memcached) {
			this.memcached = new Memcached(memcachedUrl);
		}
		return this.memcached;
	}
}

export class Mongo {
	static _user;

	static * init(mongoUrl) {
		if (!this._user) {
			var mongo = yield MongoClient.$connect(process.env.MONGO_URL);
			this._users = mongo.collection("users");
		}
		return this._user;
	}

	static * get(id) {
		var activited = new Date().getTime();
		let doc = yield this._users.$findOne({_id: ObjectID(id)});
		let result = yield this._users.$update({_id: ObjectID(id)}, {$set: {"activited": activited}}, {"upsert": true});
		return doc;
	}
}