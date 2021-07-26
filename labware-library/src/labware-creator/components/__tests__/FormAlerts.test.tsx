import * as React from 'react'
import { render } from '@testing-library/react'
import { getIsHidden } from '../../formSelectors'
import {
  IRREGULAR_LABWARE_ERROR,
  LOOSE_TIP_FIT_ERROR,
  LABWARE_TOO_SMALL_ERROR,
  LABWARE_TOO_LARGE_ERROR,
} from '../../fields'
import { FormAlerts, Props as FormAlertProps } from '../alerts/FormAlerts'
import { when, resetAllWhenMocks } from 'jest-when'

jest.mock('../../formSelectors')

const getIsHiddenMock = getIsHidden as jest.MockedFunction<typeof getIsHidden>

describe('FormAlerts', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })
  it('should render a warning when an input is not valid', () => {
    when(getIsHiddenMock)
      .calledWith('labwareType', {} as any)
      .mockReturnValue(false)

    when(getIsHiddenMock)
      .calledWith('tubeRackInsertLoadName', {} as any)
      .mockReturnValue(false)

    const props: FormAlertProps = {
      values: { labwareType: 'wellPlate', tubeRackInsertLoadName: null } as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: 'some warning',
      },
    }

    const { container } = render(<FormAlerts {...props} />)
    const warning = container.querySelector('[class="alert warning"]')
    expect(warning?.textContent).toBe('some warning')
  })
  it('should render an incompatible labware error when the labware is not compatible with labware creator', () => {
    when(getIsHiddenMock)
      .calledWith('labwareType', {} as any)
      .mockReturnValue(false)

    when(getIsHiddenMock)
      .calledWith('tubeRackInsertLoadName', {} as any)
      .mockReturnValue(false)

    const props: FormAlertProps = {
      values: { labwareType: 'wellPlate', tubeRackInsertLoadName: null } as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: IRREGULAR_LABWARE_ERROR,
      },
    }

    const { container } = render(<FormAlerts {...props} />)
    const error = container.querySelector('[class="alert error"]')
    expect(error?.textContent).toBe(
      'Your labware is not compatible with the Labware Creator. Please fill out this form to request a custom labware definition.'
    )
  })

  it('should render a loose tip fit error when hand placed fit is loose', () => {
    when(getIsHiddenMock)
      .calledWith('labwareType', {} as any)
      .mockReturnValue(false)
    when(getIsHiddenMock)
      .calledWith('tubeRackInsertLoadName', {} as any)
      .mockReturnValue(false)

    const props: FormAlertProps = {
      values: { labwareType: 'wellPlate', tubeRackInsertLoadName: null } as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: LOOSE_TIP_FIT_ERROR,
      },
    }

    const { container } = render(<FormAlerts {...props} />)
    const error = container.querySelector('[class="alert error"]')
    expect(error?.textContent).toBe(
      'If your tip does not fit when placed by hand then it is not a good candidate for this pipette on the OT-2.'
    )
  })

  it('should render labware too small error when labware footprint is too small', () => {
    when(getIsHiddenMock)
      .calledWith('labwareType', {} as any)
      .mockReturnValue(false)
    when(getIsHiddenMock)
      .calledWith('tubeRackInsertLoadName', {} as any)
      .mockReturnValue(false)

    const props: FormAlertProps = {
      values: { labwareType: 'wellPlate', tubeRackInsertLoadName: null } as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: LABWARE_TOO_SMALL_ERROR,
      },
    }

    const { container } = render(<FormAlerts {...props} />)
    const error = container.querySelector('[class="alert error"]')
    expect(error?.textContent).toBe(
      'Your labware is too small to fit in a slot properly. Please fill out this form to request an adapter.'
    )
  })

  it('should render labware too large error when labware footprint is too large', () => {
    when(getIsHiddenMock)
      .calledWith('labwareType', {} as any)
      .mockReturnValue(false)
    when(getIsHiddenMock)
      .calledWith('tubeRackInsertLoadName', {} as any)
      .mockReturnValue(false)

    const props: FormAlertProps = {
      values: { labwareType: 'wellPlate', tubeRackInsertLoadName: null } as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: LABWARE_TOO_LARGE_ERROR,
      },
    }

    const { container } = render(<FormAlerts {...props} />)
    const error = container.querySelector('[class="alert error"]')
    expect(error?.textContent).toBe(
      'Your labware is too large to fit in a single slot properly. Please fill out this form to request a custom labware definition.'
    )
  })
})
