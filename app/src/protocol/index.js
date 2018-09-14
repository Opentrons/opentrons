// @flow
// protocol state and loading actions
import path from 'path'
import startCase from 'lodash/startCase'
import {createSelector} from 'reselect'
import {getter} from '@thi.ng/paths'
import {
  fileToProtocolFile,
  parseProtocolData,
  fileIsJson,
  filenameToType,
} from './protocol-data'

import type {Selector} from 'reselect'
import type {State, Action, ThunkAction} from '../types'
import type {ProtocolState, ProtocolFile, ProtocolData} from './types'

export * from './types'

type OpenProtocolAction = {|
  type: 'protocol:OPEN',
  payload: {|file: ProtocolFile|},
|}

type UploadProtocolAction = {|
  type: 'protocol:UPLOAD',
  payload: {|contents: string, data: ?ProtocolData|},
  meta: {|robot: true|},
|}

export type ProtocolAction = OpenProtocolAction | UploadProtocolAction

export function openProtocol (file: File): ThunkAction {
  return dispatch => {
    const reader = new FileReader()
    const protocolFile = fileToProtocolFile(file)
    const openAction: OpenProtocolAction = {
      type: 'protocol:OPEN',
      payload: {file: protocolFile},
    }

    reader.onload = () => {
      // because we use readAsText below, reader.result will be a string
      const contents: string = (reader.result: any)
      const uploadAction: UploadProtocolAction = {
        type: 'protocol:UPLOAD',
        payload: {contents, data: parseProtocolData(protocolFile, contents)},
        meta: {robot: true},
      }

      dispatch(uploadAction)
    }

    reader.readAsText(file)
    return dispatch(openAction)
  }
}

const INITIAL_STATE = {file: null, contents: null, data: null}

export function protocolReducer (
  state: ProtocolState = INITIAL_STATE,
  action: Action
): ProtocolState {
  switch (action.type) {
    case 'protocol:OPEN':
      return {...INITIAL_STATE, ...action.payload}

    case 'protocol:UPLOAD':
      return {...state, ...action.payload}

    case 'robot:SESSION_RESPONSE': {
      const {name, protocolText: contents} = action.payload
      const file =
        !state.file || name !== state.file.name
          ? {name, type: filenameToType(name), lastModified: null}
          : state.file
      const data =
        !state.contents || contents !== state.contents
          ? parseProtocolData(file, contents)
          : state.data

      return {file, contents, data}
    }

    case 'robot:DISCONNECT_RESPONSE':
      return INITIAL_STATE
  }

  return state
}

type StringGetter = (?ProtocolData) => ?string
type NumberGetter = (?ProtocolData) => ?number
type StringSelector = Selector<State, void, ?string>
type NumberSelector = Selector<State, void, ?number>

const getName: StringGetter = getter('metadata.protocol-name')
const getAuthor: StringGetter = getter('metadata.author')
const getDesc: StringGetter = getter('metadata.description')
const getCreated: NumberGetter = getter('metadata.created')
const getLastModified: NumberGetter = getter('metadata.last-modified')
const getAppName: StringGetter = getter('designer-application.application-name')
const getAppVersion: StringGetter = getter(
  'designer-application.application-version'
)
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

export const getProtocolName: StringSelector = createSelector(
  getProtocolFilename,
  getProtocolData,
  (name, data) => getName(data) || (name && stripDirAndExtension(name))
)

export const getProtocolAuthor: StringSelector = createSelector(
  getProtocolData,
  data => getAuthor(data)
)

export const getProtocolDescription: StringSelector = createSelector(
  getProtocolData,
  data => getDesc(data)
)

export const getProtocolLastUpdated: NumberSelector = createSelector(
  getProtocolFile,
  getProtocolData,
  (file, data) =>
    getLastModified(data) || getCreated(data) || (file && file.lastModified)
)

const METHOD_OT_API = 'Opentrons API'
const METHOD_UNKNOWN = 'Unknown Application'

export const getProtocolMethod: StringSelector = createSelector(
  getProtocolFile,
  getProtocolContents,
  getProtocolData,
  (file, contents, data) => {
    const isJson = file && fileIsJson(file)
    const appName = getAppName(data)
    const appVersion = getAppVersion(data)
    const readableName = appName && startCase(appName)

    if (!file || !contents) return null
    if (isJson === true && !readableName) return METHOD_UNKNOWN
    if (!isJson) return METHOD_OT_API
    if (readableName && appVersion) return `${readableName} ${appVersion}`
    return readableName
  }
)
