import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import { TipPositionEntry } from '../../QuickTransferAdvancedSettings/TipPosition'

import type { ComponentProps } from 'react'
import type { QuickTransferSummaryState } from '../../types'

vi.mock('/app/redux-resources/analytics')
vi.mock('../utils')

const render = (props: ComponentProps<typeof TipPositionEntry>) => {
  return renderWithProviders(<TipPositionEntry {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('TipPosition', () => {
  let props: ComponentProps<typeof TipPositionEntry>

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
        tipPositionAspirate: 10,
        tipPositionDispense: 75,
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

  it('renders the tip position aspirate screen, continue, and back buttons', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Aspirate tip position')
    screen.getByTestId('ChildNavigation_Primary_Button')
    expect(
      screen.getByLabelText('Distance from bottom of well (mm)')
    ).toHaveValue('10')
    const exitBtn = screen.getByTestId('ChildNavigation_Back_Button')
    await user.click(exitBtn)
    expect(props.onBack).toHaveBeenCalled()
  })

  it('renders the tip position dispense screen', () => {
    props = {
      ...props,
      kind: 'dispense',
    }
    render(props)
    screen.getByText('Dispense tip position')
    expect(
      screen.getByLabelText('Distance from bottom of well (mm)')
    ).toHaveValue('75')
  })

  it('renders correct range if you enter incorrect value for aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    const deleteBtn = screen.getByText('del')
    await user.click(deleteBtn)
    await user.click(deleteBtn)
    expect(
      screen.getByLabelText('Distance from bottom of well (mm)')
    ).toHaveValue('')
    await user.click(screen.getByText('0'))
    expect(
      screen.getByLabelText('Distance from bottom of well (mm)')
    ).toHaveValue('0')
    screen.getByText('Value must be between 1 to 52')
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(saveBtn).toBeDisabled()
  })

  it('renders correct range if you enter incorrect value for dispense', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      kind: 'dispense',
    }
    render(props)
    const deleteBtn = screen.getByText('del')
    await user.click(deleteBtn)
    await user.click(deleteBtn)
    await user.click(screen.getByText('0'))
    expect(
      screen.getByLabelText('Distance from bottom of well (mm)')
    ).toHaveValue('0')
    screen.getByText('Value must be between 1 to 202')
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(saveBtn).toBeDisabled()
  })

  it('calls dispatch when an in range value is entered and saved', async () => {
    render(props)
    const user = userEvent.setup()
    const deleteBtn = screen.getByText('del')
    await user.click(deleteBtn)
    const numButton = screen.getByText('1')
    await user.click(numButton)
    const saveBtn = screen.getByText('Save')
    await user.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })
})
