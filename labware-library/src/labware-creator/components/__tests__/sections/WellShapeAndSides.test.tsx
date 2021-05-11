import React from 'react'
import { FormikConfig } from 'formik'
import { when } from 'jest-when'
import isEqual from 'lodash/isEqual'
import { render, screen } from '@testing-library/react'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { wellShapeOptionsWithIcons } from '../../optionsWithImages'
import { displayAsTube } from '../../../utils'
import { WellShapeAndSides } from '../../sections/WellShapeAndSides'
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

describe('WellShapeAndSides', () => {
  beforeEach(() => {
    textFieldMock.mockImplementation(args => {
      if (args.name === 'wellXDimension') {
        return <div>wellXDimension text field</div>
      }
      if (args.name === 'wellYDimension') {
        return <div>wellYDimension text field</div>
      }
      if (args.name === 'wellDiameter') {
        return <div>wellDiameter text field</div>
      } else {
        return <div></div>
      }
    })

    RadioFieldMock.mockImplementation(args => {
      if (args.name === 'wellShape') {
        expect(args).toEqual({
          name: 'wellShape',
          labelTextClassName: 'hidden',
          options: wellShapeOptionsWithIcons,
        })
        return <div>wellShape radio group</div>
      } else {
        return <div></div>
      }
    })

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          touched: {},
          errors: {},
          fieldList: [
            'wellShape',
            'wellDiameter',
            'wellXDimension',
            'wellYDimension',
          ],
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
    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    expect(screen.getByText('Well Shape & Sides'))
    expect(
      screen.getByText(
        'Diameter helps the robot locate the sides of the wells.'
      )
    )
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('wellShape radio group'))
    expect(screen.getByText('wellDiameter text field'))
  })

  it('should render tubes when tubeRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    when(displayAsTubeMock)
      .calledWith(formikConfig.initialValues)
      .mockReturnValue(true)
    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    expect(
      screen.getByText(
        'Diameter helps the robot locate the sides of the tubes. If there are multiple measurements for this dimension then use the smaller one.'
      )
    )
  })

  it('should render tubes when aluminumBlock is selected', () => {
    formikConfig.initialValues.labwareType = 'aluminumBlock'
    when(displayAsTubeMock)
      .calledWith(formikConfig.initialValues)
      .mockReturnValue(true)
    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    expect(
      screen.getByText(
        'Diameter helps the robot locate the sides of the tubes. If there are multiple measurements for this dimension then use the smaller one.'
      )
    )
  })

  it('should render wells when wellplate is selected', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    when(displayAsTubeMock)
      .calledWith(formikConfig.initialValues)
      .mockReturnValue(false)
    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    expect(
      screen.getByText(
        'Diameter helps the robot locate the sides of the wells.'
      )
    )
  })

  it('should render X and Y dimension fields when rectangular is selected', () => {
    formikConfig.initialValues.wellShape = 'rectangular'
    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    expect(screen.getByText('wellXDimension text field'))
    expect(screen.getByText('wellYDimension text field'))
  })
})
