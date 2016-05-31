import serve from "koa-static";

export default function(path,options) {
  return serve(path,options);
}
