import { useTranslation } from 'react-i18next'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useModulesQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  FLEX_STACKER_V1_FIXTURE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { useSendIdentifyModule } from '../../ModuleWizardFlows/hooks'
import { AddFixtureModal } from '../AddFixtureModal'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'
import type { UseQueryResult } from 'react-query'
import type { AttachedModule, Modules } from '@opentrons/api-client'
import type { DeckConfiguration, IdentifyColor } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/deck_configuration')
vi.mock('/app/organisms/ModuleCard/utils')
vi.mock('/app/organisms/ModuleWizardFlows/hooks.tsx')
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
  initReactI18next: vi.fn(),
}))
vi.mock('i18next', () => {
  return {
    default: {
      use: () => ({ init: vi.fn() }),
      createInstance: () => ({
        use: () => ({ init: vi.fn() }),
        init: vi.fn(),
        t: (k: string) => k,
      }),
      init: vi.fn(),
      t: (k: string) => k,
    },
  }
})

const mockCloseModal = vi.fn()
const mockUpdateDeckConfiguration = vi.fn()
const deckDef = getDeckDefFromRobotType('OT-3 Standard')
const mockFixture = {
  cutoutId: 'cutoutD3',
  cutoutFixtureId: FLEX_STACKER_V1_FIXTURE,
}

const render = (props: ComponentProps<typeof AddFixtureModal>) => {
  return renderWithProviders(<AddFixtureModal {...props} />)
}

describe('Touchscreen AddFixtureModal', () => {
  let props: ComponentProps<typeof AddFixtureModal>
  let sendIdentifyModule: (
    module: AttachedModule,
    start: boolean,
    color?: IdentifyColor
  ) => void
  let t: Mock

  beforeEach(() => {
    t = vi.fn(key => key)
    vi.mocked(useTranslation).mockReturnValue({ t } as any)

    sendIdentifyModule = vi.fn()
    props = {
      cutoutId: 'cutoutD3',
      addressableAreaId: 'D3',
      closeModal: mockCloseModal,
      deckDef,
    }
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [mockFixture],
    } as unknown as UseQueryResult<DeckConfiguration>)
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [] },
    } as unknown as UseQueryResult<Modules>)
    vi.mocked(useSendIdentifyModule).mockReturnValue(sendIdentifyModule)
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('add_to')
    screen.getByText('add_fixture_description')
    screen.getByText('Fixtures')
    screen.getByText('Modules')
    expect(screen.getAllByText('select_options').length).toBe(2)
  })

  it('should set deck config when tapping add button', () => {
    render(props)
    fireEvent.click(screen.getAllByText('select_options')[1])
    fireEvent.click(screen.getAllByText('add')[0])
  })

  it('should render text and buttons without modules', () => {
    props = { ...props, addressableAreaId: 'D4' }
    render(props)

    screen.getByText('add_to')
    screen.getByText('add_fixture_description')
    screen.getByText('Fixtures')
    expect(screen.queryByText('Modules')).not.toBeInTheDocument()
    expect(screen.getAllByText('select_options').length).toBe(1)
  })
})

describe('Desktop AddFixtureModal', () => {
  let props: ComponentProps<typeof AddFixtureModal>
  let t: Mock

  beforeEach(() => {
    t = vi.fn(key => key)
    vi.mocked(useTranslation).mockReturnValue({ t } as any)

    props = {
      cutoutId: 'cutoutD3',
      addressableAreaId: 'D3',
      closeModal: mockCloseModal,
      deckDef,
    }
    vi.mocked(useUpdateDeckConfigurationMutation).mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [],
    } as unknown as UseQueryResult<DeckConfiguration>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render text and buttons slot D3', () => {
    render(props)
    screen.getByText('add_to')
    screen.getByText('add_fixture_description')

    screen.getByText('Fixtures')
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('select_options')[0])
    screen.getByText('deck_configuration:trash_bin')
    expect(screen.getAllByRole('button', { name: 'add' }).length).toBe(1)
    expect(
      screen.getAllByRole('button', { name: 'select_options' }).length
    ).toBe(1)
  })

  it('should not render trash bin text and buttons slot D3 with a stacker in the slot', () => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [mockFixture],
    } as unknown as UseQueryResult<DeckConfiguration>)
    props = { ...props, existingCutoutFixtureId: FLEX_STACKER_V1_FIXTURE }
    render(props)
    screen.getByText('add_to')
    screen.getByText('add_fixture_description')

    screen.getByText('Fixtures')
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('select_options')[0])
    screen.getByText('Waste chute')
    // Verify trash bin is not rendered
    expect(
      screen.queryByText('deck_configuration:trash_bin')
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'select_options' }).length
    ).toBe(1)
  })

  it('should render text and buttons slot A1', () => {
    props = { ...props, cutoutId: 'cutoutA1', addressableAreaId: 'A1' }
    render(props)
    screen.getByText('add_to')
    screen.getByText('add_fixture_description')
    screen.getByText('Fixtures')
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('select_options')[0])
    screen.getByText('deck_configuration:trash_bin')
    screen.getByRole('button', { name: 'add' })
  })

  it('should render text and buttons slot B3', () => {
    props = { ...props, cutoutId: 'cutoutB3', addressableAreaId: 'B3' }
    render(props)
    screen.getByText('add_to')
    screen.getByText('add_fixture_description')
    screen.getByText('Fixtures')
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('select_options')[0])
    screen.getByText('deck_configuration:trash_bin')
    expect(screen.getAllByRole('button', { name: 'add' }).length).toBe(1)
  })

  it('should only render module options in column 2', () => {
    props = { ...props, cutoutId: 'cutoutB2', addressableAreaId: 'B2' }
    render(props)
    screen.getByText('add_to')
    screen.getByText('add_fixture_description')
    screen.getByText('Magnetic Block GEN1')
    expect(screen.getByRole('button', { name: 'add' })).toBeInTheDocument()
  })

  it('should call update deck config when add button is clicked', () => {
    props = { ...props, cutoutId: 'cutoutA1' }
    render(props)
    fireEvent.click(screen.getAllByText('select_options')[0])
    fireEvent.click(screen.getByText('add'))
    expect(mockUpdateDeckConfiguration).toHaveBeenCalled()
  })

  it('should display appropriate Waste Chute options when the generic Waste Chute button is clicked', () => {
    render(props)
    fireEvent.click(
      screen.getAllByRole('button', { name: 'select_options' })[0]
    ) // click fixtures
    expect(screen.getAllByRole('button', { name: 'add' }).length).toBe(1)
    expect(
      screen.getAllByRole('button', { name: 'select_options' }).length
    ).toBe(1)

    screen.getByText('Waste chute')
  })

  it('should allow a user to exit the Waste Chute submenu by clicking "go back"', () => {
    render(props)
    expect(
      screen.getAllByRole('button', { name: 'select_options' }).length
    ).toBe(2)
    fireEvent.click(
      screen.getAllByRole('button', { name: 'select_options' })[0]
    ) // click fixtures
    screen.getByText('Waste chute')
  })
})
