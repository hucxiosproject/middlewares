import bunyan from "bunyan";

export default function(app, appName,hostname) {
  var log = bunyan.createLogger({name: appName,hostname:hostname});

  return function *(next) {
    log.warn("客户端请求,方法:     "+this.request.method+","+this.request.url+"        ");
    //log.warn("header " + JSON.stringify(this.request.header) );
    var permission = true;
    if(!this.request.header["user-agent"]){
      this.body = "not found";
      this.type = "text";
      this.status = 404;
      permission = true;
    }
    if(this.request.method == "GET" ){
      log.warn("===========query:===========");
      log.warn(this.request.query);
    }else if(this.request.method == "POST" || this.request.method == "PUT"){
      log.warn("===========body:===========");
      log.warn(this.request.body);
    }
    if(permission){
      yield next;
    }else{
      log.warn("forbidden");
    }

  }
}


