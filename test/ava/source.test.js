import test from 'ava'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import _ from 'lodash'
import {
  ConfigSource,
  FileSource,
  HttpSource,
  ModuleSource,
  EnvSource,
  JsonSource,
} from '../../src/source.js'

const dbg = debug(import.meta.url)

test('file', async (t) => {
  const location = 'test/ava/configr.yaml'
  const src = await FileSource.create({location})
  dbg('config=%s', pretty(src.config))
  t.deepEqual(src.config, {base: {foo: 'bar'}})
  dbg('src.args=%s', pretty(src.args))
  t.is(src.args.location, location)
})

test('mods', async (t) => {
  const src = await FileSource.create({
    location: 'test/ava/configr.yaml',
    modifiers: ['dev', 'thing'],
  })
  dbg('src=%s', pretty(src.props))
  t.deepEqual(src.config, {base: {foo: 'bar', baz: 'bip'}})
})

test('http', async (t) => {
  const source = await HttpSource.create({
    location:
      'https://raw.githubusercontent.com/the-watchmen/node-configr/main/test/ava/configr.yaml',
  })
  dbg('source=%s', pretty(source.props))
  t.is(source.props.modifiers, undefined)
})

test('http-mods', async (t) => {
  const src = await HttpSource.create({
    location:
      'https://raw.githubusercontent.com/the-watchmen/node-configr/main/test/ava/configr.yaml',
    modifiers: ['dev', 'thing'],
  })
  dbg('src=%s', pretty(src.props))
  t.pass()
})

test('must-exist-false', async (t) => {
  const src = await FileSource.create({
    location: 'nope/nope.yaml',
    modifiers: ['dev'],
    mustExist: false,
  })
  dbg('config=%s', pretty(src.config))
  t.true(_.isEmpty(src.config))
})

test('must-exist-true', async (t) => {
  const error = await t.throwsAsync(async () => {
    await FileSource.create({
      location: 'nope/nope.yaml',
      modifiers: ['dev'],
      mustExist: true,
    })
  })

  t.truthy(error)
})

test('module', async (t) => {
  const source = await ModuleSource.create({
    location: '../test/ava/_get-config-1.js',
    modifiers: ['dev'],
    isModule: true,
  })
  const {config} = source
  dbg('src=%s', pretty(source.props))
  t.deepEqual(config, {configKeyOne: 'configValOne'})
})

test('env', (t) => {
  const foo = 'bar'
  process.env.configr_foo = foo
  const source = EnvSource.create({})
  const {config} = source
  dbg('config=%s', pretty(config))
  t.deepEqual(config, {foo})
  delete process.env.configr_foo
})

test('json', (t) => {
  const foo = 'bar'
  process.env.CONFIGR_CONFIG_JSON = '{"foo": "bar"}'
  const source = JsonSource.create({})
  const {config} = source
  dbg('src=%s', pretty(source.props))
  t.deepEqual(config, {foo})
  delete process.env.CONFIGR_CONFIG_JSON
})

test('config', (t) => {
  const source = ConfigSource.create()
  dbg('source=%s', pretty(source.props))
  t.deepEqual(source.config, {a: {b: {c: 123}}, isTrue: true})
})
