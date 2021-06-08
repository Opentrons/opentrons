import React from 'react'
import { FormikConfig } from 'formik'
import '@testing-library/jest-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { render, screen } from '@testing-library/react'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { Volume } from '../../sections/Volume'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

let formikConfig: FormikConfig<LabwareFields>

describe('Volume', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      onSubmit: jest.fn(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })

  it('should render with the correct information', () => {
    render(wrapInFormik(<Volume />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/Volume/i)

    screen.getByText('Total maximum volume of each well.')

    screen.getByRole('textbox', { name: /max volume per well/i })
  })

  it('should render tubes when tubeRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each tube.')
  })

  it('should render tubes when aluminumBlock is selected', () => {
    formikConfig.initialValues.labwareType = 'aluminumBlock'
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each tube.')
  })

  it('should render wells when wellPlate is selected', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each well.')
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { wellVolume: FAKE_ERROR }
    formikConfig.initialTouched = { wellVolume: true }
    render(wrapInFormik(<Volume />, formikConfig))

    // TODO(IL, 2021-05-26): AlertItem should have role="alert", then we can `getByRole('alert', {name: FAKE_ERROR})`
    screen.getByText(FAKE_ERROR)
  })

  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['wellVolume'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Volume />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
