import * as React from 'react'
import { vi, describe, it, expect, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { render, screen } from '@testing-library/react'
import { getIsHidden } from '../../formSelectors'
import {
  IRREGULAR_LABWARE_ERROR,
  LOOSE_TIP_FIT_ERROR,
  LABWARE_TOO_SMALL_ERROR,
  LABWARE_TOO_LARGE_ERROR,
} from '../../fields'
import { FormAlerts, Props as FormAlertProps } from '../alerts/FormAlerts'

vi.mock('../../formSelectors')

describe('FormAlerts', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('should render a warning when an input is not valid', () => {
    when(vi.mocked(getIsHidden))
      .calledWith('labwareType', {} as any)
      .thenReturn(false)

    when(vi.mocked(getIsHidden))
      .calledWith('tubeRackInsertLoadName', {} as any)
      .thenReturn(false)

    const props: FormAlertProps = {
      values: { labwareType: 'wellPlate', tubeRackInsertLoadName: null } as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: 'some warning',
      },
    }

    render(<FormAlerts {...props} />)
    const alertItem = screen.getByTestId('alert_item_title')
    expect(alertItem).toHaveTextContent('some warning')
  })
  it('should render an incompatible labware error when the labware is not compatible with labware creator', () => {
    when(vi.mocked(getIsHidden))
      .calledWith('labwareType', {} as any)
      .thenReturn(false)

    when(vi.mocked(getIsHidden))
      .calledWith('tubeRackInsertLoadName', {} as any)
      .thenReturn(false)

    const props: FormAlertProps = {
      values: { labwareType: 'wellPlate', tubeRackInsertLoadName: null } as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: IRREGULAR_LABWARE_ERROR,
      },
    }

    render(<FormAlerts {...props} />)
    const alertItem = screen.getByTestId('alert_item_title')
    expect(alertItem).toHaveTextContent(
      'Your labware is not compatible with the Labware Creator. Please fill out this form to request a custom labware definition.'
    )
  })

  it('should render a loose tip fit error when hand placed fit is loose', () => {
    when(vi.mocked(getIsHidden))
      .calledWith('labwareType', {} as any)
      .thenReturn(false)
    when(vi.mocked(getIsHidden))
      .calledWith('tubeRackInsertLoadName', {} as any)
      .thenReturn(false)

    const props: FormAlertProps = {
      values: { labwareType: 'wellPlate', tubeRackInsertLoadName: null } as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: LOOSE_TIP_FIT_ERROR,
      },
    }

    render(<FormAlerts {...props} />)
    const alertItem = screen.getByTestId('alert_item_title')
    expect(alertItem).toHaveTextContent(
      'If your tip does not fit when placed by hand then it is not a good candidate for this pipette on the OT-2.'
    )
  })

  it('should render labware too small error when labware footprint is too small', () => {
    when(vi.mocked(getIsHidden))
      .calledWith('labwareType', {} as any)
      .thenReturn(false)
    when(vi.mocked(getIsHidden))
      .calledWith('tubeRackInsertLoadName', {} as any)
      .thenReturn(false)

    const props: FormAlertProps = {
      values: { labwareType: 'wellPlate', tubeRackInsertLoadName: null } as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: LABWARE_TOO_SMALL_ERROR,
      },
    }

    render(<FormAlerts {...props} />)
    const alertItem = screen.getByTestId('alert_item_title')
    expect(alertItem).toHaveTextContent(
      'Your labware is too small to fit in a slot properly. Please fill out this form to request an adapter.'
    )
  })

  it('should render labware too large error when labware footprint is too large', () => {
    when(vi.mocked(getIsHidden))
      .calledWith('labwareType', {} as any)
      .thenReturn(false)
    when(vi.mocked(getIsHidden))
      .calledWith('tubeRackInsertLoadName', {} as any)
      .thenReturn(false)

    const props: FormAlertProps = {
      values: { labwareType: 'wellPlate', tubeRackInsertLoadName: null } as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: LABWARE_TOO_LARGE_ERROR,
      },
    }

    render(<FormAlerts {...props} />)
    const alertItem = screen.getByTestId('alert_item_title')
    expect(alertItem).toHaveTextContent(
      'Your labware is too large to fit in a single slot properly. Please fill out this form to request a custom labware definition.'
    )
  })
})
