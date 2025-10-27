import debug from '@watchmen/debug'
import {FileSource} from '../../src/source.js'

const dbg = debug(import.meta.url)

export default async function getSources() {
  dbg('invoking...')
  return [await FileSource.create({location: 'test/ava/configr.dyna.yaml'})]
}
