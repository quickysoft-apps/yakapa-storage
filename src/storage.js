import * as Common from 'yakapa-common'
import * as path from 'path'
import * as fs from 'fs'
import perfy from 'perfy'
import dataForge from 'data-forge'
import equals from 'is-equal-shallow'
import { lock } from 'ki1r0y.lock'

export default class Storage {

  constructor(tag, extractor, value, timestamp, maxDays, maxCount) {

    const rootpath = path.join(__dirname, '..', '..', 'storage', tag);
    if (!fs.existsSync(rootpath)) {
      fs.mkdirSync(rootpath)
    }
    this._fullpath = path.join(rootpath, `${extractor}.json`)
    
    this._newData = new dataForge.DataFrame([{ timestamp: timestamp.slice(0, 19) + '.000Z', value }])
    this._currentData = this.read(maxDays, maxCount)
    this._lastData = this._currentData ? this._currentData.tail(1) : null
  }

  store(onStored, onError) {
    
    const distinct = this._lastData ? this._lastData.except(this._newData, (a, b) => { return equals(a.value, b.value) }) : this._newData    
    if (distinct.count() === 0) {
      Common.logger.info('Pas de nouvelles valeurs')
      return
    }
    
    lock(this._filename, (unlock) => {
      try {        
        this.write()
        if (onStored) {
          onStored()
        }
      } catch (error) {
        Common.logger.error(error)
        if (onError) {
          onError()
        }
      } finally {
        unlock()
      }
    });
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
    Common.logger.info('Read file in', perfy.end('read').time, 's')    
    return new dataForge.DataFrame(data)
  }

  areValuesEqual(data1, data2) {
    return false
  }

  write() {    
    let storingData
    if (this._currentData) {
      storingData = this._currentData.concat(this._newData)
    } else {
      storingData = this._newData
    }    
    perfy.start('writeFile')
    storingData.asJSON().writeFileSync(this._fullpath);
    Common.logger.info(`${path.basename(this._fullpath)} written in`, perfy.end('writeFile').time, 's')    
  }

}