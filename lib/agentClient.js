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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SOCKET_SERVER_URL = 'https://mprj.cloudapp.net';
var DEFAULT_NICKNAME = 'Storage';

var EVENT_PREFIX = 'yakapa';
var AGENT_TAG = 'f1a33ec7-b0a5-4b65-be40-d2a93fd5b133';
var RESULT = EVENT_PREFIX + '/result';
var AUTHENTICATED = EVENT_PREFIX + '/authenticated';

var AgentClientEmitter = function (_EventEmitter) {
  _inherits(AgentClientEmitter, _EventEmitter);

  function AgentClientEmitter() {
    _classCallCheck(this, AgentClientEmitter);

    return _possibleConstructorReturn(this, (AgentClientEmitter.__proto__ || Object.getPrototypeOf(AgentClientEmitter)).apply(this, arguments));
  }

  _createClass(AgentClientEmitter, [{
    key: 'doConnected',
    value: function doConnected() {
      this.emit('connected');
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
      _this2._emitter.emit('pong', ms);
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

    this._socket.on(AUTHENTICATED, function (socketMessage) {
      _this2.authenticated(socketMessage);
    });

    this._socket.on(RESULT, function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(socketMessage) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _this2.store(socketMessage);

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this2);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());
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
      this._emitter.doConnected();
    }
  }, {
    key: 'socketError',
    value: function socketError(error) {
      console.error(_common2.default.now(), 'Socket error', error);
      this._emitter.emit('socketError', error);
    }
  }, {
    key: 'connectionError',
    value: function connectionError(error) {
      console.info(_common2.default.now(), 'Erreur connexion', error);
      this._emitter.emit('connectionError', error);
    }
  }, {
    key: 'authenticated',
    value: function authenticated(socketMessage) {
      console.info(_common2.default.now(), 'Bienvenue', socketMessage.nickname);
      this._isAuthenticated = true;
      this._nickname = socketMessage.nickname;
      this._emitter.emit('authenticated', socketMessage);
    }
  }, {
    key: 'store',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(socketMessage) {
        var _this3 = this;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', new Promise(function (resolve, reject) {
                  if (!_this3.check(socketMessage)) reject();
                  var decompressed = LZString.decompressFromUTF16(socketMessage.message);
                  console.info('Message ' + decompressed);
                  //const emitter = socketMessage.From;
                  //this.emit(SocketEvent.CHAT_MESSAGE, Faker.lorem.sentence(15), emitter);
                  _this3._emitter.emit('store', socketMessage);
                  resolve();
                }));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function store(_x3) {
        return _ref2.apply(this, arguments);
      }

      return store;
    }()
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