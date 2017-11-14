import Agent from 'yakapa-agent-client'
import * as Common from 'yakapa-common'

import * as path from 'path'
import * as fs from 'fs'
import perfy from 'perfy'
import { lock } from 'ki1r0y.lock'
import dataForge from 'data-forge'
import * as LZString from 'lz-string'

const EVENT_PREFIX = 'yakapa'
const STORED = `${EVENT_PREFIX}/stored`
const STORE = `${EVENT_PREFIX}/store`

const agent = new Agent({
	port: 3001,
	server: 'https://mprj.cloudapp.net',
	tag: 'f1a33ec7-b0a5-4b65-be40-d2a93fd5b133',
	nickname: 'Storage'
})

agent.client.emitter.on('connected', () => {
	Common.logger.info('Storage connecté avec le tag', agent.client.tag)
})

agent.client.emitter.on(STORE, (socketMessage) => {

	const message = socketMessage.message
	const from = socketMessage.from
	const date = socketMessage.date
	const decompressed = LZString.decompressFromUTF16(message)

	Common.logger.info('Storing result from', from)
	const jsonMessage = JSON.parse(decompressed)
	const rootPath = path.join(__dirname, '..', '..', 'storage', from);
	if (!fs.existsSync(rootPath)) {
		fs.mkdirSync(rootPath)
	}
	const filename = path.join(rootPath, `${jsonMessage.extractor}.json`)
	lock(filename, function(unlock) {
		try {
			const {
				result
			} = jsonMessage
			const newData = [{
				timestamp: date.slice(0, 19) + '.000Z',
				result
			}]
			const incomingDataFrame = new dataForge.DataFrame(newData)

			if (fs.existsSync(filename)) {
				const count = 10000 //related to extractor
				const days = 3 //related to extractor
				const last = new Date(new Date().getTime() - (days * 24 * 60 * 60 * 1000));
				perfy.start('processFile')
				const existingData = new dataForge.readFileSync(filename)
					.parseJSON()
					.where(x => x.timestamp > last.toJSON())
					.tail(count - 1)
					.toArray()
				Common.logger.info('Storage processed file in', perfy.end('processFile').time, 's')
				const existingDataFrame = new dataForge.DataFrame(existingData)
				const storingDataFrame = existingDataFrame.concat(incomingDataFrame)
				perfy.start('writeFile')
				storingDataFrame.asJSON().writeFileSync(filename);
				Common.logger.info('Storage wrote file in', perfy.end('writeFile').time, 's')
			} else {
				incomingDataFrame.asJSON().writeFileSync(filename);
			}

			Common.logger.info('Result storage done for', from)
			const stored = {
				from,
				extractor: jsonMessage.extractor
			}
			agent.client.emit(STORED, JSON.stringify(stored))
		} catch (error) {
			Common.logger.warn('Result storage failed for', from, error)
		} finally {
			unlock()
		}
	});
})