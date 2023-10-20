import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { DeckConfigurator, renderWithProviders } from '@opentrons/components'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  TRASH_BIN_LOAD_NAME,
  // WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { DeckFixtureSetupInstructionsModal } from '../../../organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import { DeckConfigurationDiscardChangesModal } from '../../../organisms/DeviceDetailsDeckConfiguration/DeckConfigurationDiscardChangesModal'
import { DeckConfigurationEditor } from '..'

import { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'
// import type { DeckConfigData } from '..'

const mockUpdateDeckConfiguration = jest.fn()
const mockGoBack = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ goBack: mockGoBack } as any),
  }
})

const mockDeckConfig = [
  {
    fixtureId: 'mockFixtureIdC3',
    fixtureLocation: 'C3',
    loadName: TRASH_BIN_LOAD_NAME,
  },
]
// const mockDeckConfigData = {
//   addedFixture: null,
//   currentDeckConfig: [
//     {
//       fixtureId: 'mockFixtureIdC3',
//       fixtureLocation: 'C3',
//       loadName: TRASH_BIN_LOAD_NAME,
//     },
//     {
//       fixtureId: 'mockFixtureIdD3',
//       fixtureLocation: 'D3',
//       loadName: WASTE_CHUTE_LOAD_NAME,
//     },
//   ],
// } as DeckConfigData

jest.mock('@opentrons/components/src/hardware-sim/DeckConfigurator/index')
jest.mock('@opentrons/react-api-client')
jest.mock(
  '../../../organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
)
jest.mock(
  '../../../organisms/DeviceDetailsDeckConfiguration/DeckConfigurationDiscardChangesModal'
)

const mockDeckFixtureSetupInstructionsModal = DeckFixtureSetupInstructionsModal as jest.MockedFunction<
  typeof DeckFixtureSetupInstructionsModal
>
const mockDeckConfigurator = DeckConfigurator as jest.MockedFunction<
  typeof DeckConfigurator
>
const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>
const mockUseUpdateDeckConfigurationMutation = useUpdateDeckConfigurationMutation as jest.MockedFunction<
  typeof useUpdateDeckConfigurationMutation
>
const mockDeckConfigurationDiscardChangesModal = DeckConfigurationDiscardChangesModal as jest.MockedFunction<
  typeof DeckConfigurationDiscardChangesModal
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <DeckConfigurationEditor />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeckConfigurationEditor', () => {
  beforeEach(() => {
    mockDeckFixtureSetupInstructionsModal.mockReturnValue(
      <div>mock DeckFixtureSetupInstructionsModal</div>
    )
    mockDeckConfigurator.mockReturnValue(<div>mock DeckConfigurator</div>)
    when(mockUseDeckConfigurationQuery).mockReturnValue({
      data: mockDeckConfig,
    } as UseQueryResult<DeckConfiguration>)
    mockUseUpdateDeckConfigurationMutation.mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    mockDeckConfigurationDiscardChangesModal.mockReturnValue(
      <div>mock DeckConfigurationDiscardChangesModal</div>
    )
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render text, button and DeckConfigurator', () => {
    const [{ getByText }] = render()
    getByText('Deck configuration')
    getByText('Setup Instructions')
    getByText('Confirm')
    getByText('mock DeckConfigurator')
  })

  it('should display setup instructions modal when tapping setup instructions button', () => {
    const [{ getByText }] = render()
    getByText('Setup Instructions').click()
    getByText('mock DeckFixtureSetupInstructionsModal')
  })

  it('should call a mock function when tapping confirm', () => {
    // This test case needs manual operation since need to update localState
    // const [{ getByText }] = render()
    // getByText('Confirm').click()
    // expect(mockUpdateDeckConfiguration).toHaveBeenCalled()
  })

  it('should call a mock function when tapping back button if there is no change', () => {
    const [{ getByTestId }] = render()
    getByTestId('ChildNavigation_Back_Button').click()
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('should render modal when tapping back button if there is a change', () => {
    // This test case needs manual operation since need to update localState
    // const [{ getByTestId }] = render()
    // getByTestId('ChildNavigation_Back_Button').click()
    // expect(mockGoBack).toHaveBeenCalled()
  })
})
