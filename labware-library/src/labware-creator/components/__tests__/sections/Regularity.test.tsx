import React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { when } from 'vitest-when'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { isEveryFieldHidden, getLabwareName } from '../../../utils'
import { Regularity } from '../../sections/Regularity'
import { wrapInFormik } from '../../utils/wrapInFormik'

vi.mock('../../../utils')

let formikConfig: FormikConfig<LabwareFields>

describe('Regularity', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: vi.fn(),
    }

    when(vi.mocked(isEveryFieldHidden))
      .calledWith(['homogeneousWells'], formikConfig.initialValues)
      .thenReturn(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render radio fields when fields are visible', () => {
    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, true)
      .thenReturn('FAKE LABWARE NAME PLURAL')

    render(wrapInFormik(<Regularity />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/regularity/i)
    // TODO(IL, 2021-05-26): this should be a semantic label, but is just a div
    screen.getByText(
      'Are all your FAKE LABWARE NAME PLURAL the same shape and size?'
    )

    const radioElements = screen.getAllByRole('radio')
    expect(radioElements).toHaveLength(2)
    screen.getByRole('radio', { name: /yes/i })
    screen.getByRole('radio', { name: /no/i })
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { homogeneousWells: FAKE_ERROR }
    formikConfig.initialTouched = { homogeneousWells: true }
    render(wrapInFormik(<Regularity />, formikConfig))

    // TODO(IL, 2021-05-26): AlertItem should have role="alert", then we can `getByRole('alert', {name: FAKE_ERROR})`
    screen.getByText(FAKE_ERROR)
  })

  it('should not render when all of the fields are hidden', () => {
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(['homogeneousWells'], formikConfig.initialValues)
      .thenReturn(true)

    const { container } = render(wrapInFormik(<Regularity />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
