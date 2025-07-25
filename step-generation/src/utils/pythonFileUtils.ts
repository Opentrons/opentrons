import max from 'lodash/max'

import {
  FLEX_ROBOT_TYPE,
  getAllLiquidClassDefs,
  getCutoutDisplayName,
  getFlexNameConversion,
  getLabwareDefIsStandard,
  getLabwareDefURI,
  isFlexPipette,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { getLiquidClassName } from './liquidClassUtils'
import { getSlotInLocationStack } from './misc'
import {
  CUSTOM_LABWARE_DICT_NAME,
  formatPyDict,
  formatPyStr,
  getChunkForIndentingLists,
  INDENT,
  indentPyLines,
  OFF_DECK,
  PROTOCOL_CONTEXT_NAME,
} from './pythonFormat'

import type { CutoutId, ProtocolFile, RobotType } from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntities,
  LabwareEntity,
  LabwareLiquidState,
  LiquidEntities,
  ModuleEntities,
  PipetteEntities,
  Timeline,
  TimelineFrame,
  TrashBinEntities,
  WasteChuteEntities,
} from '../types'

const PAPI_VERSION = '2.24' // latest version from api/src/opentrons/protocols/api_support/definitions.py
export const PD_APPLICATION_VERSION = '8.5.0' // latest PD version to insert into DESIGNER_APPLICATION blob

export function pythonImports(): string {
  return ['import json', 'from opentrons import protocol_api, types'].join('\n')
}

export function pythonMetadata(
  fileMetadata: ProtocolFile<{}>['metadata']
): string {
  // FileMetadataFields has timestamps, lists, etc., but Python metadata dict can only contain strings
  function formatTimestamp(timestamp: number | null | undefined): string {
    return timestamp ? new Date(timestamp).toISOString() : ''
  }
  const stringifiedMetadata = Object.fromEntries(
    Object.entries({
      protocolName: fileMetadata.protocolName,
      author: fileMetadata.author,
      description: fileMetadata.description,
      created: formatTimestamp(fileMetadata.created),
      lastModified: formatTimestamp(fileMetadata.lastModified),
      category: fileMetadata.category,
      subcategory: fileMetadata.subcategory,
      tags: fileMetadata.tags?.length && fileMetadata.tags.join(', '),
      protocolDesigner: process.env.OT_PD_VERSION,
      source: fileMetadata.source,
    }).filter(([key, value]) => value) // drop blank entries
  )
  return `metadata = ${formatPyDict(stringifiedMetadata)}`
}

export function pythonRequirements(robotType: RobotType): string {
  const ROBOTTYPE_TO_PAPI_NAME = {
    // values from api/src/opentrons/protocols/parse.py
    [OT2_ROBOT_TYPE]: 'OT-2',
    [FLEX_ROBOT_TYPE]: 'Flex',
  }
  const requirements = {
    robotType: ROBOTTYPE_TO_PAPI_NAME[robotType],
    apiLevel: PAPI_VERSION,
  }
  return `requirements = ${formatPyDict(requirements)}`
}

export function getLoadModules(
  moduleEntities: ModuleEntities,
  moduleRobotState: TimelineFrame['modules']
): string {
  const hasModules = Object.keys(moduleEntities).length > 0
  const pythonModules = hasModules
    ? Object.values(moduleEntities)
        .map(module => {
          // pythonIdentifier (module.model) from api/src/opentrons/protocol_api/validation.py#L373
          return `${
            module.pythonName
          } = ${PROTOCOL_CONTEXT_NAME}.load_module(${formatPyStr(
            module.model
          )}, ${formatPyStr(moduleRobotState[module.id].slot)})`
        })
        .join('\n')
    : ''
  return hasModules ? `# Load Modules:\n${pythonModules}` : ''
}

