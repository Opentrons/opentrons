import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Ajv from 'ajv'
import { commandSchemaV8, labwareSchemaV2, protocolSchemaV8 } from '@opentrons/shared-data'
import {
  fixture_12_trough,
  fixture_96_plate,
  fixture_tiprack_10_ul,
  fixture_tiprack_300_ul,
} from '@opentrons/shared-data/labware/fixtures/2'
import {
  fixtureP10Single,
  fixtureP300Single,
} from '@opentrons/shared-data/pipette/fixtures/name'
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
import { type LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  LabwareEntities,
  PipetteEntities,
} from '../../../../step-generation/src/types'
import type { LabwareDefByDefURI } from '../../labware-defs'

vi.mock('../../load-file/migration/utils/getLoadLiquidCommands')

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})
// v3 and v4 protocol schema contain reference to v2 labware schema, so give AJV access to it
// and add v8 command schema
ajv.addSchema(labwareSchemaV2)
ajv.addSchema(commandSchemaV8)

const validateProtocol = ajv.compile(protocolSchemaV8)

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
    vi.mocked(getLoadLiquidCommands).mockReturnValue([])
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('should return a schema-valid JSON V8 protocol', () => {
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
      labwareDefsByURI,
      {}
    )
    expectResultToMatchSchema(result)

    expect(vi.mocked(getLoadLiquidCommands)).toHaveBeenCalledWith(
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
