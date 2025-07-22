import test from 'ava'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import {Configr, getConfig, getConfigValue} from '../../src/index.js'

const dbg = debug(import.meta.url)

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
  const config = await getConfig({caller: import.meta.url})
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
  await getConfig({caller: import.meta.url})
  await getConfig({caller: import.meta.url})
  await getConfig({caller: import.meta.url})

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
