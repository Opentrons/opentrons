import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TouchInputField } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import { TouchTip } from '../../QuickTransferAdvancedSettings/TouchTip'

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

const render = (props: ComponentProps<typeof TouchTip>) => {
  return renderWithProviders(<TouchTip {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('TouchTip', () => {
  let props: ComponentProps<typeof TouchTip>

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

  it('renders the first touch tip screen, continue, and back buttons', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Touch tip after aspirating')
    screen.getByTestId('ChildNavigation_Primary_Button')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    const exitBtn = screen.getByTestId('ChildNavigation_Back_Button')
    await user.click(exitBtn)
    expect(props.onBack).toHaveBeenCalled()
  })

  it('renders the correct copy for dispense', () => {
    props = {
      ...props,
      kind: 'dispense',
    }
    render(props)
    screen.getByText('Touch tip after dispensing')
  })

  it('renders save button if you select enabled, then moves to second screen', async () => {
    render(props)
    const user = userEvent.setup()
    const enabledBtn = screen.getByText('Enabled')
    await user.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    await user.click(screen.getByText('1'))
    await user.click(continueBtn)
    expect(vi.mocked(TouchInputField)).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Touch tip position from top of well (mm)',
        error: null,
        type: 'text',
        value: '',
      }),
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

  it('has correct range for aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    const enabledBtn = screen.getByText('Enabled')
    await user.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    const numOneButton = screen.getByText('1')
    await user.click(numOneButton)
    await user.click(continueBtn)
    const negButton = screen.getByText('-')
    await user.click(negButton)
    const numButton = screen.getByText('9')
    await user.click(numButton)
    const secondNumButton = screen.getByText('8')
    await user.click(secondNumButton)
    expect(vi.mocked(TouchInputField)).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Touch tip position from top of well (mm)',
        error: 'Value must be between -25 to 0',
        type: 'text',
        value: '-98',
      }),
      {}
    )
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(saveBtn).toBeDisabled()
  })

  it('has correct range for dispense', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      kind: 'dispense',
    }
    render(props)
    const enabledBtn = screen.getByText('Enabled')
    await user.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    const numOneButton = screen.getByText('1')
    await user.click(numOneButton)
    await user.click(continueBtn)
    const numButton = screen.getByText('1')
    await user.click(numButton)
    expect(vi.mocked(TouchInputField)).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Touch tip position from top of well (mm)',
        error: 'Value must be between -100 to 0',
        type: 'text',
        value: '1',
      }),
      {}
    )
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(saveBtn).toBeDisabled()
  })

  it('calls dispatch when an in range value is entered and saved', async () => {
    render(props)
    const user = userEvent.setup()
    const enabledBtn = screen.getByText('Enabled')
    await user.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    const numButton = screen.getByText('1')
    await user.click(numButton)
    await user.click(continueBtn)
    const saveBtn = screen.getByText('Save')
    const zeroButton = screen.getByText('0')
    await user.click(zeroButton)
    await user.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })

  it('renders previously set value saved in state for aspirate', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      state: {
        ...props.state,
        touchTipAspirate: -25,
      },
    }
    render(props)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    const numButton = screen.getByText('0')
    await user.click(numButton)
    await user.click(continueBtn)
    expect(vi.mocked(TouchInputField)).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Touch tip position from top of well (mm)',
        error: null,
        type: 'text',
        value: '-25',
      }),
      {}
    )
  })

  it('renders previously set value saved in state for dispense', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      kind: 'dispense',
      state: {
        ...props.state,
        touchTipDispense: -8,
      },
    }
    render(props)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    const numButton = screen.getByText('0')
    await user.click(numButton)
    await user.click(continueBtn)
    expect(vi.mocked(TouchInputField)).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Touch tip position from top of well (mm)',
        error: null,
        type: 'text',
        value: '-8',
      }),
      {}
    )
  })
})
