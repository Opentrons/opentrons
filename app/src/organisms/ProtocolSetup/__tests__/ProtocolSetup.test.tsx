import * as React from 'react'
import '@testing-library/jest-dom'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { RunSetupCard } from '../RunSetupCard'
import { MetadataCard } from '../MetadataCard'
import { ProtocolSetup } from '..'

jest.mock('../../RunTimeControl/hooks')
jest.mock('../MetadataCard')
jest.mock('../RunSetupCard')

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
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
    mockUseRunStatus.mockReturnValue(RUN_STATUS_IDLE)
    mockMetadataCard.mockReturnValue(<div>Mock MetadataCard</div>)
    mockRunSetupCard.mockReturnValue(<div>Mock ReunSetupCard</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders metadata and run setup card', () => {
    const { getByText } = render()
    getByText('Mock MetadataCard')
    getByText('Mock ReunSetupCard')
  })
  it('does not render a protocol run banner when run is unstarted', () => {
    const { queryByText } = render()
    const bannerText =
      'Recalibrating Tip Length calibrations and Labware Position Check is not available.'
    expect(queryByText(bannerText)).toBeNull()
  })
  it('renders a protocol run started banner when run is started', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_RUNNING)
    const { queryByText } = render()
    const bannerText =
      'Protocol run started. Recalibrating Tip Length calibrations and Labware Position Check is not available.'
    expect(queryByText(bannerText)).toBeTruthy()
  })
  it('renders a protocol run started banner when run pause is requested', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_PAUSE_REQUESTED)
    const { queryByText } = render()
    const bannerText =
      'Protocol run started. Recalibrating Tip Length calibrations and Labware Position Check is not available.'
    expect(queryByText(bannerText)).toBeTruthy()
  })
  it('renders a protocol run started banner when run is paused', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_PAUSED)
    const { queryByText } = render()
    const bannerText =
      'Protocol run started. Recalibrating Tip Length calibrations and Labware Position Check is not available.'
    expect(queryByText(bannerText)).toBeTruthy()
  })
  it('renders a protocol run complete banner when run is complete', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_SUCCEEDED)
    const { queryByText } = render()
    const bannerText = 'Protocol run complete. This protocol can now be closed.'
    expect(queryByText(bannerText)).toBeTruthy()
  })
  it('renders a protocol run failed banner when run is failed', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_FAILED)
    const { queryByText } = render()
    const bannerText = 'Protocol run failed.'
    expect(queryByText(bannerText)).toBeTruthy()
  })
  it('renders a protocol run canceled banner when a run stop is requested', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_STOP_REQUESTED)
    const { queryByText } = render()
    const bannerText =
      'Protocol run canceled. Recalibrating Tip Length calibrations and Labware Position Check is not available.'
    expect(queryByText(bannerText)).toBeTruthy()
  })
  it('renders a protocol run canceled banner when run is stopped', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_STOPPED)
    const { queryByText } = render()
    const bannerText =
      'Protocol run canceled. Recalibrating Tip Length calibrations and Labware Position Check is not available.'
    expect(queryByText(bannerText)).toBeTruthy()
  })
  it('renders feedback link', () => {
    const { getByText, getByRole } = render()
    getByText('Have feedback about this experience?')
    expect(getByRole('link', { name: 'Let us know!' })).toBeTruthy()
  })
})
