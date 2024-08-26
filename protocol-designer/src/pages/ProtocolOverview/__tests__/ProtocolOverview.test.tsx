import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { getFileMetadata, getRobotType } from '../../../file-data/selectors'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { ProtocolOverview } from '../index'

import type { NavigateFunction } from 'react-router-dom'

vi.mock('../../../step-forms/selectors')
vi.mock('../../../file-data/selectors')

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = () => {
  return renderWithProviders(<ProtocolOverview />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolOverview', () => {
  beforeEach(() => {
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      additionalEquipmentOnDeck: {},
      modules: {},
      labware: {},
    })
    vi.mocked(getFileMetadata).mockReturnValue({
      protocolName: 'mockName',
      author: 'mockAuthor',
      description: 'mockDescription',
    })
  })
  it('renders each section with text', () => {
    render()
    // buttons
    screen.getByRole('button', { name: 'Edit protocol' })
    screen.getByRole('button', { name: 'Export protocol' })

    //  metadata
    screen.getByText('mockName')
    screen.getByText('Protocol metadata')
    screen.getAllByText('Edit')
    screen.getByText('Description')
    screen.getByText('mockDescription')
    screen.getByText('Organization/Author')
    screen.getByText('mockAuthor')
    screen.getByText('Date created')
    screen.getByText('Last exported')
    //  instruments
    screen.getByText('Instruments')
    screen.getByText('Robot type')
    screen.getAllByText('Opentrons Flex')
    screen.getByText('Left pipette')
    screen.getByText('Right pipette')
    screen.getByText('Extension mount')
    //   liquids
    screen.getByText('Liquids')
    //  steps
    screen.getByText('Protocol steps')
  })

  it('should render text N/A if there is no data', () => {
    vi.mocked(getFileMetadata).mockReturnValue({
      protocolName: undefined,
      author: undefined,
      description: undefined,
    })
    render()
    expect(screen.getAllByText('N/A').length).toBe(7)
  })

  it('navigates to deck setup deck setup', () => {
    render()
    fireEvent.click(screen.getByTestId('toDeckSetup'))
    expect(mockNavigate).toHaveBeenCalled()
  })
})
