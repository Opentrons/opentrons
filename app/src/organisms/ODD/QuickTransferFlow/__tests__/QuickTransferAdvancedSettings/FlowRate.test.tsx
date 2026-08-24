import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TouchInputField } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import { FlowRateEntry } from '../../QuickTransferAdvancedSettings/FlowRate'

import type { Mock } from 'vitest'
import type { ChangeEvent, ComponentProps } from 'react'
import type { TrackEventWithRobotSerial } from '/app/redux-resources/analytics'
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

const render = (props: ComponentProps<typeof FlowRateEntry>) => {
  return renderWithProviders(<FlowRateEntry {...props} />, {
    i18nInstance: i18n,
  })
}
const getLastTouchInputFieldProps = (): ComponentProps<
  typeof TouchInputField
> => {
  const lastCall = vi.mocked(TouchInputField).mock.calls.at(-1)
  if (lastCall == null) {
    throw new Error('TouchInputField was not rendered')
  }
  return lastCall[0] as ComponentProps<typeof TouchInputField>
}
const changeTouchInputValue = (value: string): void => {
  act(() => {
    getLastTouchInputFieldProps().onChange?.({
      target: { value },
    } as ChangeEvent<HTMLInputElement>)
  })
}
let mockTrackEventWithRobotSerial: Mock<TrackEventWithRobotSerial>

describe('FlowRate', () => {
  let props: ComponentProps<typeof FlowRateEntry>

  beforeEach(() => {
    props = {
      onBack: vi.fn(),
      kind: 'aspirate',
      state: {
        mount: 'left',
        pipette: {
          model: 'p50',
          channels: 1,
          liquids: {
            default: {
              maxVolume: 1000,
              minVolume: 5,
              supportedTips: {
                t50: {
                  uiMaxFlowRate: 92,
                  defaultAspirateFlowRate: {
                    default: 30,
                  },
                  defaultDispenseFlowRate: {
                    default: 80,
                  },
                },
              },
            },
          } as any,
        } as any,
        tipRack: {
          wells: {
            A1: {
              totalLiquidVolume: 50,
            },
          } as any,
        } as any,
        sourceWells: ['A1'],
        destinationWells: ['A1'],
        transferType: 'transfer',
        volume: 20,
        path: 'single',
        aspirateFlowRate: 35,
        dispenseFlowRate: 62,
      } as QuickTransferSummaryState,
      dispatch: vi.fn(),
    }
    mockTrackEventWithRobotSerial = vi.fn<TrackEventWithRobotSerial>()
    vi.mocked(useTrackEventWithRobotSerial).mockReturnValue({
      trackEventWithRobotSerial: mockTrackEventWithRobotSerial,
    })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the flow rate aspirate screen, continue, and back buttons', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Aspirate flow rate')
    screen.getByTestId('ChildNavigation_Primary_Button')
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Aspirate flow rate (µL/s)',
        error: null,
        type: 'text',
        value: '35',
        onChange: expect.any(Function),
      },
      {}
    )
    const exitBtn = screen.getByTestId('ChildNavigation_Back_Button')
    await user.click(exitBtn)
    expect(props.onBack).toHaveBeenCalled()
  })

  it('renders the flow rate dispense screen', () => {
    props = {
      ...props,
      kind: 'dispense',
    }
    render(props)
    screen.getByText('Dispense flow rate')
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Dispense flow rate (µL/s)',
        error: null,
        type: 'text',
        value: '62',
        onChange: expect.any(Function),
      },
      {}
    )
  })

  it('renders correct range if you enter incorrect value', async () => {
    render(props)
    const user = userEvent.setup()
    const deleteBtn = screen.getByText('del')
    await user.click(deleteBtn)
    await user.click(deleteBtn)
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Aspirate flow rate (µL/s)',
        error: null,
        type: 'text',
        value: '',
        onChange: expect.any(Function),
      },
      {}
    )
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(saveBtn).toBeDisabled()
  })

  it('calls dispatch when an in range value is entered and saved', async () => {
    render(props)
    const user = userEvent.setup()
    const deleteBtn = screen.getByText('del')
    await user.click(deleteBtn)
    await user.click(deleteBtn)
    const numButton = screen.getByText('1')
    await user.click(numButton)
    const saveBtn = screen.getByText('Save')
    await user.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })

  it('deletes external keyboard input with the stateless numerical keyboard', async () => {
    render(props)
    const user = userEvent.setup()

    changeTouchInputValue('12')
    await user.click(screen.getByText('del'))

    expect(getLastTouchInputFieldProps()).toEqual(
      expect.objectContaining({
        value: '1',
      })
    )
  })

  it('retains incomplete decimal input, shows an error, and disables save', () => {
    render(props)
    changeTouchInputValue('1.')
    expect(getLastTouchInputFieldProps()).toEqual(
      expect.objectContaining({
        value: '1.',
        error: 'Enter a valid number',
      })
    )
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeDisabled()
    changeTouchInputValue('1.5')
    expect(getLastTouchInputFieldProps()).toEqual(
      expect.objectContaining({
        value: '1.5',
        error: null,
      })
    )
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeEnabled()
  })
})
