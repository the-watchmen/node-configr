import _ from 'lodash'
import debug from '@watchmen/debug'
import config from 'config'
import {Source} from './source.js'
import {getEnv} from './util.js'

const dbg = debug(import.meta.url)

export class Configr {
  #sources
  #config

  static async create({sources = []} = {}) {
    const _sources = JSON.parse(process.env.CONFIGR_SOURCES_JSON || '[]')
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

    const _config = JSON.parse(process.env.CONFIGR_CONFIG_JSON || '{}')
    if (!_.isEmpty(_config)) {
      dbg('ctor: obtained config=%o from configr-config-json', _config)
    }

    this.#config = _.merge(this.#config, {..._config, ...getEnv()})
  }

  get config() {
    return this.#config
  }

  get sources() {
    return this.#sources
  }
}
