import * as Common from 'yakapa-common'
import * as path from 'path'
import * as fs from 'fs'
import perfy from 'perfy'
import { InfluxDB } from 'influx'
import equals from 'is-equal-shallow'

export default class Storage {

  constructor(tag, job, value, timestamp, retention) {
    this._influx = new InfluxDB('http://localhost:8086/yakapa')
    this._tags = { agent: tag }
    this._measurement = job
    this._fields = value
    this._timestamp = timestamp
    this._retention = retention
  }   

  store(onStored, onError) {        
    try {        
      perfy.start('store')
      this._influx.writeMeasurement(this._measurement, [{
        tags: this._tags,
        fields: this._fields,
        timestamp: this._timestamp
      }]).then(() => {
        if (onStored) {
          onStored()
        }
        Common.Logger.info(`${this._measurement} stored in`, perfy.end('store').time, 's')    
      })      
    } catch (error) {
      Common.Logger.error(error)
      if (onError) {
        onError()
      }
    }    
  }  

}