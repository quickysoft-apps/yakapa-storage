'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('babel-polyfill');

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _lzString = require('lz-string');

var LZString = _interopRequireWildcard(_lzString);

var _events = require('events');

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SOCKET_SERVER_URL = 'https://mprj.cloudapp.net';
var DEFAULT_NICKNAME = 'Storage';

var AGENT_TAG = 'f1a33ec7-b0a5-4b65-be40-d2a93fd5b133';
var EVENT_PREFIX = 'yakapa';
var RESULT = EVENT_PREFIX + '/result';

var AgentClientEmitter = function (_EventEmitter) {
  _inherits(AgentClientEmitter, _EventEmitter);

  function AgentClientEmitter() {
    _classCallCheck(this, AgentClientEmitter);

    return _possibleConstructorReturn(this, (AgentClientEmitter.__proto__ || Object.getPrototypeOf(AgentClientEmitter)).apply(this, arguments));
  }

  _createClass(AgentClientEmitter, [{
    key: 'connected',
    value: function connected() {
      this.emit('connected');
    }
  }, {
    key: 'socketError',
    value: function socketError(error) {
      this.emit('socketError', error);
    }
  }, {
    key: 'connectionError',
    value: function connectionError(error) {
      this.emit('connectionError', error);
    }
  }, {
    key: 'pong',
    value: function pong(ms) {
      this.emit('pong', ms);
    }
  }, {
    key: 'result',
    value: function result(message, from, date) {
      this.emit('result', message, from, date);
    }
  }]);

  return AgentClientEmitter;
}(_events.EventEmitter);

var AgentClient = function () {
  function AgentClient() {
    var _this2 = this;

    _classCallCheck(this, AgentClient);

    this._emitter = new AgentClientEmitter();
    this._isAuthenticated = false;
    this._tag = AGENT_TAG;

    this._socket = (0, _socket2.default)(SOCKET_SERVER_URL, {
      rejectUnauthorized: false,
      query: 'tag=' + this._tag
    });

    this._socket.on('pong', function (ms) {
      _this2._emitter.pong(ms);
    });

    this._socket.on('connect', function () {
      _this2.connected();
    });

    this._socket.on('connect_error', function (error) {
      _this2.connectionError(error);
    });

    this._socket.on('error', function (error) {
      _this2.socketError(error);
    });

    this._socket.on(RESULT, function (socketMessage) {
      _this2.result(socketMessage);
    });
  }

  _createClass(AgentClient, [{
    key: 'getJson',
    value: function getJson(json) {
      return (typeof json === 'undefined' ? 'undefined' : _typeof(json)) === 'object' ? json : JSON.parse(json);
    }
  }, {
    key: 'check',
    value: function check(socketMessage) {

      if (this._isAuthenticated === false) {
        console.warn(_common2.default.now() + ' Pas authentifi\xE9');
        return false;
      }

      if (socketMessage == null) {
        console.warn(_common2.default.now() + ' Pas de message \xE0 traiter');
        return false;
      }

      if (socketMessage.from == null) {
        console.warn(_common2.default.now() + ' Exp\xE9diteur non d\xE9fini\'');
        return false;
      }

      console.info(socketMessage);
      return true;
    }
  }, {
    key: 'emit',
    value: function emit() {
      var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : RESULT;
      var payload = arguments[1];
      var to = arguments[2];

      var compressed = payload != null ? LZString.compressToUTF16(payload) : null;
      var socketMessage = {
        from: this._tag,
        nickname: DEFAULT_NICKNAME + ' ' + this._tag,
        to: to,
        message: compressed
      };

      this._socket.emit(event, socketMessage);
    }
  }, {
    key: 'connected',
    value: function connected() {
      console.info(_common2.default.now(), 'Connecté à', SOCKET_SERVER_URL);
      this._isAuthenticated = true;
      this._emitter.connected();
    }
  }, {
    key: 'socketError',
    value: function socketError(error) {
      console.error(_common2.default.now(), 'Socket error', error);
      this._emitter.socketError(error);
    }
  }, {
    key: 'connectionError',
    value: function connectionError(error) {
      console.info(_common2.default.now(), 'Erreur connexion', error);
      this._emitter.connectionError(error);
    }
  }, {
    key: 'result',
    value: function result(socketMessage) {
      if (!this.check(socketMessage)) {
        return;
      }
      var decompressed = LZString.decompressFromUTF16(socketMessage.message);
      console.info('Message ' + decompressed);
      this._emitter.result(decompressed, socketMessage.from, socketMessage.date);
    }
  }, {
    key: 'tag',
    get: function get() {
      return this._tag;
    }
  }, {
    key: 'emitter',
    get: function get() {
      return this._emitter;
    }
  }]);

  return AgentClient;
}();

exports.default = AgentClient;
//# sourceMappingURL=agentClient.js.map