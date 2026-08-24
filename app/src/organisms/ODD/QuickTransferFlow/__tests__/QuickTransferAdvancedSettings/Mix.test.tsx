import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import { Mix } from '../../QuickTransferAdvancedSettings/Mix'

import type { ComponentProps } from 'react'
import type { QuickTransferSummaryState } from '../../types'

vi.mock('/app/redux-resources/analytics')
vi.mock('../utils')

const render = (props: ComponentProps<typeof Mix>) => {
  return renderWithProviders(<Mix {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('Mix', () => {
  let props: ComponentProps<typeof Mix>

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

  it('renders the first Mix screen, continue, and back buttons', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Mix before aspirating')
    screen.getByTestId('ChildNavigation_Primary_Button')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    const exitBtn = screen.getByTestId('ChildNavigation_Back_Button')
    await user.click(exitBtn)
    expect(props.onBack).toHaveBeenCalled()
  })

  it('renders the different copy for Mix on dispense', () => {
    props = {
      ...props,
      kind: 'dispense',
    }
    render(props)
    screen.getByText('Mix after dispensing')
  })

  it('renders save button if you select enabled, then moves to second screen', async () => {
    render(props)
    const user = userEvent.setup()
    const enabledBtn = screen.getByText('Enabled')
    await user.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    expect(screen.getByLabelText('Mix volume (µL)')).toHaveValue('')
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

  it('has correct Mix volume range', async () => {
    render(props)
    const user = userEvent.setup()
    const enabledBtn = screen.getByText('Enabled')
    await user.click(enabledBtn)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    const oneButton = screen.getByText('0')
    await user.click(oneButton)
    expect(screen.getByLabelText('Mix volume (µL)')).toHaveValue('0')
    screen.getByText('Value must be between 1 to 200')
    const nextBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(nextBtn).toBeDisabled()
  })

  it('has correct range for Mix repitition range', async () => {
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
    const zeroButton = screen.getByText('0')
    await user.click(zeroButton)
    expect(screen.getByLabelText('Mix repetitions')).toHaveValue('0')
    screen.getByText('Value must be between 1 to 999')
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
        mixOnAspirate: {
          mixVolume: 15,
          repetitions: 55,
        },
      },
    }
    render(props)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    expect(screen.getByLabelText('Mix volume (µL)')).toHaveValue('15')
    await user.click(continueBtn)
    expect(screen.getByLabelText('Mix repetitions')).toHaveValue('55')
  })

  it('persists previously set value saved in state for dispense', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      kind: 'dispense',
      state: {
        ...props.state,
        mixOnDispense: {
          mixVolume: 18,
          repetitions: 2,
        },
      },
    }
    render(props)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    expect(screen.getByLabelText('Mix volume (µL)')).toHaveValue('18')
    await user.click(continueBtn)
    expect(screen.getByLabelText('Mix repetitions')).toHaveValue('2')
  })
})
