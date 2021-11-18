import * as React from 'react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import { AlertItem } from '@opentrons/components/src/alerts'
import { i18n } from '../../../i18n'
import { RunSetupCard } from '../RunSetupCard'
import { MetadataCard } from '../MetadataCard'
import { ProtocolSetup } from '..'
import { fireEvent } from '@testing-library/dom'

jest.mock('../MetadataCard')
jest.mock('../RunSetupCard')
jest.mock('@opentrons/components/src/alerts')

const mockMetadataCard = MetadataCard as jest.MockedFunction<
  typeof MetadataCard
>
const mockRunSetupCard = RunSetupCard as jest.MockedFunction<
  typeof RunSetupCard
>
const mockAlertItem = AlertItem as jest.MockedFunction<typeof AlertItem>

describe('ProtocolSetup', () => {
  const render = () => {
    return renderWithProviders(<ProtocolSetup />, { i18nInstance: i18n })[0]
  }

  beforeEach(() => {
    mockMetadataCard.mockReturnValue(<div>Mock MetadataCard</div>)
    mockRunSetupCard.mockReturnValue(<div>Mock ReunSetupCard</div>)
    mockAlertItem.mockReturnValue(<div>Mock AlertItem</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders metadata and run setup card', () => {
    const { getByText } = render()
    getByText('Mock MetadataCard')
    getByText('Mock ReunSetupCard')
  })
  it('renders LPC success toast and is clickable', () => {
    const { getByText } = render()
    const successToast = getByText('Mock AlertItem')
    fireEvent.click(successToast)
  })
})
