import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;

export function UserController(userService) {
  return {

    * getSmsCode(next) {
      if(!this.params.phone){
        throw new Error("请填写完整信息：phone");
      }
      this.body = yield userService.getSmsCode(this.params.phone);
      this.type = "json";
      this.status = 200;

      yield next;
    },

    * signUp(next) {
      if(!this.request.body.phone || !this.request.body.smsCode || !this.request.body.password){
        throw new Error("请填写完整信息：phone smsCode password");
      }
      var addUser = {
        phone: this.request.body.phone,
        smsCode: this.request.body.smsCode,
        password: this.request.body.password
      };
      this.body = yield userService.signUp(addUser);
      this.type = "json";
      this.status = 200;

      yield next;
    },

    * resetPassword(next) {
      if(!this.request.body.phone || !this.request.body.smsCode || !this.request.body.password){
        throw new Error("请填写完整信息：phone smsCode password");
      }
      var addUser = { 
        phone: this.request.body.phone, 
        smsCode: this.request.body.smsCode, 
        password: this.request.body.password };
      this.body = yield userService.resetPassword(addUser);
      this.type = "json";
      this.status = 200;

      yield next;
    },

    * signIn(next) {
      if(!this.request.body.phone || !this.request.body.password){
        throw new Error("请填写完整信息：phone password");
      }
      var addUser = { 
        phone: this.request.body.phone,
        password: this.request.body.password };
      this.body = yield userService.signIn(addUser);
      this.type = "json";
      this.status = 200;

      yield next;
    },
  };
}