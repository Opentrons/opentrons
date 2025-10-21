import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InputField } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import { AirGap } from '../../QuickTransferAdvancedSettings/AirGap'

import type { ComponentProps } from 'react'
import type { QuickTransferSummaryState } from '../../types'

vi.mock('/app/redux-resources/analytics')
vi.mock('../utils')

vi.mock('@opentrons/components', async importOriginal => {
  const actualComponents = await importOriginal<typeof InputField>()
  return {
    ...actualComponents,
    InputField: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof AirGap>) => {
  return renderWithProviders(<AirGap {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('AirGap', () => {
  let props: ComponentProps<typeof AirGap>

  beforeEach(() => {
    props = {
      onBack: vi.fn(),
      kind: 'aspirate',
      state: {
        mount: 'left',
        pipette: {
          channels: 1,
          liquids: [
            {
              maxVolume: 1000,
              minVolume: 5,
            },
          ] as any,
        } as any,
        tipRack: {
          parameters: {
            isTiprack: true,
          },
          wells: {
            A1: {
              totalLiquidVolume: 200,
            },
          } as any,
        } as any,
        sourceWells: ['A1'],
        destinationWells: ['A1'],
        transferType: 'transfer',
        volume: 20,
        path: 'single',
      } as QuickTransferSummaryState,
      dispatch: vi.fn(),
    }
    mockTrackEventWithRobotSerial = vi.fn(
      () => new Promise(resolve => resolve({}))
    )
    vi.mocked(useTrackEventWithRobotSerial).mockReturnValue({
      trackEventWithRobotSerial: mockTrackEventWithRobotSerial,
    })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the first air gap screen, continue, and back buttons', () => {
    render(props)
    screen.getByText('Air gap after aspirating')
    screen.getByTestId('ChildNavigation_Primary_Button')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    const exitBtn = screen.getByTestId('ChildNavigation_Back_Button')
    fireEvent.click(exitBtn)
    expect(props.onBack).toHaveBeenCalled()
  })

  it('renders save button if you select enabled, then moves to second screen', () => {
    render(props)
    const enabledBtn = screen.getByText('Enabled')
    fireEvent.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    fireEvent.click(continueBtn)
    expect(vi.mocked(InputField)).toHaveBeenCalledWith(
      {
        title: 'Air gap volume (µL)',
        error: null,
        readOnly: true,
        type: 'number',
        value: null,
      },
      {}
    )
  })

  it('calls dispatch button if you select disabled and save', () => {
    render(props)
    const disabledBtn = screen.getByText('Disabled')
    fireEvent.click(disabledBtn)
    const saveBtn = screen.getByText('Save')
    fireEvent.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })

  it('has correct range for aspirate with a single pipette path', () => {
    render(props)
    const enabledBtn = screen.getByText('Enabled')
    fireEvent.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    fireEvent.click(continueBtn)
    fireEvent.click(screen.getByText('2'))
    fireEvent.click(screen.getByText('0'))
    fireEvent.click(screen.getByText('0'))
    expect(vi.mocked(InputField)).toHaveBeenCalledWith(
      {
        title: 'Air gap volume (µL)',
        error: 'Value must be between 0 to 195',
        readOnly: true,
        type: 'number',
        value: 200,
      },
      {}
    )
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(saveBtn).toBeDisabled()
  })

  it('has correct range for aspirate with a multiAspirate pipette path', () => {
    props = {
      ...props,
      state: {
        ...props.state,
        path: 'multiAspirate',
      },
    }
    render(props)
    const enabledBtn = screen.getByText('Enabled')
    fireEvent.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    fireEvent.click(continueBtn)
    const numButton = screen.getByText('0')
    fireEvent.click(numButton)
    expect(vi.mocked(InputField)).toHaveBeenCalledWith(
      {
        title: 'Air gap volume (µL)',
        error: null,
        readOnly: true,
        type: 'number',
        value: 0,
      },
      {}
    )
  })

  it('has correct range for aspirate with a multiDispense pipette path', () => {
    props = {
      ...props,
      state: {
        ...props.state,
        path: 'multiDispense',
      },
    }
    render(props)
    const enabledBtn = screen.getByText('Enabled')
    fireEvent.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    fireEvent.click(continueBtn)
    const numButton = screen.getByText('0')
    fireEvent.click(numButton)
    expect(vi.mocked(InputField)).toHaveBeenCalledWith(
      {
        title: 'Air gap volume (µL)',
        error: null,
        readOnly: true,
        type: 'number',
        value: 0,
      },
      {}
    )
  })

  it('has correct range for and text for a dispense', () => {
    props = {
      ...props,
      kind: 'dispense',
    }
    render(props)
    screen.getByText('Air gap after dispensing')
    const enabledBtn = screen.getByText('Enabled')
    fireEvent.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    fireEvent.click(continueBtn)
    const numButton = screen.getByText('0')
    fireEvent.click(numButton)
    expect(vi.mocked(InputField)).toHaveBeenCalledWith(
      {
        title: 'Air gap volume (µL)',
        error: null,
        readOnly: true,
        type: 'number',
        value: 0,
      },
      {}
    )
  })

  it('calls dispatch when an in range value is entered and saved', () => {
    render(props)
    const enabledBtn = screen.getByText('Enabled')
    fireEvent.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    fireEvent.click(continueBtn)
    const numButton = screen.getByText('1')
    fireEvent.click(numButton)
    const saveBtn = screen.getByText('Save')
    fireEvent.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })

  it('persists existing values if they are in state for aspirate', () => {
    props = {
      ...props,
      state: {
        ...props.state,
        airGapAspirate: 4,
      },
    }
    render(props)
    const continueBtn = screen.getByText('Continue')
    fireEvent.click(continueBtn)
    expect(vi.mocked(InputField)).toHaveBeenCalledWith(
      {
        title: 'Air gap volume (µL)',
        error: null,
        readOnly: true,
        type: 'number',
        value: 4,
      },
      {}
    )
  })

  it('persists existing values if they are in state for dispense', () => {
    props = {
      ...props,
      kind: 'dispense',
      state: {
        ...props.state,
        airGapAspirate: 4,
        airGapDispense: 16,
      },
    }
    render(props)
    const continueBtn = screen.getByText('Continue')
    fireEvent.click(continueBtn)
    expect(vi.mocked(InputField)).toHaveBeenCalledWith(
      {
        title: 'Air gap volume (µL)',
        error: null,
        readOnly: true,
        type: 'number',
        value: 16,
      },
      {}
    )
  })
})
