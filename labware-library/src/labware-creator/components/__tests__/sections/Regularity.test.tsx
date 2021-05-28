import React from 'react'
import { when } from 'jest-when'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { Regularity } from '../../sections/Regularity'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('Regularity', () => {
  beforeEach(() => {
    when(isEveryFieldHiddenMock)
      .calledWith(['homogeneousWells'], formikConfig.initialValues)
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render radio fields when fields are visible', () => {
    render(wrapInFormik(<Regularity />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/regularity/i)
    // TODO(IL, 2021-05-26): this should be a semantic label, but is just a div
    screen.getByText('Are all your wells the same shape and size?')

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
    when(isEveryFieldHiddenMock)
      .calledWith(['homogeneousWells'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Regularity />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