//  note: label arg is not needed since PD does not support giving an adapter
//  a nickname
export function getLoadAdapters(
  moduleEntities: ModuleEntities,
  labwareEntities: LabwareEntities,
  labwareRobotState: TimelineFrame['labware']
): string {
  const adapterEntities = Object.values(labwareEntities).filter(lw =>
    lw.def.allowedRoles?.includes('adapter')
  )
  const pythonAdapters = Object.values(adapterEntities)
    .map(adapter => {
      const { id, def, pythonName } = adapter
      const { parameters, namespace } = def
      // 2nd item in stack is the slot the adapter is on
      const adapterSlot = labwareRobotState[id].stack[1]
      const onModule = moduleEntities[adapterSlot] != null

      let parentName: string
      let locationArg: string | undefined
      if (onModule) {
        parentName = moduleEntities[adapterSlot].pythonName
      } else {
        parentName = PROTOCOL_CONTEXT_NAME
        locationArg = `location=${
          adapterSlot === 'offDeck' ? OFF_DECK : formatPyStr(adapterSlot)
        }`
      }

      const isStandard = getLabwareDefIsStandard(def)
      if (isStandard) {
        const adapterArgs = [
          `${formatPyStr(parameters.loadName)}`,
          ...(locationArg ? [locationArg] : []),
          `namespace=${formatPyStr(namespace)}`,
          //  NOTE: temporarily removing version number
          //  until PD migrated labware defs to the latest version
          //  upon re-import
          // `version=${version}`,
        ].join(',\n')
        return (
          `${pythonName} = ${parentName}.load_adapter(\n` +
          `${indentPyLines(adapterArgs)},\n` +
          `)`
        )
      } else {
        // custom adapter
        const adapterArgs = [
          `${CUSTOM_LABWARE_DICT_NAME}[${formatPyStr(getLabwareDefURI(def))}]`,
          ...(locationArg ? [locationArg] : []),
        ].join(',\n')
        return (
          `${pythonName} = ${parentName}.load_adapter_from_definition(\n` +
          `${indentPyLines(adapterArgs)},\n` +
          `)`
        )
      }
    })
    .join('\n')

  return pythonAdapters ? `# Load Adapters:\n${pythonAdapters}` : ''
}

const _getLidStacks = (
  lidEntities: LabwareEntity[],
  allLabwareEntities: LabwareEntities,
  labwareState: TimelineFrame['labware']
): Record<string, { loadName: string; quantity: number }> =>
  lidEntities.reduce<Record<string, { loadName: string; quantity: number }>>(
    (acc, { id, labwareDefURI, def }) => {
      const { stack } = labwareState[id]
      const nonSlotStackLength = stack.length - 1
      const parentLabware = stack.slice(1, nonSlotStackLength) // excluding stack
      const isLidStack = parentLabware.every(
        parentLabwareId =>
          allLabwareEntities[parentLabwareId].labwareDefURI === labwareDefURI
      )
      const loadName = def.parameters.loadName
      if (!isLidStack) {
        return acc
      }
      const lidSlot = getSlotInLocationStack(stack)
      if (!(lidSlot in acc)) {
        return {
          ...acc,
          [lidSlot]: { loadName, quantity: nonSlotStackLength },
        }
      }
      const { quantity } = acc[lidSlot]
      const newQuantity = max([quantity, nonSlotStackLength]) ?? quantity
      return { ...acc, [lidSlot]: { loadName, quantity: newQuantity } }
    },
    {}
  )

export const getLoadLidStacks = (
  allLabwareEntities: LabwareEntities,
  labwareRobotState: TimelineFrame['labware']
): string => {
  const lidEntities = Object.values(allLabwareEntities).filter(lw =>
    lw.def.allowedRoles?.includes('lid')
  )

  // store quantity here
  const lidStacks = _getLidStacks(
    lidEntities,
    allLabwareEntities,
    labwareRobotState
  )

  const pythonLidStacks = Object.entries(lidStacks)
    .map<string>(([slot, { loadName, quantity }]) => {
      const loadNameArg = `load_name=${formatPyStr(loadName)}`
      const locationArg = `location=${formatPyStr(slot)}`
      const quantityArg = `quantity=${quantity}`
      const allArgs = [loadNameArg, locationArg, quantityArg].join(',\n')
      const allArgsIndented = indentPyLines(allArgs)
      return (
        `lid_stack_${slot} = ${PROTOCOL_CONTEXT_NAME}.load_lid_stack(\n` +
        `${allArgsIndented},\n` +
        `)`
      )
    })
    .join('\n')
  return pythonLidStacks ? `# Load Lid Stacks:\n${pythonLidStacks}` : ''
}

