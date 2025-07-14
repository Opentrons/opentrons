import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { Aspirate } from '../../Aspirate'
import { AspirateSettingDetail } from '../../Aspirate/AspirateSettingDetail'
import { AspirateSettingItem } from '../../Aspirate/AspirateSettingItem'
import { useAspirateSettingsConfig } from '../../Aspirate/hooks/useAspirateSettingsConfig'
import { ResetAdvancedSettingsModal } from '../../QuickTransferAdvancedSettings/ResetAdvancedSettingsModal'

import type { ComponentProps } from 'react'

vi.mock('../../Aspirate/AspirateSettingItem')
vi.mock('../../Aspirate/AspirateSettingDetail')
vi.mock('../../Aspirate/hooks/useAspirateSettingsConfig')
vi.mock('../../QuickTransferAdvancedSettings/ResetAdvancedSettingsModal')

const render = (props: ComponentProps<typeof Aspirate>) => {
  return renderWithProviders(<Aspirate {...props} />, {
    i18nInstance: i18n,
  })
}

const mockClick = vi.fn()

const mockAspirateSettingsItems = [
  {
    option: 'aspirate_flow_rate',
    copy: 'Aspirate flow rate',
    value: '35 µL/s',
    enabled: true,
    onClick: mockClick,
  },
  {
    option: 'aspirate_tip_position',
    copy: 'Tip position',
    value: '1 mm from bottom',
    enabled: true,
    onClick: mockClick,
  },
  {
    option: 'aspirate_submerge',
    copy: 'Submerge',
    value: '',
    enabled: false,
    onClick: mockClick,
  },
  {
    option: 'pre_wet_tip',
    copy: 'Pre-wet tip',
    value: 'Enabled',
    enabled: true,
    onClick: mockClick,
  },
  {
    option: 'aspirate_mix',
    copy: 'Mix',
    value: '50 µL, 3 reps',
    enabled: true,
    onClick: mockClick,
  },
  {
    option: 'aspirate_delay',
    copy: 'Delay',
    value: '1.0 s',
    enabled: true,
    onClick: mockClick,
  },
  {
    option: 'aspirate_retract',
    copy: 'Retract',
    value: '',
    enabled: false,
    onClick: mockClick,
  },
  {
    option: 'aspirate_touch_tip',
    copy: 'Touch tip',
    value: '2 mm from bottom',
    enabled: true,
    onClick: mockClick,
  },
  {
    option: 'aspirate_air_gap',
    copy: 'Air gap',
    value: '5 µL',
    enabled: true,
    onClick: mockClick,
  },
] as any

describe('Aspirate', () => {
  let props: ComponentProps<typeof Aspirate>

  beforeEach(() => {
    props = {
      state: {
        pipette: {
          channels: 1,
          liquids: [
            {
              maxVolume: 1000,
              minVolume: 5,
            },
          ] as any,
        } as any,
        mount: 'left',
        tipRack: {
          wells: {
            A1: {
              totalLiquidVolume: 200,
            },
          } as any,
        } as any,
        source: {
          metadata: {
            displayCategory: 'wellPlate',
          },
          wells: {
            A1: {
              totalLiquidVolume: 200,
              depth: 50,
            },
          } as any,
        } as any,
        sourceWells: ['A1'],
        destination: {
          metadata: {
            displayCategory: 'wellPlate',
          },
          wells: {
            A1: {
              totalLiquidVolume: 200,
              depth: 200,
            },
          } as any,
        } as any,
        destinationWells: ['A1'],
        transferType: 'consolidate',
        volume: 20,
        aspirateFlowRate: 570,
        dispenseFlowRate: 890,
        path: 'single',
        tipPositionAspirate: 10,
        preWetTip: false,
        tipPositionDispense: 2,
        changeTip: 'once',
        dropTipLocation: {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: 'trashBinAdapter',
        },
      } as any,
      dispatch: vi.fn(),
      isMultiTransfer: false,
    }
    vi.mocked(AspirateSettingItem).mockReturnValue(
      <div>mock AspirateSettingItem</div>
    )
    vi.mocked(AspirateSettingDetail).mockReturnValue(
      <div>mock AspirateSettingDetail</div>
    )
    vi.mocked(useAspirateSettingsConfig).mockReturnValue(
      mockAspirateSettingsItems
    )
    vi.mocked(ResetAdvancedSettingsModal).mockReturnValue(
      <div>mock ResetAdvancedSettingsModal</div>
    )
  })

  it('renders mock components and reset button', () => {
    render(props)
    expect(screen.getAllByText('mock AspirateSettingItem').length).toBe(9)
    screen.getByText('mock AspirateSettingDetail')
    screen.getByRole('button', { name: 'Reset aspirate settings' })
  })

  it('when clicking reset button, shows ResetAdvancedSettingsModal', () => {
    render(props)
    const resetButton = screen.getByRole('button', {
      name: 'Reset aspirate settings',
    })
    fireEvent.click(resetButton)
    screen.getByText('mock ResetAdvancedSettingsModal')
  })
})
