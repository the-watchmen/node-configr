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
        return Source.create(_.isString(source) ? {source} : source)
      }),
    )
    return new Configr({sources})
  }

  constructor({sources}) {
    this.#sources = sources
    this.#config = _.reduce(
      this.#sources,
      (memo, source) => {
        dbg('ctor: reduce: source=%o, memo=%o', source.source, memo)
        _.merge(memo, source.config)
        return memo
      },
      config.util.toObject(config),
    )

    const _config = JSON.parse(getEnv({name: 'CONFIGR_CONFIG_JSON', dflt: '{}'}))
    if (!_.isEmpty(_config)) {
      dbg('ctor: obtained config=%o from configr-config-json', _config)
    }

    this.#config = _.merge(this.#config, {..._config, ...getPrefixEnv()})
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

  async addSource(source) {
    const _source = await Source.create(source)
    this.#config = _.merge(this.config, _source.config)
    this.sources.push(_source)
  }
}
