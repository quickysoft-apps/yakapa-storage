'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('request');

var DEFAULT_PUBLIC_PORT = 80;
var DEFAULT_PRIVATE_PORT = 3001;
var DEFAULT_PUBLIC_SSL_PORT = 444;
var DEFAULT_PRIVATE_SSL_PORT = 3444;
var DEFAULT_HOST = 'http://mprj.cloudapp.net';
var DEFAULT_SSL_HOST = 'https://mprj.cloudapp.net';

var Server = function () {
  function Server() {
    var secure = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    _classCallCheck(this, Server);

    this._secure = secure;

    var sslOptions = {
      key: _fs2.default.readFileSync('/home/azemour/yakapa/yakapa-storage/yakapass.pem'),
      cert: _fs2.default.readFileSync('/home/azemour/yakapa/yakapa-storage/yakapass.crt')
    };

    this.publicPort = secure ? DEFAULT_PUBLIC_SSL_PORT : DEFAULT_PUBLIC_PORT;
    this.privatePort = secure ? DEFAULT_PRIVATE_SSL_PORT : DEFAULT_PRIVATE_PORT;
    this.expressApp = (0, _express2.default)();
    this.webServer = secure ? _https2.default.Server(sslOptions, this.expressApp) : _http2.default.Server(this.expressApp);
    this.expressApp.use(_express2.default.static(_path2.default.resolve(__dirname, '..', 'static')));
    this.expressApp.get('*', function (req, res) {
      res.sendFile(_path2.default.resolve(__dirname, '..', 'static', 'index.html'));
    });
  }

  _createClass(Server, [{
    key: 'listen',
    value: function listen() {
      var _this = this;

      this.webServer.listen(this.privatePort, function () {
        console.info(_common2.default.now(), 'Listening on *:' + _this.publicPort + ' --> *:' + _this.privatePort);
      });
    }
  }, {
    key: 'toJson',
    value: function toJson(json) {
      return (typeof json === 'undefined' ? 'undefined' : _typeof(json)) === 'object' ? json : JSON.parse(json);
    }
  }]);

  return Server;
}();

exports.default = Server;
//# sourceMappingURL=server.js.map