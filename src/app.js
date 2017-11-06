import Server from './server'
import AgentClient from './agentClient'
import Common from './common'

import * as path from 'path'
import * as fs from 'fs'
import { lock } from 'ki1r0y.lock'
import dataForge from 'data-forge'

const server = new Server(true)
const agentClient = new AgentClient()

server.listen()

agentClient.emitter.on('connected', () => {
	console.info(Common.now(), 'Storage connecté avec le tag', agentClient.tag)
})

agentClient.emitter.on('result', (message, from, date) => {
	console.info(Common.now(), 'Storing result', message, 'from', from)
	const jsonMessage = JSON.parse(message)
	const rootPath = path.join(__dirname, '..', '..', 'storage', from);
	if (!fs.existsSync(rootPath)) {
		fs.mkdirSync(rootPath)
	}
	const filename = path.join(rootPath, `${jsonMessage.extractor}.json`)
	lock(filename, function(unlock) {		
		try {
			const { extractor, result } = jsonMessage			
			const newData = [
				{				
					timestamp: date.slice(0,19)+'.000Z',
					result
				}
			]
			const incomingDataFrame = new dataForge.DataFrame(newData)
						
			if (fs.existsSync(filename)) {
				const count = 10000
				const days = 3				
				const last = new Date(new Date().getTime() - (days * 24 * 60 * 60 * 1000));				
				const existingData = new dataForge.readFileSync(filename)
					.parseJSON()
					.parseDates("timestamp")
					.setIndex("timestamp")
					.orderBy(row => row.timestamp)
					.startAt(last)
					.tail(count - 1)
					.toArray()
				const existingDataFrame = new dataForge.DataFrame(existingData)
				const storingDataFrame = existingDataFrame.concat(incomingDataFrame)
				storingDataFrame.asJSON().writeFileSync(filename);
			} else {
				incomingDataFrame.asJSON().writeFileSync(filename);
			}
			
			console.info(Common.now(), 'Result storage done for', from)
		} 
		catch(error) {			
			console.warn(Common.now(), 'Result storage failed for', from, error)
		}
		finally {
			unlock()
		}
	});
})