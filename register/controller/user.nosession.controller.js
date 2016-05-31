import {User} from "../model/user.model";

export function UserController(userService) {
	return {
		* signin(next) {
			var email = this.query.email;
			var password = this.query.password;

			this.body = yield userService.signin(email, password);
			this.status = 200;
			this.type = "json";
			yield next;
		}
	};
}