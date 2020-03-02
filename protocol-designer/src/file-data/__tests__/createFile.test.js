// @flow
import Ajv from 'ajv'
import isEmpty from 'lodash/isEmpty'
import protocolV3Schema from '@opentrons/shared-data/protocol/schemas/3.json'
import protocolV4Schema from '@opentrons/shared-data/protocol/schemas/4.json'
import labwareV2Schema from '@opentrons/shared-data/labware/schemas/2.json'
import { createFile } from '../selectors'
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

const getAjvValidator = _protocolSchema => {
  const ajv = new Ajv({
    allErrors: true,
    jsonPointers: true,
  })
  // v3 and v4 protocol schema contain reference to v2 labware schema, so give AJV access to it
  ajv.addSchema(labwareV2Schema)
  const validateProtocol = ajv.compile(_protocolSchema)
  return validateProtocol
}

const expectResultToMatchSchema = (result, _protocolSchema): void => {
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
    // $FlowFixMe TODO(IL, 2020-02-25): Flow doesn't have type for resultFunc
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
      false // isV4Protocol
    )

    expectResultToMatchSchema(result, protocolV3Schema)

    // check for false positives: if the output is lacking these entities, we don't
    // have the opportunity to validate their part of the schema
    expect(!isEmpty(result.labware)).toBe(true)
    expect(!isEmpty(result.pipettes)).toBe(true)
  })

  it('should return a schema-valid JSON V4 protocol, if the protocol does have modules', () => {
    // $FlowFixMe TODO(IL, 2020-02-25): Flow doesn't have type for resultFunc
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
      true // isV4Protocol
    )

    expectResultToMatchSchema(result, protocolV4Schema)

    // check for false positives: if the output is lacking these entities, we don't
    // have the opportunity to validate their part of the schema
    expect(!isEmpty(result.modules)).toBe(true)
    expect(!isEmpty(result.labware)).toBe(true)
    expect(!isEmpty(result.pipettes)).toBe(true)
  })
})
