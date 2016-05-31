import mount from "koa-mount";
import router from "koa-router";
import Memcached from 'cofy-memcached';
import co from "co";
import mongodb from "comongodb";
var MongoClient = mongodb.MongoClient;

import {UserService} from "./service/user.service";
import {UserController} from "./controller/user.controller";
import {UserNoSessionController} from "./controller/user.nosession.controller";
import {UserDAO} from "./model/user.model";

export default function(path, mongoUrl, memcacheUrl, log) {

	return {
		* session(next) {
			var mongo = yield MongoClient.$connect(mongoUrl);
			yield UserDAO.init(mongo, log);

			var mongo = yield MongoClient.$connect(process.env.MONGO_URL);
			var memcached = new Memcached(process.env.MEMCACHED_URL);

			var service = new UserService(mongo, memcached);
			var controller = new UserController(service);
			var nosessionController = new UserNoSessionController(service);

			var r = new router();
			r.get("/users", controller.getList);
		  r.post("/user", controller.addUser);
		  r.put("/user", controller.update);
		  r.delete("/user", controller.delUser);
		  log.info("register-innersystem session works");
			return mount(path, r.middleware());
		},

		* nosession(next) {
			var mongo = yield MongoClient.$connect(mongoUrl);
			yield UserDAO.init(mongo, log);

			var mongo = yield MongoClient.$connect(process.env.MONGO_URL);
			var memcached = new Memcached(process.env.MEMCACHED_URL);

			var service = new UserService(mongo, memcached);
			var controller = new UserController(service);
			var nosessionController = new UserNoSessionController(service);

			var r = new router();
		  r.get("/signin", nosessionController.signin);
		  log.info("register-innersystem nosession works");
			return mount(path, r.middleware());
		}
	};
}