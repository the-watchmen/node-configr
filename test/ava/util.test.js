import test from 'ava'
import debug from '@watchmen/debug'
import {
  isInParent,
  getObjectFromData,
  getObjectFromSource,
  decomposeSource,
  getModifiedSources,
  getExtFromSource,
  getEnv,
} from '../../src/util.js'

const dbg = debug(import.meta.url)
const home = process.env.HOME

test('in-parent', (t) => {
  const file = `${home}/node_modules/foo/bar/dummy.js`
  const dir = 'node_modules'
  const path = isInParent({file, dir})
  dbg('in-parent: file=%s, dir=%s, path=%s', file, dir, path)
  t.truthy(path)
})

test('in-parent-url', (t) => {
  const file = `file://${home}/node_modules/foo/bar/dummy.js`
  const dir = 'node_modules'
  const path = isInParent({file, dir})
  dbg('in-parent-url: file=%s, dir=%s, path=%s', file, dir, path)
  t.truthy(path)
})

test('not-in-parent', (t) => {
  const file = `${home}/foo/bar/dummy.js`
  const dir = 'node_modules'
  const path = isInParent({file, dir})
  dbg('not-in-parent: file=%s, dir=%s, path=%s', file, dir, path)
  t.falsy(path)
})

test('github', async (t) => {
  const host = 'github.com'
  const owner = 'the-watchmen'
  const repo = 'node-configr'
  const branch = 'main'
  const path = 'test/ava/configr.test.yaml'
  const data = await getObjectFromSource({
    source: `https://raw.${host}/${owner}/${repo}/${branch}/${path}`,
  })
  dbg('data=%o', data)
  t.is(data.extra.aNumber, 42)
})

test('path', async (t) => {
  const source = 'test/ava/configr.test.yaml'
  const data = await getObjectFromSource({
    source,
  })
  dbg('data=%o', data)
  t.is(data.extra.aNumber, 42)
})

test('gofd-yaml', (t) => {
  const yaml = `
foo:
  bar: 42
`
  const obj = getObjectFromData({data: yaml, type: 'yaml'})
  t.deepEqual(obj, {foo: {bar: 42}})
})

test('gofd-yml', (t) => {
  const yml = `
foo:
  bar: 99
`
  const obj = getObjectFromData({data: yml, type: 'yml'})
  t.deepEqual(obj, {foo: {bar: 99}})
})

test('gofd-json', (t) => {
  const json = '{"foo":{"bar":123}}'
  const obj = getObjectFromData({data: json, type: 'json'})
  t.deepEqual(obj, {foo: {bar: 123}})
})

test('gofd-nope', (t) => {
  const data = 'foo=bar'
  const error = t.throws(() => getObjectFromData({data, type: 'properties'}))
  t.regex(error.message, /unhandled type/)
})

test('decomp', (t) => {
  const source = 'https://github.com/owner-1/repo-1/path/to/values.yaml'
  const res = decomposeSource({source})
  t.is(res.dir, 'https://github.com/owner-1/repo-1/path/to')
  t.is(res.name, 'values')
  t.is(res.ext, 'yaml')
  dbg('res=%o', res)
})

test('decomp-path', (t) => {
  const source = 'path/to/values.yaml'
  const res = decomposeSource({source})
  t.is(res.dir, 'path/to')
  t.is(res.name, 'values')
  t.is(res.ext, 'yaml')
  dbg('res=%o', res)
})

test('get-modified-url', (t) => {
  const source = 'https://github.com/owner-1/repo-1/path/to/values.yaml'
  const modifiers = ['dev', 'us']
  const res = getModifiedSources({source, modifiers})
  t.deepEqual(res, [
    'https://github.com/owner-1/repo-1/path/to/values.yaml',
    'https://github.com/owner-1/repo-1/path/to/values.dev.yaml',
    'https://github.com/owner-1/repo-1/path/to/values.us.yaml',
  ])
})

test('get-modified-none', (t) => {
  const source = 'https://github.com/owner-1/repo-1/path/to/values.yaml'
  const res = getModifiedSources({source})
  t.deepEqual(res, ['https://github.com/owner-1/repo-1/path/to/values.yaml'])
})

test('get-ext-url', (t) => {
  const source = 'https://github.com/owner-1/repo-1/path/to/values.yaml'
  const ext = getExtFromSource({source})
  t.is(ext, 'yaml')
})

test('get-ext-file', (t) => {
  const source = 'path/to/values.yaml'
  const ext = getExtFromSource({source})
  t.is(ext, 'yaml')
})

test('get-env', (t) => {
  // eslint-disable-next-line dot-notation
  process.env['configr_foo_bar'] = 'baz'
  const env = getEnv()
  dbg('env=%o', env)
  t.deepEqual(env, {foo: {bar: 'baz'}})
})
