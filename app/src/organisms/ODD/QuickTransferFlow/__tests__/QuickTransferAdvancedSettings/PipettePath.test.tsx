import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import { useBlowOutLocationOptions } from '../../QuickTransferAdvancedSettings/BlowOut'
import { PipettePath } from '../../QuickTransferAdvancedSettings/PipettePath'

import type { ComponentProps } from 'react'
import type { QuickTransferSummaryState } from '../../types'

vi.mock('/app/redux-resources/analytics')
vi.mock('../utils')
vi.mock('../../QuickTransferAdvancedSettings/BlowOut')

const render = (props: ComponentProps<typeof PipettePath>) => {
  return renderWithProviders(<PipettePath {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('PipettePath', () => {
  let props: ComponentProps<typeof PipettePath>

  beforeEach(() => {
    props = {
      onBack: vi.fn(),
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
        transferType: 'consolidate',
        volume: 20,
        path: 'multiAspirate',
      } as QuickTransferSummaryState,
      dispatch: vi.fn(),
    }
    mockTrackEventWithRobotSerial = vi.fn(
      () => new Promise(resolve => resolve({}))
    )
    vi.mocked(useTrackEventWithRobotSerial).mockReturnValue({
      trackEventWithRobotSerial: mockTrackEventWithRobotSerial,
    })
    vi.mocked(useBlowOutLocationOptions).mockReturnValue([
      {
        location: 'source_well',
        description: 'Source well',
      },
    ])
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the first pipette path screen, continue, back buttons', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Pipette path')
    screen.getByTestId('ChildNavigation_Primary_Button')
    const exitBtn = screen.getByTestId('ChildNavigation_Back_Button')
    await user.click(exitBtn)
    expect(props.onBack).toHaveBeenCalled()
  })

  it('renders multi aspirate and single options for consolidate if there is room in the tip', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Single transfers')
    screen.getByText('Multi-aspirate')
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    await user.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })

  it('renders single option only for consolidate if there is not room in the tip', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      state: {
        ...props.state,
        volume: 101,
      },
    }
    render(props)
    screen.getByText('Single transfers')
    expect(screen.queryByText('Multi-aspirate')).not.toBeInTheDocument()
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    await user.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })

  it('renders multi dispense and single options for distribute if there is room in the tip', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      state: {
        ...props.state,
        transferType: 'distribute',
      },
    }
    render(props)
    screen.getByText('Single transfers')
    screen.getByText('Multi-dispense')
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    await user.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })

  it('renders single option only for distribute if there is not room in the tip', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      state: {
        ...props.state,
        transferType: 'distribute',
        volume: 67,
      },
    }
    render(props)
    screen.getByText('Single transfers')
    expect(screen.queryByText('Multi-dispense')).not.toBeInTheDocument()
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    await user.click(saveBtn)
    expect(props.dispatch).toHaveBeenCalled()
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
  })

  it('renders next cta and disposal volume screen if you choose multi dispense', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      state: {
        ...props.state,
        transferType: 'distribute',
        path: 'multiDispense',
        disposalVolumeDispenseSettings: {
          volume: 20,
          blowOutLocation: 'source_well',
          flowRate: 10,
        },
      },
    }
    render(props)
    const multiDispenseBtn = screen.getByText('Multi-dispense')
    await user.click(multiDispenseBtn)
    const continueBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    await user.click(continueBtn)

    expect(screen.getByLabelText('Disposal volume (µL)')).toHaveValue('20')
  })

  it('renders error on disposal volume screen if you select an out of range value', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      state: {
        ...props.state,
        transferType: 'distribute',
        path: 'multiDispense',
        disposalVolumeDispenseSettings: {
          volume: 20,
          blowOutLocation: 'source_well',
          flowRate: 10,
        },
      },
    }
    render(props)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    const oneButton = screen.getByText('1')
    await user.click(oneButton)
    expect(screen.getByLabelText('Disposal volume (µL)')).toHaveValue('201')
    screen.getByText('Value must be between 1 to 160')
    const nextBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(nextBtn).toBeDisabled()
  })

  it('renders blowout options on third screen and calls dispatch when saved', async () => {
    const user = userEvent.setup()
    props = {
      ...props,
      state: {
        ...props.state,
        transferType: 'distribute',
        path: 'multiDispense',
        disposalVolumeDispenseSettings: {
          volume: 20,
          blowOutLocation: 'source_well',
          flowRate: 10,
        },
      },
    }
    render(props)
    const continueBtn = screen.getByText('Continue')
    await user.click(continueBtn)
    await user.click(continueBtn)
    screen.getByText('Source well')
  })
})