export function getLoadLabware(
  moduleEntities: ModuleEntities,
  allLabwareEntities: LabwareEntities,
  labwareRobotState: TimelineFrame['labware'],
  labwareNicknamesById: Record<string, string>
): string {
  const labwareEntities = Object.values(allLabwareEntities).filter(
    lw =>
      !lw.def.allowedRoles?.includes('adapter') &&
      !lw.def.allowedRoles?.includes('lid')
  )
  const lidEntities = Object.values(allLabwareEntities).filter(lw =>
    lw.def.allowedRoles?.includes('lid')
  )

  const pythonLabware = Object.values(labwareEntities)
    .reduce<string[]>((acc, labware) => {
      const { id, def, pythonName } = labware
      const { metadata, parameters, namespace } = def
      const lidEntity = Object.values(lidEntities).find(
        lid => labwareRobotState[lid.id].stack[1] === id
      )

      const hasNickname =
        labwareNicknamesById[id] != null &&
        labwareNicknamesById[id] !== metadata.displayName
      // 2nd item in stack is the slot the labware is on
      const labwareSlot = labwareRobotState[id].stack[1]
      const onModule = moduleEntities[labwareSlot] != null
      const onAdapter = allLabwareEntities[labwareSlot] != null

      let parentName: string
      let locationArg: string | undefined
      if (onAdapter) {
        parentName = allLabwareEntities[labwareSlot].pythonName
      } else if (onModule) {
        parentName = moduleEntities[labwareSlot].pythonName
      } else {
        parentName = PROTOCOL_CONTEXT_NAME
        locationArg = `location=${
          labwareSlot === 'offDeck' ? OFF_DECK : formatPyStr(labwareSlot)
        }`
      }
      const labelArg = hasNickname
        ? `label=${formatPyStr(labwareNicknamesById[id])}`
        : undefined

      const isStandard = getLabwareDefIsStandard(def)
      if (isStandard) {
        const loadLabwareArgs = [
          `${formatPyStr(parameters.loadName)}`,
          ...(locationArg ? [locationArg] : []),
          ...(labelArg ? [labelArg] : []),
          `namespace=${formatPyStr(namespace)}`,
          ...(lidEntity != null
            ? [`lid=${formatPyStr(lidEntity.def.parameters.loadName)}`]
            : []),
          //  NOTE: temporarily removing version number
          //  until PD migrated labware defs to the latest version
          //  upon re-import
          // `version=${version}`,
        ].join(',\n')
        return [
          ...acc,
          `${pythonName} = ${parentName}.load_labware(\n` +
            `${indentPyLines(loadLabwareArgs)},\n` +
            `)`,
        ]
      } else {
        // custom labware
        const loadFromDefnArgs = [
          `${CUSTOM_LABWARE_DICT_NAME}[${formatPyStr(getLabwareDefURI(def))}]`,
          ...(locationArg ? [locationArg] : []),
          ...(labelArg ? [labelArg] : []),
        ].join(',\n')
        return [
          ...acc,
          `${pythonName} = ${parentName}.load_labware_from_definition(\n` +
            `${indentPyLines(loadFromDefnArgs)},\n` +
            `)`,
        ]
      }
    }, [])
    .join('\n')

  return pythonLabware ? `# Load Labware:\n${pythonLabware}` : ''
}

export function getLoadPipettes(
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities,
  labwareRobotState: TimelineFrame['labware'],
  pipetteRobotState: TimelineFrame['pipettes']
): string {
  const pythonPipette = Object.values(pipetteEntities)
    .map(pipette => {
      const { name, id, spec, pythonName, tiprackDefURI } = pipette
      const mount =
        spec.channels === 96 ? '' : formatPyStr(pipetteRobotState[id].mount)
      const pipetteName = isFlexPipette(name)
        ? getFlexNameConversion(spec)
        : name
      const allTipracks = tiprackDefURI.reduce(
        (acc: LabwareEntity[], defURI) => {
          for (const lw of Object.values(labwareEntities)) {
            if (lw.labwareDefURI === defURI) {
              acc.push(lw)
            }
          }
          return acc
        },
        []
      )
      const onDeckTipracks = allTipracks.filter(
        tiprack =>
          getSlotInLocationStack(labwareRobotState[tiprack.id].stack) !==
          'offDeck'
      )
      const offDeckTipracks = allTipracks.filter(
        tiprack =>
          getSlotInLocationStack(labwareRobotState[tiprack.id].stack) ===
          'offDeck'
      )
      const tiprackPythonNames = [...onDeckTipracks, ...offDeckTipracks]
        .map(tiprack => tiprack.pythonName)
        .join(', ')
      const pythonTipRacks =
        tiprackDefURI.length === 0 ? '' : `tip_racks=[${tiprackPythonNames}]`

      return (
        `${pythonName} = ${PROTOCOL_CONTEXT_NAME}.load_instrument(\n` +
        `${indentPyLines(
          [
            formatPyStr(pipetteName),
            ...(mount ? [mount] : []),
            ...(pythonTipRacks ? [pythonTipRacks] : []),
          ].join(', ')
        )},\n` +
        ')'
      )
    })
    .join('\n')

  return pythonPipette ? `# Load Pipettes:\n${pythonPipette}` : ''
}

