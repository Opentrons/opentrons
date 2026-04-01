import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { createCustomTiprackDef } from '/protocol-designer/labware-defs/actions'
import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import { getTiprackOptions } from '/protocol-designer/pages/Onboarding/utils'

import { SelectPipetteModal } from '..'
import { IncompatibleTipsModal } from '../../IncompatibleTipsModal'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { WizardFormState } from '/protocol-designer/components/organisms/types'
import type { WizardTileProps } from '/protocol-designer/pages/Onboarding/types'

vi.mock('/protocol-designer/labware-defs/actions')
vi.mock('/protocol-designer/pages/Onboarding/utils')
vi.mock('../../IncompatibleTipsModal')
vi.mock('/protocol-designer/labware-defs/selectors')
const mockLocation = vi.fn()
window.HTMLElement.prototype.scrollIntoView = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useLocation: () => mockLocation,
  }
})

const render = (props: ComponentProps<typeof SelectPipetteModal>) => {
  return renderWithProviders(<SelectPipetteModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  fixtures: {},
  hasGripper: false,
  hasThermocycler: false,
  hasWasteChute: false,
  fields: {
    name: '',
    description: '',
    organizationOrAuthor: '',
    robotType: FLEX_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: { pipetteName: 'p1000_single_flex', tiprackDefURI: ['mockDefUri'] },
    right: {},
  },
  modules: {},
} as WizardFormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  proceed: vi.fn(),
  setValue: vi.fn(),
  watch: vi.fn((name: keyof typeof values) => values[name]) as any,
}

describe('SelectPipetteModal', () => {
  let props: ComponentProps<typeof SelectPipetteModal>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
      handleBack: vi.fn(),
      pipetteGen: 'flex',
      pipetteVolume: 'p1000',
      pipetteType: 'single',
      setPipetteGen: vi.fn(),
      setPipetteVolume: vi.fn(),
      setPipetteType: vi.fn(),
      mount: 'right',
      setSelectedPipetteName: vi.fn(),
    }

    vi.mocked(IncompatibleTipsModal).mockReturnValue(
      <div>mock incompatible tips modal</div>
    )
    vi.mocked(getLabwareDefsByURI).mockReturnValue({})
    vi.mocked(getTiprackOptions).mockReturnValue({
      'opentrons/opentrons_flex_96_tiprack_200ul/1': '200µL Flex tipracks',
      'opentrons/opentrons_flex_96_tiprack_1000ul/1': '1000µL Flex tipracks',
    })
  })

  it('renders the first page of select pipettes for a Flex', () => {
    render(props)
    screen.getByText('Add a pipette')
    screen.getByText('Pipette type')
    // select pip type
    fireEvent.click(screen.getByRole('label', { name: '1-Channel' }))
    screen.getByText('Pipette volume')
    // select pip volume
    fireEvent.click(screen.getByRole('label', { name: '1000 µL' }))
    // select tip
    screen.getByText('200µL Flex tipracks')
    fireEvent.click(screen.getByText('1000µL Flex tipracks'))

    screen.getByRole('button', { name: 'Save' })

    // go back
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.handleBack).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  })

  it('renders the first page of select pipettes for an ot-2', () => {
    vi.mocked(getTiprackOptions).mockReturnValue({
      'opentrons/opentrons_96_tiprack_10ul/1': '10µL tipracks',
      'opentrons/opentrons_96_tiprack_300ul/1': '300µL tipracks',
    })

    const values = {
      fixtures: {},
      hasGripper: false,
      fields: {
        name: '',
        description: '',
        organizationOrAuthor: '',
        robotType: OT2_ROBOT_TYPE,
      },
      pipettesByMount: {
        left: {},
        right: {
          pipetteName: 'p20_single_gen2',
          tiprackDefURI: ['mockDefUri'],
        },
      },
      modules: {},
    } as WizardFormState

    props = {
      ...props,
      watch: vi.fn((name: keyof typeof values) => values[name]) as any,
      handleBack: vi.fn(),
      pipetteGen: 'GEN2',
      pipetteVolume: 'p20',
      pipetteType: 'single',
      setPipetteGen: vi.fn(),
      setPipetteVolume: vi.fn(),
      setPipetteType: vi.fn(),
      mount: 'right',
      setSelectedPipetteName: vi.fn(),
    }
    render(props)
    screen.getByText('Pipette type')
    // select pip type
    fireEvent.click(screen.getByRole('label', { name: '1-Channel' }))

    screen.getByText('Pipette generation')
    // select gen
    fireEvent.click(screen.getByRole('label', { name: 'GEN2' }))

    screen.getByText('Pipette volume')
    // select pip volume
    fireEvent.click(screen.getByRole('label', { name: '20 µL' }))
    // select tip
    screen.getByText('Add custom pipette tips')
    screen.getByText('10µL tipracks')
    fireEvent.click(screen.getByText('300µL tipracks'))
    screen.getByText('Add custom pipette tips')

    //  add custom pipette tips
    fireEvent.change(screen.getByLabelText('Add custom pipette tips'), {
      target: {
        files: [
          new File(['{}'], 'custom-tips.json', {
            type: 'application/json',
          }),
        ],
      },
    })
    expect(vi.mocked(createCustomTiprackDef)).toHaveBeenCalled()

    //  change all tip setting
    fireEvent.click(screen.getByText('Show more tip types'))
    screen.getByText('mock incompatible tips modal')
  })
})
