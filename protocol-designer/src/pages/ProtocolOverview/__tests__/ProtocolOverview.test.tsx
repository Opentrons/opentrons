import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { EditProtocolMetadataModal } from '../../../organisms'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { getFileMetadata, getRobotType } from '../../../file-data/selectors'
import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
  getSavedStepForms,
} from '../../../step-forms/selectors'
import { MaterialsListModal } from '../../../organisms/MaterialsListModal'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import { ProtocolOverview } from '../index'
import { DeckThumbnail } from '../DeckThumbnail'
import { OffDeckThumbnail } from '../OffdeckThumbnail'

import type { NavigateFunction } from 'react-router-dom'

vi.mock('../OffdeckThumbnail')
vi.mock('../DeckThumbnail')
vi.mock('../../../step-forms/selectors')
vi.mock('../../../file-data/selectors')
vi.mock('../../../organisms/MaterialsListModal')
vi.mock('../../../labware-ingred/selectors')
vi.mock('../../../organisms')
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
    vi.mocked(getAdditionalEquipmentEntities).mockReturnValue({})
    vi.mocked(getSavedStepForms).mockReturnValue({
      __INITIAL_DECK_SETUP_STEP__: {} as any,
    })
    vi.mocked(labwareIngredSelectors.allIngredientGroupFields).mockReturnValue(
      {}
    )
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
    vi.mocked(MaterialsListModal).mockReturnValue(
      <div>mock MaterialsListModal</div>
    )
    vi.mocked(DeckThumbnail).mockReturnValue(<div>mock DeckThumbnail</div>)
    vi.mocked(OffDeckThumbnail).mockReturnValue(
      <div>mock OffdeckThumbnail</div>
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
    screen.getByText('Protocol Metadata')
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
    screen.getByText('Liquid Definitions')
    //  steps
    screen.getByText('Protocol steps')
  })

  it('should render the deck thumbnail and offdeck thumbnail', () => {
    render()
    screen.getByText('mock DeckThumbnail')
    fireEvent.click(screen.getByText('Off-deck'))
    screen.getByText('mock OffdeckThumbnail')
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

  it('navigates to starting deck state', () => {
    render()
    const button = screen.getByRole('button', { name: 'Edit protocol' })
    fireEvent.click(button)
    expect(mockNavigate).toHaveBeenCalledWith('/designer')
  })

  it('render mock materials list modal when clicking materials list', () => {
    render()
    fireEvent.click(screen.getByText('Materials list'))
    screen.getByText('mock MaterialsListModal')
  })

  it('renders the edit protocol metadata modal', () => {
    vi.mocked(EditProtocolMetadataModal).mockReturnValue(
      <div>mock EditProtocolMetadataModal</div>
    )
    render()
    fireEvent.click(screen.getByTestId('ProtocolOverview_MetadataEditButton'))
    screen.getByText('mock EditProtocolMetadataModal')
  })
})
