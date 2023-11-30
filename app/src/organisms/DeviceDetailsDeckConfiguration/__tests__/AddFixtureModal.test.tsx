import * as React from 'react'

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
    const [{ getByText, getAllByText }] = render(props)
    getByText('Add to slot D3')
    getByText(
      'Choose a fixture below to add to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Staging area slot')
    getByText('Trash bin')
    getByText('Waste chute')
    expect(getAllByText('Add').length).toBe(2)
    expect(getAllByText('Select options').length).toBe(1)
  })

  it('should a mock function when tapping app button', () => {
    const [{ getAllByText }] = render(props)
    getAllByText('Add')[0].click()
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
    const [{ getByText, getAllByRole }] = render(props)
    getByText('Add to slot D3')
    getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Staging area slot')
    getByText('Trash bin')
    getByText('Waste chute')
    expect(getAllByRole('button', { name: 'Add' }).length).toBe(2)
    expect(getAllByRole('button', { name: 'Select options' }).length).toBe(1)
  })

  it('should render text and buttons slot A1', () => {
    props = { ...props, cutoutId: 'cutoutA1' }
    const [{ getByText, getByRole }] = render(props)
    getByText('Add to slot A1')
    getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Trash bin')
    getByRole('button', { name: 'Add' })
  })

  it('should render text and buttons slot B3', () => {
    props = { ...props, cutoutId: 'cutoutB3' }
    const [{ getByText, getAllByRole }] = render(props)
    getByText('Add to slot B3')
    getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Staging area slot')
    getByText('Trash bin')
    expect(getAllByRole('button', { name: 'Add' }).length).toBe(2)
  })

  it('should call a mock function when clicking add button', () => {
    props = { ...props, cutoutId: 'cutoutA1' }
    const [{ getByRole }] = render(props)
    getByRole('button', { name: 'Add' }).click()
    expect(mockUpdateDeckConfiguration).toHaveBeenCalled()
  })

  it('should display appropriate Waste Chute options when the generic Waste Chute button is clicked', () => {
    const [{ getByText, getByRole, getAllByRole }] = render(props)
    getByRole('button', { name: 'Select options' }).click()
    expect(getAllByRole('button', { name: 'Add' }).length).toBe(
      WASTE_CHUTE_FIXTURES.length
    )

    WASTE_CHUTE_FIXTURES.forEach(cutoutId => {
      const displayText = getFixtureDisplayName(cutoutId)
      getByText(displayText)
    })
  })

  it('should allow a user to exit the Waste Chute submenu by clicking "go back"', () => {
    const [{ getByText, getByRole, getAllByRole }] = render(props)
    getByRole('button', { name: 'Select options' }).click()

    getByText('Go back').click()
    getByText('Staging area slot')
    getByText('Trash bin')
    getByText('Waste chute')
    expect(getAllByRole('button', { name: 'Add' }).length).toBe(2)
    expect(getAllByRole('button', { name: 'Select options' }).length).toBe(1)
  })
})
