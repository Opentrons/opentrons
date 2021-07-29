import path from 'path'
import startCase from 'lodash/startCase'
import uniq from 'lodash/uniq'
import partition from 'lodash/partition'

import { createSelector } from 'reselect'

import { fileIsJson } from './protocol-data'
import { createLogger } from '../../logger'

import type {
  LabwareDefinition2,
  PipetteNameSpecs,
} from '@opentrons/shared-data'
import { getPipetteNameSpecs } from '@opentrons/shared-data'

import type { State } from '../types'
import type { ProtocolData, ProtocolType, ProtocolFile } from './types'
import * as PipetteConstants from '../pipettes/constants'

type ProtocolInfoSelector = (
  state: State
) => {
  protocolName: string | null
  lastModified: number | null
  appName: string | null
  appVersion: string | null
}

const log = createLogger(__filename)
const stripDirAndExtension = (f: string): string =>
  path.basename(f, path.extname(f))

export const getProtocolFile = (state: State): ProtocolFile | null =>
  state.protocol.file
export const getProtocolContents = (state: State): string | null =>
  state.protocol.contents

export const getProtocolData = (state: State): ProtocolData | null =>
  state.protocol.data

export const getProtocolFilename: (
  state: State
) => string | null = createSelector(getProtocolFile, file => file?.name ?? null)

// TODO: (ka 2019-06-11): Investigate removing this unused? selector
// export const getProtocolLastModified: NumberSelector = createSelector(
//   getProtocolFile,
//   file => file && file.lastModified
// )

interface LabwareDefinitionBySlotMap {
  [slot: string]: LabwareDefinition2 | null | undefined
}

export const getLabwareDefBySlot: (
  state: State
) => LabwareDefinitionBySlotMap = createSelector(getProtocolData, data => {
  if (data && 'labwareDefinitions' in data && 'labware' in data) {
    const labwareById = data.labware
    const labwareDefinitions = data.labwareDefinitions

    return Object.keys(labwareById).reduce(
      (defsBySlot: LabwareDefinitionBySlotMap, labwareId: string) => {
        const labware = labwareById[labwareId]
        let slot: string =
          // @ts-expect-error(sa, 2021-05-12): data has been type narrowed to be Readonly<ProtocolFileV3<{}>>, which does not have modules
          data.modules && labware.slot in data.modules
            ? // @ts-expect-error(sa, 2021-05-12): data has been type narrowed to be Readonly<ProtocolFileV3<{}>>, which does not have modules
              data.modules[labware.slot].slot
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
})

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
    const metadata: any | null | undefined = _data.metadata

    const protocolName =
      metadata?.protocolName ?? metadata?.['protocol-name'] ?? basename

    const lastModified =
      metadata?.lastModified ??
      metadata?.['last-modified'] ??
      metadata?.created ??
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

export const getProtocolName: (state: State) => string | null = createSelector(
  getProtocolDisplayData,
  displayData => displayData.protocolName
)

export const getProtocolAuthor: (
  state: State
) => string | null = createSelector(
  getProtocolData,
  data => (data?.metadata?.author as string) ?? null
)

export const getProtocolDescription: (
  state: State
) => string | null = createSelector(
  getProtocolData,
  data => (data?.metadata?.description as string) ?? null
)

export const getProtocolSource: (
  state: State
) => string | null = createSelector(getProtocolData, data => {
  return data !== null &&
    'metadata' in data &&
    'source' in data.metadata &&
    typeof data.metadata.source === 'string'
    ? data.metadata.source
    : null
})

export const getProtocolLastUpdated: (
  state: State
) => number | null = createSelector(
  getProtocolFile,
  getProtocolDisplayData,
  (file, displayData) => displayData.lastModified ?? file?.lastModified ?? null
)

export const getProtocolType: (
  state: State
) => ProtocolType | null = createSelector(
  getProtocolFile,
  file => file?.type || null
)

export const getProtocolCreatorApp: (
  state: State
) => {
  name: string | null
  version: string | null
} = createSelector(getProtocolDisplayData, displayData => {
  return {
    name: displayData.appName,
    version: displayData.appVersion,
  }
})

export const getProtocolApiVersion = (state: State): string | null => {
  // TODO(mc, 2019-11-26): did not import due to circular dependency
  // protocol API level should probably be part of protocol state
  const level = state.robot.session.apiLevel

  return level != null ? level.join('.') : null
}

const METHOD_OT_API = 'Python Protocol API'
const METHOD_UNKNOWN = 'Unknown Application'

export const getProtocolMethod: (
  state: State
) => string | null = createSelector(
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

export interface ProtocolLabwareData {
  pipetteKey: string
  mount: typeof PipetteConstants.LEFT | typeof PipetteConstants.RIGHT
  pipetteSpecs: PipetteNameSpecs
  tipracks: LabwareDefinition2[]
}

export const getProtocolLabwareData: (
  state: State
) => ProtocolLabwareData[] = createSelector(getProtocolData, protocolData => {
  // where are the type definitions of these protocol data objects?
  const { pipettes, labwareDefinitions, commands } = protocolData
  const tipRackCommands = commands.filter(
    commandObject => commandObject.command === 'pickUpTip'
  )
  const protocolPipetteValues = Object.values(pipettes)
  const protocolPipetteKeys = Object.keys(pipettes)

  const pipetteData: ProtocolLabwareData[] = []

  protocolPipetteValues.forEach((pipette, index) => {
    const pipetteObject = {
      pipetteKey: protocolPipetteKeys[index],
      mount: pipette.mount,
      pipetteSpecs: getPipetteNameSpecs(pipette.name),
      tipracks: [],
    }
    pipetteData.push(pipetteObject)
  })

  const [tipracks] = partition(
    labwareDefinitions,
    lw => lw.parameters.isTiprack
  )

  pipetteData.forEach(pipette => {
    tipRackCommands.forEach(command => {
      if (pipette.pipetteKey === command.params.pipette) {
        const tiprackDefinition = tipracks.find(tiprack =>
          command.params.labware.includes(tiprack.parameters.loadName)
        )
        pipette.tipracks.push(tiprackDefinition)
      }
      pipette.tipracks = uniq(pipette.tipracks)
    })
  })

  return pipetteData
})
