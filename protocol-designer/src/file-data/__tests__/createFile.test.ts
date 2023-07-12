import Ajv from 'ajv'
import isEmpty from 'lodash/isEmpty'
import protocolV6Schema from '@opentrons/shared-data/protocol/schemas/6.json'
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
import * as v6Fixture from '../__fixtures__/createFile/v6Fixture'
import {
  LabwareEntities,
  PipetteEntities,
} from '../../../../step-generation/src/types'
import { LabwareDefByDefURI } from '../../labware-defs'

jest.mock('../../load-file/migration/utils/getLoadLiquidCommands')

const mockGetLoadLiquidCommands = getLoadLiquidCommands as jest.MockedFunction<
  typeof getLoadLiquidCommands
>

const getAjvValidator = (_protocolSchema: Record<string, any>) => {
  const ajv = new Ajv({
    allErrors: true,
    jsonPointers: true,
  })
  // v3 and v4 protocol schema contain reference to v2 labware schema, so give AJV access to it
  ajv.addSchema(labwareV2Schema)
  const validateProtocol = ajv.compile(_protocolSchema)
  return validateProtocol
}

const expectResultToMatchSchema = (
  result: any,
  _protocolSchema: Record<string, any>
): void => {
  const validate = getAjvValidator(_protocolSchema)
  const valid = validate(result)
  const validationErrors = validate.errors

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
  it('should return a schema-valid JSON V6 protocol', () => {
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    const result = createFile.resultFunc(
      fileMetadata,
      v6Fixture.initialRobotState,
      v6Fixture.robotStateTimeline,
      ot2Robot,
      dismissedWarnings,
      ingredients,
      ingredLocations,
      v6Fixture.savedStepForms,
      v6Fixture.orderedStepIds,
      labwareEntities,
      v6Fixture.moduleEntities,
      pipetteEntities,
      labwareNicknamesById,
      labwareDefsByURI
    )
    expectResultToMatchSchema(result, protocolV6Schema)
    // check for false positives: if the output is lacking these entities, we don't
    // have the opportunity to validate their part of the schema
    expect(!isEmpty(result.labware)).toBe(true)
    expect(!isEmpty(result.pipettes)).toBe(true)
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
