import _ from 'lodash'
import debug from '@watchmen/debug'
import {getModifiedSources, getObjectFromSource} from '../src/util.js'

const dbg = debug(import.meta.url)

export class Source {
  #source
  #modifiers
  #config

  static async create({source, modifiers = [], headers}) {
    const modified = getModifiedSources({source, modifiers})

    const config = await _.reduce(
      modified,
      async (memo, source) => {
        memo = await memo
        dbg('create: reduce: source=%o', source)
        const o = await getObjectFromSource({source, headers, mustExist: _.isEmpty(memo)})
        return _.merge(memo, o)
      },
      {},
    )
    dbg('config=%o', config)
    return new Source({source, modifiers, config})
  }

  constructor({source, modifiers, config}) {
    this.#source = source
    this.#modifiers = modifiers
    this.#config = config
  }

  get config() {
    return this.#config
  }

  get source() {
    return this.#source
  }

  get modifiers() {
    return this.#modifiers
  }
}
