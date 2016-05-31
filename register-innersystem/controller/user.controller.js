import {User} from "../model/user.model";

export function UserController(userService) {
	return {
		* addUser(next) {
			var currUser = this.request.user;
			var email = this.request.body.email;
			var nickName = this.request.body.nickName;
			var password = this.request.body.password;
			var brief = this.request.body.brief;
			var userType = this.request.body.userType;

			var newUser = new User(null, email, nickName, password, brief, userType);
			this.body = yield userService.addUser(currUser, newUser);
			this.status = 200;
			this.type = "json";
			yield next;
		},

		* update(next) {
			var currUser = this.request.user;
			var password = this.request.body.password;
			var nickName = this.request.body.nickName;
			var brief = this.request.body.brief;
			var userType = this.request.body.userType;

			this.body = yield userService.resetPassword(currUser._id, nickName, password, brief, userType);
			this.status = 200;
			this.type = "json";
			yield next;
		},

		* delUser(next) {
			var currUser = this.request.user;
			var id = this.query.id;
			this.body = yield userService.delUser(currUser, id);
			this.status = 200;
			this.type = "json";
			yield next;
		},

		* getList(next) {
			var currUser = this.request.user;

			this.body = yield userService.getAll(currUser);
			this.status = 200;
			this.type = "json";
			yield next;
		}
	};
}