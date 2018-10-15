String.prototype.replaceAll = function (replaceStr, targetStr) {
  var val = this.toString()
  while (val.indexOf(replaceStr) > -1) {
    val = val.replace(replaceStr, targetStr)
  }
  return val
}