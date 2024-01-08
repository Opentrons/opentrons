import React from 'react'
import { FormikConfig } from 'formik'
import '@testing-library/jest-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { render, screen } from '@testing-library/react'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { isEveryFieldHidden, getLabwareName } from '../../../utils'
import { Volume } from '../../sections/Volume'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>
const getLabwareNameMock = getLabwareName as jest.MockedFunction<
  typeof getLabwareName
>

let formikConfig: FormikConfig<LabwareFields>

describe('Volume', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: jest.fn(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })

  it('should render with the correct information', () => {
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, false)
      .mockReturnValue('well')
    render(wrapInFormik(<Volume />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/Volume/i)

    screen.getByText('Total maximum volume of each well.')

    screen.getByRole('textbox', { name: /Volume/i })
  })

  it('should render tubes when tubeRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, false)
      .mockReturnValue('tube')
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each tube.')
  })

  it('should render tubes when aluminumBlock is selected', () => {
    formikConfig.initialValues.labwareType = 'aluminumBlock'
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, false)
      .mockReturnValue('tube')
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each tube.')
  })

  it('should render wells when wellPlate is selected', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, false)
      .mockReturnValue('well')
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each well.')
  })

  it('should render tips when tipRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tipRack'
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, false)
      .mockReturnValue('tip')
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each tip.')
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { wellVolume: FAKE_ERROR }
    formikConfig.initialTouched = { wellVolume: true }
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByRole('alert')
  })

  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['wellVolume'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Volume />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
