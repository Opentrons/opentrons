// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { getProtocolSchemaVersion } from '@opentrons/shared-data'
import type { ProtocolFile as SchemaV3ProtocolFile } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import { getter } from '@thi.ng/paths'
import startCase from 'lodash/startCase'
import path from 'path'
import { createSelector } from 'reselect'

import { createLogger } from '../logger'
import type { State } from '../types'
import { fileIsJson } from './protocol-data'
import type { ProtocolData, ProtocolFile, ProtocolType } from './types'

type StringGetter = (?ProtocolData) => ?string
type NumberGetter = (?ProtocolData) => ?number
type StringSelector = State => ?string
type NumberSelector = State => ?number
type ProtocolTypeSelector = State => ProtocolType | null

type ProtocolInfoSelector = State => {|
  protocolName: string | null,
  lastModified: number | null,
  appName: string | null,
  appVersion: string | null,
|}

type CreatorAppSelector = State => {|
  name: string | null,
  version: string | null,
|}

const log = createLogger(__filename)

const protocolV1V2GetterPaths = {
  name: 'metadata.protocol-name',
  lastModified: 'metadata.last-modified',
  appName: 'designer-application.application-name',
  appVersion: 'designer-application.application-version',
}

const PROTOCOL_GETTER_PATHS_BY_SCHEMA = {
  '1': protocolV1V2GetterPaths,
  '2': protocolV1V2GetterPaths,
  '3': {
    name: 'metadata.protocolName',
    lastModified: 'metadata.lastModified',
    appName: 'designerApplication.name',
    appVersion: 'designerApplication.version',
  },
}

const getAuthor: StringGetter = getter('metadata.author')
const getDesc: StringGetter = getter('metadata.description')
const getCreated: NumberGetter = getter('metadata.created')
const getSource: StringGetter = getter('metadata.source')

const stripDirAndExtension = f => path.basename(f, path.extname(f))

export const getProtocolFile = (state: State): ProtocolFile | null =>
  state.protocol.file
export const getProtocolContents = (state: State): string | null =>
  state.protocol.contents
export const getProtocolData = (state: State): ProtocolData | null =>
  state.protocol.data

export const getProtocolFilename: StringSelector = createSelector(
  getProtocolFile,
  file => file && file.name
)

// TODO: (ka 2019-06-11): Investigate removing this unused? selector
// export const getProtocolLastModified: NumberSelector = createSelector(
//   getProtocolFile,
//   file => file && file.lastModified
// )

export const getLabwareDefBySlot: State => {
  [slot: string]: LabwareDefinition2 | void,
} = createSelector(
  getProtocolData,
  (_data: any) => {
    if (_data?.schemaVersion === 3) {
      // TODO: Ian 2019-08-15 flow cannot infer ProtocolData enum by schemaVersion === 3
      const data: SchemaV3ProtocolFile<{}> = _data
      return Object.keys(data.labware).reduce((acc, labwareId) => {
        const labware = data.labware[labwareId]
        const slot = labware.slot
        if (slot in acc) {
          log.warn(
            `expected 1 labware per slot, slot ${slot} contains multiple labware`
          )
        }
        const labwareDef = data.labwareDefinitions[labware.definitionId]
        return {
          ...acc,
          [slot]: labwareDef,
        }
      }, {})
    }
    return {}
  }
)

export const getProtocolDisplayData: ProtocolInfoSelector = createSelector(
  getProtocolData,
  getProtocolFilename,
  (data, name) => {
    const basename = name ? stripDirAndExtension(name) : null

    if (!data) {
      return {
        protocolName: basename,
        lastModified: null,
        appName: null,
        appVersion: null,
      }
    }

    const version = getProtocolSchemaVersion(data) || 1
    const getName = getter(PROTOCOL_GETTER_PATHS_BY_SCHEMA[version]['name'])
    const getLastModified = getter(
      PROTOCOL_GETTER_PATHS_BY_SCHEMA[version]['lastModified']
    )
    const getAppName = getter(
      PROTOCOL_GETTER_PATHS_BY_SCHEMA[version]['appName']
    )
    const getAppVersion = getter(
      PROTOCOL_GETTER_PATHS_BY_SCHEMA[version]['appVersion']
    )
    const protocolName = getName(data) || basename
    const lastModified = getLastModified(data) || getCreated(data)
    const appName = getAppName(data)
    const appVersion = getAppVersion(data)

    return {
      protocolName: protocolName,
      lastModified: lastModified,
      appName: appName,
      appVersion: appVersion,
    }
  }
)

export const getProtocolName: StringSelector = createSelector(
  getProtocolDisplayData,
  displayData => displayData.protocolName
)

export const getProtocolAuthor: StringSelector = createSelector(
  getProtocolData,
  data => getAuthor(data)
)

export const getProtocolDescription: StringSelector = createSelector(
  getProtocolData,
  data => getDesc(data)
)

export const getProtocolSource: StringSelector = createSelector(
  getProtocolData,
  data => getSource(data)
)

export const getProtocolLastUpdated: NumberSelector = createSelector(
  getProtocolFile,
  getProtocolDisplayData,
  (file, displayData) => displayData.lastModified || (file && file.lastModified)
)

export const getProtocolType: ProtocolTypeSelector = createSelector(
  getProtocolFile,
  file => file?.type || null
)

export const getProtocolCreatorApp: CreatorAppSelector = createSelector(
  getProtocolDisplayData,
  displayData => {
    return {
      name: displayData.appName,
      version: displayData.appVersion,
    }
  }
)

export const getProtocolApiVersion = (state: State): string | null => {
  // TODO(mc, 2019-11-26): did not import due to circular dependency
  // protocol API level should probably be part of protocol state
  const level = state.robot.session.apiLevel

  return level != null ? level.join('.') : null
}

const METHOD_OT_API = 'Python Protocol API'
const METHOD_UNKNOWN = 'Unknown Application'

export const getProtocolMethod: StringSelector = createSelector(
  getProtocolFile,
  getProtocolContents,
  getProtocolData,
  getProtocolCreatorApp,
  getProtocolApiVersion,
  (file, contents, data, app, apiVersion) => {
    const isJson = file && fileIsJson(file)
    const jsonAppName = app.name
      ? startCase(app.name.replace(/^opentrons\//, ''))
      : METHOD_UNKNOWN
    const jsonAppVersion = app.version ? ` v${app.version}` : ''
    const readableJsonName = isJson ? `${jsonAppName}${jsonAppVersion}` : null

    if (!file || !contents) return null
    if (readableJsonName) return readableJsonName
    return `${METHOD_OT_API}${apiVersion !== null ? ` v${apiVersion}` : ''}`
  }
)
