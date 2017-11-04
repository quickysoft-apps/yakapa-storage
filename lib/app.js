'use strict';

var _server = require('./server');

var _server2 = _interopRequireDefault(_server);

var _agentClient = require('./agentClient');

var _agentClient2 = _interopRequireDefault(_agentClient);

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var server = new _server2.default(true);
var agentClient = new _agentClient2.default();

server.listen();

agentClient.emitter.on('connected', function () {
	console.info(_common2.default.now(), 'Storage connecté avec le tag', agentClient.tag);
});
//# sourceMappingURL=app.js.map