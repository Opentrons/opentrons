import React from 'react'
import { FormikConfig } from 'formik'
import isEqual from 'lodash/isEqual'
import { render, screen } from '@testing-library/react'
import {
  getDefaultFormState,
  LabwareFields,
  snugLooseOptions,
} from '../../../fields'
import { HandPlacedTipFit } from '../../sections/HandPlacedTipFit'
import { FormAlerts } from '../../FormAlerts'
import { Dropdown } from '../../Dropdown'
import { wrapInFormik } from '../../utils/wrapInFormik'
import { TipFitAlerts } from '../../TipFitAlerts'

jest.mock('../../Dropdown')
jest.mock('../../FormAlerts')
jest.mock('../../TipFitAlerts')

const FormAlertsMock = FormAlerts as jest.MockedFunction<typeof FormAlerts>
const dropdownMock = Dropdown as jest.MockedFunction<typeof Dropdown>

const tipFitAlertsMock = TipFitAlerts as jest.MockedFunction<
  typeof TipFitAlerts
>

let formikConfig: FormikConfig<LabwareFields>

describe('HandPlacedTipFit', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      onSubmit: jest.fn(),
    }

    dropdownMock.mockImplementation(args => {
      if (
        isEqual(args, { name: 'handPlacedTipFit', options: snugLooseOptions })
      ) {
        return <div>handPlacedTipFit dropdown field</div>
      } else {
        return <div></div>
      }
    })

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
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

    tipFitAlertsMock.mockImplementation(args => {
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
    jest.restoreAllMocks()
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
    expect(screen.getByText('Hand-Placed Tip Fit'))
    expect(
      screen.getByText(
        'Place the tip you wish to use on the pipette you wish to use it on. Give the tip a wiggle to check the fit.'
      )
    )
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('handPlacedTipFit dropdown field'))
    expect(screen.getByText('mock getTipFitAlertsMock alerts'))
  })

  it('should not render when non tiprack labware selected', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    const { container } = render(
      wrapInFormik(<HandPlacedTipFit />, formikConfig)
    )
    expect(container.firstChild).toBe(null)
  })
})
