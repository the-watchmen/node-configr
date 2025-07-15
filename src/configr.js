import _ from 'lodash'
import debug from '@watchmen/debug'
import config from 'config'
import {Source} from './source.js'
import {getEnv} from './util.js'

const dbg = debug(import.meta.url)

export class Configr {
  #sources
  #config

  static async create({sources = [], isEnvAugment = true}) {
    sources = await Promise.all(
      _.map(sources, (source) => {
        return Source.create(_.isString(source) ? {source} : source)
      }),
    )
    return new Configr({sources, isEnvAugment})
  }

  constructor({sources, isEnvAugment}) {
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

    if (isEnvAugment) {
      this.#config = _.merge(this.#config, getEnv())
    }
  }

  get config() {
    return this.#config
  }

  get sources() {
    return this.#sources
  }
}
