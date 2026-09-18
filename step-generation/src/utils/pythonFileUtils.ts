import max from 'lodash/max'

import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getAllLiquidClassDefs,
  getCutoutDisplayName,
  getFlexNameConversion,
  getLabwareDefIsStandard,
  getLabwareDefURI,
  isFlexPipette,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import {
  HOPPER_STACKER_LOCATION,
  VACUUM_DOCK_ADDRESSABLE_AREA,
} from '../constants'
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

import type {
  CutoutId,
  LabwareDefinition2,
  ProtocolFile,
  RobotType,
} from '@opentrons/shared-data'
import type {
  ChangeTipOptions,
  InvariantContext,
  LabwareEntities,
  LabwareEntity,
  LabwareLiquidState,
  LabwareTemporalProperties,
  LiquidEntities,
  ModuleEntities,
  ModuleTemporalProperties,
  PipetteEntities,
  Timeline,
  TimelineFrame,
  TrashBinEntities,
  WasteChuteEntities,
} from '../types'

export const PAPI_VERSION = '2.30' // oldest version that we need from api/src/opentrons/protocols/api_support/definitions.py, might not be the actual latest version
export const PD_APPLICATION_VERSION = '9.0.1' // latest PD version to insert into DESIGNER_APPLICATION blob

export function pythonImports(): string {
  return ['import json', 'from opentrons import protocol_api, types'].join('\n')
}

