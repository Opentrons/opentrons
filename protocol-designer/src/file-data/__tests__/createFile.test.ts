import Ajv from 'ajv'
import protocolV7Schema from '@opentrons/shared-data/protocol/schemas/7.json'
import commandV7Schema from '@opentrons/shared-data/command/schemas/7.json'
import labwareV2Schema from '@opentrons/shared-data/labware/schemas/2.json'
import fixture_12_trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import {
  fixtureP10Single,
  fixtureP300Single,
} from '@opentrons/shared-data/pipette/fixtures/name'
import { LabwareDefinition2 } from '@opentrons/shared-data'
import { getLoadLiquidCommands } from '../../load-file/migration/utils/getLoadLiquidCommands'
import { createFile, getLabwareDefinitionsInUse } from '../selectors'
import {
  fileMetadata,
  dismissedWarnings,
  ingredients,
  ingredLocations,
  labwareEntities,
  labwareNicknamesById,
  labwareDefsByURI,
  pipetteEntities,
  ot2Robot,
} from '../__fixtures__/createFile/commonFields'
import * as v7Fixture from '../__fixtures__/createFile/v7Fixture'
import {
  LabwareEntities,
  PipetteEntities,
} from '../../../../step-generation/src/types'
import { LabwareDefByDefURI } from '../../labware-defs'

jest.mock('../../load-file/migration/utils/getLoadLiquidCommands')

const mockGetLoadLiquidCommands = getLoadLiquidCommands as jest.MockedFunction<
  typeof getLoadLiquidCommands
>

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})
// v3 and v4 protocol schema contain reference to v2 labware schema, so give AJV access to it
// and add v7 command schema
ajv.addSchema(labwareV2Schema)
ajv.addSchema(commandV7Schema)

const validateProtocol = ajv.compile(protocolV7Schema)

const expectResultToMatchSchema = (result: any): void => {
  const valid = validateProtocol(result)
  const validationErrors = validateProtocol.errors

  if (validationErrors) {
    console.log(JSON.stringify(validationErrors, null, 4))
  }

  expect(valid).toBe(true)
  expect(validationErrors).toBe(null)
}

describe('createFile selector', () => {
  beforeEach(() => {
    mockGetLoadLiquidCommands.mockReturnValue([])
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should return a schema-valid JSON V7 protocol', () => {
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    const result = createFile.resultFunc(
      fileMetadata,
      v7Fixture.initialRobotState,
      v7Fixture.robotStateTimeline,
      ot2Robot,
      dismissedWarnings,
      ingredients,
      ingredLocations,
      v7Fixture.savedStepForms,
      v7Fixture.orderedStepIds,
      labwareEntities,
      v7Fixture.moduleEntities,
      pipetteEntities,
      labwareNicknamesById,
      labwareDefsByURI
    )
    expectResultToMatchSchema(result)

    expect(mockGetLoadLiquidCommands).toHaveBeenCalledWith(
      ingredients,
      ingredLocations
    )
  })
})
describe('getLabwareDefinitionsInUse util', () => {
  it('should exclude definitions that are neither on the deck nor assigned to a pipette', () => {
    const assignedTiprackOnDeckDef = fixture_tiprack_10_ul
    const assignedTiprackNotOnDeckDef = fixture_tiprack_300_ul
    const nonTiprackLabwareOnDeckDef = fixture_12_trough
    const nonTiprackLabwareNotOnDeckDef = fixture_96_plate
    // NOTE that assignedTiprackNotOnDeckDef and nonTiprackLabwareNotOnDeckDef are
    // missing from LabwareEntities bc they're not on the deck
    const labwareEntities: LabwareEntities = {
      someLabwareId: {
        id: 'someLabwareId',
        def: assignedTiprackOnDeckDef as LabwareDefinition2,
        labwareDefURI: 'assignedTiprackOnDeckURI',
      },
      otherLabwareId: {
        id: 'otherLabwareId',
        def: nonTiprackLabwareOnDeckDef as LabwareDefinition2,
        labwareDefURI: 'nonTiprackLabwareOnDeckURI',
      },
    }
    const allLabwareDefsByURI: LabwareDefByDefURI = {
      assignedTiprackOnDeckURI: assignedTiprackOnDeckDef as LabwareDefinition2,
      assignedTiprackNotOnDeckURI: assignedTiprackNotOnDeckDef as LabwareDefinition2,
      nonTiprackLabwareOnDeckURI: nonTiprackLabwareOnDeckDef as LabwareDefinition2,
      nonTiprackLabwareNotOnDeckURI: nonTiprackLabwareNotOnDeckDef as LabwareDefinition2,
    }
    const pipetteEntities: PipetteEntities = {
      somePipetteId: {
        id: 'somePipetteId',
        // @ts-expect-error(sa, 2021-6-18): not a valid pipette name
        name: 'foo',
        spec: fixtureP10Single,
        tiprackLabwareDef: assignedTiprackOnDeckDef as LabwareDefinition2,
        tiprackDefURI: 'assignedTiprackOnDeckURI',
      },
      otherPipetteId: {
        id: 'otherPipetteId',
        // @ts-expect-error(sa, 2021-6-18): not a valid pipette name
        name: 'foo',
        spec: fixtureP300Single,
        tiprackLabwareDef: assignedTiprackNotOnDeckDef as LabwareDefinition2,
        tiprackDefURI: 'assignedTiprackNotOnDeckURI',
      },
    }
    const result = getLabwareDefinitionsInUse(
      labwareEntities,
      pipetteEntities,
      allLabwareDefsByURI
    )
    expect(result).toEqual({
      assignedTiprackOnDeckURI: assignedTiprackOnDeckDef,
      assignedTiprackNotOnDeckURI: assignedTiprackNotOnDeckDef,
      nonTiprackLabwareOnDeckURI: nonTiprackLabwareOnDeckDef,
    })
  })
})
