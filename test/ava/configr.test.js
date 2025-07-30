import test from 'ava'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import {Configr, getConfig, getConfigr, getConfigValue} from '../../src/index.js'

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
})

test('basic', async (t) => {
  const sources = [
    {
      source:
        'https://raw.githubusercontent.com/the-watchmen/node-configr/main/test/ava/configr.https.yaml',
      token: 's3cret',
    },
    {source: 'test/ava/configr.yaml', modifiers: ['test']},
  ]
  const configr = await Configr.create({sources})
  dbg('config=%s', pretty(configr.config))
  t.deepEqual(configr.config, {
    a: {b: {c: 123}},
    isTrue: true,
    base: {foo: 'bar', https: true},
    extra: {aList: ['foo', 'bar'], aBoolean: true, anObject: {foo: 'foo', bar: 'bar'}, aNumber: 42},
  })
})

test('env', async (t) => {
  process.env.CONFIGR_SOURCES_JSON = JSON.stringify([
    'https://raw.githubusercontent.com/the-watchmen/node-configr/main/test/ava/configr.https.yaml',
    {source: 'test/ava/configr.yaml', modifiers: ['test']},
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
    sources: [{source: '../test/ava/_get-config-1.js', isModule: true}],
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

  await configr.addSource({source: '../test/ava/_get-config-2.js', isModule: true})

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

test('get-configr', async (t) => {
  const configr = await getConfigr({bustCache: true})

  dbg('config=%s', pretty(configr.config))
  t.deepEqual(configr.config, {
    a: {
      b: {
        c: 123,
      },
    },
    isTrue: true,
  })

  await configr.addSource({source: '../test/ava/_get-config-1.js', isModule: true})
  dbg('config-post-add-1=%s', pretty(configr.config))
  t.deepEqual(configr.config, {
    a: {
      b: {
        c: 123,
      },
    },
    isTrue: true,
    configKeyOne: 'configValOne',
  })

  await configr.addSource({source: '../test/ava/_get-config-2.js', isModule: true})
  dbg('config-post-add-2=%s', pretty(configr.config))
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
