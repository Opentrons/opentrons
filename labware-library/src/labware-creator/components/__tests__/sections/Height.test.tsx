import React from 'react'
import { FormikConfig } from 'formik'
import { when } from 'jest-when'
import { render, screen } from '@testing-library/react'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { Height } from '../../sections/Height'
import { getFormAlerts } from '../../utils/getFormAlerts'
import { TextField } from '../../TextField'
import { wrapInFormik } from '../../utils/wrapInFormik'
import { getHeightAlerts } from '../../utils/getHeightAlerts'

jest.mock('../../TextField')
jest.mock('../../utils/getFormAlerts')
jest.mock('../../utils/getHeightAlerts')

const getFormAlertsMock = getFormAlerts as jest.MockedFunction<
  typeof getFormAlerts
>
const textFieldMock = TextField as jest.MockedFunction<typeof TextField>

const getHeightAlertsMock = getHeightAlerts as jest.MockedFunction<
  typeof getHeightAlerts
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('Height Section with Alerts', () => {
  beforeEach(() => {
    textFieldMock.mockImplementation(args => {
      return <div>labwareZDimension text field</div>
    })

    when(getFormAlertsMock)
      .calledWith({
        values: getDefaultFormState(),
        touched: {},
        errors: {},
        fieldList: ['labwareType', 'labwareZDimension'],
      })
      .mockReturnValue([<div key="mock key">mock alerts</div>])

    when(getHeightAlertsMock)
      .calledWith(getDefaultFormState(), {})
      .mockReturnValue(<div>mock getHeightAlertsMock alerts</div>)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render with the correct information', () => {
    render(wrapInFormik(<Height />, formikConfig))
    expect(screen.getByText('Height'))
    expect(
      screen.getByText(
        'The height measurement informs the robot of the top and bottom of your labware.'
      )
    )
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('labwareZDimension text field'))
    expect(screen.getByText('mock getHeightAlertsMock alerts'))
  })

  it('should update title and instructions when tubeRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    render(wrapInFormik(<Height />, formikConfig))
    expect(screen.getByText('Total Height'))
    expect(screen.getByText('Place your tubes inside the rack.'))
  })

  it('should update title and instructions when aluminumBlock is selected', () => {
    formikConfig.initialValues.labwareType = 'aluminumBlock'
    render(wrapInFormik(<Height />, formikConfig))
    expect(screen.getByText('Total Height'))
    expect(screen.getByText('Put your labware on top of the aluminum block.'))
  })
})
