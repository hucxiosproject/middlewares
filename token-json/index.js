import Memcached from 'cofy-memcached';
import co from "co";

export default function (memcachedUrl) {

  return function *token(next) {
    if (this.request.method == 'OPTIONS')
      return yield next;
    var token = this.request.body.token;
    if (!token && (this.request.method == 'GET' || this.request.method == 'DELETE')) {
      token = this.query.token;
    }
    if (!token) {
      this.status = 504;
      this.body = "请确认传递了token";
    } else {
      let memcached = MemcachedClient.init(memcachedUrl);
      let value = yield memcached.$get(token);
      if (value) {
        let userjson = JSON.parse(value);

        let user = userjson;
        user._id = userjson.id;
        user.id = undefined;
        if (!user._id && userjson._id) user._id = userjson._id;
        user.password = "";
        user.token = token;

        yield memcached.$replace(token, value, 7200);

        this.request.user = user;
        yield next;
      } else {
        this.status = 504;
        this.body = "token过期，请重新登录";
      }
    }
  }
}

export class MemcachedClient {

  static memcached;

  static init(memcachedUrl) {
    if (!this.memcached) {
      this.memcached = new Memcached(memcachedUrl);
    }
    return this.memcached;
  }
}