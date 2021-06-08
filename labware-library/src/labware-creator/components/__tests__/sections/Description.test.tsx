import React from 'react'
import { when } from 'jest-when'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { Description } from '../../sections/Description'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

let formikConfig: FormikConfig<LabwareFields>

describe('Description', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      onSubmit: jest.fn(),
    }

    when(isEveryFieldHiddenMock)
      .calledWith(['brand', 'brandId'], formikConfig.initialValues)
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render fields when fields are visible', () => {
    render(wrapInFormik(<Description />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/description/i)

    // TODO IMMEDIATELY: changes from 7715 ???
    screen.getByRole('textbox', { name: /^brand$/i })
    screen.getByRole('textbox', { name: /manufacturer\/catalog #/i })
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { brand: FAKE_ERROR }
    formikConfig.initialTouched = { brand: true }
    render(wrapInFormik(<Description />, formikConfig))

    // TODO(IL, 2021-05-26): AlertItem should have role="alert", then we can `getByRole('alert', {name: FAKE_ERROR})`
    screen.getByText(FAKE_ERROR)
  })

  it('should not render when all of the fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['brand', 'brandId'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Description />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
