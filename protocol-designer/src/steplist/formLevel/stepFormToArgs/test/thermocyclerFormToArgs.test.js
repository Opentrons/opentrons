// @flow
import { thermocyclerFormToArgs } from '../thermocyclerFormToArgs'
import { THERMOCYCLER_STATE } from '../../../../constants'
import type { FormData } from '../../../../form-types'
import type { ThermocyclerStateStepArgs } from '../../../../step-generation/types'

const tcModuleId = 'tcModuleId'

describe('thermocyclerFormToArgs', () => {
  const testCases: Array<{|
    formData: FormData,
    expected: ThermocyclerStateStepArgs,
    testName: string,
  |}> = [
    {
      formData: {
        stepType: 'thermocycler',
        id: 'testId',
        description: 'some description',

        moduleId: tcModuleId,
        thermocyclerFormType: THERMOCYCLER_STATE,
        blockIsActive: true,
        blockTargetTemp: '45',
        lidIsActive: true,
        lidTargetTemp: '40',
        lidOpen: false,

        // TODO later we add the (blank) TC Profile fields here
      },
      expected: {
        commandCreatorFnName: THERMOCYCLER_STATE,

        module: tcModuleId,
        blockTargetTemp: 45,
        lidTargetTemp: 40,
        lidOpen: false,
      },
      testName: 'all active temps',
    },
    {
      formData: {
        stepType: 'thermocycler',
        id: 'testId',
        description: 'some description',

        moduleId: tcModuleId,
        thermocyclerFormType: THERMOCYCLER_STATE,
        blockIsActive: false,
        blockTargetTemp: '9999',
        lidIsActive: true,
        lidTargetTemp: '40',
        lidOpen: false,

        // TODO later we add the (blank) TC Profile fields here
      },
      expected: {
        commandCreatorFnName: THERMOCYCLER_STATE,

        module: tcModuleId,
        blockTargetTemp: null,
        lidTargetTemp: 40,
        lidOpen: false,
      },
      testName: 'inactive block',
    },
  ]

  testCases.forEach(({ formData, expected, testName }) => {
    it(`should translate "thermocyclerState" to args: ${testName}`, () => {
      expect(thermocyclerFormToArgs(formData)).toEqual(expected)
    })
  })
})
