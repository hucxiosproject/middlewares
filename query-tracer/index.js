export default function() {
  return function * queryTracer(next) {
    let queryId = Date.now() + "-" + parseInt(Math.random() * 10000);
    this.request.queryId = queryId;
    yield next;
  }
}
