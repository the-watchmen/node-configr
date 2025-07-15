import {Configr} from './configr.js'

export {getConfig}
export {Configr} from './configr.js'

async function getConfig() {
  const config = await Configr.create()
  return config.config
}
