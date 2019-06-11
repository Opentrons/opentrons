// @flow
// protocol state and loading actions
import path from 'path'
import startCase from 'lodash/startCase'
import { createSelector } from 'reselect'
import { getter } from '@thi.ng/paths'
import { getProtocolSchemaVersion } from '@opentrons/shared-data'
import {
  fileToProtocolFile,
  parseProtocolData,
  fileIsJson,
  fileToType,
  filenameToMimeType,
} from './protocol-data'

import type { OutputSelector } from 'reselect'
import type { State, Action, ThunkAction } from '../types'
import type {
  ProtocolState,
  ProtocolFile,
  ProtocolData,
  ProtocolType,
} from './types'

export * from './types'

type OpenProtocolAction = {|
  type: 'protocol:OPEN',
  payload: {| file: ProtocolFile |},
|}

type UploadProtocolAction = {|
  type: 'protocol:UPLOAD',
  payload: {| contents: string, data: $PropertyType<ProtocolState, 'data'> |},
  meta: {| robot: true |},
|}

export type ProtocolAction = OpenProtocolAction | UploadProtocolAction

export function openProtocol(file: File): ThunkAction {
  return dispatch => {
    const reader = new FileReader()
    const protocolFile = fileToProtocolFile(file)
    const openAction: OpenProtocolAction = {
      type: 'protocol:OPEN',
      payload: { file: protocolFile },
    }

    reader.onload = () => {
      // because we use readAsText below, reader.result will be a string
      const contents: string = (reader.result: any)
      const uploadAction: UploadProtocolAction = {
        type: 'protocol:UPLOAD',
        payload: { contents, data: parseProtocolData(protocolFile, contents) },
        meta: { robot: true },
      }

      dispatch(uploadAction)
    }

    reader.readAsText(file)
    return dispatch(openAction)
  }
}

const INITIAL_STATE = { file: null, contents: null, data: null }

export function protocolReducer(
  state: ProtocolState = INITIAL_STATE,
  action: Action
): ProtocolState {
  switch (action.type) {
    case 'protocol:OPEN':
      return { ...INITIAL_STATE, ...action.payload }

    case 'protocol:UPLOAD':
      return { ...state, ...action.payload }

    case 'robot:SESSION_RESPONSE': {
      const { name, metadata, protocolText: contents } = action.payload
      const file =
        !state.file || name !== state.file.name
          ? { name, type: filenameToMimeType(name), lastModified: null }
          : state.file
      const data =
        !state.data || contents !== state.contents
          ? parseProtocolData(file, contents, metadata)
          : state.data

      return { file, contents, data }
    }

    case 'robot:DISCONNECT_RESPONSE':
      return INITIAL_STATE
  }

  return state
}

type StringGetter = (?ProtocolData) => ?string
type NumberGetter = (?ProtocolData) => ?number
type StringSelector = OutputSelector<State, void, ?string>
type NumberSelector = OutputSelector<State, void, ?number>
type ProtocolTypeSelector = OutputSelector<State, void, ProtocolType | null>
type ProtocolInfoSelector = OutputSelector<
  State,
  void,
  { name: ?string, appName: ?string, appVersion: ?string }
>
type CreatorAppSelector = OutputSelector<
  State,
  void,
  { name: ?string, version: ?string }
>

const protocolV1V2GetterPaths = {
  name: 'metadata.protocol-name',
  appName: 'designer-application.application-name',
  appVersion: 'designer-application.application-version',
}

const PROTOCOL_GETTER_PATHS_BY_SCHEMA = {
  '1': protocolV1V2GetterPaths,
  '2': protocolV1V2GetterPaths,
  '3': {
    name: 'metadata.protocolName',
    appName: 'designerApplication.name',
    appVersion: 'designerApplication.version',
  },
}

const getAuthor: StringGetter = getter('metadata.author')
const getDesc: StringGetter = getter('metadata.description')
const getCreated: NumberGetter = getter('metadata.created')
const getLastModified: NumberGetter = getter('metadata.last-modified')
const getSource: StringGetter = getter('metadata.source')

const stripDirAndExtension = f => path.basename(f, path.extname(f))

export const getProtocolFile = (state: State) => state.protocol.file
export const getProtocolContents = (state: State) => state.protocol.contents
export const getProtocolData = (state: State) => state.protocol.data

export const getProtocolFilename: StringSelector = createSelector(
  getProtocolFile,
  file => file && file.name
)

export const getProtocolLastModified: NumberSelector = createSelector(
  getProtocolFile,
  file => file && file.lastModified
)

export const getProtocolDisplayData: $Shape<ProtocolInfoSelector> = createSelector(
  getProtocolData,
  getProtocolFilename,
  (data, name) => {
    if (!data) return { name: '', appName: '', appVersion: '' }
    const version = (data && getProtocolSchemaVersion(data)) || 1
    const getName = getter(PROTOCOL_GETTER_PATHS_BY_SCHEMA[version]['name'])
    const getAppName = getter(
      PROTOCOL_GETTER_PATHS_BY_SCHEMA[version]['appName']
    )
    const getAppVersion = getter(
      PROTOCOL_GETTER_PATHS_BY_SCHEMA[version]['appVersion']
    )
    const protocolName = getName(data) || (name && stripDirAndExtension(name))
    const appName = getAppName(data)
    const appVersion = getAppVersion(data)
    return { name: protocolName, appName: appName, appVersion: appVersion }
  }
)

export const getProtocolName: StringSelector = createSelector(
  getProtocolDisplayData,
  displayData => displayData.name
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
  getProtocolData,
  (file, data) =>
    getLastModified(data) || getCreated(data) || (file && file.lastModified)
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