export function getDefineLiquids(liquidEntities: LiquidEntities): string {
  const pythonDefineLiquids = Object.values(liquidEntities)
    .map(liquid => {
      const { pythonName, displayColor, displayName, description } = liquid
      const liquidArgs = [
        `${formatPyStr(displayName)}`,
        ...(description ? [`description=${formatPyStr(description)}`] : []),
        `display_color=${formatPyStr(displayColor)}`,
      ].join(',\n')

      return (
        `${pythonName} = ${PROTOCOL_CONTEXT_NAME}.define_liquid(\n` +
        `${indentPyLines(liquidArgs)},\n` +
        `)`
      )
    })
    .join('\n')
  return pythonDefineLiquids ? `# Define Liquids:\n${pythonDefineLiquids}` : ''
}

export function getLoadLiquids(
  liquidsByLabwareId: LabwareLiquidState,
  liquidEntities: LiquidEntities,
  labwareEntities: LabwareEntities
): string {
  const groupedLiquids = Object.entries(liquidsByLabwareId).reduce(
    (
      acc: Record<
        string,
        {
          labwarePythonName: string
          liquidPythonName: string
          volume: number
          wells: string[]
        }
      >,
      [labwareId, liquidState]
    ) => {
      const labwarePythonName = labwareEntities[labwareId].pythonName

      Object.entries(liquidState).forEach(([well, locationState]) => {
        Object.entries(locationState).forEach(([liquidGroupId, volumeInfo]) => {
          const liquidPythonName = liquidEntities[liquidGroupId].pythonName

          const key = `${labwarePythonName}__${liquidPythonName}__${volumeInfo.volume}`
          if (!acc[key]) {
            acc[key] = {
              labwarePythonName,
              liquidPythonName,
              volume: volumeInfo.volume,
              wells: [],
            }
          }
          acc[key].wells.push(well)
        })
      })

      return acc
    },
    {}
  )

  const pythonLoadLiquids = Object.values(groupedLiquids)
    .map(({ labwarePythonName, liquidPythonName, volume, wells }) => {
      const formattedWells = wells.map(w => formatPyStr(w))
      const wellChunks = getChunkForIndentingLists(formattedWells, 8)

      const indentedWells = wellChunks
        .map(chunk => INDENT + chunk.join(', '))
        .join(',\n')

      const pythonWells =
        formattedWells.length < 8
          ? formattedWells.join(', ')
          : `\n${indentedWells}\n`

      const loadLiquidArgs = [
        `wells=[${pythonWells}],\n` +
          `liquid=${liquidPythonName},\n` +
          `volume=${volume},\n`,
      ].join()

      return (
        `${labwarePythonName}.load_liquid(\n` +
        `${indentPyLines(loadLiquidArgs)}` +
        `)`
      )
    })
    .join('\n')
  return pythonLoadLiquids ? `# Load Liquids:\n${pythonLoadLiquids}` : ''
}

