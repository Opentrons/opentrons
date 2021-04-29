import React from 'react'
import { FormikConfig } from 'formik'
import { when } from 'jest-when'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { Footprint } from '../../sections/Footprint'
import { getFormAlerts } from '../../utils/getFormAlerts'
import { TextField } from '../../TextField'
import { wrapInFormik } from '../../utils/wrapInFormik'
import { getXYDimensionAlerts } from '../../utils/getXYDimensionAlerts'

jest.mock('../../TextField')
jest.mock('../../utils/getFormAlerts')
jest.mock('../../utils/getXYDimensionAlerts')

const getFormAlertsMock = getFormAlerts as jest.MockedFunction<
  typeof getFormAlerts
>
const textFieldMock = TextField as jest.MockedFunction<typeof TextField>

const getXYDimensionAlertsMock = getXYDimensionAlerts as jest.MockedFunction<
  typeof getXYDimensionAlerts
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('Footprint', () => {
  beforeEach(() => {
    textFieldMock.mockImplementation(args => {
      if (args.name === 'footprintXDimension') {
        return <div>footprintXDimension text field</div>
      }
      if (args.name === 'footprintYDimension') {
        return <div>footprintYDimension text field</div>
      }
      throw new Error(
        `Text field should have been called with footprintXDimension or footprintYDimension, instead got ${args.name} `
      )
    })

    when(getFormAlertsMock)
      .expectCalledWith({
        values: getDefaultFormState(),
        touched: {},
        errors: {},
        fieldList: ['footprintXDimension', 'footprintYDimension'],
      })
      .mockReturnValue([<div key="mock key">mock alerts</div>])

    when(getXYDimensionAlertsMock)
      .expectCalledWith(getDefaultFormState(), {})
      .mockReturnValue(<div>mock getXYDimensionAlertsMock alerts</div>)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should render with the correct information', () => {
    render(wrapInFormik(<Footprint />, formikConfig))
    expect(screen.getByText('Footprint'))
    expect(
      screen.getByText(
        'The footprint measurement helps determine if the labware fits firmly into the slots on the OT-2 deck.'
      )
    )
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('footprintXDimension text field'))
    expect(screen.getByText('footprintYDimension text field'))
    expect(screen.getByText('mock getXYDimensionAlertsMock alerts'))
  })
})
