import _ from 'lodash'
import debug from '@watchmen/debug'
import {parseBoolean, pretty} from '@watchmen/helpr'
import {getModifiedLocations, getObjectFromLocation, invoke} from '../src/util.js'

const dbg = debug(import.meta.url)

export class Source {
  #args
  #config

  static async create({location, modifiers = [], headers, mustExist, isModule}) {
    let config
    if (isModule) {
      dbg('create: module type source, location=%s', location)
      config = await invoke({module: location, args: {modifiers}})
    } else {
      const locations = getModifiedLocations({location, modifiers})
      let _mustExist
      if (mustExist !== undefined) {
        _mustExist = parseBoolean(mustExist)
        dbg('create: must-exist=%s, parsed to boolean=%o', mustExist, _mustExist)
      }

      config = await _.reduce(
        locations,
        async (memo, location) => {
          memo = await memo
          _mustExist = mustExist === undefined ? _.isEmpty(memo) : _mustExist
          const o = await getObjectFromLocation({location, headers, mustExist: _mustExist})
          dbg('create: reduce: location=%s, config=%o', location, o)

          return _.merge(memo, o)
        },
        {},
      )
    }

    dbg('create: location=%o, config=%o', location, config)
    return new Source({args: arguments[0], config})
  }

  constructor({args, config}) {
    this.#args = args
    this.#config = config
  }

  get config() {
    return this.#config
  }

  get args() {
    return this.#args
  }

  get location() {
    return this.#args.location
  }

  toString() {
    return pretty(this.args)
  }
}
