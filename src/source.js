import _ from 'lodash'
import debug from '@watchmen/debug'
import {parseBoolean, pretty} from '@watchmen/helpr'
import {getModifiedSources, getObjectFromSource, invoke} from '../src/util.js'

const dbg = debug(import.meta.url)

export class Source {
  #args
  #config

  static async create({source, modifiers = [], headers, mustExist, isModule}) {
    let config
    if (isModule) {
      dbg('create: module type source=%s', source)
      config = await invoke({module: source, args: {modifiers}})
    } else {
      const modified = getModifiedSources({source, modifiers})
      let _mustExist
      if (mustExist !== undefined) {
        _mustExist = parseBoolean(mustExist)
        dbg('create: must-exist=%s, parsed to boolean=%o', mustExist, _mustExist)
      }

      config = await _.reduce(
        modified,
        async (memo, source) => {
          memo = await memo
          _mustExist = mustExist === undefined ? _.isEmpty(memo) : _mustExist
          const o = await getObjectFromSource({source, headers, mustExist: _mustExist})
          dbg('create: reduce: source=%o, config=%o', source, o)

          return _.merge(memo, o)
        },
        {},
      )
    }

    dbg('create: source=%o, config=%o', source, config)
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

  toString() {
    return pretty(this.args)
  }
}
