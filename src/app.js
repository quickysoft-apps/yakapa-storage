import Agent from 'yakapa-agent-client'
import Common from './common'

import * as path from 'path'
import * as fs from 'fs'
import perfy from 'perfy'
import { lock } from 'ki1r0y.lock'
import dataForge from 'data-forge'
import * as LZString from 'lz-string'

const EVENT_PREFIX = 'yakapa'
const RESULT_STORED = `${EVENT_PREFIX}/resultStored`

const agent = new Agent({
	port: 3001,
	server: 'https://mprj.cloudapp.net',
	tag: 'f1a33ec7-b0a5-4b65-be40-d2a93fd5b133',
	nickname: 'Storage'
})

agent.client.emitter.on('connected', () => {
	console.info(Common.now(), 'Storage connecté avec le tag', agent.client.tag)
})

agent.client.emitter.on('yakapa/result', (socketMessage) => {

	const message = socketMessage.message
	const from = socketMessage.from
	const date = socketMessage.date
	const decompressed = LZString.decompressFromUTF16(message)

	console.info(Common.now(), 'Storing result', decompressed, 'from', from)
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
				perfy.start('process file')
				const existingData = new dataForge.readFileSync(filename)
					.parseJSON()
					.where(x => x.timestamp > last.toJSON())
					.tail(count - 1)
					.toArray()
				console.log(perfy.end('process file').summary)
				const existingDataFrame = new dataForge.DataFrame(existingData)
				const storingDataFrame = existingDataFrame.concat(incomingDataFrame)
				perfy.start('write file')
				storingDataFrame.asJSON().writeFileSync(filename);
				console.log(perfy.end('write file').summary)
			} else {
				incomingDataFrame.asJSON().writeFileSync(filename);
			}

			console.info(Common.now(), 'Result storage done for', from)
			const storedMessage = {
				from,
				extractor: jsonMessage.extractor
			}
			agent.client.emit(RESULT_STORED, JSON.stringify(storedMessage))
		} catch (error) {
			console.warn(Common.now(), 'Result storage failed for', from, error)
		} finally {
			unlock()
		}
	});
})