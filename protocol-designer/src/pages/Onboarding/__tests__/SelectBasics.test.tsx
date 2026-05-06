import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

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
vi.mock('/protocol-designer/feature-flags/selectors', async importOriginal => {
  const actual = await importOriginal<
    typeof import('/protocol-designer/feature-flags/selectors')
  >()

  return {
    ...actual,
    getEnableFork: (state: BaseState) =>
      state.featureFlags.flags.OT_PD_ENABLE_FORK ?? false,
  }
})
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

interface RenderOptions {
  enableFork?: boolean
}

const render = (
  props: ComponentProps<typeof SelectBasics>,
  options: RenderOptions = {}
) => {
  const initialState = {
    featureFlags: {
      flags: {
        OT_PD_ENABLE_FORK: options.enableFork ?? false,
      },
    },
  } as Partial<BaseState> as BaseState

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

  it('hides the robot type question and keeps Flex options when fork is enabled', () => {
    const forkValues: WizardFormState = {
      ...values,
      fields: {
        ...values.fields,
        robotType: OT2_ROBOT_TYPE,
      },
    }
    props = {
      ...props,
      watch: makeWatchMock(forkValues),
    }

    render(props, { enableFork: true })

    expect(
      screen.queryByText('What kind of robot do you have?')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('label', { name: 'Opentrons OT-2' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('label', { name: 'Opentrons Flex' })
    ).not.toBeInTheDocument()
    screen.getByText('Your pipettes')
    screen.getByText(
      'Do you want to move labware automatically with the gripper?'
    )
    expect(props.setValue).toHaveBeenCalledWith(
      'fields.robotType',
      FLEX_ROBOT_TYPE
    )
  })
})
