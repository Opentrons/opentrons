// @flow
import { reduxActionToAnalyticsEvent } from '../middleware'
import { getFileMetadata } from '../../file-data/selectors'
import {
  getArgsAndErrorsByStepId,
  getPipetteEntities,
} from '../../step-forms/selectors'
import type { FileMetadataFields } from '../../file-data/types'

jest.mock('../../file-data/selectors')
jest.mock('../../step-forms/selectors')

const getFileMetadataMock: JestMockFn<any, FileMetadataFields> = getFileMetadata
const getArgsAndErrorsByStepIdMock: JestMockFn<
  any,
  any
> = getArgsAndErrorsByStepId
const getPipetteEntitiesMock: JestMockFn<any, any> = getPipetteEntities

let fooState: any
beforeEach(() => {
  fooState = {}
  getFileMetadataMock.mockReturnValue({
    protocolName: 'protocol name here',
    created: 1600000000000, // 2020-09-13T12:26:40.000Z
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('reduxActionToAnalyticsEvent', () => {
  it('should return null for unhandled actions', () => {
    expect(
      reduxActionToAnalyticsEvent(fooState, { type: 'SOME_UNHANDLED_ACTION' })
    ).toBe(null)
  })

  it('should return payload of ANALYTICS_EVENT action, as-is', () => {
    // IRL the payload would be an AnalyticsEventAction
    const action = { type: 'ANALYTICS_EVENT', payload: { foo: 123 } }
    const result = reduxActionToAnalyticsEvent(fooState, action)
    expect(result).toBe(action.payload)
  })

  it('should convert a SAVE_STEP_FORM action into a saveStep action with additional properties', () => {
    getArgsAndErrorsByStepIdMock.mockReturnValue({
      stepId: {
        stepArgs: {
          id: 'stepId',
          pipette: 'pipetteId',
          otherField: 123,
          nested: { inner: true },
        },
      },
    })
    getPipetteEntitiesMock.mockReturnValue({
      pipetteId: { name: 'some_pipette_spec_name' },
    })

    const action = {
      type: 'SAVE_STEP_FORM',
      payload: {
        id:
          'stepId' /* .. other fields don't matter, will be read from getArgsAndErrors */,
      },
    }
    const result = reduxActionToAnalyticsEvent(fooState, action)
    expect(result).toEqual({
      name: 'saveStep',
      properties: {
        // existing fields
        id: 'stepId',
        pipette: 'pipetteId',
        otherField: 123,
        // de-nested fields
        __nested__inner: true,
        nested: { inner: true },
        // additional special properties for analytics
        __dateCreated: '2020-09-13T12:26:40.000Z',
        __protocolName: 'protocol name here',
        __pipetteName: 'some_pipette_spec_name',
      },
    })
  })
})
