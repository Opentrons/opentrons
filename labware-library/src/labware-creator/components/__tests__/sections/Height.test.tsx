import React from 'react'
import { FormikConfig } from 'formik'
import isEqual from 'lodash/isEqual'
import { when } from 'jest-when'
import { render, screen } from '@testing-library/react'
import { DEFAULT_FORM_STATE, LabwareFields } from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { Height } from '../../sections/Height'
import { FormAlerts } from '../../alerts/FormAlerts'
import { HeightAlerts } from '../../alerts/HeightAlerts'
import { TextField } from '../../TextField'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')
jest.mock('../../TextField')
jest.mock('../../alerts/FormAlerts')
jest.mock('../../alerts/HeightAlerts')

const FormAlertsMock = FormAlerts as jest.MockedFunction<typeof FormAlerts>
const textFieldMock = TextField as jest.MockedFunction<typeof TextField>

const HeightAlertsMock = HeightAlerts as jest.MockedFunction<
  typeof HeightAlerts
>

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: DEFAULT_FORM_STATE,
  onSubmit: jest.fn(),
}

describe('Height Section with Alerts', () => {
  beforeEach(() => {
    textFieldMock.mockImplementation(args => {
      return <div>labwareZDimension text field</div>
    })

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          touched: {},
          errors: {},
          fieldList: ['labwareType', 'labwareZDimension'],
        })
      ) {
        return <div>mock alerts</div>
      } else {
        return <div></div>
      }
    })

    HeightAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          values: formikConfig.initialValues,
          touched: {},
        })
      ) {
        return <div>mock heightAlertsMock alerts</div>
      } else {
        return <div></div>
      }
    })

    when(isEveryFieldHiddenMock)
      .calledWith(
        ['labwareType', 'labwareZDimension'],
        formikConfig.initialValues
      )
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render text fields and alerts when fields are visible', () => {
    render(wrapInFormik(<Height />, formikConfig))
    expect(screen.getByText('Height'))
    expect(
      screen.getByText(
        'The height measurement informs the robot of the top and bottom of your labware.'
      )
    )
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('labwareZDimension text field'))
    expect(screen.getByText('mock heightAlertsMock alerts'))
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

  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(
        ['labwareType', 'labwareZDimension'],
        formikConfig.initialValues
      )
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Height />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
