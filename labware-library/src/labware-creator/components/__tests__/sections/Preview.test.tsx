import React from 'react'
import { FormikConfig } from 'formik'
import { when, resetAllWhenMocks } from 'jest-when'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { getLabwareName } from '../../../utils'
import { Preview } from '../../sections/Preview'
import { wrapInFormik } from '../../utils/wrapInFormik'
import { FORM_LEVEL_ERRORS } from '../../../formLevelValidation'

jest.mock('../../../utils')

// NOTE(IL, 2021-05-18): eventual dependency on definitions.tsx which uses require.context
// would break this test (though it's not directly used)
jest.mock('../../../../definitions')

const getLabwareNameMock = getLabwareName as jest.MockedFunction<
  typeof getLabwareName
>

let formikConfig: FormikConfig<LabwareFields>

describe('Preview', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: jest.fn(),
    }

    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, true)
      .mockReturnValue('FAKE LABWARE NAME PLURAL')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })

  it('should render the preview section telling user to check their tubes/tips/wells/etc', () => {
    formikConfig.initialValues.labwareType = 'tipRack'
    render(wrapInFormik(<Preview />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/check your work/i)
    screen.getByText(
      'Check that the size, spacing, and shape of your FAKE LABWARE NAME PLURAL looks correct.'
    )
    screen.getByText('Add missing info to see labware preview')
  })
})

it('should render form-level alerts when form-level errors are present', () => {
  const FAKE_ERROR = 'ahh'
  // @ts-expect-error: fake form-level error
  formikConfig.initialErrors = { [FORM_LEVEL_ERRORS]: { FAKE_ERROR } }
  render(wrapInFormik(<Preview />, formikConfig))

  screen.getByRole('alert')
})
