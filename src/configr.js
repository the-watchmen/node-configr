import _ from 'lodash'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import {ConfigSource} from './source.js'
import {getEnv} from './env.js'
import {invoke} from './util.js'

const dbg = debug(import.meta.url)

export class Configr {
  #sources
  #config

  static async create({sources = [ConfigSource.create()]} = {}) {
    dbg('create: sources=%o', sources)
    const module = getEnv({name: 'CONFIGR_SOURCES_IMPORT', dflt: null})
    if (module) {
      const imported = await invoke({module})
      dbg('create: imported sources=%o from module=%o', imported, module)
      sources = [...sources, ...imported]
    }

    return new Configr({sources})
  }

  constructor({sources}) {
    this.#sources = sources
    this.#config = this.#reduce()
  }

  #reduce() {
    const configs = _.map(this.sources, (source) => source.config)
    return _.reduce(
      configs,
      (memo, _config) => {
        _.merge(memo, _config)
        return memo
      },
      {},
    )
  }

  get config() {
    return this.#config
  }

  get sources() {
    return this.#sources
  }

  toString() {
    return pretty(
      _.map(this.sources, (val) => {
        return val.args
      }),
    )
  }

  getSource(name) {
    return _.find(this.sources, (source) => {
      return source.name === name
    })
  }

  addSource(source) {
    const _source = this.getSource(source.name)
    if (_source) {
      throw new Error(`source=${_source.toString()} already exists`)
    }

    this.#config = _.merge(this.config, source.config)
    this.sources.push(source)
  }

  async refreshSource(name) {
    const sources = this.sources
    const idx = _.findIndex(sources, (source) => {
      return source.name === name
    })
    if (idx === -1) {
      throw new Error(`unable to refresh source with name=${name}, does not exist`)
    } else {
      const source = sources[idx]
      const ctor = source.constructor
      dbg('refresh: located source=%s of type=%s, refreshing...', name, ctor.name)
      sources[idx] = await ctor.create(sources[idx].args)
      this.#config = this.#reduce()
    }
  }
}
