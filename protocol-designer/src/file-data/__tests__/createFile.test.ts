import Ajv from 'ajv'
import isEmpty from 'lodash/isEmpty'
import protocolV3Schema from '@opentrons/shared-data/protocol/schemas/3.json'
import protocolV4Schema from '@opentrons/shared-data/protocol/schemas/4.json'
import protocolV5Schema from '@opentrons/shared-data/protocol/schemas/5.json'
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
import {
  createFile,
  getRequiresAtLeastV5,
  getLabwareDefinitionsInUse,
} from '../selectors'
import {
  fileMetadata,
  dismissedWarnings,
  ingredients,
  ingredLocations,
  labwareEntities,
  labwareNicknamesById,
  labwareDefsByURI,
  pipetteEntities,
} from '../__fixtures__/createFile/commonFields'
import * as engageMagnet from '../__fixtures__/createFile/engageMagnet'
import * as noModules from '../__fixtures__/createFile/noModules'
import * as v5Fixture from '../__fixtures__/createFile/v5Fixture'
import {
  LabwareEntities,
  PipetteEntities,
} from '../../../../step-generation/src/types'
import { LabwareDefByDefURI } from '../../labware-defs'

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
  it('should return a schema-valid JSON V3 protocol, if the protocol has NO modules', () => {
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    const result = createFile.resultFunc(
      fileMetadata,
      noModules.initialRobotState,
      noModules.robotStateTimeline,
      dismissedWarnings,
      ingredients,
      ingredLocations,
      noModules.savedStepForms,
      noModules.orderedStepIds,
      labwareEntities,
      noModules.moduleEntities,
      pipetteEntities,
      labwareNicknamesById,
      labwareDefsByURI,
      false, // isV4Protocol
      false // requiresV5
    )
    expectResultToMatchSchema(result, protocolV3Schema)
    // check for false positives: if the output is lacking these entities, we don't
    // have the opportunity to validate their part of the schema
    expect(!isEmpty(result.labware)).toBe(true)
    expect(!isEmpty(result.pipettes)).toBe(true)
  })
  it('should return a schema-valid JSON V4 protocol, if the protocol does have modules', () => {
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    const result = createFile.resultFunc(
      fileMetadata,
      engageMagnet.initialRobotState,
      engageMagnet.robotStateTimeline,
      dismissedWarnings,
      ingredients,
      ingredLocations,
      engageMagnet.savedStepForms,
      engageMagnet.orderedStepIds,
      labwareEntities,
      engageMagnet.moduleEntities,
      pipetteEntities,
      labwareNicknamesById,
      labwareDefsByURI,
      true, // isV4Protocol
      false // requiresV5
    )
    expectResultToMatchSchema(result, protocolV4Schema)
    // check for false positives: if the output is lacking these entities, we don't
    // have the opportunity to validate their part of the schema
    expect(!isEmpty(result.modules)).toBe(true)
    expect(!isEmpty(result.labware)).toBe(true)
    expect(!isEmpty(result.pipettes)).toBe(true)
  })
  it('should return a schema-valid JSON V5 protocol, if getRequiresAtLeastV5 returns true', () => {
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    const result = createFile.resultFunc(
      fileMetadata,
      v5Fixture.initialRobotState,
      v5Fixture.robotStateTimeline,
      dismissedWarnings,
      ingredients,
      ingredLocations,
      v5Fixture.savedStepForms,
      v5Fixture.orderedStepIds,
      labwareEntities,
      v5Fixture.moduleEntities,
      pipetteEntities,
      labwareNicknamesById,
      labwareDefsByURI,
      true, // isV4Protocol
      true // requiresV5
    )
    expectResultToMatchSchema(result, protocolV5Schema)
    // check for false positives: if the output is lacking these entities, we don't
    // have the opportunity to validate their part of the schema
    expect(!isEmpty(result.labware)).toBe(true)
    expect(!isEmpty(result.pipettes)).toBe(true)
  })
})
describe('getRequiresAtLeastV5', () => {
  it('should return true if protocol has airGap', () => {
    const airGapTimeline = {
      timeline: [
        {
          commands: [
            {
              command: 'airGap',
              params: {
                pipette: 'pipetteId',
                volume: 1,
                labware: 'plateId',
                well: 'A1',
                offsetFromBottomMm: 15.81,
                flowRate: 3.78,
              },
            },
          ],
        },
      ],
    }
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    expect(getRequiresAtLeastV5.resultFunc(airGapTimeline)).toBe(true)
  })
  it('should return true if protocol has moveToWell', () => {
    const moveToWellTimeline = {
      timeline: [
        {
          commands: [
            {
              command: 'moveToWell',
              params: {
                pipette: 'pipetteId',
                labware: 'plateId',
                well: 'B1',
                offset: {
                  x: 0,
                  y: 0,
                  z: 1,
                },
              },
            },
          ],
        },
      ],
    }
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    expect(getRequiresAtLeastV5.resultFunc(moveToWellTimeline)).toBe(true)
  })
  it('should return false if protocol has no airGap and no moveToWell', () => {
    // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
    expect(getRequiresAtLeastV5.resultFunc(noModules.robotStateTimeline)).toBe(
      false
    )
    expect(
      // @ts-expect-error(sa, 2021-6-15): resultFunc not part of Selector type
      getRequiresAtLeastV5.resultFunc(engageMagnet.robotStateTimeline)
    ).toBe(false)
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
