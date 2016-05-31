export class StringUtil {
  
  static getLen(str) {
    if (!str) return 0;
    var len = 0;
    for (var i=0; i<str.length; i++) {
      var c = str.charCodeAt(i);
      if ((c >= 0x0001 && c <= 0x007e) || (0xff60<=c && c<=0xff9f)) {
        len ++;
      } else {
        len += 2;
      }
    }
    return len;
  }
}