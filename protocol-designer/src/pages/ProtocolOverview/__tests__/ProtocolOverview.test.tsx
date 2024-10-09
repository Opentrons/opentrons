import { describe, it, vi, beforeEach, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

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
import { ProtocolMetaData } from '../ProtocolMetaData'
import { InstrumentsInfo } from '../InstrumentsInfo'
import { LiquidDefinitions } from '../LiquidDefinitions'

import type { NavigateFunction } from 'react-router-dom'

vi.mock('../OffdeckThumbnail')
vi.mock('../DeckThumbnail')
vi.mock('../../../step-forms/selectors')
vi.mock('../../../file-data/selectors')
vi.mock('../../../organisms/MaterialsListModal')
vi.mock('../../../labware-ingred/selectors')
vi.mock('../../../organisms')
vi.mock('../../../labware-ingred/selectors')
vi.mock('../LiquidDefinitions')
vi.mock('../InstrumentsInfo')
vi.mock('../ProtocolMetaData')

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
      created: 123,
    })
    vi.mocked(MaterialsListModal).mockReturnValue(
      <div>mock MaterialsListModal</div>
    )
    vi.mocked(DeckThumbnail).mockReturnValue(<div>mock DeckThumbnail</div>)
    vi.mocked(OffDeckThumbnail).mockReturnValue(
      <div>mock OffdeckThumbnail</div>
    )
    vi.mocked(LiquidDefinitions).mockReturnValue(
      <div>mock LiquidDefinitions</div>
    )
    vi.mocked(InstrumentsInfo).mockReturnValue(<div>mock InstrumentsInfo</div>)
    vi.mocked(ProtocolMetaData).mockReturnValue(
      <div>mock ProtocolMetaData</div>
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
    screen.getByText('mock ProtocolMetaData')

    //  instruments
    screen.getByText('mock InstrumentsInfo')

    //   liquids
    screen.getByText('mock LiquidDefinitions')

    //  steps
    screen.getByText('Protocol steps')
  })

  it('should render the deck thumbnail and offdeck thumbnail', () => {
    render()
    screen.getByText('mock DeckThumbnail')
    fireEvent.click(screen.getByText('Off-deck'))
    screen.getByText('mock OffdeckThumbnail')
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
})
