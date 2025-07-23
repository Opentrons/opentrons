import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useModulesQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  FLEX_STACKER_V1_FIXTURE,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { useSendIdentifyStacker } from '../../ModuleWizardFlows/hooks'
import { AddFixtureModal } from '../AddFixtureModal'

import type { ComponentProps } from 'react'
import type { UseQueryResult } from 'react-query'
import type { AttachedModule, Modules } from '@opentrons/api-client'
import type { DeckConfiguration, IdentifyColor } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/deck_configuration')
vi.mock('/app/organisms/ModuleCard/utils')
vi.mock('/app/organisms/ModuleWizardFlows/hooks.tsx')

const mockCloseModal = vi.fn()
const mockUpdateDeckConfiguration = vi.fn()
const deckDef = getDeckDefFromRobotType('OT-3 Standard')
const mockFixture = {
  cutoutId: 'cutoutD3',
  cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
}

const render = (props: ComponentProps<typeof AddFixtureModal>) => {
  return renderWithProviders(<AddFixtureModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Touchscreen AddFixtureModal', () => {
  let props: ComponentProps<typeof AddFixtureModal>
  let sendIdentifyStacker: (
    module: AttachedModule,
    start: boolean,
    color?: IdentifyColor
  ) => void

  beforeEach(() => {
    sendIdentifyStacker = vi.fn()
    props = {
      cutoutId: 'cutoutD3',
      addressableAreaId: 'D3',
      closeModal: mockCloseModal,
      deckDef,
    }
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
      data: [mockFixture],
    } as unknown) as UseQueryResult<DeckConfiguration>)
    vi.mocked(useModulesQuery).mockReturnValue(({
      data: { data: [] },
    } as unknown) as UseQueryResult<Modules>)
    vi.mocked(useSendIdentifyStacker).mockReturnValue(sendIdentifyStacker)
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Add to Slot D3')
    screen.getByText(
      'Choose an item below to add to your deck configuration. It will be referenced during protocol analysis.'
    )
    screen.getByText('Fixtures')
    screen.getByText('Modules')
    expect(screen.getAllByText('Select options').length).toBe(2)
  })

  it('should set deck config when tapping add button', () => {
    render(props)
    fireEvent.click(screen.getAllByText('Select options')[1])
    fireEvent.click(screen.getAllByText('Add')[0])
  })
})

describe('Desktop AddFixtureModal', () => {
  let props: ComponentProps<typeof AddFixtureModal>

  beforeEach(() => {
    props = {
      cutoutId: 'cutoutD3',
      addressableAreaId: 'D3',
      closeModal: mockCloseModal,
      deckDef,
    }
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render text and buttons slot D3', () => {
    render(props)
    screen.getByText('Add to Slot D3')
    screen.getByText(
      'Choose an item below to add to your deck configuration. It will be referenced during protocol analysis.'
    )

    screen.getByText('Fixtures')
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('Select options')[0])
    screen.getByText('Trash bin')
    screen.getByText('Waste chute')
    expect(screen.getAllByRole('button', { name: 'Add' }).length).toBe(2)
  })

  it('should not render trash bin text and buttons slot D3 with a stacker in the slot', () => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
      data: [mockFixture],
    } as unknown) as UseQueryResult<DeckConfiguration>)
    render(props)
    screen.getByText('Add to Slot D3')
    screen.getByText(
      'Choose an item below to add to your deck configuration. It will be referenced during protocol analysis.'
    )

    screen.getByText('Fixtures')
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('Select options')[0])
    screen.getByText('Waste chute')
    // Verify trash bin is not rendered
    expect(screen.queryByText('Trash bin')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Add' }).length).toBe(1)
  })

  it('should render text and buttons slot A1', () => {
    props = { ...props, cutoutId: 'cutoutA1', addressableAreaId: 'A1' }
    render(props)
    screen.getByText('Add to Slot A1')
    screen.getByText(
      'Choose an item below to add to your deck configuration. It will be referenced during protocol analysis.'
    )
    screen.getByText('Fixtures')
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('Select options')[0])
    screen.getByText('Trash bin')
    screen.getByRole('button', { name: 'Add' })
  })

  it('should render text and buttons slot B3', () => {
    props = { ...props, cutoutId: 'cutoutB3', addressableAreaId: 'B3' }
    render(props)
    screen.getByText('Add to Slot B3')
    screen.getByText(
      'Choose an item below to add to your deck configuration. It will be referenced during protocol analysis.'
    )
    screen.getByText('Fixtures')
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('Select options')[0])
    screen.getByText('Trash bin')
    console.log('screen: ', screen)
    expect(screen.getAllByRole('button', { name: 'Add' }).length).toBe(1)
  })

  it('should only render module options in column 2', () => {
    props = { ...props, cutoutId: 'cutoutB2', addressableAreaId: 'B2' }
    render(props)
    screen.getByText('Add to Slot B2')
    screen.getByText(
      'Choose an item below to add to your deck configuration. It will be referenced during protocol analysis.'
    )
    screen.getByText('Magnetic Block GEN1')
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('should call update deck config when add button is clicked', () => {
    props = { ...props, cutoutId: 'cutoutA1' }
    render(props)
    fireEvent.click(screen.getAllByText('Select options')[0])
    fireEvent.click(screen.getByText('Add'))
    expect(mockUpdateDeckConfiguration).toHaveBeenCalled()
  })

  it('should display appropriate Waste Chute options when the generic Waste Chute button is clicked', () => {
    render(props)
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Select options' })[0]
    ) // click fixtures
    expect(screen.getAllByRole('button', { name: 'Add' }).length).toBe(2)

    const displayText = getFixtureDisplayName(
      WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
    )
    screen.getByText(displayText)
  })

  it('should allow a user to exit the Waste Chute submenu by clicking "go back"', () => {
    render(props)
    expect(
      screen.getAllByRole('button', { name: 'Select options' }).length
    ).toBe(2)
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Select options' })[0]
    ) // click fixtures
    screen.getByText('Waste chute')
  })
})