export function getLoadLiquidClasses(
  allUniqueLiquidClassesFromForms: string[]
): string {
  const allLiquidClassDefs = getAllLiquidClassDefs()
  const pythonLoadLiquidClasses = allUniqueLiquidClassesFromForms
    .map(liquidClass => {
      if (liquidClass == null) {
        return ''
      }
      return `${getLiquidClassName(
        liquidClass,
        true
      )} = ${PROTOCOL_CONTEXT_NAME}.get_liquid_class(${formatPyStr(
        allLiquidClassDefs[liquidClass].liquidClassName
      )})`
    })
    .join('\n')

  return allUniqueLiquidClassesFromForms.length > 0
    ? `# Load Liquid Classes:\n${pythonLoadLiquidClasses}`
    : ''
}

export function getLoadTrashBins(trashBinEntities: TrashBinEntities): string {
  const pythonLoadTrashBins = Object.values(trashBinEntities)
    ?.map(trashBin => {
      const location = formatPyStr(
        getCutoutDisplayName(trashBin.location as CutoutId)
      )
      return `${trashBin.pythonName} = ${PROTOCOL_CONTEXT_NAME}.load_trash_bin(${location})`
    })
    .join('\n')

  return pythonLoadTrashBins ? `# Load Trash Bins:\n${pythonLoadTrashBins}` : ''
}

export function getLoadWasteChute(
  wasteChuteEntities: WasteChuteEntities
): string {
  const pythonLoadWasteChute = Object.values(wasteChuteEntities)?.map(
    wasteChute =>
      `${wasteChute.pythonName} = ${PROTOCOL_CONTEXT_NAME}.load_waste_chute()`
  )

  return pythonLoadWasteChute.length > 0
    ? `# Load Waste Chute:\n${pythonLoadWasteChute}`
    : ''
}

export function stepCommands(robotStateTimeline: Timeline): string {
  return (
    '# PROTOCOL STEPS\n\n' +
    robotStateTimeline.timeline
      .map(
        (timelineFrame, idx) =>
          `# Step ${idx + 1}:\n${timelineFrame.python || 'pass'}`
      )
      .join('\n\n')
  )
}

export function pythonDefRun(
  invariantContext: InvariantContext,
  robotState: TimelineFrame,
  robotStateTimeline: Timeline,
  liquidsByLabwareId: LabwareLiquidState,
  labwareNicknamesById: Record<string, string>,
  robotType: RobotType,
  allUniqueLiquidClassesFromForms: string[]
): string {
  const {
    moduleEntities,
    labwareEntities,
    pipetteEntities,
    liquidEntities,
    wasteChuteEntities,
    trashBinEntities,
  } = invariantContext
  const { modules, labware, pipettes } = robotState
  const sections: string[] = [
    getLoadModules(moduleEntities, modules),
    getLoadAdapters(moduleEntities, labwareEntities, labware),
    getLoadLidStacks(labwareEntities, labware),
    getLoadLabware(
      moduleEntities,
      labwareEntities,
      labware,
      labwareNicknamesById
    ),
    getLoadPipettes(pipetteEntities, labwareEntities, labware, pipettes),
    ...(robotType === FLEX_ROBOT_TYPE
      ? [
          getLoadTrashBins(trashBinEntities),
          getLoadWasteChute(wasteChuteEntities),
        ]
      : []),
    getDefineLiquids(liquidEntities),
    getLoadLiquids(liquidsByLabwareId, liquidEntities, labwareEntities),
    getLoadLiquidClasses(allUniqueLiquidClassesFromForms),
    stepCommands(robotStateTimeline),
  ]
  const functionBody =
    sections
      .filter(section => section) // skip empty sections
      .join('\n\n') || 'pass'
  return (
    `def run(${PROTOCOL_CONTEXT_NAME}: protocol_api.ProtocolContext) -> None:\n` +
    `${indentPyLines(functionBody)}`
  )
}

export function pythonCustomLabwareDict(
  labwareEntities: LabwareEntities
): string {
  const customLabwareDefs = Object.values(labwareEntities)
    .filter(labwareEntity => !getLabwareDefIsStandard(labwareEntity.def))
    .map(labwareEntity => labwareEntity.def)
  if (customLabwareDefs.length > 0) {
    const customLabwareDict = Object.fromEntries(
      customLabwareDefs.map(labwareDef => [
        getLabwareDefURI(labwareDef),
        labwareDef,
      ])
    )
    return `${CUSTOM_LABWARE_DICT_NAME} = json.loads("""${JSON.stringify(
      customLabwareDict
    )}""")`
  } else {
    return ''
  }
}
