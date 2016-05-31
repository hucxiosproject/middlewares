export class RandomUtil {
  /**
   * 获得一个在Max和Min之间的随机数
   * @param Min
   * @param MAX
   * @returns {*}
   */
  static getRandomNumber(Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
  }
}