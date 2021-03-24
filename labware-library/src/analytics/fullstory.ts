import uniq from 'lodash/uniq'

const FULLSTORY_NAMESPACE = 'FS'
const FULLSTORY_ORG = process.env.OT_LL_FULLSTORY_ORG
const LL_VERSION = process.env.OT_LL_VERSION
const LL_BUILD_DATE = new Date(process.env.OT_LL_BUILD_DATE as any)

const _getFullstory = (): Object | null => {
  const namespace = global._fs_namespace
  const fs = namespace ? global[namespace] : null
  return fs || null
}

export const shutdownFullstory = () => {
  console.debug('shutting down Fullstory')
  const fs = _getFullstory()
  if (fs && fs.shutdown) {
    fs.shutdown()
  }
  if (global._fs_namespace && global[global._fs_namespace]) {
    delete global[global._fs_namespace]
  }
}

export const inferFsKeyWithSuffix = (
  key: string,
  value: any
): string | null => {
  // semi-hacky way to provide FS with type suffix for keys in FS `properties`
  if (typeof value === 'boolean') return 'bool'
  if (Number.isInteger(value)) return 'int'
  if (typeof value === 'number') return 'real'
  if (value instanceof Date) return ''
  if (typeof value === 'string') return 'str'

  // flat array
  if (Array.isArray(value) && value.every(x => !Array.isArray(x))) {
    const recursiveContents = value.map(x => inferFsKeyWithSuffix(key, x))
    // homogenously-typed array
    if (uniq(recursiveContents).length === 1 && recursiveContents[0] != null) {
      // add 's' to suffix to denote array of type (eg 'bools')
      return `${recursiveContents[0]}s`
    }
  }

  // NOTE: nested objects are valid in FS properties,
  // but not yet supported by this fn
  console.info(`could not determine Fullstory key suffix for key "${key}"`)

  return null
}

export const fullstoryEvent = (
  name: string,
  parameters: Record<string, any> = {}
): void => {
  // NOTE: make sure user has opted in before calling this fn
  const fs = _getFullstory()
  if (fs && fs.event) {
    // NOTE: fullstory requires property names to have type suffix
    // https://help.fullstory.com/hc/en-us/articles/360020623234#Custom%20Property%20Name%20Requirements
    const _parameters = Object.keys(parameters).reduce((acc, key) => {
      const value = parameters[key]
      const suffix = inferFsKeyWithSuffix(key, value)
      const name: string = suffix === null ? key : `${key}_${suffix}`
      return { ...acc, [name]: value }
    }, {})
    fs.event(name, _parameters)
  }
}

export const _setAnalyticsTags = () => {
  const fs = _getFullstory()
  // NOTE: fullstory expects the keys 'displayName' and 'email' verbatim
  // though all other key names must be fit the schema described here
  // https://help.fullstory.com/hc/en-us/articles/360020623294
  if (fs && fs.setUserVars) {
    const version_str = LL_VERSION
    const buildDate_date = LL_BUILD_DATE

    fs.setUserVars({
      ot_application_name_str: 'labware-library', // NOTE: to distinguish from other apps using the FULLSTORY_ORG
      version_str,
      buildDate_date,
    })
  }
}
