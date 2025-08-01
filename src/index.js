import _ from 'lodash'
import debug from '@watchmen/debug'
import {Configr} from './configr.js'
import {getRelativeToCwd} from './util.js'

export {getConfig, getConfigr, getConfigValue}
export {Configr} from './configr.js'

const dbg = debug(import.meta.url)

let configr
let promise

async function getConfig({caller, bustCache} = {}) {
  const configr = await getConfigr({caller, bustCache})
  return configr.config
}

async function getConfigr({caller, bustCache} = {}) {
  let path
  if (caller) {
    path = getRelativeToCwd(caller)
  }

  if (configr && !bustCache) {
    if (path) dbg('cache-hit: caller=%s', path)
    return configr
  }

  if (promise && !bustCache) {
    if (path) dbg('promise: caller=%s', path)
    return promise
  }

  promise = (async () => {
    if (path) dbg('creating: caller=%s', path)
    if (bustCache) dbg('busting-cache per request')

    configr = await Configr.create()

    return configr
  })()

  return promise
}

async function getConfigValue({path, dflt, caller}) {
  const toks = path.split('.')
  const env = _.snakeCase(toks.join('_')).toUpperCase()
  let val
  val = process.env[env]
  if (val) {
    dbg('get-config-value: obtained value=%s from env=%s (path=%s)', val, env, path)
    return val
  }

  const config = await getConfig({caller})
  val = _.get(config, path)
  if (val) {
    dbg('get-config-value: no value at env=%s, obtained value=%s from config=%s', env, val, path)
    return val
  }

  dbg('get-config-value: no value at env=%s or config=%s, returning default=%s', env, path, dflt)
  return dflt
}
