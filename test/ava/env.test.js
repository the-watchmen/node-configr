import test from 'ava'
// import debug from '@watchmen/debug'
import {getEnv, getEnvAsBoolean, getEnvAsArray, getEnvAsNumber} from '../../src/env.js'

// const dbg = debug(import.meta.url)

test('string', (t) => {
  const val = getEnv({name: 'HOME'})
  t.true(val.startsWith('/'))
})

test('string-dflt', (t) => {
  const dflt = 'yup'
  const val = getEnv({name: 'NOPE', dflt})
  t.is(val, dflt)
})

test('string-dflt-nope', (t) => {
  const dflt = null
  const val = getEnv({name: 'NOPE', dflt})
  t.is(val, dflt)
})

test('string-nope', (t) => {
  const error = t.throws(() => getEnv({name: 'NOPE'}))
  t.truthy(error)
})

test('bool-false', (t) => {
  const name = 'BOOL'
  process.env[name] = 'whut'
  const value = getEnvAsBoolean({name})
  t.false(value)
  delete process.env[name]
})

test('bool-true', (t) => {
  const name = 'BOOL'
  process.env[name] = 'true'
  const value = getEnvAsBoolean({name})
  t.true(value)
  delete process.env[name]
})

test('array', (t) => {
  const name = 'ARRAY'
  process.env[name] = 'one, two, three'
  const val = getEnvAsArray({name})
  t.deepEqual(val, ['one', 'two', 'three'])
  delete process.env[name]
})

test('array-dflt', (t) => {
  const name = 'ARRAY'
  const val = getEnvAsArray({name, dflt: ['one', 'two', 'three']})
  t.deepEqual(val, ['one', 'two', 'three'])
})

test('array-dflt-string', (t) => {
  const name = 'ARRAY'
  const val = getEnvAsArray({name, dflt: 'one,two,three'})
  t.deepEqual(val, ['one', 'two', 'three'])
})

test('number', (t) => {
  const name = 'NUM'
  process.env[name] = '42'
  const val = getEnvAsNumber({name})
  t.is(val, 42)
  delete process.env[name]
})

test('num-nan', (t) => {
  const error = t.throws(() => getEnvAsNumber({name: 'HOME'}))
  t.truthy(error)
})
