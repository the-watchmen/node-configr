import _assert from 'node:assert'
import fs from 'node:fs'
import _ from 'lodash'
import config from 'config'
import {parse} from 'yaml'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'

export {getConfig, initConfig}

const dbg = debug(import.meta.url)

const _config = initConfig()

function initConfig() {
  const yaml = process.env.CONFIGR_YAML
  if (yaml) {
    dbg('yaml=%o', yaml)
    const _yaml = fs.readFileSync(yaml, 'utf8')
    const __yaml = parse(_yaml)
    dbg('read yaml=%s', pretty(__yaml))
    return _.merge(config, __yaml)
  }

  return config
}

function getConfig({path, dflt = null} = {}) {
  if (path) {
    const toks = path.split('.')
    const env = _.snakeCase(toks.join('_')).toUpperCase()
    const _path = toks.join('.')
    dbg('env=%s, path=%s, dflt=%s', env, _path, dflt)
    return process.env[env] || _.get(_config, _path) || dflt
  }

  return _config
}
