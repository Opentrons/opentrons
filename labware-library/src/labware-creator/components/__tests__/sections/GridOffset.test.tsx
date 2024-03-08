import React from 'react'
import { FormikConfig } from 'formik'
import isEqual from 'lodash/isEqual'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { render, screen } from '@testing-library/react'
import { nestedTextMatcher } from '../../__testUtils__/nestedTextMatcher'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { isEveryFieldHidden, getLabwareName } from '../../../utils'
import { GridOffset } from '../../sections/GridOffset'
import { FormAlerts } from '../../alerts/FormAlerts'
import { TextField } from '../../TextField'
import { wrapInFormik } from '../../utils/wrapInFormik'

vi.mock('../../../utils')
vi.mock('../../TextField')
vi.mock('../../alerts/FormAlerts')

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: vi.fn(),
}

describe('GridOffset', () => {
  beforeEach(() => {
    vi.mocked(TextField).mockImplementation(args => {
      if (args.name === 'gridOffsetX') {
        return <div>gridOffsetX text field</div>
      }
      if (args.name === 'gridOffsetY') {
        return <div>gridOffsetY text field</div>
      } else {
        return <div></div>
      }
    })

    vi.mocked(FormAlerts).mockImplementation(args => {
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
    vi.restoreAllMocks()
  })

  it('should render when fields are visible', () => {
    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, false)
      .thenReturn('FAKE LABWARE NAME SINGULAR')
    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, true)
      .thenReturn('FAKE LABWARE NAME PLURAL')

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
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(['gridOffsetX', 'gridOffsetY'], formikConfig.initialValues)
      .thenReturn(true)

    const { container } = render(wrapInFormik(<GridOffset />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
