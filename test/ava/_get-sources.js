import debug from '@watchmen/debug'

const dbg = debug(import.meta.url)

export default async function getSources() {
  dbg('invoking...')
  return [{source: 'test/ava/configr.dyna.yaml'}]
}
