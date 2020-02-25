// @flow
import Ajv from 'ajv'
import protocolV3Schema from '@opentrons/shared-data/protocol/schemas/3.json'
import protocolV4Schema from '@opentrons/shared-data/protocol/schemas/4.json'
import labwareV2Schema from '@opentrons/shared-data/labware/schemas/2.json'

import { createFile } from '../selectors'
import { engageMagnetProtocolFixture } from '../__fixtures__/engageMagnetProtocolFixture'
import { noModulesProtocolFixture } from '../__fixtures__/noModulesProtocolFixture'

describe('createFile selector', () => {
  it('should return a schema-valid JSON V3 protocol, if the protocol has NO modules', () => {
    const ajv = new Ajv({
      allErrors: true,
      jsonPointers: true,
    })
    // v4 protocol schema contains reference to v2 labware schema, so give AJV access to it
    ajv.addSchema(labwareV2Schema)
    const validateProtocolV3 = ajv.compile(protocolV3Schema)

    const {
      fileMetadata,
      initialRobotState,
      robotStateTimeline,
      dismissedWarnings,
      ingredients,
      ingredLocations,
      savedStepForms,
      orderedStepIds,
      labwareEntities,
      moduleEntities,
      pipetteEntities,
      labwareNicknamesById,
      labwareDefsByURI,
      modulesEnabled,
    } = noModulesProtocolFixture

    // $FlowFixMe TODO(IL, 2020-02-25): Flow doesn't have type for resultFunc
    const result = createFile.resultFunc(
      fileMetadata,
      initialRobotState,
      robotStateTimeline,
      dismissedWarnings,
      ingredients,
      ingredLocations,
      savedStepForms,
      orderedStepIds,
      labwareEntities,
      moduleEntities,
      pipetteEntities,
      labwareNicknamesById,
      labwareDefsByURI,
      modulesEnabled
    )

    const valid = validateProtocolV3(result)
    const validationErrors = validateProtocolV3.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }
    expect(valid).toBe(true)
    expect(validationErrors).toBe(null)
  })

  it('should return a schema-valid JSON V4 protocol, if the protocol does have modules', () => {
    const ajv = new Ajv({
      allErrors: true,
      jsonPointers: true,
    })
    // v4 protocol schema contains reference to v2 labware schema, so give AJV access to it
    ajv.addSchema(labwareV2Schema)
    const validateProtocolV4 = ajv.compile(protocolV4Schema)

    const {
      fileMetadata,
      initialRobotState,
      robotStateTimeline,
      dismissedWarnings,
      ingredients,
      ingredLocations,
      savedStepForms,
      orderedStepIds,
      labwareEntities,
      moduleEntities,
      pipetteEntities,
      labwareNicknamesById,
      labwareDefsByURI,
      modulesEnabled,
    } = engageMagnetProtocolFixture

    // $FlowFixMe TODO(IL, 2020-02-25): Flow doesn't have type for resultFunc
    const result = createFile.resultFunc(
      fileMetadata,
      initialRobotState,
      robotStateTimeline,
      dismissedWarnings,
      ingredients,
      ingredLocations,
      savedStepForms,
      orderedStepIds,
      labwareEntities,
      moduleEntities,
      pipetteEntities,
      labwareNicknamesById,
      labwareDefsByURI,
      modulesEnabled
    )

    const valid = validateProtocolV4(result)
    const validationErrors = validateProtocolV4.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }
    expect(valid).toBe(true)
    expect(validationErrors).toBe(null)
  })
})
