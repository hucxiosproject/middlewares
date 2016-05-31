import mount from "koa-mount";
import router from "koa-router";
import Memcached from 'cofy-memcached';
import co from "co";
import mongodb from "comongodb";
var MongoClient = mongodb.MongoClient;

import {UserService} from "./service/user.service";
import {UserController} from "./controller/user.controller";
import { EasyChat } from "./util/easychat.util";

export default function(path, mongoUrl, memcacheUrl, easeId, easeSecret, easeType) {
	return function *(next) {
		var mongo = yield MongoClient.$connect(process.env.MONGO_URL);
		var memcached = new Memcached(process.env.MEMCACHED_URL);

		var service = new UserService(mongo, memcached);
		var controller = new UserController(service);

		let token = yield EasyChat.init(easeId, easeSecret, easeType);

		var r = new router();
		r.get("/sms/:phone", controller.getSmsCode);
	  r.post("/signup", controller.signUp);
	  r.post("/signin", controller.signIn);
	  r.post("/resetPassword", controller.resetPassword);
		return mount(path, r.middleware());
	}
}