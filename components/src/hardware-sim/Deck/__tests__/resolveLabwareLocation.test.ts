import { expect, it } from 'vitest'

import {
  getAllDefinitions,
  getDeckDefinitions,
  getModuleDef,
} from '@opentrons/shared-data'

import type { ModuleModel } from '@opentrons/shared-data'

import { resolveLabwareLocation } from '../resolveLabwareLocation'

it('should resolve a labware location', () => {
  const labwareAUri = 'opentrons/nest_12_reservoir_15ml/1'
  const labwareBUri = "opentrons/agilent_1_reservoir_290ml/1"
  const labwareCUri = 'opentrons/opentrons_96_pcr_adapter/1'
  const labwareADefinition = getAllDefinitions()[labwareAUri]
  const labwareBDefinition = getAllDefinitions()[labwareBUri]
  const labwareCDefinition = getAllDefinitions()[labwareCUri]

  const moduleModel: ModuleModel = "temperatureModuleV2"
  const moduleDefinition = getModuleDef(moduleModel)

  const deckDefinition = getDeckDefinitions().ot3_standard

  const slotId = "C2"

  const result = resolveLabwareLocation({
    targetLabwareDef: labwareADefinition,
    targetLabwareLocation: {
      labwareId: 'labware-b-id',
    },
    otherLoadedLabware: [
      {
        id: 'labware-b-id',
        definitionUri: labwareBUri,
        location: {
          labwareId: 'labware-c-id',
        },
        loadName: '',
      },
      {
        id: 'labware-c-id',
        definitionUri: labwareCUri,
        location: {
          moduleId: "module-id"
        },
        loadName: '',
      },
    ],
    deckDef: deckDefinition,
    otherLabwareDefinitions: [
      labwareBDefinition, labwareCDefinition
    ],
    loadedModules: [{
      id: "module-id",
      model: moduleModel,
      location: {
        slotName: slotId
      },
      serialNumber: ""
    }],
  })

  const expectedResult: typeof result = {
    deckDefinition,
    slotId,
    moduleDefinition,
    labwareDefinitionsBottomToTop: [
      labwareCDefinition,
      labwareBDefinition,
      labwareADefinition,
    ],
  }

  expect(result).toStrictEqual(expectedResult)
})

it('should return offDeck if the labware is off-deck', () => {
  const labwareAUri = 'opentrons/nest_12_reservoir_15ml/1'
  const labwareBUri = "opentrons/agilent_1_reservoir_290ml/1"
  const labwareADefinition = getAllDefinitions()[labwareAUri]
  const labwareBDefinition = getAllDefinitions()[labwareBUri]

  const deckDefinition = getDeckDefinitions().ot3_standard

  const result = resolveLabwareLocation({
    targetLabwareDef: labwareADefinition,
    targetLabwareLocation: {
      labwareId: 'labware-b-id',
    },
    otherLoadedLabware: [
      {
        id: 'labware-b-id',
        definitionUri: labwareBUri,
        location: "offDeck",
        loadName: '',
      },
    ],
    deckDef: deckDefinition,
    otherLabwareDefinitions: [labwareBDefinition],
    loadedModules: [],
  })

  const expectedResult: typeof result = 'offDeck'

  expect(result).toStrictEqual(expectedResult)
})

it('should return error if something is missing from the input definitions', () => {
  const labwareAUri = 'opentrons/nest_12_reservoir_15ml/1'
  const labwareBUri = "opentrons/agilent_1_reservoir_290ml/1"
  const labwareADefinition = getAllDefinitions()[labwareAUri]

  const deckDefinition = getDeckDefinitions().ot3_standard

  const result = resolveLabwareLocation({
    targetLabwareDef: labwareADefinition,
    targetLabwareLocation: {
      labwareId: 'labware-b-id',
    },
    otherLoadedLabware: [
      {
        id: 'labware-b-id',
        definitionUri: labwareBUri,
        location: "offDeck",
        loadName: '',
      },
    ],
    deckDef: deckDefinition,
    otherLabwareDefinitions: [], // Missing labware B definition.
    loadedModules: [],
  })

  const expectedResult: typeof result = 'error'

  expect(result).toStrictEqual(expectedResult)
})
