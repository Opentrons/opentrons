import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ETHANOL_LIQUID_CLASS_NAME,
  getAllLiquidClassDefs,
  GLYCEROL_LIQUID_CLASS_NAME,
  NONE_LIQUID_CLASS_NAME,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useToaster } from '/app/organisms/ToasterOven'

import { SelectLiquidClass } from '../SelectLiquidClass'
import { checkLiquidClassCompatibility } from '../utils'

import type { ComponentProps } from 'react'

vi.mock('../utils')
vi.mock('/app/organisms/ToasterOven')
vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getAllLiquidClassDefs>()
  return {
    ...actual,
    getAllLiquidClassDefs: vi.fn(() => mockLiquidClasses),
  }
})
const mockMakeSnackbar = vi.fn()

const mockByPipette = [
  {
    tiprack: 'opentrons/opentrons_flex_96_tiprack_50ul/1',
    aspirate: {},
    singleDispense: {
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
]

const mockLiquidClasses = {
  [ETHANOL_LIQUID_CLASS_NAME]: {
    liquidClassName: 'ethanol_80',
    displayName: 'Volatile',
    description: '80% ethanol',
    schemaVersion: 0,
    namespace: '',
    byPipette: mockByPipette,
  },
  [GLYCEROL_LIQUID_CLASS_NAME]: {
    liquidClassName: 'glycerol_50',
    displayName: 'Viscous',
    description: '50% glycerol',
    schemaVersion: 0,
    namespace: '',
    byPipette: mockByPipette,
  },
  [WATER_LIQUID_CLASS_NAME]: {
    displayName: 'Aqueous',
    liquidClassName: 'water',
    description: 'Deionized water',
    schemaVersion: 0,
    namespace: '',
    byPipette: mockByPipette,
  },
} as any

const mockState = {
  pipette: {
    displayName: 'Flex 1-Channel 50 µL',
    model: 'p50',
    displayCategory: 'FLEX',
    channels: 1,
    liquids: {
      default: {
        $otSharedSchema:
          '#/pipette/schemas/2/pipetteLiquidPropertiesSchema.json',
        supportedTips: {},
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
        supportedTips: {},
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
} as any

const render = (props: ComponentProps<typeof SelectLiquidClass>) => {
  return renderWithProviders(<SelectLiquidClass {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SelectLiquidClass', () => {
  let props: ComponentProps<typeof SelectLiquidClass>

  beforeEach(() => {
    props = {
      onNext: vi.fn(),
      onBack: vi.fn(),
      exitButtonProps: {
        buttonType: 'tertiaryLowLight',
        buttonText: 'Exit',
        onClick: vi.fn(),
      },
      state: mockState,
      dispatch: vi.fn(),
    }
    vi.mocked(checkLiquidClassCompatibility).mockReturnValue({
      incompatible: false,
      pipetteIncompatible: false,
      tipRackIncompatible: false,
      pipettePathIncompatible: false,
    })
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    })
  })

  it('renders text, exit button and continue button', () => {
    render(props)
    screen.getByText('Select liquid class')
    screen.getByText(
      'Apply predefined settings for the type of liquid used in your transfer'
    )
    screen.getByText('Exit')
    screen.getByText('Continue')
    screen.getByText("Don't use liquid class settings")
    screen.getByText('Default')
    screen.getByText('Aqueous')
    screen.getByText('Deionized water')
    screen.getByText('Viscous')
    screen.getByText('50% glycerol')
    screen.getByText('Volatile')
    screen.getByText('80% ethanol')
  })

  it('should call mock function when tappin exit button', () => {
    render(props)
    fireEvent.click(screen.getByText('Exit'))
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
  })

  it('should call mock function when tapping continue button - not using liquid class', () => {
    render(props)
    fireEvent.click(screen.getByText("Don't use liquid class settings"))
    fireEvent.click(screen.getByText('Continue'))
    expect(props.onNext).toHaveBeenCalled()
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_LIQUID_CLASS',
      liquidClassName: NONE_LIQUID_CLASS_NAME,
    })
  })

  it('should call mock function when tapping continue button - water', () => {
    vi.mocked(getAllLiquidClassDefs).mockReturnValue(mockLiquidClasses)
    render(props)
    fireEvent.click(screen.getByText('Aqueous'))
    fireEvent.click(screen.getByText('Continue'))
    expect(props.onNext).toHaveBeenCalled()
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_LIQUID_CLASS',
      liquidClassName: WATER_LIQUID_CLASS_NAME,
    })
  })

  it('should call mock snackbar function when tapping liquid class button - pipette incompatible', () => {
    props.state.pipette = {
      displayName: 'mock pipette',
    } as any
    vi.mocked(checkLiquidClassCompatibility).mockReturnValue({
      incompatible: true,
      pipetteIncompatible: true,
      tipRackIncompatible: true,
      pipettePathIncompatible: false,
    })
    render(props)
    fireEvent.click(screen.getByText('Aqueous'))
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'The mock pipette is incompatible with this liquid class'
    )
  })

  it('should call mock snackbar function when tapping liquid class button - pipette path incompatible', () => {
    vi.mocked(checkLiquidClassCompatibility).mockReturnValue({
      incompatible: true,
      pipetteIncompatible: false,
      tipRackIncompatible: false,
      pipettePathIncompatible: true,
    })
    render(props)
    fireEvent.click(screen.getByText('Aqueous'))
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'The selected pipette path is incompatible with this liquid class'
    )
  })

  it('should call mock function when tapping liquid class button - volume incompatible', () => {
    vi.mocked(checkLiquidClassCompatibility).mockReturnValue({
      incompatible: true,
      volumeIncompatible: true,
    })
    render(props)
    fireEvent.click(screen.getByText('Aqueous'))
    fireEvent.click(screen.getByText('Continue'))
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      'Transfer volumes of 10 µL or less are incompatible with liquid classes'
    )
  })
})
