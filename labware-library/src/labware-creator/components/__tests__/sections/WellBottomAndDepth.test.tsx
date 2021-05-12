import React from 'react'
import { FormikConfig } from 'formik'
import { when } from 'jest-when'
import isEqual from 'lodash/isEqual'
import { render, screen } from '@testing-library/react'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { wellBottomShapeOptionsWithIcons } from '../../optionsWithImages'
import { displayAsTube } from '../../../utils'
import { WellBottomAndDepth } from '../../sections/WellBottomAndDepth'
import { FormAlerts } from '../../FormAlerts'
import { TextField } from '../../TextField'
import { RadioField } from '../../RadioField'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils/displayAsTube')
jest.mock('../../TextField')
jest.mock('../../RadioField')
jest.mock('../../FormAlerts')

const FormAlertsMock = FormAlerts as jest.MockedFunction<typeof FormAlerts>
const textFieldMock = TextField as jest.MockedFunction<typeof TextField>
const RadioFieldMock = RadioField as jest.MockedFunction<typeof RadioField>
const displayAsTubeMock = displayAsTube as jest.MockedFunction<
  typeof displayAsTube
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('WellBottomAndDepth', () => {
  beforeEach(() => {
    textFieldMock.mockImplementation(args => {
      if (args.name === 'wellDepth') {
        return <div>wellDepth text field</div>
      } else {
        return <div></div>
      }
    })

    RadioFieldMock.mockImplementation(args => {
      if (args.name === 'wellBottomShape') {
        expect(args).toEqual({
          name: 'wellBottomShape',
          labelTextClassName: 'hidden',
          options: wellBottomShapeOptionsWithIcons,
        })
        return <div>wellBottomShape radio group</div>
      } else {
        return <div></div>
      }
    })

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          touched: {},
          errors: {},
          fieldList: ['wellBottomShape', 'wellDepth'],
        })
      ) {
        return <div>mock alerts</div>
      } else {
        return <div></div>
      }
    })

    when(displayAsTubeMock)
      .calledWith(formikConfig.initialValues)
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render with the correct information', () => {
    render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

    expect(screen.getByText('Well Bottom & Depth'))
    expect(
      screen.getByText(
        'Depth informs the robot how far down it can go inside a well.'
      )
    )
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('wellBottomShape radio group'))
    expect(screen.getByText('wellDepth text field'))
  })

  it('should render tubes when tubeRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    when(displayAsTubeMock)
      .calledWith(formikConfig.initialValues)
      .mockReturnValue(true)
    render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

    expect(
      screen.getByText(
        'Depth informs the robot how far down it can go inside a tube.'
      )
    )
  })

  it('should render tubes when aluminumBlock is selected', () => {
    formikConfig.initialValues.labwareType = 'aluminumBlock'
    when(displayAsTubeMock)
      .calledWith(formikConfig.initialValues)
      .mockReturnValue(true)
    render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

    expect(
      screen.getByText(
        'Depth informs the robot how far down it can go inside a tube.'
      )
    )
  })

  it('should render wells when wellplate is selected', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    when(displayAsTubeMock)
      .calledWith(formikConfig.initialValues)
      .mockReturnValue(false)
    render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

    expect(
      screen.getByText(
        'Depth informs the robot how far down it can go inside a well.'
      )
    )
  })
})
