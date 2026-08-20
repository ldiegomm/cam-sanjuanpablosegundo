module.exports = new Proxy(
  {},
  {
    get: function (target, name) {
      if (name === '__esModule') {
        return false;
      }
      return name;
    },
  }
);
