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

  getSource(location) {
    return _.find(this.sources, (source) => {
      return source.location === location
    })
  }

  async addSource(source) {
    let _source = this.getSource(source.location)
    if (_source) {
      throw new Error('source with location=%s already exists', _source.toString())
    }

    _source = await Source.create(source)
    this.#config = _.merge(this.config, _source.config)
    this.sources.push(_source)
  }

  async refreshSource(location) {
    const sources = this.sources
    const idx = _.findIndex(sources, (source) => {
      return source.location === location
    })
    if (idx === -1) {
      throw new Error(`unable to refresh source with location=${location}, does not exist`)
    } else {
      dbg('refresh: located source=%s, refreshing...', location)
      sources[idx] = await Source.create(sources[idx].args)
      this.#config = this.#reduce()
    }
  }
}
