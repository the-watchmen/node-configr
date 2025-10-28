import assert from 'node:assert'
import _ from 'lodash'
import config from 'config'
import debug from '@watchmen/debug'
import {parseBoolean, pretty} from '@watchmen/helpr'
import {
  getModifiedLocations,
  invoke,
  getHttpData,
  getFileData,
  getExtFromLocation,
  getObjectFromData,
} from '../src/util.js'
import {getPrefixEnv, getEnv} from '../src/env.js'

const dbg = debug(import.meta.url)
export {ConfigSource, HttpSource, FileSource, ModuleSource, EnvSource, JsonSource}

class Source {
  #args

  constructor(args) {
    assert.ok(args.location)
    this.#args = args
  }

  get config() {
    return this.args?.config
  }

  get location() {
    return this.args?.location
  }

  get name() {
    return this.args?.name ?? this.location
  }

  get args() {
    return this.#args
  }

  get props() {
    return {this: this.constructor.name, args: this.args}
  }
}

// just base config from https://github.com/node-config/node-config
//
class ConfigSource extends Source {
  static create() {
    return new ConfigSource({location: 'config', config: config.util.toObject(config)})
  }
}

class HttpSource extends Source {
  static async create(args = {}) {
    const {location, headers, modifiers = [], mustExist} = args
    const config = await getModifiedConfig({
      location,
      modifiers,
      mustExist,
      getData({location, mustExist}) {
        return getHttpData({url: location, headers, mustExist})
      },
    })

    return new HttpSource({...args, config})
  }
}

class FileSource extends Source {
  static async create(args = {}) {
    const {location, mustExist, modifiers = []} = args
    const config = await getModifiedConfig({
      location,
      modifiers,
      mustExist,
      getData({location, mustExist}) {
        return getFileData({path: location, mustExist})
      },
    })

    return new FileSource({...args, config})
  }
}

class ModuleSource extends Source {
  static async create(args = {}) {
    const {location} = args
    const config = await invoke({module: location, args})
    return new ModuleSource({...args, config})
  }
}

class EnvSource extends Source {
  static create(args = {}) {
    const {location = 'configr_'} = args
    const config = getPrefixEnv({prefix: location})
    return new EnvSource({...args, location, config})
  }
}

class JsonSource extends Source {
  static create(args = {}) {
    const {location = 'CONFIGR_CONFIG_JSON'} = args
    const config = JSON.parse(getEnv({name: location, dflt: '{}'}))
    if (!_.isEmpty(config)) {
      dbg('json-create: obtained config=%s from %s', pretty(config), location)
    }

    return new JsonSource({...args, location, config})
  }
}

async function getModifiedConfig({location, modifiers, mustExist, getData}) {
  const locations = getModifiedLocations({location, modifiers})
  let _mustExist
  if (mustExist !== undefined) {
    _mustExist = parseBoolean(mustExist)
    dbg('create: must-exist=%s, parsed to boolean=%o', mustExist, _mustExist)
  }

  return _.reduce(
    locations,
    async (memo, location) => {
      memo = await memo
      _mustExist = mustExist === undefined ? _.isEmpty(memo) : _mustExist
      const data = await getData({location, mustExist: _mustExist})
      if (data) {
        const ext = getExtFromLocation({location})
        const o = getObjectFromData({data, type: ext})
        dbg('get-modified-config: reduce: location=%s, config=%o', location, o)

        return _.merge(memo, o)
      }

      dbg('no data obtained from location=%o', location)
      return memo
    },
    {},
  )
}
