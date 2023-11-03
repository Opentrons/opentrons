import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import { TRASH_BIN_LOAD_NAME } from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { AddFixtureModal } from '../AddFixtureModal'

jest.mock('@opentrons/react-api-client')
const mockSetShowAddFixtureModal = jest.fn()
const mockUpdateDeckConfiguration = jest.fn()
const mockSetCurrentDeckConfig = jest.fn()

const mockUseUpdateDeckConfigurationMutation = useUpdateDeckConfigurationMutation as jest.MockedFunction<
  typeof useUpdateDeckConfigurationMutation
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
      fixtureLocation: 'cutoutD3',
      setShowAddFixtureModal: mockSetShowAddFixtureModal,
      setCurrentDeckConfig: mockSetCurrentDeckConfig,
      isOnDevice: true,
    }
    mockUseUpdateDeckConfigurationMutation.mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
  })

  it('should render text and buttons', () => {
    const [{ getByText, getAllByText }] = render(props)
    getByText('Add to slot D3')
    getByText(
      'Choose a fixture below to add to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Staging Area Slot')
    getByText('Trash Bin')
    getByText('Waste Chute')
    expect(getAllByText('Add').length).toBe(3)
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
      fixtureLocation: 'cutoutD3',
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
    getByText('Staging Area Slot')
    getByText('Trash Bin')
    getByText('Waste Chute')
    expect(getAllByRole('button', { name: 'Add' }).length).toBe(3)
  })

  it('should render text and buttons slot A1', () => {
    props = { ...props, fixtureLocation: 'cutoutA1' }
    const [{ getByText, getByRole }] = render(props)
    getByText('Add to slot A1')
    getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Trash Bin')
    getByRole('button', { name: 'Add' })
  })

  it('should render text and buttons slot B3', () => {
    props = { ...props, fixtureLocation: 'cutoutB3' }
    const [{ getByText, getAllByRole }] = render(props)
    getByText('Add to slot B3')
    getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Staging Area Slot')
    getByText('Trash Bin')
    expect(getAllByRole('button', { name: 'Add' }).length).toBe(2)
  })

  it('should call a mock function when clicking add button', () => {
    props = { ...props, fixtureLocation: 'cutoutA1' }
    const [{ getByRole }] = render(props)
    getByRole('button', { name: 'Add' }).click()
    expect(mockUpdateDeckConfiguration).toHaveBeenCalledWith({
      fixtureLocation: 'cutoutA1',
      loadName: TRASH_BIN_LOAD_NAME,
    })
  })
})
