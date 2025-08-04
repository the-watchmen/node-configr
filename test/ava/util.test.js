import test from 'ava'
import debug from '@watchmen/debug'
import {
  isInParent,
  getObjectFromData,
  getObjectFromLocation,
  decomposeLocation,
  getModifiedLocations,
  getExtFromLocation,
  invoke,
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
  const data = await getObjectFromLocation({
    location: `https://raw.${host}/${owner}/${repo}/${branch}/${path}`,
  })
  dbg('data=%o', data)
  t.is(data.extra.aNumber, 42)
})

test('path', async (t) => {
  const location = 'test/ava/configr.test.yaml'
  const data = await getObjectFromLocation({
    location,
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
  const location = 'https://github.com/owner-1/repo-1/path/to/values.yaml'
  const res = decomposeLocation({location})
  t.is(res.dir, 'https://github.com/owner-1/repo-1/path/to')
  t.is(res.name, 'values')
  t.is(res.ext, 'yaml')
  dbg('res=%o', res)
})

test('decomp-path', (t) => {
  const location = 'path/to/values.yaml'
  const res = decomposeLocation({location})
  t.is(res.dir, 'path/to')
  t.is(res.name, 'values')
  t.is(res.ext, 'yaml')
  dbg('res=%o', res)
})

test('get-modified-url', (t) => {
  const location = 'https://github.com/owner-1/repo-1/path/to/values.yaml'
  const modifiers = ['dev', 'us']
  const res = getModifiedLocations({location, modifiers})
  t.deepEqual(res, [
    'https://github.com/owner-1/repo-1/path/to/values.yaml',
    'https://github.com/owner-1/repo-1/path/to/values.dev.yaml',
    'https://github.com/owner-1/repo-1/path/to/values.us.yaml',
  ])
})

test('get-modified-none', (t) => {
  const location = 'https://github.com/owner-1/repo-1/path/to/values.yaml'
  const res = getModifiedLocations({location})
  t.deepEqual(res, ['https://github.com/owner-1/repo-1/path/to/values.yaml'])
})

test('get-ext-url', (t) => {
  const location = 'https://github.com/owner-1/repo-1/path/to/values.yaml'
  const ext = getExtFromLocation({location})
  t.is(ext, 'yaml')
})

test('get-ext-file', (t) => {
  const location = 'path/to/values.yaml'
  const ext = getExtFromLocation({location})
  t.is(ext, 'yaml')
})

test('invoke', async (t) => {
  const data = await invoke({module: '../test/ava/_get-config-1.js'})
  t.deepEqual(data, {
    configKeyOne: 'configValOne',
  })
})
