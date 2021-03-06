/**
 * Extend target object with sources' own properties
 * @params {{}}target, {{}}source1, {{}}source2, ..., {{}}sourceN
 * @returns {*}
 */
function extend(target) {
  var sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (var prop in source) {
      if (source.hasOwnProperty(prop)) {
        target[prop] = source[prop];
      }
    }
  });
  return target;
}

exports.extend = extend;
