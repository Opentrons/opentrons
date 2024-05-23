import uuidv1 from 'uuid/v4'
import {
  consolidate,
  transfer,
  distribute,
  ConsolidateArgs,
  TransferArgs,
  DistributeArgs,
} from '@opentrons/step-generation'
import { generateQuickTransferArgs } from './generateQuickTransferArgs'
import { FLEX_ROBOT_TYPE, FLEX_STANDARD_DECKID } from '@opentrons/shared-data'
import type {
  DeckConfiguration,
  CommandAnnotationV1Mixin,
  CommandV8Mixin,
  CreateCommand,
  LabwareV2Mixin,
  LiquidV1Mixin,
  LoadLabwareCreateCommand,
  LoadPipetteCreateCommand,
  OT3RobotMixin,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { QuickTransferSummaryState } from '../types'

const uuid: () => string = uuidv1

export function createQuickTransferFile(
  quickTransferState: QuickTransferSummaryState,
  deckConfig: DeckConfiguration
): string {
  const {
    stepArgs,
    invariantContext,
    initialRobotState,
  } = generateQuickTransferArgs(quickTransferState, deckConfig)
  const pipetteEntity = Object.values(invariantContext.pipetteEntities)[0]

  const loadPipetteCommand: LoadPipetteCreateCommand = {
    key: uuid(),
    commandType: 'loadPipette' as const,
    params: {
      pipetteName: pipetteEntity.name,
      mount: quickTransferState.mount,
      pipetteId: pipetteEntity.id,
    },
  }
  const labwareEntities = Object.values(invariantContext.labwareEntities)
  const loadLabwareCommands = labwareEntities.reduce<
    LoadLabwareCreateCommand[]
  >((acc, entity) => {
    acc.push({
      key: uuid(),
      commandType: 'loadLabware' as const,
      params: {
        displayName: entity.def.metadata.displayName,
        labwareId: entity.id,
        loadName: entity.def.parameters.loadName,
        namespace: entity.def.namespace,
        version: entity.def.version,
        location: { slotName: initialRobotState.labware[entity.id].slot },
      },
    })
    return acc
  }, [])

  let nonLoadCommandCreator
  if (stepArgs?.commandCreatorFnName === 'transfer') {
    nonLoadCommandCreator = transfer(
      stepArgs as TransferArgs,
      invariantContext,
      initialRobotState
    )
  } else if (stepArgs?.commandCreatorFnName === 'consolidate') {
    nonLoadCommandCreator = consolidate(
      stepArgs as ConsolidateArgs,
      invariantContext,
      initialRobotState
    )
  } else if (stepArgs?.commandCreatorFnName === 'distribute') {
    nonLoadCommandCreator = distribute(
      stepArgs as DistributeArgs,
      invariantContext,
      initialRobotState
    )
  }

  const nonLoadCommands =
    nonLoadCommandCreator != null && 'commands' in nonLoadCommandCreator
      ? nonLoadCommandCreator.commands
      : []

  let commands: CreateCommand[] = [
    loadPipetteCommand,
    ...loadLabwareCommands,
    ...nonLoadCommands,
  ]

  const protocolBase = {
    $otSharedSchema: '#/protocol/schemas/8',
    schemaVersion: 8,
    metadata: {
      protocolName: `Quick Transfer ${quickTransferState.volume}µL`,
      category: null,
      subcategory: null,
      tags: [],
    },
    //TODO: formalize designer application data type
    designerApplication: {
      name: 'Quick Transfer',
      version: '0.0',
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
  ).reduce<{ [x: string]: LabwareDefinition2 }>((acc, entity) => {
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

  const commandv8Mixin: CommandV8Mixin = {
    commandSchemaId: 'opentronsCommandSchemaV8',
    commands,
  }

  const commandAnnotionaV1Mixin: CommandAnnotationV1Mixin = {
    commandAnnotationSchemaId: 'opentronsCommandAnnotationSchemaV1',
    commandAnnotations: [],
  }

  return JSON.stringify({
    ...protocolBase,
    ...flexDeckSpec,
    ...labwareV2Mixin,
    ...liquidV1Mixin,
    ...commandv8Mixin,
    ...commandAnnotionaV1Mixin,
  })
}
