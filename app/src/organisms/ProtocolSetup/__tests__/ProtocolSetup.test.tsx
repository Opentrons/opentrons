import * as React from 'react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { RunSetupCard } from '../RunSetupCard'
import { MetadataCard } from '../MetadataCard'
import { ProtocolSetup } from '..'

jest.mock('../MetadataCard')
jest.mock('../RunSetupCard')

const mockMetadataCard = MetadataCard as jest.MockedFunction<
  typeof MetadataCard
>
const mockRunSetupCard = RunSetupCard as jest.MockedFunction<
  typeof RunSetupCard
>

describe('ProtocolSetup', () => {
  const render = () => {
    return renderWithProviders(<ProtocolSetup />, {
      i18nInstance: i18n,
    })[0]
  }

  beforeEach(() => {
    mockMetadataCard.mockReturnValue(<div>Mock MetadataCard</div>)
    mockRunSetupCard.mockReturnValue(<div>Mock ReunSetupCard</div>)
  })

  it('renders metadata and run setup card', () => {
    const { getByText } = render()
    getByText('Mock MetadataCard')
    getByText('Mock ReunSetupCard')
  })
  it('renders feedback link', () => {
    const { getByText, getByRole } = render()
    getByText('Have feedback about this experience?')
    expect(getByRole('link', { name: 'Let us know!' })).toBeTruthy()
  })
})
