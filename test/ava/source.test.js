import test from 'ava'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
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
