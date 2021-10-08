import React from 'react'
import { FormikConfig } from 'formik'
import isEqual from 'lodash/isEqual'
import { when, resetAllWhenMocks } from 'jest-when'
import { render, screen } from '@testing-library/react'
import { nestedTextMatcher } from '@opentrons/components'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { isEveryFieldHidden, getLabwareName } from '../../../utils'
import { GridOffset } from '../../sections/GridOffset'
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

const getLabwareNameMock = getLabwareName as jest.MockedFunction<
  typeof getLabwareName
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('GridOffset', () => {
  beforeEach(() => {
    textFieldMock.mockImplementation(args => {
      if (args.name === 'gridOffsetX') {
        return <div>gridOffsetX text field</div>
      }
      if (args.name === 'gridOffsetY') {
        return <div>gridOffsetY text field</div>
      } else {
        return <div></div>
      }
    })

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          values: formikConfig.initialValues,
          touched: {},
          errors: {},
          fieldList: ['gridOffsetX', 'gridOffsetY'],
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
    resetAllWhenMocks()
  })

  it('should render when fields are visible', () => {
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, false)
      .mockReturnValue('FAKE LABWARE NAME SINGULAR')
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, true)
      .mockReturnValue('FAKE LABWARE NAME PLURAL')

    render(wrapInFormik(<GridOffset />, formikConfig))
    expect(screen.getByText('Grid Offset'))
    expect(screen.getByText('mock alerts'))
    expect(
      screen.getByText(
        "Corner offset informs the robot how far the grid of FAKE LABWARE NAME PLURAL is from the slot's top left corner."
      )
    )

    screen.getByText(
      nestedTextMatcher(
        "Find the measurement from the center of FAKE LABWARE NAME SINGULAR A1 to the edge of the labware's footprint."
      )
    )

    expect(screen.getByText('gridOffsetX text field'))
    expect(screen.getByText('gridOffsetY text field'))
  })

  it('should show reservoir-specific instructions when reservoir is selected', () => {
    const { getByText } = render(
      wrapInFormik(<GridOffset />, {
        ...formikConfig,
        initialValues: {
          ...formikConfig.initialValues,
          labwareType: 'reservoir',
        },
      })
    )

    getByText(
      nestedTextMatcher(
        "Find the measurement from the center of the top left-most well to the edge of the labware's footprint."
      )
    )
  })

  it('should NOT render when the labware type is aluminumBlock', () => {
    const { container } = render(
      wrapInFormik(<GridOffset />, {
        ...formikConfig,
        initialValues: {
          ...formikConfig.initialValues,
          labwareType: 'aluminumBlock',
        },
      })
    )
    expect(container.firstChild).toBe(null)
  })

  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['gridOffsetX', 'gridOffsetY'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<GridOffset />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
