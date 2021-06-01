import React from 'react'
import { FormikConfig } from 'formik'
import isEqual from 'lodash/isEqual'
import { when } from 'jest-when'
import { render, screen } from '@testing-library/react'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { WellSpacing } from '../../sections/WellSpacing'
import { FormAlerts } from '../../alerts/FormAlerts'
import { TextField } from '../../TextField'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')
jest.mock('../../TextField')
jest.mock('../../alerts/FormAlerts')

const FormAlertsMock = FormAlerts as jest.MockedFunction<typeof FormAlerts>

const textFieldMock = TextField as jest.MockedFunction<typeof TextField>

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('WellSpacing', () => {
  beforeEach(() => {
    textFieldMock.mockImplementation(args => {
      if (args.name === 'gridSpacingX') {
        return <div>gridSpacingX text field</div>
      }
      if (args.name === 'gridSpacingY') {
        return <div>gridSpacingY text field</div>
      } else {
        return <div></div>
      }
    })

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          touched: {},
          errors: {},
          fieldList: ['gridSpacingX', 'gridSpacingY'],
        })
      ) {
        return <div>mock alerts</div>
      } else {
        return <div></div>
      }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render when fields are visible', () => {
    render(wrapInFormik(<WellSpacing />, formikConfig))
    expect(screen.getByText('Well Spacing'))
    expect(screen.getByText('mock alerts'))
    expect(
      screen.getByText(
        'Well spacing measurements inform the robot how far away rows and columns are from each other.'
      )
    )
    expect(screen.getByText('gridSpacingX text field'))
    expect(screen.getByText('gridSpacingX text field'))
  })

  it('should NOT render when the labware type is aluminumBlock', () => {
    const { container } = render(
      wrapInFormik(<WellSpacing />, {
        ...formikConfig,
        initialValues: {
          ...formikConfig.initialValues,
          labwareType: 'aluminumBlock',
        },
      })
    )
    expect(container.firstChild).toBe(null)
  })
  it('should NOT render when the labware type is tubeRack', () => {
    const { container } = render(
      wrapInFormik(<WellSpacing />, {
        ...formikConfig,
        initialValues: {
          ...formikConfig.initialValues,
          labwareType: 'tubeRack',
        },
      })
    )
    expect(container.firstChild).toBe(null)
  })

  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['gridSpacingX', 'gridSpacingY'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<WellSpacing />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
