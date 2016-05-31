import Redis from "../cofy-ioredis";

export default function(redisUrl, expireTime) {
	if (!expireTime)
		expireTime = 7200000;
	return function *token(next) {
		if (this.request.method == 'OPTIONS')
			return yield next;
		var token = this.request.body.token;
		if (!token) {
			token = this.query.token;
		}
		if (!token) {
			this.status = 504;
			this.body = "请确认传递了token";
		} else {
			var redis = RedisClient.init(redisUrl);
			var tokenkey = "usertoken:" + token;
			var value = yield redis.$get(tokenkey);
			if (value) {
				let userjson = JSON.parse(value);
				yield redis.$pexpire(tokenkey, expireTime);
				let user = userjson;
				if(userjson.id){
					user._id = parseInt(userjson.id);
				}
				user.id = undefined;
				if (!user._id && userjson._id) user._id = userjson._id;
				user.password = "";
				user.token = token;
				this.request.user = user;
				yield next;
			} else {
				this.status = 504;
				this.body = "token过期，请重新登录";
			}
		}
	}
}

export class RedisClient {
	static redis;
	static init(redisUrl) {
		if (!this.redis) {
			this.redis = new Redis(redisUrl);
		}
		return this.redis;
	}
}