'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _server = require('./server');

var _server2 = _interopRequireDefault(_server);

var _agentClient = require('./agentClient');

var _agentClient2 = _interopRequireDefault(_agentClient);

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _ki1r0y = require('ki1r0y.lock');

var _dataForge = require('data-forge');

var _dataForge2 = _interopRequireDefault(_dataForge);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var server = new _server2.default(true);
var agentClient = new _agentClient2.default();

server.listen();

agentClient.emitter.on('connected', function () {
	console.info(_common2.default.now(), 'Storage connecté avec le tag', agentClient.tag);
});

agentClient.emitter.on('result', function (message, from) {
	console.info(_common2.default.now(), 'Storing result', message, 'from', from);
	var filename = path.join(__dirname, '..', '..', 'storage', from + '.json');
	(0, _ki1r0y.lock)(filename, function (unlock) {
		try {
			var data = _extends({
				timestamp: new Date().toJSON(),
				source: from
			}, message);
			var existing = new _dataForge2.default.readFileSync(filename);
			var incoming = new _dataForge2.default.DataFrame(data).setIndex("timestamp").dropSeries("timestamp");
			console.log('incoming', incoming.asJSON());
			var dataFrame = undefined;
			if (existing) {
				console.log('existing', existing.parseJSON());
			}
			//dataFrame = existing ? existing.concat(incoming) : incoming			
			incoming.asJSON().writeFileSync(filename);
			console.info(_common2.default.now(), 'Storage done for', filename);
		} catch (error) {
			console.warn(_common2.default.now(), 'Storage failed for', filename, error);
		} finally {
			unlock();
		}
	});
});
//# sourceMappingURL=app.js.map