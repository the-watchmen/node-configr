import test from 'ava'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import {Configr} from '../../src/configr.js'

const dbg = debug(import.meta.url)

// test('bare', (t) => {
//   const configr = new Configr()
//   dbg('config=%s', pretty(configr))
//   t.pass()
// })

test('basic', async (t) => {
  const sources = [
    {
      source: 'https://github.com/the-watchmen/node-configr/test/ava/configr.https.yaml',
      token: 's3cret',
    },
    {source: 'test/ava/configr.yaml', modifiers: ['test']},
  ]
  const configr = await Configr.create({sources})
  dbg('config=%s', pretty(configr))
  t.pass()
})
