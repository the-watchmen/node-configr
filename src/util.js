import path from 'node:path'
import {fileURLToPath} from 'node:url'
import _ from 'lodash'
import fs from 'fs-extra'
import {parse} from 'yaml'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'

export {
  getRelativePath,
  isInParent,
  getDataFromLocation,
  getObjectFromData,
  getExtFromLocation,
  getObjectFromLocation,
  decomposeLocation,
  getModifiedLocations,
  getRelativeToCwd,
  invoke,
}

const format = {
  yaml: 'yaml',
  yml: 'yml',
  json: 'json',
}

const dbg = debug(import.meta.url)

// return relative path of file to folder if file in folder
//
function getRelativePath({file, dir}) {
  const _file = file.startsWith('file://') ? fileURLToPath(file) : file
  let current = path.dirname(_file)
  while (current !== path.parse(current).root) {
    if (path.basename(current) === dir) {
      return path.relative(current, _file)
    }

    current = path.dirname(current)
  }

  return null
}

function isInParent({file, dir}) {
  return getRelativePath({file, dir})
}

function getRelativeToCwd(url) {
  return path.relative(process.cwd(), fileURLToPath(url))
}

async function getHttpData({url, headers, mustExist}) {
  // eg: url = `https://raw.${host}/${owner}/${repo}/${branch}/${path}`
  //
  const res = await fetch(url, {headers})
  if (res.ok) {
    return res.text()
  }

  if (res.status === 404) {
    if (mustExist) {
      throw new Error(`url=${url} not found`)
    } else {
      dbg('get-http-data: url=%s not found, skipping...', url)
      return null
    }
  }

  throw new Error(`error encountered fetching url=${url}: code=${res.status}`)
}

async function getFileData({path, mustExist}) {
  // dbg('get-file-data: path=%s, must-exist=%s', path, mustExist)
  try {
    return await fs.readFile(path, 'utf8')
  } catch (error) {
    // dbg('caught error=%o', error)
    if (error.code === 'ENOENT') {
      if (mustExist) {
        throw new Error(`path=${path} not found`)
      } else {
        dbg('get-file-data: path=%s not found, skipping...', path)
        return null
      }
    }

    throw error
  }
}

async function getDataFromLocation({location, headers, mustExist}) {
  return location.startsWith('https://')
    ? getHttpData({url: location, headers, mustExist})
    : getFileData({path: location, mustExist})
}

async function getObjectFromLocation({location, headers, mustExist}) {
  const data = await getDataFromLocation({location, headers, mustExist})
  if (data) {
    // dbg('get-object-from-location: location=%s found, processing...', source)

    const ext = getExtFromLocation({location})
    return getObjectFromData({data, type: ext})
  }
}

function getObjectFromData({data, type}) {
  let o
  if ([format.yaml, format.yml].includes(type)) {
    o = parse(data)
  } else if (type === format.json) {
    o = JSON.parse(data)
  } else {
    throw new Error('unhandled type=%s', type)
  }

  return o
}

function getExtFromLocation({location}) {
  return location.split('.').pop().toLowerCase()
}

function decomposeLocation({location}) {
  const file = path.basename(location)
  let ext = path.extname(file)
  const name = path.basename(file, ext)
  ext = ext.slice(1)
  const dir = path.dirname(location)
  return {dir, name, ext}
}

function getModifiedLocations({location, modifiers}) {
  const decomp = decomposeLocation({location})

  return [
    location,
    ..._.map(modifiers, (modifier) => `${decomp.dir}/${decomp.name}.${modifier}.${decomp.ext}`),
  ]
}

async function invoke({module, args}) {
  dbg('invoke: importing module=%s...', module)
  const _module = await import(module)
  dbg('invoke: module=%s imported, invoking...', module)
  const data = await _module.default(args)
  dbg('invoke: default function invoked, obtained data=%s', pretty(data))
  return data
}
