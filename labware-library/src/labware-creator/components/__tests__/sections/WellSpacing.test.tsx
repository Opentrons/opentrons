import React from 'react'
import { FormikConfig } from 'formik'
import { when, resetAllWhenMocks } from 'jest-when'
import { render, screen } from '@testing-library/react'
import { nestedTextMatcher } from '@opentrons/components'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { isEveryFieldHidden, getLabwareName } from '../../../utils'
import { WellSpacing } from '../../sections/WellSpacing'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const getLabwareNameMock = getLabwareName as jest.MockedFunction<
  typeof getLabwareName
>

let formikConfig: FormikConfig<LabwareFields>

describe('WellSpacing', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: jest.fn(),
    }

    when(isEveryFieldHiddenMock)
      .calledWith(['gridSpacingX', 'gridSpacingY'], expect.any(Object))
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })

  it('should render when fields are visible', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, false)
      .mockReturnValue('FAKE LABWARE NAME SINGULAR')
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, true)
      .mockReturnValue('FAKE LABWARE NAME PLURAL')

    render(wrapInFormik(<WellSpacing />, formikConfig))

    screen.getByRole('heading', { name: /FAKE LABWARE NAME SINGULAR Spacing/i })

    screen.getByText(
      nestedTextMatcher(
        'Spacing is between the center of FAKE LABWARE NAME PLURAL.'
      )
    )

    screen.getByText(
      nestedTextMatcher(
        'FAKE LABWARE NAME SINGULAR spacing measurements inform the robot how far away rows and columns are from each other.'
      )
    )

    screen.getByRole('textbox', { name: /X Spacing \(Xs\)/i })
    screen.getByRole('textbox', { name: /Y Spacing \(Ys\)/i })
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

  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['gridSpacingX', 'gridSpacingY'], formikConfig.initialValues)
      .mockReturnValue(true)
    const { container } = render(wrapInFormik(<WellSpacing />, formikConfig))
    expect(container.firstChild).toBe(null)
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { gridSpacingX: FAKE_ERROR }
    formikConfig.initialTouched = { gridSpacingX: true }
    render(wrapInFormik(<WellSpacing />, formikConfig))

    screen.getByRole('alert')
  })
})
