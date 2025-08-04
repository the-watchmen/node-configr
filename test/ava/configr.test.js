import test from 'ava'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import _ from 'lodash'
import fs from 'fs-extra'
import config from 'config'
import {stringify} from 'yaml'
import {Configr, getConfig, getConfigValue} from '../../src/index.js'

const dbg = debug(import.meta.url)
const caller = import.meta.url

test('bare', async (t) => {
  const configr = await Configr.create()
  dbg('config=%s', pretty(configr.config))
  t.deepEqual(configr.config, {
    a: {
      b: {
        c: 123,
      },
    },
    isTrue: true,
  })

  dbg('to-string=%s', configr.toString())
})

test('basic', async (t) => {
  const sources = [
    {
      location:
        'https://raw.githubusercontent.com/the-watchmen/node-configr/main/test/ava/configr.https.yaml',
      token: 's3cret',
    },
    {location: 'test/ava/configr.yaml', modifiers: ['test']},
  ]
  const configr = await Configr.create({sources})
  dbg('config=%s', pretty(configr.config))
  t.deepEqual(configr.config, {
    a: {b: {c: 123}},
    isTrue: true,
    base: {foo: 'bar', https: true},
    extra: {aList: ['foo', 'bar'], aBoolean: true, anObject: {foo: 'foo', bar: 'bar'}, aNumber: 42},
  })
  dbg('to-string=%s', configr.toString())
})

test('env', async (t) => {
  process.env.CONFIGR_SOURCES_JSON = JSON.stringify([
    'https://raw.githubusercontent.com/the-watchmen/node-configr/main/test/ava/configr.https.yaml',
    {location: 'test/ava/configr.yaml', modifiers: ['test']},
  ])
  const configr = await Configr.create()
  dbg('config=%s', pretty(configr.config))
  t.deepEqual(configr.config, {
    a: {b: {c: 123}},
    isTrue: true,
    base: {foo: 'bar', https: true},
    extra: {aList: ['foo', 'bar'], aBoolean: true, anObject: {foo: 'foo', bar: 'bar'}, aNumber: 42},
  })
  delete process.env.CONFIGR_SOURCES_JSON
})

test('json', async (t) => {
  process.env.CONFIGR_CONFIG_JSON = JSON.stringify({foo: {bar: 'baz'}})
  const configr = await Configr.create()
  dbg('config=%s', pretty(configr.config))
  t.deepEqual(configr.config, {
    foo: {bar: 'baz'},
    a: {b: {c: 123}},
    isTrue: true,
  })
  delete process.env.CONFIGR_CONFIG_JSON
})

test('get', async (t) => {
  const config = await getConfig({caller})
  dbg('config=%s', pretty(config))
  t.deepEqual(config, {
    a: {
      b: {
        c: 123,
      },
    },
    isTrue: true,
  })
})
test('get-multi', async (t) => {
  await getConfig({caller})
  await getConfig({caller})
  await getConfig({caller})

  t.pass()
})

test('get-val-env', async (t) => {
  const val = await getConfigValue({path: 'home'})
  t.true(val.startsWith('/'))
})

test('get-val-config', async (t) => {
  const config = await getConfigValue({path: 'a.b.c'})
  t.is(config, 123)
})

test('get-val-dflt', async (t) => {
  let config = await getConfigValue({path: 'nope.nah.no'})
  t.is(config, undefined)
  config = await getConfigValue({path: 'nope.nah.no', dflt: 'yup'})
  t.is(config, 'yup')
})

test('push-env', async (t) => {
  const env = 'configr_a_b_c_d'
  const val = 'ack'
  process.env[env] = val
  const configr = await Configr.create()
  dbg('config=%s', pretty(configr.config))
  t.is(configr.config.a.b.c.d, val)
  delete process.env[env]
})

test('push-env-get', async (t) => {
  const env = 'configr_a_b_c_d'
  const val = 'ack'
  process.env[env] = val
  const config = await getConfig({caller, bustCache: true})
  dbg('config=%s', pretty(config))
  t.is(config.a.b.c.d, val)
  delete process.env[env]
})

test('get-import', async (t) => {
  process.env.CONFIGR_SOURCES_IMPORT = '../test/ava/_get-sources.js'
  const config = await getConfig({caller, bustCache: true})
  dbg('config=%s', pretty(config))
  t.deepEqual(config, {
    a: {
      b: {
        c: 123,
      },
    },
    isTrue: true,
    dynamic: 'yep',
  })

  delete process.env.CONFIGR_SOURCES_IMPORT
})

test('add', async (t) => {
  const configr = await Configr.create({
    sources: [{location: '../test/ava/_get-config-1.js', isModule: true}],
  })

  dbg('config=%s', pretty(configr.config))
  t.deepEqual(configr.config, {
    a: {
      b: {
        c: 123,
      },
    },
    isTrue: true,
    configKeyOne: 'configValOne',
  })

  await configr.addSource({location: '../test/ava/_get-config-2.js', isModule: true})

  dbg('config(post-add)=%s', pretty(configr.config))
  t.deepEqual(configr.config, {
    a: {
      b: {
        c: 123,
      },
    },
    isTrue: true,
    configKeyOne: 'configValOne',
    configKeyTwo: 'configValTwo',
  })
})

test('refresh', async (t) => {
  const root = '/tmp/configr'
  await fs.emptyDir(root)
  const first = `${root}/first.yaml`
  const second = `${root}/second.yaml`
  const third = `${root}/third.yaml`
  const dflt = config.util.toObject(config)
  const _first = {first: 'yep'}
  await fs.writeFile(first, stringify(_first))
  const _third = {third: 'yes'}
  await fs.writeFile(third, stringify(_third))

  const configr = await Configr.create({
    sources: [{location: first}, {location: second, mustExist: false}, {location: third}],
  })

  dbg('config=%s', pretty(configr.config))

  dbg('sources=%s', configr.toString())

  let expected = _.merge(_first, _third, dflt)
  t.deepEqual(configr.config, expected)

  const _second = {second: 'ya'}
  await fs.writeFile(second, stringify(_second))

  await configr.refreshSource(second)
  dbg('config-refreshed=%s', pretty(configr.config))
  expected = _.merge(expected, _second)
  t.deepEqual(configr.config, expected)
})
