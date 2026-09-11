import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import { BlowOut } from '../BlowOut'

import type { ComponentProps } from 'react'

const mockByPipette = [
  {
    pipetteModel: 'flex_1channel_50',
    byTipType: [
      {
        tiprack: 'opentrons/opentrons_flex_96_tiprack_50ul/1',
        aspirate: {
          correctionByVolume: [[0.0, 0.0]],
          flowRateByVolume: [
            [1.0, 35.0],
            [50.0, 35.0],
          ],
        },
        singleDispense: {
          correctionByVolume: [[0.0, 0.0]],
          flowRateByVolume: [[1.0, 50.0]],
          retract: {
            airGapByVolume: [
              [1.0, 0.1],
              [49.9, 0.1],
              [50.0, 0.0],
            ],
          },
          submerge: {
            positionReference: 'well-top',
            offset: {
              x: 0,
              y: 0,
              z: 2,
            },
            speed: 100,
            delay: {
              enable: false,
              params: {
                duration: 0,
              },
            },
          },
        },
        multiDispense: {},
      },
    ],
  },
]

const mockLiquidClasses = {
  ethanol: {
    liquidClassName: 'mock ethanol',
    displayName: 'Volatile',
    description: '80% ethanol',
    schemaVersion: 0,
    namespace: '',
    byPipette: mockByPipette,
  },
  glyeral: {
    liquidClassName: 'mock glyeral',
    displayName: 'Viscous',
    description: '50% glycerol',
    schemaVersion: 0,
    namespace: '',
    byPipette: mockByPipette,
  },
  water: {
    displayName: 'Aqueous',
    liquidClassName: 'mock water',
    description: 'Deionized water',
    schemaVersion: 0,
    namespace: '',
    byPipette: mockByPipette,
  },
} as any

vi.mock('/app/redux-resources/analytics')
vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    getAllLiquidClassDefs: () => ({
      waterV1: mockLiquidClasses.water,
      ethanol80V1: mockLiquidClasses.ethanol,
      glycerol50V1: mockLiquidClasses.glyeral,
      none: mockLiquidClasses.water,
    }),
  }
})

const mockState = {
  pipette: {
    displayName: 'Flex 1-Channel 50 µL',
    model: 'p50',
    displayCategory: 'FLEX',
    channels: 1,
    shaftULperMM: 716,
    liquids: {
      default: {
        $otSharedSchema:
          '#/pipette/schemas/2/pipetteLiquidPropertiesSchema.json',
        supportedTips: {
          t50: {
            defaultBlowOutFlowRate: {
              default: 1000,
            },
          },
        },
        maxVolume: 50,
        minVolume: 5,
        defaultTipracks: [
          'opentrons/opentrons_flex_96_tiprack_50ul/1',
          'opentrons/opentrons_flex_96_filtertiprack_50ul/1',
        ],
      },
      lowVolumeDefault: {
        $otSharedSchema:
          '#/pipette/schemas/2/pipetteLiquidPropertiesSchema.json',
        supportedTips: {
          t50: {
            defaultBlowOutFlowRate: {
              default: 1000,
            },
          },
        },
        maxVolume: 30,
        minVolume: 1,
        defaultTipracks: [
          'opentrons/opentrons_flex_96_tiprack_50ul/1',
          'opentrons/opentrons_flex_96_filtertiprack_50ul/1',
        ],
      },
    },
  } as any,
  mount: 'left',
  tipRack: {
    wells: {
      A1: {
        totalLiquidVolume: 200,
      },
    },
    parameters: {
      format: '96Standard',
      quirks: [],
      isTiprack: true,
      tipLength: 57.9,
      tipOverlap: 10.5,
      isMagneticModuleCompatible: false,
      loadName: 'opentrons_flex_96_tiprack_50ul',
    },
  } as any,
  source: {},
  sourceWells: ['A1'],
  destination: 'source',
  destinationWells: ['A1'],
  transferType: 'transfer',
  volume: 15,
  path: 'single',
  changeTip: 'once',
  dropTipLocation: {
    cutoutFixtureId: 'trashBinAdapter',
    cutoutId: 'cutoutA3',
  },
  liquidClass: {
    byPipette: mockByPipette,
    description: 'Deionized water',
    displayName: 'Aqueous',
    liquidClassName: 'water',
    namespace: 'opentrons',
    schemaVersion: 1,
  },
} as any

const render = (props: ComponentProps<typeof BlowOut>) => {
  return renderWithProviders(<BlowOut {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('BlowOut', () => {
  let props: ComponentProps<typeof BlowOut>

  beforeEach(() => {
    props = {
      onBack: vi.fn(),
      state: mockState,
      dispatch: vi.fn(),
      kind: 'dispense',
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

  it('renders text, buttons for blowout fist screen', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Blowout after dispensing')
    screen.getByText('Save')
    screen.getByText('Blow extra air through the tip')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    await user.click(screen.getByText('Enabled'))
    screen.getByText('Continue')
  })

  it('renders text, buttons for blowout second screen', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Select blowout location')
    screen.getByText('Destination well')
    screen.getByText('Source well')
    screen.getByText('Trash bin in A3')
  })

  it('renders text, buttons for blowout third screen', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Select blowout location')
    screen.getByText('Destination well')
    screen.getByText('Source well')
    screen.getByText('Trash bin in A3')
    await user.click(screen.getByText('Source well'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Blowout speed (µL/second)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
  })

  it('should call dispatch when clicking save button', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Select blowout location')
    screen.getByText('Destination well')
    screen.getByText('Source well')
    screen.getByText('Trash bin in A3')
    await user.click(screen.getByText('Source well'))
    await user.click(screen.getByText('Continue'))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_BLOW_OUT',
      blowOutSettings: {
        location: 'source_well',
        flowRate: 2,
      },
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'BlowOut',
      },
    })
  })

  it('should call mock function when clicking back button', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onBack).toHaveBeenCalled()
  })
})
