import _ from 'lodash'
import config from 'config'
import {Source} from './source.js'

export class Configr {
  #sources
  #config

  static async create({sources = []}) {
    sources = Promise.all(
      _.map(sources, (source) => {
        return Source.create(_.isString(source) ? {source} : source)
      }),
    )
    return new Configr({sources})
  }

  constructor({sources}) {
    this.#sources = sources
    this.#config = _.reduce(
      this.#sources,
      (source, memo) => {
        return _.merge(memo, source.config)
      },
      config,
    )
  }

  get config() {
    return this.#config
  }

  get sources() {
    return this.#sources
  }
}
