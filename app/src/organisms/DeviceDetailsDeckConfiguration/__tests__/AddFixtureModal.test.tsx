import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  getFixtureDisplayName,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { AddFixtureModal } from '../AddFixtureModal'

import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')
const mockSetShowAddFixtureModal = jest.fn()
const mockUpdateDeckConfiguration = jest.fn()
const mockSetCurrentDeckConfig = jest.fn()

const mockUseUpdateDeckConfigurationMutation = useUpdateDeckConfigurationMutation as jest.MockedFunction<
  typeof useUpdateDeckConfigurationMutation
>
const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>

const render = (props: React.ComponentProps<typeof AddFixtureModal>) => {
  return renderWithProviders(<AddFixtureModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Touchscreen AddFixtureModal', () => {
  let props: React.ComponentProps<typeof AddFixtureModal>

  beforeEach(() => {
    props = {
      cutoutId: 'cutoutD3',
      setShowAddFixtureModal: mockSetShowAddFixtureModal,
      setCurrentDeckConfig: mockSetCurrentDeckConfig,
      isOnDevice: true,
    }
    mockUseUpdateDeckConfigurationMutation.mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    mockUseDeckConfigurationQuery.mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Add to slot D3')
    screen.getByText(
      'Choose a fixture below to add to your deck configuration. It will be referenced during protocol analysis.'
    )
    screen.getByText('Staging area slot')
    screen.getByText('Trash bin')
    screen.getByText('Waste chute')
    expect(screen.getAllByText('Add').length).toBe(2)
    expect(screen.getAllByText('Select options').length).toBe(1)
  })

  it('should a mock function when tapping app button', () => {
    render(props)
    fireEvent.click(screen.getAllByText('Add')[0])
    expect(mockSetCurrentDeckConfig).toHaveBeenCalled()
  })
})

describe('Desktop AddFixtureModal', () => {
  let props: React.ComponentProps<typeof AddFixtureModal>

  beforeEach(() => {
    props = {
      cutoutId: 'cutoutD3',
      setShowAddFixtureModal: mockSetShowAddFixtureModal,
    }
    mockUseUpdateDeckConfigurationMutation.mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text and buttons slot D3', () => {
    render(props)
    screen.getByText('Add to slot D3')
    screen.getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    screen.getByText('Staging area slot')
    screen.getByText('Trash bin')
    screen.getByText('Waste chute')
    expect(screen.getAllByRole('button', { name: 'Add' }).length).toBe(2)
    expect(
      screen.getAllByRole('button', { name: 'Select options' }).length
    ).toBe(1)
  })

  it('should render text and buttons slot A1', () => {
    props = { ...props, cutoutId: 'cutoutA1' }
    render(props)
    screen.getByText('Add to slot A1')
    screen.getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    screen.getByText('Trash bin')
    screen.getByRole('button', { name: 'Add' })
  })

  it('should render text and buttons slot B3', () => {
    props = { ...props, cutoutId: 'cutoutB3' }
    render(props)
    screen.getByText('Add to slot B3')
    screen.getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    screen.getByText('Staging area slot')
    screen.getByText('Trash bin')
    expect(screen.getAllByRole('button', { name: 'Add' }).length).toBe(2)
  })

  it('should call a mock function when clicking add button', () => {
    props = { ...props, cutoutId: 'cutoutA1' }
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(mockUpdateDeckConfiguration).toHaveBeenCalled()
  })

  it('should display appropriate Waste Chute options when the generic Waste Chute button is clicked', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Select options' }))
    expect(screen.getAllByRole('button', { name: 'Add' }).length).toBe(
      WASTE_CHUTE_FIXTURES.length
    )

    WASTE_CHUTE_FIXTURES.forEach(cutoutId => {
      const displayText = getFixtureDisplayName(cutoutId)
      screen.getByText(displayText)
    })
  })

  it('should allow a user to exit the Waste Chute submenu by clicking "go back"', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Select options' }))

    fireEvent.click(screen.getByText('Go back'))
    screen.getByText('Staging area slot')
    screen.getByText('Trash bin')
    screen.getByText('Waste chute')
    expect(screen.getAllByRole('button', { name: 'Add' }).length).toBe(2)
    expect(
      screen.getAllByRole('button', { name: 'Select options' }).length
    ).toBe(1)
  })
})
