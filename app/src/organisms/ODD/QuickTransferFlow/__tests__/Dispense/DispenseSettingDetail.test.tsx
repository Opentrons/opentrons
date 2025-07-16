import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { DispenseSettingDetail } from '../../Dispense/DispenseSettingDetail'
import { AirGap } from '../../QuickTransferAdvancedSettings/AirGap'
import { BlowOut } from '../../QuickTransferAdvancedSettings/BlowOut'
import { Delay } from '../../QuickTransferAdvancedSettings/Delay'
import { DisposalVolume } from '../../QuickTransferAdvancedSettings/DisposalVolume'
import { FlowRateEntry } from '../../QuickTransferAdvancedSettings/FlowRate'
import { Mix } from '../../QuickTransferAdvancedSettings/Mix'
import { TipPositionEntry } from '../../QuickTransferAdvancedSettings/TipPosition'
import { TouchTip } from '../../QuickTransferAdvancedSettings/TouchTip'

import type { ComponentProps } from 'react'

vi.mock('../../QuickTransferAdvancedSettings/FlowRate')
vi.mock('../../QuickTransferAdvancedSettings/TipPosition')
vi.mock('../../QuickTransferAdvancedSettings/Mix')
vi.mock('../../QuickTransferAdvancedSettings/Delay')
vi.mock('../../QuickTransferAdvancedSettings/TouchTip')
vi.mock('../../QuickTransferAdvancedSettings/AirGap')
vi.mock('../../QuickTransferAdvancedSettings/BlowOut')
vi.mock('../../QuickTransferAdvancedSettings/DisposalVolume')

const render = (props: ComponentProps<typeof DispenseSettingDetail>) => {
  return renderWithProviders(<DispenseSettingDetail {...props} />)
}

describe('DispenseSettingDetail', () => {
  let props: ComponentProps<typeof DispenseSettingDetail>
  beforeEach(() => {
    props = {
      selectedSetting: 'dispense_flow_rate',
      state: {} as any,
      dispatch: vi.fn(),
      onBack: vi.fn(),
      isMultiTransfer: false,
    }
    vi.mocked(FlowRateEntry).mockReturnValue(<div>mock FlowRateEntry</div>)
    vi.mocked(TipPositionEntry).mockReturnValue(
      <div>mock TipPositionEntry</div>
    )
    vi.mocked(Mix).mockReturnValue(<div>mock Mix</div>)
    vi.mocked(Delay).mockReturnValue(<div>mock Delay</div>)
    vi.mocked(TouchTip).mockReturnValue(<div>mock TouchTip</div>)
    vi.mocked(AirGap).mockReturnValue(<div>mock AirGap</div>)
    vi.mocked(BlowOut).mockReturnValue(<div>mock BlowOut</div>)
    vi.mocked(DisposalVolume).mockReturnValue(<div>mock DisposalVolume</div>)
  })

  it('renders the correct setting option flow rate entry', () => {
    render(props)
    screen.getByText('mock FlowRateEntry')
  })

  it('renders the correct setting option tip position entry', () => {
    props.selectedSetting = 'dispense_tip_position'
    render(props)
    screen.getByText('mock TipPositionEntry')
  })

  it('renders the correct setting option mix entry', () => {
    props.selectedSetting = 'dispense_mix'
    render(props)
    screen.getByText('mock Mix')
  })

  it('renders the correct setting option delay entry', () => {
    props.selectedSetting = 'dispense_delay'
    render(props)
    screen.getByText('mock Delay')
  })

  it('renders the correct setting option touch tip entry', () => {
    props.selectedSetting = 'dispense_touch_tip'
    render(props)
    screen.getByText('mock TouchTip')
  })

  it('renders the correct setting option air gap entry', () => {
    props.selectedSetting = 'dispense_air_gap'
    render(props)
    screen.getByText('mock AirGap')
  })

  it('renders the correct setting option blow out entry', () => {
    props.selectedSetting = 'dispense_blow_out'
    render(props)
    screen.getByText('mock BlowOut')
  })

  it('renders the correct setting option blow out entry', () => {
    props.isMultiTransfer = true
    props.selectedSetting = 'dispense_disposal_volume'
    render(props)
    screen.getByText('mock DisposalVolume')
  })
})
