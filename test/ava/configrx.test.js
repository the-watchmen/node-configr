import test from 'ava'
import debug from '@watchmen/debug'
import config from 'config'
import {pretty} from '@watchmen/helpr'
import {getConfig, initConfig, configr} from '../../src/index.js'

const dbg = debug(import.meta.url)

test('basic', (t) => {
  dbg('config=%s', pretty(config))
  t.falsy(process.env.A_B_C)
  t.is(getConfig({path: 'a.b.c'}), config.a.b.c)
})

test('camel', (t) => {
  dbg('config=%s', pretty(config))
  t.is(getConfig({path: 'isTrue'}), config.isTrue)
})

test('camel-env', (t) => {
  process.env.PATH_IS_TRUE = 'sumthin'
  dbg('config=%s', pretty(config))
  t.falsy(config?.path?.isTrue)
  t.is(getConfig({path: 'path.isTrue'}), process.env.PATH_IS_TRUE)
  delete process.env.PATH_IS_TRUE
})

test('env', (t) => {
  process.env.A_B_D = 'sumthin'
  t.falsy(config.a.b.d)
  t.is(getConfig({path: 'a.b.d'}), process.env.A_B_D)
  delete process.env.A_B_D
})

test('dflt', (t) => {
  const dflt = 'nope'
  t.falsy(config.a.b.d)
  t.falsy(process.env.A_B_D)
  t.is(getConfig({path: 'a.b.d', dflt}), dflt)
})

test('yml', (t) => {
  process.env.CONFIGR_INPUT = `${import.meta.dirname}/configr.test.yaml`
  initConfig()
  t.like(getConfig({path: 'extra.aList'}), ['foo', 'bar'])
  delete process.env.CONFIGR_INPUT
})

test('yaml-data', (t) => {
  process.env.CONFIGR_INPUT = 'foo: bar'
  process.env.CONFIGR_FORMAT = 'yaml'
  initConfig()
  t.is(getConfig({path: 'foo'}), 'bar')
  delete process.env.CONFIGR_INPUT
  delete process.env.CONFIGR_FORMAT
})

test('json-data', (t) => {
  process.env.CONFIGR_INPUT = '{"foo": {"bar": "baz"}}'
  process.env.CONFIGR_FORMAT = 'json'
  initConfig()
  t.is(getConfig({path: 'foo.bar'}), 'baz')
  delete process.env.CONFIGR_INPUT
  delete process.env.CONFIGR_FORMAT
})

test('all', (t) => {
  const all = getConfig()
  dbg('all=%s', pretty(all))
  t.is(getConfig(), config)
})

test('all-yaml', (t) => {
  process.env.CONFIGR_YAML = `${import.meta.dirname}/configr.test.yml`
  initConfig()
  const all = getConfig()
  dbg('all=%s', pretty(all))
  t.is(getConfig(), config)
  delete process.env.CONFIGR_YAML
})

test('configr', (t) => {
  t.is(configr, config)
})
