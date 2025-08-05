import _ from 'lodash'
import debug from '@watchmen/debug'
import config from 'config'
import {pretty} from '@watchmen/helpr'
import {Source} from './source.js'
import {getPrefixEnv, getEnv} from './env.js'
import {invoke} from './util.js'

const dbg = debug(import.meta.url)

export class Configr {
  #sources
  #config
  #jsonConfig
  #envConfig

  static async create({sources = []} = {}) {
    let _sources = JSON.parse(getEnv({name: 'CONFIGR_SOURCES_JSON', dflt: '[]'}))

    const _import = getEnv({name: 'CONFIGR_SOURCES_IMPORT', dflt: null})
    if (_import) {
      const imported = await invoke({module: _import})
      _sources = [..._sources, ...imported]
    }

    if (!_.isEmpty(_sources)) dbg('create: sources from env=%o', _sources)

    sources = await Promise.all(
      _.map([..._sources, ...sources], (source) => {
        return Source.create(_.isString(source) ? {location: source} : source)
      }),
    )
    return new Configr({sources})
  }

  constructor({sources}) {
    this.#sources = sources
    const jsonConfig = JSON.parse(getEnv({name: 'CONFIGR_CONFIG_JSON', dflt: '{}'}))
    if (!_.isEmpty(jsonConfig)) {
      dbg('ctor: obtained config=%o from configr-config-json', jsonConfig)
    }

    this.#jsonConfig = jsonConfig
    this.#envConfig = getPrefixEnv()
    this.#config = this.#reduce()
  }

  #reduce() {
    const configs = _.map(this.sources, (source) => source.config)
    configs.push(config.util.toObject(config), this.#jsonConfig, this.#envConfig)
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
      dbg('refresh: located source=%s, refreshing...', name)
      sources[idx] = await Source.create(sources[idx].args)
      this.#config = this.#reduce()
    }
  }
}
