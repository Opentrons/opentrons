import React from 'react'
import { FormikConfig } from 'formik'
import isEqual from 'lodash/isEqual'
import { when } from 'jest-when'
import { render, screen } from '@testing-library/react'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { Footprint } from '../../sections/Footprint'
import { FormAlerts } from '../../alerts/FormAlerts'
import { XYDimensionAlerts } from '../../alerts/XYDimensionAlerts'
import { TextField } from '../../TextField'
import { wrapInFormik } from '../../utils/wrapInFormik'

import { isEveryFieldHidden } from '../../../utils'

jest.mock('../../TextField')
jest.mock('../../alerts/FormAlerts')
jest.mock('../../alerts/XYDimensionAlerts')
jest.mock('../../../utils')

const FormAlertsMock = FormAlerts as jest.MockedFunction<typeof FormAlerts>
const textFieldMock = TextField as jest.MockedFunction<typeof TextField>
const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const XYDimensionAlertsMock = XYDimensionAlerts as jest.MockedFunction<
  typeof XYDimensionAlerts
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
      return <div></div>
    })

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          touched: {},
          errors: {},
          fieldList: ['footprintXDimension', 'footprintYDimension'],
        })
      ) {
        return <div>mock alerts</div>
      } else {
        return <div></div>
      }
    })

    XYDimensionAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          values: formikConfig.initialValues,
          touched: {},
        })
      ) {
        return <div>mock XYDimensionAlertsMock alerts</div>
      } else {
        return <div></div>
      }
    })

    when(isEveryFieldHiddenMock)
      .calledWith(
        ['footprintXDimension', 'footprintYDimension'],
        formikConfig.initialValues
      )
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should render alerts and text fields when fields are visible', () => {
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
    expect(screen.getByText('mock XYDimensionAlertsMock alerts'))
  })
  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(
        ['footprintXDimension', 'footprintYDimension'],
        formikConfig.initialValues
      )
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Footprint />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
