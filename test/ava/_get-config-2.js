import debug from '@watchmen/debug'

const dbg = debug(import.meta.url)

export default function getConfig({modifiers} = {}) {
  if (modifiers) dbg('invoking: modifiers=%s', modifiers)
  return {configKeyTwo: 'configValTwo'}
}
