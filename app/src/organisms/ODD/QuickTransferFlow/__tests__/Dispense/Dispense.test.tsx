import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { Dispense } from '../../Dispense'
import { DispenseSettingDetail } from '../../Dispense/DispenseSettingDetail'
import { DispenseSettingItem } from '../../Dispense/DispenseSettingItem'
import { ResetAdvancedSettingsModal } from '../../QuickTransferAdvancedSettings/ResetAdvancedSettingsModal'
import { getIsTouchTipEnabled } from '../../utils/getIsTouchTipEnabled'

import type { ComponentProps } from 'react'

vi.mock('../../Dispense/DispenseSettingItem')
vi.mock('../../Dispense/DispenseSettingDetail')
vi.mock('../../Dispense/hooks/useAspirateSettingsConfig')
vi.mock('../../QuickTransferAdvancedSettings/ResetAdvancedSettingsModal')
vi.mock('../../utils/getIsTouchTipEnabled')

const render = (props: ComponentProps<typeof Dispense>) => {
  return renderWithProviders(<Dispense {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Dispense', () => {
  let props: ComponentProps<typeof Dispense>

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
    vi.mocked(DispenseSettingItem).mockReturnValue(
      <div>mock DispenseSettingItem</div>
    )
    vi.mocked(DispenseSettingDetail).mockReturnValue(
      <div>mock DispenseSettingDetail</div>
    )
    vi.mocked(ResetAdvancedSettingsModal).mockReturnValue(
      <div>mock ResetAdvancedSettingsModal</div>
    )
    vi.mocked(getIsTouchTipEnabled).mockReturnValue(true)
  })

  it('renders mock components and reset button', () => {
    render(props)
    expect(screen.getAllByText('mock DispenseSettingItem').length).toBe(11)
    screen.getByText('mock DispenseSettingDetail')
    screen.getByRole('button', { name: 'Reset dispense settings' })
  })

  it('when clicking reset button, shows ResetAdvancedSettingsModal', () => {
    render(props)
    const resetButton = screen.getByRole('button', {
      name: 'Reset dispense settings',
    })
    fireEvent.click(resetButton)
    screen.getByText('mock ResetAdvancedSettingsModal')
  })
})
