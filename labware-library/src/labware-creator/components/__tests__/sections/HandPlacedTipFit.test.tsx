import React from 'react'
import { FormikConfig } from 'formik'
import isEqual from 'lodash/isEqual'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
  snugLooseOptions,
} from '../../../fields'
import { HandPlacedTipFit } from '../../sections/HandPlacedTipFit'
import { FormAlerts } from '../../alerts/FormAlerts'
import { TipFitAlerts } from '../../alerts/TipFitAlerts'
import { Dropdown } from '../../Dropdown'
import { wrapInFormik } from '../../utils/wrapInFormik'

vi.mock('../../Dropdown')
vi.mock('../../alerts/FormAlerts')
vi.mock('../../alerts/TipFitAlerts')

let formikConfig: FormikConfig<LabwareFields>

describe('HandPlacedTipFit', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: vi.fn(),
    }

    vi.mocked(Dropdown).mockImplementation(args => {
      if (
        isEqual(args, { name: 'handPlacedTipFit', options: snugLooseOptions })
      ) {
        return <div>handPlacedTipFit dropdown field</div>
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
          fieldList: ['handPlacedTipFit'],
        })
      ) {
        return <div>mock alerts</div>
      } else {
        return <div></div>
      }
    })

    vi.mocked(TipFitAlerts).mockImplementation(args => {
      if (
        isEqual(args, {
          values: formikConfig.initialValues,
          touched: {},
        })
      ) {
        return <div>mock getTipFitAlertsMock alerts</div>
      } else {
        return <div></div>
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not render when no labware type selected', () => {
    const { container } = render(
      wrapInFormik(<HandPlacedTipFit />, formikConfig)
    )
    expect(container.firstChild).toBe(null)
  })

  it('should render alerts and dropdown when tiprack is selected', () => {
    formikConfig.initialValues.labwareType = 'tipRack'
    render(wrapInFormik(<HandPlacedTipFit />, formikConfig))
    expect(screen.getByText('Hand-Placed Tip Fit')).toBeTruthy()
    expect(
      screen.getByText(
        'Place the tip on the pipette you wish to use it on. Give the tip a wiggle to check the fit.'
      )
    ).toBeTruthy()
    expect(screen.getByText('mock alerts')).toBeTruthy()
    expect(screen.getByText('handPlacedTipFit dropdown field')).toBeTruthy()
    expect(screen.getByText('mock getTipFitAlertsMock alerts')).toBeTruthy()
  })

  it('should not render when non tiprack labware selected', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    const { container } = render(
      wrapInFormik(<HandPlacedTipFit />, formikConfig)
    )
    expect(container.firstChild).toBe(null)
  })
})
