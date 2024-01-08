import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FormikConfig } from 'formik'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { displayAsTube, getLabwareName } from '../../../utils'
import { WellShapeAndSides } from '../../sections/WellShapeAndSides'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')

const displayAsTubeMock = displayAsTube as jest.MockedFunction<
  typeof displayAsTube
>

const getLabwareNameMock = getLabwareName as jest.MockedFunction<
  typeof getLabwareName
>

let formikConfig: FormikConfig<LabwareFields>

describe('WellShapeAndSides', () => {
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
      .mockReturnValue('FAKE LABWARE NAME SINGULAR')
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, true)
      .mockReturnValue('FAKE LABWARE NAME PLURAL')
    when(displayAsTubeMock)
      .expectCalledWith(formikConfig.initialValues)
      .mockReturnValue(false)

    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    expect(screen.getByRole('heading')).toHaveTextContent(
      /FAKE LABWARE NAME SINGULAR Shape & Sides/i
    )

    screen.getByText(
      'Diameter helps the robot locate the sides of the FAKE LABWARE NAME PLURAL.'
    )

    const radioElements = screen.getAllByRole('radio')
    expect(radioElements).toHaveLength(2)
    screen.getAllByRole('radio', { name: /circular/i })
    screen.getAllByRole('radio', { name: /rectangular/i })

    // should show diameter by default when no shape is selected
    screen.getByRole('textbox', { name: /diameter/i })
  })

  it('should render tubes when labware that should displayAsTube is selected', () => {
    when(displayAsTubeMock)
      .expectCalledWith(formikConfig.initialValues)
      .mockReturnValue(true)

    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    screen.getByText(
      'Diameter helps the robot locate the sides of the tubes. If there are multiple measurements for this dimension then use the smaller one.'
    )
  })

  it('should render diameter field when tipRack is selected (and hide the well shape radio group ,and should not render x/y fields)', () => {
    formikConfig.initialValues.labwareType = 'tipRack'
    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    expect(screen.getByRole('heading')).toHaveTextContent(/Tip Diameter/i)

    expect(screen.queryByRole('textbox', { name: /Well X/i })).toBeNull()
    expect(screen.queryByRole('textbox', { name: /Well Y/i })).toBeNull()
    expect(screen.queryByRole('radio', { name: /circular/i })).toBeNull()
    expect(screen.queryByRole('radio', { name: /rectangular/i })).toBeNull()

    screen.getByRole('textbox', { name: /Diameter/i })
  })

  it('should render diameter field when circular is selected (and should not render x/y fields)', () => {
    formikConfig.initialValues.wellShape = 'circular'
    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    expect(screen.queryByRole('textbox', { name: /Well X/i })).toBeNull()
    expect(screen.queryByRole('textbox', { name: /Well Y/i })).toBeNull()

    screen.getByRole('textbox', { name: /Diameter/i })
  })

  it('should render X and Y dimension fields when rectangular is selected', () => {
    formikConfig.initialValues.wellShape = 'rectangular'
    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    screen.getByRole('textbox', { name: /Well X/i })
    screen.getByRole('textbox', { name: /Well Y/i })

    expect(screen.queryByRole('textbox', { name: /Diameter/i })).toBeNull()
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { wellShape: FAKE_ERROR }
    formikConfig.initialTouched = { wellShape: true }
    render(wrapInFormik(<WellShapeAndSides />, formikConfig))

    screen.getByRole('alert')
  })
})
