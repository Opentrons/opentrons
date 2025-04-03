import { describe, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { when } from 'vitest-when'

import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { AspirateSettingsList } from '../../Aspirate/AspirateSettingsList'
import { AspirateSettingDetail } from '../../Aspirate/AspirateSettingDetail'
import { useAspirateSettingsConfig } from '../../Aspirate/hooks/useAspirateSettingsConfig'

import { Aspirate } from '../../Aspirate'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')
vi.mock('../../Aspirate/AspirateSettingsList')
vi.mock('../../Aspirate/AspirateSettingDetail')
vi.mock('../../Aspirate/hooks/useAspirateSettingsConfig')

const render = (props: ComponentProps<typeof Aspirate>) => {
  return renderWithProviders(<Aspirate {...props} />, {
    i18nInstance: i18n,
  })
}

let mockTrackEventWithRobotSerial: any

describe('Aspirate', () => {
  let props: ComponentProps<typeof Aspirate>

  beforeEach(() => {
    props = props = {
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
    }
    vi.mocked(AspirateSettingsList).mockReturnValue(
      <div>mock AspirateSettingsList</div>
    )
    vi.mocked(AspirateSettingDetail).mockReturnValue(
      <div>mock AspirateSettingDetail</div>
    )
    when(vi.mocked(useAspirateSettingsConfig))
      .calledWith({
        state: props.state,
        dispatch: props.dispatch,
        setSelectedSetting: vi.fn(),
      })
      .thenReturn({} as any)
    mockTrackEventWithRobotSerial = vi.fn(
      () => new Promise(resolve => resolve({}))
    )
    vi.mocked(useTrackEventWithRobotSerial).mockReturnValue({
      trackEventWithRobotSerial: mockTrackEventWithRobotSerial,
    })
  })

  it('renders mock components and reset button', () => {
    render(props)
    screen.getByText('mock AspirateSettingsList')
    screen.getByText('mock AspirateSettingDetail')
    screen.getByRole('button', { name: 'Reset aspirate settings' })
  })

  // ToDo(kk:04/03) add test for reset button
})
