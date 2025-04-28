import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { AspirateSettingDetail } from '../../Aspirate/AspirateSettingDetail'
import { AirGap } from '../../QuickTransferAdvancedSettings/AirGap'
import { Delay } from '../../QuickTransferAdvancedSettings/Delay'
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

const render = (props: ComponentProps<typeof AspirateSettingDetail>) => {
  return renderWithProviders(<AspirateSettingDetail {...props} />, {
    i18nInstance: i18n,
  })
}

describe('AspirateSettingDetail', () => {
  let props: ComponentProps<typeof AspirateSettingDetail>
  beforeEach(() => {
    props = {
      selectedSetting: 'aspirate_flow_rate',
      state: {} as any,
      dispatch: vi.fn(),
      onBack: vi.fn(),
    }
    vi.mocked(FlowRateEntry).mockReturnValue(<div>mock FlowRateEntry</div>)
    vi.mocked(TipPositionEntry).mockReturnValue(
      <div>mock TipPositionEntry</div>
    )
    vi.mocked(Mix).mockReturnValue(<div>mock Mix</div>)
    vi.mocked(Delay).mockReturnValue(<div>mock Delay</div>)
    vi.mocked(TouchTip).mockReturnValue(<div>mock TouchTip</div>)
    vi.mocked(AirGap).mockReturnValue(<div>mock AirGap</div>)
  })
  it('renders the correct setting option flow rate entry', () => {
    render(props)
    screen.getByText('mock FlowRateEntry')
  })
  it('renders the correct setting option tip position entry', () => {
    props.selectedSetting = 'aspirate_tip_position'
    render(props)
    screen.getByText('mock TipPositionEntry')
  })
  it('renders the correct setting option mix entry', () => {
    props.selectedSetting = 'aspirate_mix'
    render(props)
    screen.getByText('mock Mix')
  })
  it('renders the correct setting option delay entry', () => {
    props.selectedSetting = 'aspirate_delay'
    render(props)
    screen.getByText('mock Delay')
  })
  it('renders the correct setting option touch tip entry', () => {
    props.selectedSetting = 'aspirate_touch_tip'
    render(props)
    screen.getByText('mock TouchTip')
  })
  it('renders the correct setting option air gap entry', () => {
    props.selectedSetting = 'aspirate_air_gap'
    render(props)
    screen.getByText('mock AirGap')
  })
})
