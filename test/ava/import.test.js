import test from 'ava'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'

const dbg = debug(import.meta.url)

test('import', async (t) => {
  process.env.CONFIGR_INPUT = `${import.meta.dirname}/configr.test.yaml`
  const {configr} = await import('../../src/index.js')
  dbg('configr=%s', pretty(configr))
  t.is(configr.extra.aNumber, 42)
  delete process.env.CONFIGR_YAML
})
