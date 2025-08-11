import flatMap from 'lodash/flatMap'
import uuidv1 from 'uuid/v4'

import {
  FLEX_ROBOT_TYPE,
  FLEX_STANDARD_DECKID,
  getAllLiquidClassDefs,
  getFlexNameConversion,
} from '@opentrons/shared-data'
import {
  getLiquidClassName,
  getSlotInLocationStack,
  pythonImports,
  pythonMetadata,
  pythonRequirements,
} from '@opentrons/step-generation'

import { generateQuickTransferArgs } from './generateQuickTransferArgs'
import { generateQuickTransferRobotStateTimeline } from './generateQuickTransferRobotStateTimeline'
import { pythonDef } from './pythonDef'

import type {
  CommandAnnotationV1Mixin,
  CommandV14Mixin,
  CreateCommand,
  DeckConfiguration,
  LabwareDefinition2,
  LabwareV2Mixin,
  LiquidV1Mixin,
  LoadLabwareCreateCommand,
  LoadLiquidClassCreateCommand,
  LoadPipetteCreateCommand,
  OT3RobotMixin,
} from '@opentrons/shared-data'
import type { QuickTransferSummaryState } from '../types'

const uuid: () => string = uuidv1

export function createQuickTransferFile(
  quickTransferState: QuickTransferSummaryState,
  deckConfig: DeckConfiguration,
  protocolName?: string
): File {
  const {
    stepArgs,
    invariantContext,
    initialRobotState,
  } = generateQuickTransferArgs(quickTransferState, deckConfig)
  const pipetteEntity = Object.values(invariantContext.pipetteEntities)[0]
  const { name, id, spec } = pipetteEntity

  const loadPipetteCommand: LoadPipetteCreateCommand = {
    key: uuid(),
    commandType: 'loadPipette' as const,
    params: {
      pipetteName: name,
      mount: quickTransferState.mount,
      pipetteId: id,
    },
  }
  const labwareEntities = Object.values(invariantContext.labwareEntities)
  const loadAdapterCommands = labwareEntities.reduce<
    LoadLabwareCreateCommand[]
  >((acc, entity) => {
    const { def, id } = entity
    const isAdapter = def.allowedRoles?.includes('adapter')
    if (!isAdapter) return acc
    acc.push({
      key: uuid(),
      commandType: 'loadLabware' as const,
      params: {
        displayName: def.metadata.displayName,
        labwareId: id,
        loadName: def.parameters.loadName,
        namespace: def.namespace,
        version: def.version,
        location: {
          slotName: getSlotInLocationStack(initialRobotState.labware[id].stack),
        },
      },
    })
    return acc
  }, [])

  const loadLabwareCommands = labwareEntities.reduce<
    LoadLabwareCreateCommand[]
  >((acc, entity) => {
    const { def, id } = entity
    const isAdapter = def.allowedRoles?.includes('adapter')
    if (isAdapter) return acc
    const location = initialRobotState.labware[id].stack[1]
    const isOnAdapter =
      loadAdapterCommands.find(
        command => command.params.labwareId === location
      ) != null

    acc.push({
      key: uuid(),
      commandType: 'loadLabware' as const,
      params: {
        displayName: def.metadata.displayName,
        labwareId: id,
        loadName: def.parameters.loadName,
        namespace: def.namespace,
        version: def.version,
        location: isOnAdapter
          ? { labwareId: location }
          : { slotName: location },
      },
    })
    return acc
  }, [])
  const {
    loadName: currentTiprackLoadName,
  } = quickTransferState.tipRack.parameters

  const liquidClass =
    stepArgs?.liquidClass != null && stepArgs.liquidClass !== 'none'
      ? stepArgs.liquidClass
      : null
  const byTipTypeSettings =
    liquidClass != null
      ? getAllLiquidClassDefs()
          [liquidClass]?.byPipette.find(
            pipetteObject =>
              pipetteObject.pipetteModel === getFlexNameConversion(spec)
          )
          ?.byTipType.find(tipObject => {
            const tiprackLoadName = tipObject.tiprack.split('/')[1]
            return tiprackLoadName === currentTiprackLoadName
          })
      : null
  const loadLiquidCommand: LoadLiquidClassCreateCommand | null =
    liquidClass != null && byTipTypeSettings != null
      ? {
          key: uuid(),
          commandType: 'loadLiquidClass' as const,
          params: {
            liquidClassRecord: {
              ...byTipTypeSettings,
              liquidClassName: getLiquidClassName(liquidClass),
              pipetteModel: spec.model,
            },
          },
        }
      : null

  const robotStateTimeline = generateQuickTransferRobotStateTimeline({
    stepArgs,
    initialRobotState,
    invariantContext,
  })
  const nonLoadCommands: CreateCommand[] = flatMap(
    robotStateTimeline.timeline,
    timelineFrame => timelineFrame.commands
  )

  const commands: CreateCommand[] = [
    loadPipetteCommand,
    ...loadAdapterCommands,
    ...loadLabwareCommands,
    ...(loadLiquidCommand != null ? [loadLiquidCommand] : []),
    ...nonLoadCommands,
  ]
  const sourceLabwareName = quickTransferState.source.metadata.displayName
  let destinationLabwareName = sourceLabwareName
  if (quickTransferState.destination !== 'source') {
    destinationLabwareName = quickTransferState.destination.metadata.displayName
  }
  const protocolBase = {
    $otSharedSchema: '#/protocol/schemas/8',
    schemaVersion: 8,
    metadata: {
      protocolName:
        protocolName ?? `Quick Transfer ${quickTransferState.volume}µL`,
      description: `This quick transfer moves liquids from a ${sourceLabwareName} to a ${destinationLabwareName}`,
      category: null,
      subcategory: null,
      tags: [],
    },
    // see QuickTransferFlow/README.md for versioning details
    designerApplication: {
      name: 'opentrons/quick-transfer',
      version: '1.1.0',
      data: quickTransferState,
    },
  }
  const flexDeckSpec: OT3RobotMixin = {
    robot: {
      model: FLEX_ROBOT_TYPE,
      deckId: FLEX_STANDARD_DECKID,
    },
  }

  const labwareDefinitions = Object.values(
    invariantContext.labwareEntities
  ).reduce<Record<string, LabwareDefinition2>>((acc, entity) => {
    return { ...acc, [entity.labwareDefURI]: entity.def }
  }, {})

  const labwareV2Mixin: LabwareV2Mixin = {
    labwareDefinitionSchemaId: 'opentronsLabwareSchemaV2',
    labwareDefinitions,
  }

  const liquidV1Mixin: LiquidV1Mixin = {
    liquidSchemaId: 'opentronsLiquidSchemaV1',
    liquids: {},
  }

  const commandv8Mixin: CommandV14Mixin = {
    commandSchemaId: 'opentronsCommandSchemaV14',
    commands,
  }

  const commandAnnotionaV1Mixin: CommandAnnotationV1Mixin = {
    commandAnnotationSchemaId: 'opentronsCommandAnnotationSchemaV1',
    commandAnnotations: [],
  }
  const protocolContents = JSON.stringify({
    ...protocolBase,
    ...flexDeckSpec,
    ...labwareV2Mixin,
    ...liquidV1Mixin,
    ...commandv8Mixin,
    ...commandAnnotionaV1Mixin,
  })

  return new File(
    [protocolContents],
    `${protocolBase.metadata.protocolName}.json`
  )
}

