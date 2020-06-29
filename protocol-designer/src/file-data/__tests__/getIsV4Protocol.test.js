// @flow
import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
} from '@opentrons/shared-data'

import type { ModuleEntities } from '../../step-forms'
import { getIsV4Protocol } from '../selectors/fileCreator'

describe('getIsV4Protocol selector', () => {
  const testCases: Array<{|
    testName: string,
    robotStateTimeline: {
      // NOTE: this is a simplified version of Timeline type so we don't need a huge fixture
      timeline: Array<{ commands: Array<{ command: string }> }>,
    },
    moduleEntities: ModuleEntities,
    expected: boolean,
  |}> = [
    {
      testName: 'should return true if there are modules',
      expected: true,
      robotStateTimeline: { timeline: [] },
      moduleEntities: {
        someModule: {
          id: 'moduleId',
          type: MAGNETIC_MODULE_TYPE,
          model: MAGNETIC_MODULE_V1,
        },
      },
    },
    {
      testName: 'should return true if there are non-v3 commands',
      expected: true,
      robotStateTimeline: {
        timeline: [{ commands: [{ command: 'someNonV4Command' }] }],
      },
      moduleEntities: {},
    },
    {
      testName:
        'should return false if there are no modules and no v4-specific commands',
      expected: false,
      robotStateTimeline: { timeline: [] },
      moduleEntities: {},
    },
  ]
  testCases.forEach(
    ({ testName, robotStateTimeline, moduleEntities, expected }) => {
      it(testName, () => {
        // $FlowFixMe TODO(IL, 2020-02-25): Flow doesn't have type for resultFunc
        const result = getIsV4Protocol.resultFunc(
          robotStateTimeline,
          moduleEntities
        )
        expect(result).toBe(expected)
      })
    }
  )
})
