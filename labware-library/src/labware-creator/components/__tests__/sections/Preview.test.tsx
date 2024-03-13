import React from 'react'
import { FormikConfig } from 'formik'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { when } from 'vitest-when'
import { render, screen } from '@testing-library/react'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { getLabwareName } from '../../../utils'
import { Preview } from '../../sections/Preview'
import { wrapInFormik } from '../../utils/wrapInFormik'
import { FORM_LEVEL_ERRORS } from '../../../formLevelValidation'

vi.mock('../../../utils')

// NOTE(IL, 2021-05-18): eventual dependency on definitions.tsx which uses require.context
// would break this test (though it's not directly used)
vi.mock('../../../../definitions')

let formikConfig: FormikConfig<LabwareFields>

describe('Preview', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: vi.fn(),
    }

    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, true)
      .thenReturn('FAKE LABWARE NAME PLURAL')
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

  // TODO(IL, 2021-05-26): AlertItem should have role="alert", then we can `getByRole('alert', {name: FAKE_ERROR})`
  screen.getByText(FAKE_ERROR)
})
