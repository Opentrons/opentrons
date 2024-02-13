import React from 'react'
import { FormikConfig } from 'formik'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { render, screen } from '@testing-library/react'
import { nestedTextMatcher } from '../../__testUtils__/nestedTextMatcher'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { isEveryFieldHidden, getLabwareName } from '../../../utils'
import { WellSpacing } from '../../sections/WellSpacing'
import { wrapInFormik } from '../../utils/wrapInFormik'

vi.mock('../../../utils')

let formikConfig: FormikConfig<LabwareFields>

describe('WellSpacing', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: vi.fn(),
    }

    when(vi.mocked(isEveryFieldHidden))
      .calledWith(['gridSpacingX', 'gridSpacingY'], expect.any(Object))
      .thenReturn(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render when fields are visible', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, false)
      .thenReturn('FAKE LABWARE NAME SINGULAR')
    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, true)
      .thenReturn('FAKE LABWARE NAME PLURAL')

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
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(['gridSpacingX', 'gridSpacingY'], formikConfig.initialValues)
      .thenReturn(true)
    const { container } = render(wrapInFormik(<WellSpacing />, formikConfig))
    expect(container.firstChild).toBe(null)
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { gridSpacingX: FAKE_ERROR }
    formikConfig.initialTouched = { gridSpacingX: true }
    render(wrapInFormik(<WellSpacing />, formikConfig))

    // TODO(IL, 2021-05-26): AlertItem should have role="alert", then we can `getByRole('alert', {name: FAKE_ERROR})`
    screen.getByText(FAKE_ERROR)
  })
})
