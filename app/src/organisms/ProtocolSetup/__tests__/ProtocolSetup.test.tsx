import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/dom'
import { renderWithProviders } from '@opentrons/components'
import { RunSetupCard } from '../RunSetupCard'
import { MetadataCard } from '../MetadataCard'
import { LabwareOffsetSuccessToast } from '../LabwareOffsetSuccessToast'
import { ProtocolSetup } from '..'

jest.mock('../MetadataCard')
jest.mock('../RunSetupCard')
jest.mock('../LabwareOffsetSuccessToast')

const mockMetadataCard = MetadataCard as jest.MockedFunction<
  typeof MetadataCard
>
const mockRunSetupCard = RunSetupCard as jest.MockedFunction<
  typeof RunSetupCard
>
const mockLabwareOffsetSuccessToast = LabwareOffsetSuccessToast as jest.MockedFunction<
  typeof LabwareOffsetSuccessToast
>

describe('ProtocolSetup', () => {
  const render = () => {
    return renderWithProviders(<ProtocolSetup />)[0]
  }

  beforeEach(() => {
    mockMetadataCard.mockReturnValue(<div>Mock MetadataCard</div>)
    mockRunSetupCard.mockReturnValue(<div>Mock ReunSetupCard</div>)
    mockLabwareOffsetSuccessToast.mockReturnValue(
      <div>Mock LabwareOffsetSuccessToast</div>
    )
  })

  it('renders metadata and run setup card', () => {
    const { getByText } = render()
    getByText('Mock MetadataCard')
    getByText('Mock ReunSetupCard')
  })
  it('renders LPC success toast and is clickable', () => {
    const { getByText } = render()
    const successToast = getByText('Mock LabwareOffsetSuccessToast')
    fireEvent.click(successToast)
  })
})
