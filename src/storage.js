import * as Common from 'yakapa-common'
import * as path from 'path'
import * as fs from 'fs'
import perfy from 'perfy'
import {
  InfluxDB
} from 'influx'
import equals from 'is-equal-shallow'

export default class Storage {

  constructor(tag, job, value, timestamp, retention) {
    this._influx = new InfluxDB('http://localhost:8086/yakapa')
    this._tag = tag    
    this._job = job
    this._value = value
    this._timestamp = timestamp
    this._retention = retention
  }

  store(onStored, onError) {
    try {
      perfy.start('store')

      let points = []
      if (Array.isArray(this._value)) {
        points = this._value.map((x, y) => {                     
          return {            
            tags: { agent: this._tag, rank: y },
            fields: x,
            timestamp: this._timestamp
          }
        })        
      } else {
        points = [{          
          tags: { agent: this._tag },
          fields: this._value,
          timestamp: this._timestamp
        }]
      }
      
      this._influx.writeMeasurement(this._job, points, { retentionPolicy: 'threedays'/*, precision: 'ms' */ }).then(() => {
        if (onStored) {
          onStored()
        }
        Common.Logger.info(`${this._job} stored in`, perfy.end('store').time, 's')
      })
      
    } catch (error) {
      Common.Logger.error(error)
      if (onError) {
        onError()
      }
    }
  }

}