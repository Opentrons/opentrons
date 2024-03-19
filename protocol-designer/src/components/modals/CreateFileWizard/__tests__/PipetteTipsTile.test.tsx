import * as React from 'react'
import { fireEvent, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  fixture_tiprack_10_ul,
  fixture_tiprack_300_ul,
} from '@opentrons/shared-data/labware/fixtures/2'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../localization'
import { getLabwareDefsByURI } from '../../../../labware-defs/selectors'
import { getAllowAllTipracks } from '../../../../feature-flags/selectors'
import { getTiprackOptions } from '../../utils'
import { PipetteTipsTile } from '../PipetteTipsTile'
import { EquipmentOption } from '../EquipmentOption'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { FormPipettesByMount } from '../../../../step-forms'
import type { FormState, WizardTileProps } from '../types'

vi.mock('../../../../labware-defs/selectors')
vi.mock('../../../../feature-flags/selectors')
vi.mock('../../utils')
vi.mock('../EquipmentOption')

const render = (props: React.ComponentProps<typeof PipetteTipsTile>) => {
  return renderWithProviders(<PipetteTipsTile {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  fields: {
    name: 'mockName',
    description: 'mockDescription',
    organizationOrAuthor: 'mockOrganizationOrAuthor',
    robotType: FLEX_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: {
      pipetteName: 'p50_single_flex',
      tiprackDefURI: 'opentrons/opentrons_flex_96_tiprack_200ul/1',
    },
    right: { pipetteName: null, tiprackDefURI: null },
  } as FormPipettesByMount,
  modulesByType: {
    heaterShakerModuleType: { onDeck: false, model: null, slot: '1' },
    magneticBlockType: { onDeck: false, model: null, slot: '2' },
    temperatureModuleType: { onDeck: false, model: null, slot: '3' },
    thermocyclerModuleType: { onDeck: false, model: null, slot: '4' },
  },
  additionalEquipment: ['gripper'],
} as FormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  goBack: vi.fn(),
  proceed: vi.fn(),
  watch: vi.fn((name: keyof typeof values) => values[name]) as any,
}

const fixtureTipRack10ul = {
  ...fixture_tiprack_10_ul,
  version: 2,
} as LabwareDefinition2

const fixtureTipRack300uL = {
  ...fixture_tiprack_300_ul,
  version: 2,
} as LabwareDefinition2
const ten = '10uL'
const threeHundred = '300uL'

describe('PipetteTipsTile', () => {
  let props: React.ComponentProps<typeof PipetteTipsTile>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
      mount: 'left',
    }
    vi.mocked(getAllowAllTipracks).mockReturnValue(false)
    vi.mocked(getLabwareDefsByURI).mockReturnValue({
      [ten]: fixtureTipRack10ul,
      [threeHundred]: fixtureTipRack300uL,
    })
    vi.mocked(EquipmentOption).mockReturnValue(<div>mock EquipmentOption</div>)
    vi.mocked(getTiprackOptions).mockReturnValue([
      {
        name: '200uL Flex tipracks',
        value: 'opentrons/opentrons_flex_96_tiprack_200ul/1',
      },
      {
        name: '1000uL Flex tipracks',
        value: 'opentrons/opentrons_flex_96_tiprack_1000ul/1',
      },
    ])
  })
  afterEach(() => {
    cleanup()
  })
  it('renders default tiprack options for 50uL flex pipette and btn ctas work', () => {
    render(props)
    screen.getByText('Choose tips for Flex 1-Channel 50 μL')
    screen.getByText('mock EquipmentOption')
    screen.getByText('Go back')
    fireEvent.click(screen.getByRole('button', { name: 'GoBack_button' }))
    expect(props.goBack).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders the custom tip btn and section with no custom tips', () => {
    render(props)
    fireEvent.click(screen.getByLabelText('PipetteTipsTile_customTipButton'))
    screen.getByText('Custom tips')
    screen.getByText('Upload')
    screen.getByText('Upload a custom tiprack to select its definition')
  })
  it('renders the custom tip btn and section with a custom tip', () => {
    vi.mocked(getTiprackOptions).mockReturnValue([
      {
        name: '200uL Flex tipracks',
        value: 'opentrons/opentrons_flex_96_tiprack_200ul/1',
      },
      {
        name: '1000uL Flex tipracks',
        value: 'opentrons/opentrons_flex_96_tiprack_1000ul/1',
      },
      {
        name: 'Custom',
        value: 'custom_beta_blah_blah_blah',
      },
    ])
    render(props)
    screen.getByText('Choose tips for Flex 1-Channel 50 μL')
    fireEvent.click(screen.getByLabelText('PipetteTipsTile_customTipButton'))
    screen.getByText('Custom tips')
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(2)
  })
  it('renders all tiprack options for 50uL flex pipette when all tipracks are true', () => {
    vi.mocked(getAllowAllTipracks).mockReturnValue(true)
    render(props)
    screen.getByText('Choose tips for Flex 1-Channel 50 μL')
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(2)
  })
  it('renders default options for 10uL ot-2 pipette', () => {
    const values = {
      fields: {
        robotType: OT2_ROBOT_TYPE,
      },
      pipettesByMount: {
        left: {
          pipetteName: 'p10_single',
          tiprackDefURI: 'opentrons/opentrons_96_tiprack_10ul/1',
        },
        right: { pipetteName: null, tiprackDefURI: null },
      } as FormPipettesByMount,
      modulesByType: {
        heaterShakerModuleType: { onDeck: false, model: null, slot: '1' },
        magneticBlockType: { onDeck: false, model: null, slot: '2' },
        temperatureModuleType: { onDeck: false, model: null, slot: '3' },
        thermocyclerModuleType: { onDeck: false, model: null, slot: '4' },
      },
      additionalEquipment: ['gripper'],
    } as FormState

    const mockWizardTileProps: Partial<WizardTileProps> = {
      goBack: vi.fn(),
      proceed: vi.fn(),
      watch: vi.fn((name: keyof typeof values) => values[name]) as any,
    }

    props = {
      ...props,
      ...mockWizardTileProps,
      mount: 'left',
    }
    vi.mocked(getTiprackOptions).mockReturnValue([
      {
        name: '10uL tipracks',
        value: 'opentrons/opentrons_96_tiprack_10ul/1',
      },
      {
        name: '300uL tipracks',
        value: 'opentrons/opentrons_96_tiprack_300ul/1',
      },
    ])
    render(props)
    screen.getByText('Choose tips for P10 Single-Channel GEN1')
    screen.getByText('mock EquipmentOption')
  })
})
