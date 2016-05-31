export default function(servertoken) {
	return function * token(next) {
		if (this.request.method == 'OPTIONS')
			return yield next;
		var token = this.request.body.token;
		if (!token && (this.request.method == 'GET' || this.request.method == 'DELETE')) {
			token = this.query.token;
		}
		if (token == servertoken) {
			yield next;
		} else {
			this.status = 504;
			this.body = "请确认token是否正确";
		}
	}
}