var Redis = require('ioredis');
require('cofy').class(Redis);

Redis.prototype.$getJson = function(key){
	var _this = this;
	return function(done){
		_this.get(key, function(e,r){
			if(e){
				return done(e);
			}
			try{
				done(null ,JSON.parse(r));
			}catch(e){
				done(null , r);
			}

		});
	};
};

Redis.prototype.$setJson = function(key,object){
	var _this = this;
	return function(done){
		_this.set(key,JSON.stringify(object),done);
	};
};
module.exports = Redis;