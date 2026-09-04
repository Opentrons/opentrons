import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { IncompatibleTipsModal } from '/protocol-designer/components/organisms'
import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'

import { SelectBasics } from '../SelectBasics'
import { getTiprackOptions } from '../utils'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { WizardFormState } from '/protocol-designer/components/organisms'
import type { BaseState } from '/protocol-designer/types'
import type { WizardTileProps } from '../types'

vi.mock('/protocol-designer/labware-defs/selectors')
vi.mock('/protocol-designer/components/organisms')
vi.mock('/protocol-designer/labware-defs/actions')
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
  const initialState = {} as Partial<BaseState> as BaseState

  return renderWithProviders(<SelectBasics {...props} />, {
    i18nInstance: i18n,
    initialState,
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

const makeWatchMock = (
  formValues: WizardFormState
): WizardTileProps['watch'] => {
  return vi.fn((name?: keyof WizardFormState) => {
    if (name == null) {
      return formValues
    }
    return formValues[name]
  }) as unknown as WizardTileProps['watch']
}

const mockWizardTileProps: Partial<WizardTileProps> = {
  proceed: vi.fn(),
  setValue: vi.fn(),
  watch: makeWatchMock(values),
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
    vi.mocked(getTiprackOptions).mockReturnValue({
      'opentrons/opentrons_flex_96_tiprack_200ul/1': '200µL Flex tipracks',
      'opentrons/opentrons_flex_96_tiprack_1000ul/1': '1000µL Flex tipracks',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders all the text and buttons for selecting the basics', () => {
    render(props)
    screen.getByText('Step 1')
    screen.getByText('Let’s start with the basics')
    expect(
      screen.queryByText('What kind of robot do you have?')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('label', { name: 'Opentrons OT-2' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('label', { name: 'Opentrons Flex' })
    ).not.toBeInTheDocument()
    //  pipette
    screen.getByText('Your pipettes')
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

    //  confirm
    screen.getByRole('button', { name: 'Confirm' })
  })
})
