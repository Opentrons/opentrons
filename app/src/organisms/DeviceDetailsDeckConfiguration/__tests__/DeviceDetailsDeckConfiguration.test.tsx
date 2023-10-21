import * as React from 'react'
import { DeckConfigurator, renderWithProviders } from '@opentrons/components'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { DeckFixtureSetupInstructionsModal } from '../DeckFixtureSetupInstructionsModal'
import { DeviceDetailsDeckConfiguration } from '../'

jest.mock('@opentrons/components/src/hardware-sim/DeckConfigurator/index')
jest.mock('@opentrons/react-api-client')
jest.mock('../DeckFixtureSetupInstructionsModal')

const ROBOT_NAME = 'otie'
const mockUpdateDeckConfiguration = jest.fn()

const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>
const mockUseUpdateDeckConfigurationMutation = useUpdateDeckConfigurationMutation as jest.MockedFunction<
  typeof useUpdateDeckConfigurationMutation
>
const mockDeckFixtureSetupInstructionsModal = DeckFixtureSetupInstructionsModal as jest.MockedFunction<
  typeof DeckFixtureSetupInstructionsModal
>
const mockDeckConfigurator = DeckConfigurator as jest.MockedFunction<
  typeof DeckConfigurator
>

const render = (
  props: React.ComponentProps<typeof DeviceDetailsDeckConfiguration>
) => {
  return renderWithProviders(<DeviceDetailsDeckConfiguration {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DeviceDetailsDeckConfiguration', () => {
  let props: React.ComponentProps<typeof DeviceDetailsDeckConfiguration>

  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
    }
    mockUseDeckConfigurationQuery.mockReturnValue({ data: [] } as any)
    mockUseUpdateDeckConfigurationMutation.mockReturnValue({
      updateDeckConfiguration: mockUpdateDeckConfiguration,
    } as any)
    mockDeckFixtureSetupInstructionsModal.mockReturnValue(
      <div>mock DeckFixtureSetupInstructionsModal</div>
    )
    mockDeckConfigurator.mockReturnValue(<div>mock DeckConfigurator</div>)
  })

  it('should render text and button', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('otie deck configuration')
    getByRole('button', { name: 'Setup Instructions' })
    getByText('Location')
    getByText('Fixture')
    getByText('mock DeckConfigurator')
  })

  it('should render DeckFixtureSetupInstructionsModal when clicking text button', () => {
    const [{ getByText, getByRole }] = render(props)
    getByRole('button', { name: 'Setup Instructions' }).click()
    getByText('mock DeckFixtureSetupInstructionsModal')
  })
})
