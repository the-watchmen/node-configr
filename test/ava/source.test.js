import test from 'ava'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import _ from 'lodash'
import {Source} from '../../src/source.js'

const dbg = debug(import.meta.url)

test('basic', async (t) => {
  const src = await Source.create({source: 'test/ava/configr.yaml'})
  dbg('config=%s', pretty(src.config))
  t.deepEqual(src.config, {base: {foo: 'bar'}})
})

test('mods', async (t) => {
  const src = await Source.create({source: 'test/ava/configr.yaml', modifiers: ['dev', 'thing']})
  dbg('config=%s', pretty(src.config))
  t.deepEqual(src.config, {base: {foo: 'bar', baz: 'bip'}})
})

test('http', async (t) => {
  const src = await Source.create({
    source:
      'https://raw.githubusercontent.com/the-watchmen/node-configr/main/test/ava/configr.yaml',
  })
  dbg('config=%s', pretty(src.config))
  t.pass()
})

test('http-mods', async (t) => {
  const src = await Source.create({
    source:
      'https://raw.githubusercontent.com/the-watchmen/node-configr/main/test/ava/configr.yaml',
    modifiers: ['dev', 'thing'],
  })
  dbg('config=%s', pretty(src.config))
  t.pass()
})

test('must-exist-false', async (t) => {
  const src = await Source.create({
    source: 'nope/nope.yaml',
    modifiers: ['dev'],
    mustExist: false,
  })
  dbg('config=%s', pretty(src.config))
  t.true(_.isEmpty(src.config))
})

test('must-exist-true', async (t) => {
  const error = await t.throwsAsync(async () => {
    await Source.create({
      source: 'nope/nope.yaml',
      modifiers: ['dev'],
      mustExist: true,
    })
  })

  t.truthy(error)
})

test('module', async (t) => {
  const source = await Source.create({
    source: '../test/ava/_get-config-1.js',
    modifiers: ['dev'],
    isModule: true,
  })
  const {config} = source
  dbg('config=%s', pretty(config))
  t.deepEqual(config, {configKeyOne: 'configValOne'})
})
