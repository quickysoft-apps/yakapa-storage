import * as Common from 'yakapa-common'
import * as path from 'path'
import * as fs from 'fs'
import perfy from 'perfy'
import dataForge from 'data-forge'
import equals from 'is-equal-shallow'

export default class Storage {

  constructor(tag, job, value, timestamp, maxDays, maxCount) {

    const rootpath = path.join(__dirname, '..', '..', 'storage', tag);
    if (!fs.existsSync(rootpath)) {
      fs.mkdirSync(rootpath)
    }
    this._fullpath = path.join(rootpath, `${job}.json`)
    this._newData = new dataForge.DataFrame([{  timestamp: timestamp.slice(0, 19) + '.000Z', tag, job, ...value }])
    this._currentData = this.read(maxDays, maxCount)
    this._lastData = this._currentData ? new dataForge.DataFrame([this._currentData.last()]) : null
  }
  
  get fullpath() {
    return this._fullpath
  }

  store(onStored, onError) {
    
    let changed = true
    if (this._lastData) {         
      const a = this._lastData.dropSeries('timestamp').toArray()[0]
      const b = this._newData.dropSeries('timestamp').toArray()[0]          
      changed = !equals(a, b)
    }
    
    if (!changed) {
      Common.Logger.info('No new values to store')
      return
    }
    
    try {        
      this.write()
      if (onStored) {
        onStored()
      }
    } catch (error) {
      Common.Logger.error(error)
      if (onError) {
        onError()
      }
    }
    
  }

  read(maxDays, maxCount) {
    if (!fs.existsSync(this._fullpath)) {
      return null
    }
    const until = new Date(new Date().getTime() - (maxDays * 24 * 60 * 60 * 1000));
    perfy.start('read')
    const data = new dataForge.readFileSync(this._fullpath)
      .parseJSON()
      .where(x => x.timestamp > until.toJSON())
      .tail(maxCount - 1)
      .toArray()
    Common.Logger.info('Read', path.basename(this._fullpath), 'in', perfy.end('read').time, 's')    
    return new dataForge.DataFrame(data)
  }

  write() {    
    let storingData = this._newData.asJSON()
    if (this._currentData) {
      //storingData = this._currentData.concat(this._newData)
    }    
    perfy.start('writeFile')
    storingData.writeFileSync(this._fullpath);
    Common.Logger.info(`${path.basename(this._fullpath)} written in`, perfy.end('writeFile').time, 's')    
  }

}