import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;

export class User {
	constructor(id, email, nickName, password, brief, userType) {
		if (id)
			this._id = String(id);
		this.email = email;
		this.nickName = nickName;
		this.password = password;
		this.brief = brief;
		this.userType = userType;
	}

	static fromMongo(doc) {
		var user = new User(doc._id, doc.email, doc.nickName, doc.password, doc.brief, doc.userType);
		user.lastModified = doc.lastModified;
		return user;
	}

	toMongo() {
		var user = {};
		user.email = this.email;
		user.nickName = this.nickName;
		user.password = this.password;
		user.brief = this.brief;
		user.lastModified = new Date().getTime();
		user.userType = this.userType;
		return user;
	}

	toClient() {
		var user = {};
		user._id = this._id;
		user.email = this.email;
		user.nickName = this.nickName;
		// user.password = this.password;
		user.brief = this.brief;
		user.userType = this.userType;
		user.lastModified = this.lastModified;
		return user;
	}
}

export class UserDAO {
	static * init(mongo, log) {
		this._log = log;
		if (!this._users) {
			this._users = mongo.collection("users");
			yield this._users.$ensureIndex({'email': 1});
			this._log = log;
			this._log.info("users index ensured!");
		}
	}

	static * insert(user) {
		var result = yield this._users.$insert(user.toMongo());
		return result[0]._id;
	}

	static * del(id) {
		var result = yield this._users.$remove({'_id': ObjectID(String(id))});
		if (result && result.length && result[1].ok)
			return true;
		return result;
	}

	static * updateProperty(id, property) {
		var update = {};
		if (property.nickName) update.nickName = property.nickName;
		if (property.password) update.password = property.password;
		if (property.brief) update.brief = property.brief;
		if (property.userType) update.userType = property.userType;

		update.lastModified = new Date().getTime();
		var result = yield this._users.$update({'_id': ObjectID(String(id))}, {$set: update});
		if (result && result.length && result[1].ok)
			return true;
		return result;
	}

	static * get(id) {
		var primaryKey;
		try {
			primaryKey = ObjectID(String(id));
		} catch (err) {
			throw {status: 501, message: "id error!!! wrong id is " + id};
		}
		var doc = yield this._users.$findOne({'_id': primaryKey});
		if (!doc)
			throw { status: 501, message: "cannot find user"};
		var user = User.fromMongo(doc);
		return user;
	}

	static * getByEmail(email) {
		var doc = yield this._users.$findOne({'email': email});
		if (!doc)
			return null;
		var user = User.fromMongo(doc);
		return user;
	}

	static * getList() {
		var docs = yield this._users.find({}, {sort: {'_id': -1}}).$toArray();
		var result = [];
		for (var doc of docs) {
			result.push(User.fromMongo(doc));
		}
		return result;
	}
}