export function createQuickTransferPythonFile(
  quickTransferState: QuickTransferSummaryState,
  deckConfig: DeckConfiguration,
  protocolName?: string
): File {
  const sourceLabwareName = quickTransferState.source.metadata.displayName
  let destinationLabwareName = sourceLabwareName
  if (quickTransferState.destination !== 'source') {
    destinationLabwareName = quickTransferState.destination.metadata.displayName
  }
  const fileMetadata = {
    protocolName:
      protocolName ?? `Quick Transfer ${quickTransferState.volume}µL`,
    description: `This quick transfer moves liquids from a ${sourceLabwareName} to a ${destinationLabwareName}`,
    source: 'Quick Transfer',
    //  TODO: increase version for when we export python
    //  see QuickTransferFlow/README.md for versioning details
    version: '1.1.0',
    category: null,
    subcategory: null,
    tags: [],
  }

  const protocolContents =
    [
      pythonImports(),
      pythonMetadata(fileMetadata),
      pythonRequirements(FLEX_ROBOT_TYPE),
      pythonDef(quickTransferState, deckConfig),
    ]
      .filter(section => section)
      .join('\n\n') + '\n'

  // so you can view the string in devTools:
  console.log(protocolContents)

  return new File([protocolContents], `${fileMetadata.protocolName}.py`, {
    type: 'text/x-python',
  })
}
