import _assert from 'node:assert'
import fs from 'node:fs'
import _ from 'lodash'
import config from 'config'
import {parse} from 'yaml'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'

export {getConfig, initConfig, configr}

const dbg = debug(import.meta.url)

const format = {
  yaml: 'yaml',
  yml: 'yml',
  json: 'json',
}

const configr = initConfig()

function initConfig() {
  let input = getConfig({path: 'configr.input', config})
  if (input) {
    let _format = getConfig({path: 'configr.format', config})
    const isFile = !_format
    if (isFile) {
      const file = input
      _format = file.split('.').at(-1)
      if (_format) {
        dbg('determined format=%s from file=%s', _format, file)
      } else {
        throw new Error(`unable to determine format from file=${file}`)
      }

      input = fs.readFileSync(input, 'utf8')
    }

    if ([format.yaml, format.yml].includes(_format)) {
      input = parse(input)
      dbg('read yaml\n:%s', pretty(input))
    } else if (_format === format.json) {
      input = JSON.parse(input)
      dbg('read json:\n%s', pretty(input))
    } else {
      // maybe support properties format as enhancement
      //
      throw new Error(`unsupported input format=${_format}`)
    }
  }

  const _config = input ? _.merge(config, input) : config

  dbg('prevailing config:\n%s', pretty(_config))

  return _config
}

function getConfig({path, dflt = null, config = configr} = {}) {
  if (path) {
    const toks = path.split('.')
    const env = _.snakeCase(toks.join('_')).toUpperCase()
    const _path = toks.join('.')
    dbg('env=%s, path=%s, dflt=%s', env, _path, dflt)
    return process.env[env] || _.get(config, _path) || dflt
  }

  return config
}

export class Configr {
  constructor({sources}) {
    for (const source of sources) {
      dbg('ctor: iterating source=%o', source)
    }
  }
}
