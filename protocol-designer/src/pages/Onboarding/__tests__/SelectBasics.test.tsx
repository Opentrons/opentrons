import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { IncompatibleTipsModal } from '../../../components/organisms'
import { getAllowAllTipracks } from '../../../feature-flags/selectors'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { SelectBasics } from '../SelectBasics'
import { getTiprackOptions } from '../utils'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { WizardFormState } from '../../../components/organisms'
import type { WizardTileProps } from '../types'

vi.mock('../../../labware-defs/selectors')
vi.mock('../../../feature-flags/selectors')
vi.mock('../../../components/organisms')
vi.mock('../../../labware-defs/actions')
vi.mock('../utils')
const mockLocation = vi.fn()
window.HTMLElement.prototype.scrollIntoView = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useLocation: () => mockLocation,
  }
})

const render = (props: ComponentProps<typeof SelectBasics>) => {
  return renderWithProviders(<SelectBasics {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  fixtures: {},
  hasGripper: false,
  fields: {
    name: '',
    description: '',
    organizationOrAuthor: '',
    robotType: FLEX_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: {
      pipetteName: 'p50_single_flex',
      tiprackDefURI: ['opentrons/opentrons_flex_96_tiprack_200ul/1'],
    },
    right: {},
  },
  modules: {},
  hasThermocycler: false,
  hasWasteChute: false,
} as WizardFormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  proceed: vi.fn(),
  setValue: vi.fn(),
  watch: vi.fn((name: keyof typeof values) => values[name]) as any,
}

describe('SelectBasics', () => {
  let props: ComponentProps<typeof SelectBasics>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
    vi.mocked(IncompatibleTipsModal).mockReturnValue(
      <div>mock incompatible tips modal</div>
    )
    vi.mocked(getLabwareDefsByURI).mockReturnValue({})
    vi.mocked(getAllowAllTipracks).mockReturnValue(false)
    vi.mocked(getTiprackOptions).mockReturnValue({
      'opentrons/opentrons_flex_96_tiprack_200ul/1': '200µL Flex tipracks',
      'opentrons/opentrons_flex_96_tiprack_1000ul/1': '1000µL Flex tipracks',
    })
  })

  it('renders all the text and buttons for selecting the basics', () => {
    render(props)
    screen.getByText('Step 1')
    screen.getByText('Let’s start with the basics')
    // add robot
    screen.getByText('What kind of robot do you have?')
    fireEvent.click(screen.getByRole('label', { name: 'Opentrons OT-2' }))
    expect(props.setValue).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('label', { name: 'Opentrons Flex' }))
    expect(props.setValue).toHaveBeenCalled()
    //  pipette
    fireEvent.click(screen.getByText('Add a pipette'))

    // gripper
    screen.getByText(
      'Do you want to move labware automatically with the gripper?'
    )
    screen.getByText('Some modules require a gripper to operate.')
    fireEvent.click(screen.getAllByRole('label', { name: 'Yes' })[0])
    expect(props.setValue).toHaveBeenCalled()
    fireEvent.click(screen.getAllByRole('label', { name: 'No' })[0])
    expect(props.setValue).toHaveBeenCalled()

    // thermocycler
    screen.getByText('Are you using a Thermocycler in your protocol?')
    fireEvent.click(screen.getAllByRole('label', { name: 'Yes' })[1])
    expect(props.setValue).toHaveBeenCalled()
    fireEvent.click(screen.getAllByRole('label', { name: 'No' })[1])
    expect(props.setValue).toHaveBeenCalled()

    // wasteChute
    screen.getByText('Are you using a waste chute in your protocol?')
    fireEvent.click(screen.getAllByRole('label', { name: 'Yes' })[2])
    expect(props.setValue).toHaveBeenCalled()
    fireEvent.click(screen.getAllByRole('label', { name: 'No' })[2])
    expect(props.setValue).toHaveBeenCalled()

    //  confirm
    screen.getByRole('button', { name: 'Confirm' })
  })
})