export function pythonMetadata(
  fileMetadata: ProtocolFile<{}>['metadata'] & { protocolDesigner?: string } & {
    internalAppBuildDate?: string
  }
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
      internalAppBuildDate: fileMetadata.internalAppBuildDate,
      lastModified: formatTimestamp(fileMetadata.lastModified),
      category: fileMetadata.category,
      subcategory: fileMetadata.subcategory,
      tags: fileMetadata.tags?.length && fileMetadata.tags.join(', '),
      protocolDesigner: fileMetadata.protocolDesigner,
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
      const { parameters, namespace, version } = def

      const adapterSlot = labwareRobotState[id].stack[1]
      const adapterModuleId = labwareRobotState[id].stack.find(
        entityId => entityId in moduleEntities
      )
      const isOnVacuumDock = labwareRobotState[id].stack.some(
        element => element === VACUUM_DOCK_ADDRESSABLE_AREA
      )

      let parentName: string
      let locationArg: string | null = null
      if (adapterModuleId != null) {
        const adapterModule = moduleEntities[adapterModuleId]
        ;[parentName, locationArg] = isOnVacuumDock
          ? [
              PROTOCOL_CONTEXT_NAME,
              `location=${adapterModule.pythonName}.manifold_dock`,
            ]
          : [adapterModule.pythonName, null]
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
          `version=${version}`,
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
      const deckRiserParentLabware = parentLabware.find(
        parentLabwareId =>
          allLabwareEntities[parentLabwareId]?.def.parameters.loadName ===
          'opentrons_flex_deck_riser'
      )
      const isLidStack =
        parentLabware.every(
          parentLabwareId =>
            allLabwareEntities[parentLabwareId]?.labwareDefURI === labwareDefURI
        ) || deckRiserParentLabware != null

      const loadName = def.parameters.loadName
      if (!isLidStack) {
        return acc
      }
      const lidSlot =
        deckRiserParentLabware != null
          ? allLabwareEntities[deckRiserParentLabware]?.pythonName
          : getSlotInLocationStack(stack)
      const nonSlotAndAdapterLength =
        stack.length - (deckRiserParentLabware != null ? 2 : 1)

      if (!(lidSlot in acc)) {
        return {
          ...acc,
          [lidSlot]: { loadName, quantity: nonSlotAndAdapterLength },
        }
      }
      const { quantity } = acc[lidSlot]
      const newQuantity = max([quantity, nonSlotAndAdapterLength]) ?? quantity
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
    .map<string>(([location, { loadName, quantity }]) => {
      const isLidSlotOnAdapter = Object.values(allLabwareEntities).some(
        ({ pythonName }) => pythonName === location
      )
      const loadNameArg = `load_name=${formatPyStr(loadName)}`
      const locationArg = `location=${
        isLidSlotOnAdapter ? location : formatPyStr(location)
      }`
      const quantityArg = `quantity=${quantity}`
      const allArgs = [loadNameArg, locationArg, quantityArg].join(',\n')
      const allArgsIndented = indentPyLines(allArgs)
      return (
        `lid_stack_${location} = ${PROTOCOL_CONTEXT_NAME}.load_lid_stack(\n` +
        `${allArgsIndented},\n` +
        `)`
      )
    })
    .join('\n')
  return pythonLidStacks ? `# Load Lid Stacks:\n${pythonLidStacks}` : ''
}

const getFormatLidParams = (def: LabwareDefinition2): string[] => {
  const { parameters, namespace, version } = def
  return [
    `lid=${formatPyStr(parameters.loadName)}`,
    `lid_namespace=${formatPyStr(namespace)}`,
    `lid_version=${version}`,
  ]
}

export function getLoadLabware(
  moduleRobotState: TimelineFrame['modules'],
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
      const { metadata, parameters, namespace, version } = def
      const lidEntity = Object.values(lidEntities).find(
        lid => labwareRobotState[lid.id].stack[1] === id
      )

      const hasNickname =
        labwareNicknamesById[id] != null &&
        labwareNicknamesById[id] !== metadata.displayName
      const isLabwareOnHopper = labwareRobotState[id].stack.includes(
        HOPPER_STACKER_LOCATION
      )
      // 2nd item in stack is the slot the labware is on
      const labwareSlot = labwareRobotState[id].stack[1]
      // this is the deck slot that the labware is on
      const deckSlot = getSlotInLocationStack(labwareRobotState[id].stack)
      const stackerOnSlot = Object.entries(moduleRobotState).find(
        ([id, module]) =>
          module.slot === deckSlot &&
          module.moduleState.type === FLEX_STACKER_MODULE_TYPE
      )
      const onModule =
        moduleEntities[labwareSlot] != null ||
        (deckSlot === stackerOnSlot?.[1].slot && !isLabwareOnHopper) // special case stacker shuttle labware
      const onLabware = allLabwareEntities[labwareSlot] != null

      let parentName: string
      let locationArg: string | undefined
      if (onLabware && !isLabwareOnHopper) {
        parentName = allLabwareEntities[labwareSlot].pythonName
      } else if (onModule) {
        const moduleId =
          stackerOnSlot != null ? stackerOnSlot?.[0] : labwareSlot
        parentName = moduleEntities[moduleId].pythonName
      } else {
        parentName = PROTOCOL_CONTEXT_NAME
        locationArg = `location=${
          labwareSlot === 'offDeck' || isLabwareOnHopper
            ? OFF_DECK
            : formatPyStr(labwareSlot)
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
          `version=${version}`,
          ...(lidEntity != null ? getFormatLidParams(lidEntity.def) : []),
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
  pipetteRobotState: TimelineFrame['pipettes']
): string {
  const pythonPipette = Object.values(pipetteEntities)
    .map(pipette => {
      const { name, id, spec, pythonName } = pipette
      const mount =
        spec.channels === 96 ? '' : formatPyStr(pipetteRobotState[id].mount)
      const pipetteName = isFlexPipette(name)
        ? getFlexNameConversion(spec)
        : name

      return (
        `${pythonName} = ${PROTOCOL_CONTEXT_NAME}.load_instrument(` +
        `${[formatPyStr(pipetteName), ...(mount ? [mount] : [])].join(', ')}` +
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

const formatDescription = (description?: string | null): string => {
  if (!description) {
    return ''
  }
  return (
    `\n` +
    description
      .split(/\r\n|\r|\n/)
      .map(line => `# ${line}`)
      .join('\n')
  )
}

export function stepCommands(robotStateTimeline: Timeline): string {
  return (
    '# PROTOCOL STEPS\n\n' +
    robotStateTimeline.timeline
      .map(timelineFrame => {
        const { stepInfo } = timelineFrame
        const description = stepInfo?.description
        return `# Step ${stepInfo?.stepNumber}: ${
          stepInfo?.name
        }${formatDescription(description)}\n${timelineFrame.python || 'pass'}`
      })
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
      modules,
      moduleEntities,
      labwareEntities,
      labware,
      labwareNicknamesById
    ),
    getLoadPipettes(pipetteEntities, pipettes),
    ...(robotType === FLEX_ROBOT_TYPE
      ? [
          getLoadTrashBins(trashBinEntities),
          getLoadWasteChute(wasteChuteEntities),
        ]
      : []),
    getDefineLiquids(liquidEntities),
    getLoadLiquids(liquidsByLabwareId, liquidEntities, labwareEntities),
    getLoadLiquidClasses(allUniqueLiquidClassesFromForms),
    getSetStoredLabware(
      moduleEntities,
      labwareEntities,
      labware,
      modules,
      robotStateTimeline
    ),
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

export const formatChangeTipArg = (changeTip: ChangeTipOptions): string => {
  switch (changeTip) {
    case 'perDest': {
      return 'per destination'
    }
    case 'perSource': {
      return 'per source'
    }
    default: {
      return changeTip
    }
  }
}
export const getSetStoredLabware = (
  moduleEntities: ModuleEntities,
  labwareEntities: LabwareEntities,
  labware: { [labwareId: string]: LabwareTemporalProperties },
  modules: { [moduleId: string]: ModuleTemporalProperties },
  robotStateTimeline: Timeline
): string => {
  const pythonSetStoredLabware = Object.values(moduleEntities).map(module => {
    const { id, type, pythonName } = module

    if (type === FLEX_STACKER_MODULE_TYPE) {
      const moduleSlot = modules[id].slot
      const allLabwareState = robotStateTimeline.timeline.map(
        timeline => timeline.robotState.labware
      )
      const labwaresOnHopper = Object.entries(labware).filter(
        ([_, labware]) =>
          labware.stack.includes(id) &&
          labware.stack.includes(HOPPER_STACKER_LOCATION)
      )
      // include initialDeckState and all future states in the protocol
      const allLabwaresThatAppearOnShuttle = [
        ...Object.entries(labware),
        ...allLabwareState.flatMap(labwareMap => Object.entries(labwareMap)),
      ].filter(
        ([_, labware]) =>
          getSlotInLocationStack(labware.stack) === moduleSlot &&
          !labware.stack.includes(HOPPER_STACKER_LOCATION)
      )

      // TODO: this doesn't address adapters in the shuttle yet since we dont allow that
      // as of 1/9/26
      if (labwaresOnHopper.length === 0) {
        if (allLabwaresThatAppearOnShuttle.length === 0) {
          return ''
        }

        const lid = allLabwaresThatAppearOnShuttle.find(([id]) =>
          labwareEntities[id].def.allowedRoles?.includes('lid')
        )

        const nonLid = allLabwaresThatAppearOnShuttle.find(
          ([id]) => !labwareEntities[id].def.allowedRoles?.includes('lid')
        )

        if (nonLid == null) {
          return ''
        }

        const pythonArgs = [
          `load_name=${formatPyStr(
            labwareEntities[nonLid[0]].def.parameters.loadName
          )}`,
          `namespace=${formatPyStr(labwareEntities[nonLid[0]].def.namespace)}`,
          `version=${labwareEntities[nonLid[0]].def.version}`,
          'count=0',
          ...(lid != null
            ? [
                `lid=${formatPyStr(
                  labwareEntities[lid[0]].def.parameters.loadName
                )}`,
              ]
            : []),
        ].join(',\n')

        return `${pythonName}.set_stored_labware(\n${indentPyLines(pythonArgs)}\n)`
      } else {
        const labwarePythonNames = Object.values(labwaresOnHopper)
          .filter(labware => {
            const allowedRoles = labwareEntities[labware[0]]?.def.allowedRoles
            return !allowedRoles?.includes('lid')
          })
          .map(labware => labwareEntities[labware[0]].pythonName)
        const labwareChunks = getChunkForIndentingLists(labwarePythonNames, 4)

        const indentedLabwarePythonNames = labwareChunks
          .map(chunk => INDENT + chunk.join(', '))
          .join(',\n')

        const pythonLabwareNames =
          labwarePythonNames.length < 4
            ? labwarePythonNames.join(', ')
            : `\n${indentedLabwarePythonNames}\n`
        const pythonArgs = `labware=[${pythonLabwareNames}],\n`

        return `${pythonName}.set_stored_labware_items(\n${indentPyLines(pythonArgs)})`
      }
    }
  })

  //  filter any empty strings
  const pythonLines = pythonSetStoredLabware.filter(Boolean)

  return pythonLines.length > 0
    ? `# Set Stored Labware:\n${pythonLines.join('\n').trimStart()}`
    : ''
}
