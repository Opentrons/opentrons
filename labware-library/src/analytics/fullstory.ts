import uniq from 'lodash/uniq'

const LL_VERSION = process.env.OT_LL_VERSION
const LL_BUILD_DATE = new Date(process.env.OT_LL_BUILD_DATE as any)

const _getFullstory = (): Object | null => {
  const namespace = global._fs_namespace
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const fs = namespace ? (global as any)[namespace] : null
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  return fs || null
}

export const shutdownFullstory = (): void => {
  console.debug('shutting down Fullstory')
  const fs: any = _getFullstory()
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (fs?.shutdown && typeof fs.shutdown === 'function') {
    fs.shutdown()
  }
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (global._fs_namespace && (global as any)[global._fs_namespace]) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (global as any)[(global as any)._fs_namespace]
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
  parameters: Record<string, unknown> = {}
): void => {
  // NOTE: make sure user has opted in before calling this fn
  const fs = _getFullstory()
  // @ts-expect-error(sa, 2021-03-26): add event to _getFullstory return type
  if (fs && fs.event) {
    // NOTE: fullstory requires property names to have type suffix
    // https://help.fullstory.com/hc/en-us/articles/360020623234#Custom%20Property%20Name%20Requirements
    const _parameters = Object.keys(parameters).reduce((acc, key) => {
      const value = parameters[key]
      const suffix = inferFsKeyWithSuffix(key, value)
      const name: string = suffix === null ? key : `${key}_${suffix}`
      return { ...acc, [name]: value }
    }, {})
    // @ts-expect-error(sa, 2021-03-26): accurately type _getFullstory return value
    fs.event(name, _parameters)
  }
}

export const _setAnalyticsTags = (): void => {
  const fs: any = _getFullstory()
  // NOTE: fullstory expects the keys 'displayName' and 'email' verbatim
  // though all other key names must be fit the schema described here
  // https://help.fullstory.com/hc/en-us/articles/360020623294
  if (fs && fs.setUserVars) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const version_str = LL_VERSION
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const buildDate_date = LL_BUILD_DATE

    fs.setUserVars({
      ot_application_name_str: 'labware-library', // NOTE: to distinguish from other apps using the FULLSTORY_ORG
      version_str,
      buildDate_date,
    })
  }
}
