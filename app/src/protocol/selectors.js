// @flow
import path from 'path'
import startCase from 'lodash/startCase'

import { createSelector } from 'reselect'

import { fileIsJson } from './protocol-data'
import { createLogger } from '../logger'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { State } from '../types'
import type { ProtocolData, ProtocolType, ProtocolFile } from './types'

type ProtocolInfoSelector = State => {|
  protocolName: string | null,
  lastModified: number | null,
  appName: string | null,
  appVersion: string | null,
|}

const log = createLogger(__filename)
const stripDirAndExtension = f => path.basename(f, path.extname(f))

export const getProtocolFile = (state: State): ProtocolFile | null =>
  state.protocol.file
export const getProtocolContents = (state: State): string | null =>
  state.protocol.contents
export const getProtocolData = (state: State): ProtocolData | null =>
  state.protocol.data

export const getProtocolFilename: State => string | null = createSelector(
  getProtocolFile,
  file => file?.name ?? null
)

// TODO: (ka 2019-06-11): Investigate removing this unused? selector
// export const getProtocolLastModified: NumberSelector = createSelector(
//   getProtocolFile,
//   file => file && file.lastModified
// )

type LabwareDefinitionBySlotMap = {
  [slot: string]: LabwareDefinition2 | void,
  ...,
}

export const getLabwareDefBySlot: State => LabwareDefinitionBySlotMap = createSelector(
  getProtocolData,
  data => {
    if (data !== null && data.labwareDefinitions) {
      const labwareById = data.labware
      const labwareDefinitions = data.labwareDefinitions

      return Object.keys(labwareById).reduce(
        (defsBySlot: LabwareDefinitionBySlotMap, labwareId: string) => {
          const labware = labwareById[labwareId]
          let slot: string =
            data.modules && labware.slot in data.modules
              ? data.modules[labware.slot].slot
              : labware.slot

          // TODO(mc, 2020-08-04): this is for thermocycler support, and its
          // ugliness is due to deficiences in RPC-based labware state
          // revisit as part of Protocol Sessions project
          if (slot === 'span7_8_10_11') slot = '7'

          if (slot in defsBySlot) {
            log.warn(
              `expected 1 labware per slot, slot ${slot} contains multiple labware`
            )
          }

          defsBySlot[slot] = labwareDefinitions[labware.definitionId]
          return defsBySlot
        },
        {}
      )
    }
    return {}
  }
)

export const getProtocolDisplayData: ProtocolInfoSelector = createSelector(
  getProtocolData,
  getProtocolFilename,
  (_data, name) => {
    const basename = name ? stripDirAndExtension(name) : null

    if (!_data) {
      return {
        protocolName: basename,
        lastModified: null,
        appName: null,
        appVersion: null,
      }
    }

    // TODO(mc, 2020-08-04): this typing doesn't behave; put data access behind
    // a unit tested utility that migrates all data patterns up to latest schema
    const data: any = _data

    const protocolName =
      data.metadata.protocolName ?? data.metadata['protocol-name'] ?? basename

    const lastModified =
      data.metadata.lastModified ??
      data.metadata['last-modified'] ??
      data.metadata.created ??
      null

    const appName =
      data.designerApplication?.name ??
      data['designer-application']?.['application-name'] ??
      null

    const appVersion =
      data.designerApplication?.version ??
      data['designer-application']?.['application-version'] ??
      null

    return {
      protocolName: protocolName,
      lastModified: lastModified,
      appName: appName,
      appVersion: appVersion,
    }
  }
)

export const getProtocolName: State => string | null = createSelector(
  getProtocolDisplayData,
  displayData => displayData.protocolName
)

export const getProtocolAuthor: State => string | null = createSelector(
  getProtocolData,
  data => data?.metadata.author ?? null
)

export const getProtocolDescription: State => string | null = createSelector(
  getProtocolData,
  data => data?.metadata.description ?? null
)

export const getProtocolSource: State => string | null = createSelector(
  getProtocolData,
  data => {
    return typeof data?.metadata.source === 'string'
      ? data.metadata.source
      : null
  }
)

export const getProtocolLastUpdated: State => number | null = createSelector(
  getProtocolFile,
  getProtocolDisplayData,
  (file, displayData) => displayData.lastModified ?? file?.lastModified ?? null
)

export const getProtocolType: State => ProtocolType | null = createSelector(
  getProtocolFile,
  file => file?.type || null
)

export const getProtocolCreatorApp: State => {|
  name: string | null,
  version: string | null,
|} = createSelector(
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

export const getProtocolMethod: State => string | null = createSelector(
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
