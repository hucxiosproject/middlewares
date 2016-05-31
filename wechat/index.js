import mount from "koa-mount";
import wechat from "koa-wechat";

export default function(path, token) {
  return mount(path || "/wechat", wechat({ token: token }));
}

