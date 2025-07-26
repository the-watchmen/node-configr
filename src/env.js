import _ from 'lodash'
import debug from '@watchmen/debug'
import {parseBoolean} from '@watchmen/helpr'

export {getEnv, getEnvAsBoolean, getEnvAsArray, getEnvAsNumber, getPrefixEnv}

const dbg = debug(import.meta.url)

function getEnv({name, dflt = undefined}) {
  const value = process.env[name]

  if (value) {
    dbg('get-env: obtained value=%s from env-var=%s', value, name)
    return value
  }

  if (dflt !== undefined) {
    dbg('get-env: env-var=%s not set, using default=%s', name, dflt)
    return dflt
  }

  throw new Error(`environment-variable=${name} required`)
}

function getEnvAsBoolean({name, dflt}) {
  const value = getEnv({name, dflt})
  return parseBoolean(value)
}

function getEnvAsArray({name, dflt}) {
  const value = getEnv({name, dflt})
  if (Array.isArray(value)) {
    return value
  }

  return value.split(',').map((env) => env.trim())
}

function getEnvAsNumber({name, dflt}) {
  const value = getEnv({name, dflt})
  const _value = Number(value)
  if (Number.isNaN(_value)) {
    throw new TypeError(`value=${value} is NaN`)
  }

  return _value
}

function getPrefixEnv({prefix = 'configr_', separator = '_'} = {}) {
  return _.reduce(
    _.entries(process.env),
    (memo, [key, val]) => {
      if (key.startsWith(prefix)) {
        // dbg('get-env: env=%s', key)
        let _key = key.slice(prefix.length)
        const toks = _key.split(separator)
        _key = toks.join('.')
        dbg('get-env: found env=%s, setting _key=%s', key, _key)
        _.set(memo, _key, val)
      }

      return memo
    },
    {},
  )
}
