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

agentClient.emitter.on('result', (message, from) => {
	console.info(Common.now(), 'Storing result', message, 'from', from)
	const filename = path.join(__dirname, '..', '..', 'storage', `${from}.json`)
	lock(filename, function(unlock) {		
		try {
			
			const result = JSON.parse(message)
			const newData = [
				{				
					timestamp: new Date().toJSON(),
					...result
				}
			]
			const incomingDataFrame = new dataForge.DataFrame(newData)			
						
			if (fs.existsSync(filename)) {
				const existingData = new dataForge.readFileSync(filename).parseJSON().toArray()
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