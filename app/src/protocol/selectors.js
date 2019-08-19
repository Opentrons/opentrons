// @flow
import path from 'path'
import startCase from 'lodash/startCase'
import { createSelector } from 'reselect'
import { getter } from '@thi.ng/paths'
import { getProtocolSchemaVersion } from '@opentrons/shared-data'
import { fileIsJson, fileToType } from './protocol-data'

import type { OutputSelector } from 'reselect'
import type { State } from '../types'
import type { ProtocolData, ProtocolType } from './types'

type StringGetter = (?ProtocolData) => ?string
type NumberGetter = (?ProtocolData) => ?number
type StringSelector = OutputSelector<State, void, ?string>
type NumberSelector = OutputSelector<State, void, ?number>
type ProtocolTypeSelector = OutputSelector<State, void, ProtocolType | null>
type ProtocolInfoSelector = OutputSelector<
  State,
  void,
  {
    protocolName: ?string,
    lastModified: ?number,
    appName: ?string,
    appVersion: ?string,
  }
>
type CreatorAppSelector = OutputSelector<
  State,
  void,
  { name: ?string, version: ?string }
>

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

export const getProtocolFile = (state: State) => state.protocol.file
export const getProtocolContents = (state: State) => state.protocol.contents
// NOTE: Ian 2019-08-15 protocol?.data safe get isn't necessary, but useful in unit tests with partial State
export const getProtocolData = (state: State) => state.protocol?.data

export const getProtocolFilename: StringSelector = createSelector(
  getProtocolFile,
  file => file && file.name
)

// TODO: (ka 2019-06-11): Investigate removing this unused? selector
// export const getProtocolLastModified: NumberSelector = createSelector(
//   getProtocolFile,
//   file => file && file.lastModified
// )

export const getProtocolDisplayData: $Shape<ProtocolInfoSelector> = createSelector(
  getProtocolData,
  getProtocolFilename,
  (data, name) => {
    if (!data)
      return {
        protocolName: name && stripDirAndExtension(name),
        lastModified: null,
        appName: null,
        appVersion: null,
      }
    const version = (data && getProtocolSchemaVersion(data)) || 1
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
    const protocolName = getName(data) || (name && stripDirAndExtension(name))
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
  fileToType
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

const METHOD_OT_API = 'Opentrons API'
const METHOD_UNKNOWN = 'Unknown Application'

export const getProtocolMethod: StringSelector = createSelector(
  getProtocolFile,
  getProtocolContents,
  getProtocolData,
  getProtocolCreatorApp,
  (file, contents, data, app) => {
    const isJson = file && fileIsJson(file)
    const appVersion = app && app.version
    const readableName = app && startCase(app.name)

    if (!file || !contents) return null
    if (isJson === true && !readableName) return METHOD_UNKNOWN
    if (!isJson) return METHOD_OT_API
    if (readableName && appVersion) return `${readableName} ${appVersion}`
    return readableName
  }
)
