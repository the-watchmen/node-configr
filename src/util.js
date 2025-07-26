import path from 'node:path'
import {fileURLToPath} from 'node:url'
import _ from 'lodash'
import fs from 'fs-extra'
import {parse} from 'yaml'
import debug from '@watchmen/debug'

export {
  getRelativePath,
  isInParent,
  getDataFromSource,
  getObjectFromData,
  getExtFromSource,
  getObjectFromSource,
  decomposeSource,
  getModifiedSources,
  getRelativeToCwd,
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

// function getHeaders({url}) {
//   const host = new URL(url).host
//   const tokenEnv = _.get(config, `configr.hosts.${host}.tokenEnv`)
//   const token = process.env[tokenEnv]
//   const headers = {}
//   if (token) {
//     headers.Authorization = `Bearer ${token}`
//   }

//   return headers
// }

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

async function getDataFromSource({source, headers, mustExist}) {
  return source.startsWith('https://')
    ? getHttpData({url: source, headers, mustExist})
    : getFileData({path: source, mustExist})
}

async function getObjectFromSource({source, headers, mustExist}) {
  const data = await getDataFromSource({source, headers, mustExist})
  if (data) {
    // dbg('get-object-from-source: source=%s found, processing...', source)

    const ext = getExtFromSource({source})
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

function getExtFromSource({source}) {
  return source.split('.').pop().toLowerCase()
}

function decomposeSource({source}) {
  const file = path.basename(source)
  let ext = path.extname(file)
  const name = path.basename(file, ext)
  ext = ext.slice(1)
  const dir = path.dirname(source)
  return {dir, name, ext}
}

function getModifiedSources({source, modifiers}) {
  const decomp = decomposeSource({source})

  return [
    source,
    ..._.map(modifiers, (modifier) => `${decomp.dir}/${decomp.name}.${modifier}.${decomp.ext}`),
  ]
}
