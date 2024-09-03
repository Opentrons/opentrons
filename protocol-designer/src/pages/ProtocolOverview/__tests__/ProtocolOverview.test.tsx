import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { getFileMetadata, getRobotType } from '../../../file-data/selectors'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { useBlockingHint } from '../../../components/Hints/useBlockingHint'
import { MaterialsListModal } from '../../../organisms/MaterialsListModal'
import { ProtocolOverview } from '../index'

import type { NavigateFunction } from 'react-router-dom'

vi.mock('../../../step-forms/selectors')
vi.mock('../../../file-data/selectors')
vi.mock('../../../components/Hints/useBlockingHint')
vi.mock('../../../organisms/MaterialsListModal')
vi.mock('../../../labware-ingred/selectors')

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
    vi.mocked(useBlockingHint).mockReturnValue(null)
    vi.mocked(MaterialsListModal).mockReturnValue(
      <div>mock MaterialsListModal</div>
    )
  })

  it('renders each section with text', () => {
    render()
    // buttons
    screen.getByRole('button', { name: 'Edit protocol' })
    screen.getByRole('button', { name: 'Export protocol' })
    screen.getByText('Materials list')

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

  it.todo('should render mock materials list modal')

  it('navigates to starting deck state', () => {
    render()
    const button = screen.getByRole('button', { name: 'Edit protocol' })
    fireEvent.click(button)
    expect(mockNavigate).toHaveBeenCalledWith('/designer')
  })

  it('renders the file sidebar and exports with blocking hint for exporting', () => {
    vi.mocked(useBlockingHint).mockReturnValue(<div>mock blocking hint</div>)
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export protocol' }))
    expect(vi.mocked(useBlockingHint)).toHaveBeenCalled()
    screen.getByText('mock blocking hint')
  })

  it('render mock materials list modal when clicking materials list', () => {
    render()
    fireEvent.click(screen.getByText('Materials list'))
    screen.getByText('mock MaterialsListModal')
  })

  it.todo('warning modal tests')
})
