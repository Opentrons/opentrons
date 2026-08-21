import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TouchInputField } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import { Delay } from '../../QuickTransferAdvancedSettings/Delay'

import type { ComponentProps } from 'react'
import type { QuickTransferSummaryState } from '../../types'

vi.mock('/app/redux-resources/analytics')
vi.mock('../utils')

vi.mock('@opentrons/components', async importOriginal => {
  const actualComponents = await importOriginal<typeof TouchInputField>()
  return {
    ...actualComponents,
    TouchInputField: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof Delay>) => {
  return renderWithProviders(<Delay {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('Delay', () => {
  let props: ComponentProps<typeof Delay>

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
        source: {
          wells: {
            A1: {
              totalLiquidVolume: 200,
              depth: 50,
            },
          } as any,
        } as any,
        destination: {
          wells: {
            A1: {
              totalLiquidVolume: 200,
              depth: 200,
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

  it('renders the first delay screen, continue, and back buttons', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Delay after aspirating')
    screen.getByTestId('ChildNavigation_Primary_Button')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    const exitBtn = screen.getByTestId('ChildNavigation_Back_Button')
    await user.click(exitBtn)
    expect(props.onBack).toHaveBeenCalled()
  })

  it('renders save button if you select enabled, then moves to second screen', async () => {
    render(props)
    const user = userEvent.setup()
    const enabledBtn = screen.getByText('Enabled')
    await user.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Delay duration (seconds)',
        error: null,
        type: 'number',
        value: null,
        onChange: expect.any(Function),
      },
      {}
    )
  })

  it('calls dispatch button if you select disabled and save', async () => {
    render(props)
    const user = userEvent.setup()
    const disabledBtn = screen.getByText('Disabled')
    await user.click(disabledBtn)
    const saveBtn = screen.getByText('Save')
    await user.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })

  it('has correct delay duration range', async () => {
    render(props)
    const user = userEvent.setup()
    const enabledBtn = screen.getByText('Enabled')
    await user.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    const oneButton = screen.getByText('0')
    await user.click(oneButton)
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Delay duration (seconds)',
        error: 'Value must be between 0.1 to 9999999999',
        type: 'number',
        value: 0,
        onChange: expect.any(Function),
      },
      {}
    )
    const nextBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(nextBtn).toBeDisabled()
  })

  it('calls dispatch when an in range value is entered and saved', async () => {
    render(props)
    const user = userEvent.setup()
    const enabledBtn = screen.getByText('Enabled')
    await user.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    const oneButton = screen.getByText('1')
    await user.click(oneButton)
    const nextBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    await user.click(nextBtn)
    const twoButton = screen.getByText('2')
    await user.click(twoButton)
    const saveBtn = screen.getByText('Save')
    await user.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })

  it('persists previously set value saved in state for aspirate', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      state: {
        ...props.state,
        delayAspirate: {
          delayDuration: 15,
        },
      },
    }
    render(props)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Delay duration (seconds)',
        error: null,
        type: 'number',
        value: 15,
        onChange: expect.any(Function),
      },
      {}
    )
  })

  it('persists previously set value saved in state for dispense', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      kind: 'dispense',
      state: {
        ...props.state,
        delayDispense: {
          delayDuration: 20,
        },
      },
    }
    render(props)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Delay duration (seconds)',
        error: null,
        type: 'number',
        value: 20,
        onChange: expect.any(Function),
      },
      {}
    )
  })
})
