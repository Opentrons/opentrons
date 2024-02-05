import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { InstrumentGroup } from '@opentrons/components'
import { renderWithProviders } from '../../__testing-utils__'
import { i18n } from '../../localization'
import { getFileMetadata } from '../../file-data/selectors'
import {
  getInitialDeckSetup,
  getModulesForEditModulesCard,
  getPipettesForInstrumentGroup,
} from '../../step-forms/selectors'
import { navigateToPage } from '../../navigation/actions'
import { changeSavedStepForm } from '../../steplist/actions'
import { FilePage } from '../FilePage'
import { EditModulesCard } from '../modules'
import { FilePipettesModal } from '../modals/FilePipettesModal'

jest.mock('../../file-data/selectors')
jest.mock('../../step-forms/selectors')
jest.mock('../modules')
jest.mock('@opentrons/components/src/instrument/InstrumentGroup')
jest.mock('../modals/FilePipettesModal')
jest.mock('../../steplist/actions')
jest.mock('../../navigation/actions')

const mockGetFileMetadata = getFileMetadata as jest.MockedFunction<
  typeof getFileMetadata
>
const mockGetPipettesForInstrumentGroup = getPipettesForInstrumentGroup as jest.MockedFunction<
  typeof getPipettesForInstrumentGroup
>
const mockGetModulesForEditModulesCard = getModulesForEditModulesCard as jest.MockedFunction<
  typeof getModulesForEditModulesCard
>
const mockGetInitialDeckSetup = getInitialDeckSetup as jest.MockedFunction<
  typeof getInitialDeckSetup
>
const mockEditModulesCard = EditModulesCard as jest.MockedFunction<
  typeof EditModulesCard
>
const mockInstrumentGroup = InstrumentGroup as jest.MockedFunction<
  typeof InstrumentGroup
>
const mockFilePipettesModal = FilePipettesModal as jest.MockedFunction<
  typeof FilePipettesModal
>
const mockChangeSavedStepForm = changeSavedStepForm as jest.MockedFunction<
  typeof changeSavedStepForm
>
const mockNavigateToPage = navigateToPage as jest.MockedFunction<
  typeof navigateToPage
>

const render = () => {
  return renderWithProviders(<FilePage />, { i18nInstance: i18n })[0]
}

describe('File Page', () => {
  beforeEach(() => {
    mockGetFileMetadata.mockReturnValue({})
    mockGetPipettesForInstrumentGroup.mockReturnValue({})
    mockGetModulesForEditModulesCard.mockReturnValue({})
    mockGetInitialDeckSetup.mockReturnValue({
      pipettes: {},
      modules: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    mockEditModulesCard.mockReturnValue(<div>mock EditModulesCard</div>)
    mockInstrumentGroup.mockReturnValue(<div>mock InstrumentGroup</div>)
    mockFilePipettesModal.mockReturnValue(<div>mock FilePipettesModal</div>)
  })
  it('renders file page with all the information', () => {
    render()
    screen.getByText('Information')
    screen.getByText('Date Created')
    screen.getByText('Last Exported')
    screen.getByText('Protocol Name')
    screen.getByText('Organization/Author')
    screen.getByText('Description')
    screen.getByRole('button', { name: 'UPDATED' })
    screen.getByText('Pipettes')
    screen.getByText('mock InstrumentGroup')
    screen.getByRole('button', { name: 'edit' })
    screen.getByRole('button', { name: 'swap' })
    screen.getByText('mock EditModulesCard')
    screen.getByRole('button', { name: 'Continue to Liquids' })
  })
  it('renders the edit pipettes button and it opens the modal', () => {
    render()
    const btn = screen.getByRole('button', { name: 'edit' })
    fireEvent.click(btn)
    screen.getByText('mock FilePipettesModal')
  })
  it('renders the swap pipettes button and it dispatches the changeSavedStepForm', () => {
    render()
    const btn = screen.getByRole('button', { name: 'swap' })
    fireEvent.click(btn)
    expect(mockChangeSavedStepForm).toHaveBeenCalled()
  })
  it('renders the continue to liquids button and it dispatches the navigateToPage', () => {
    render()
    const btn = screen.getByRole('button', { name: 'Continue to Liquids' })
    fireEvent.click(btn)
    expect(mockNavigateToPage).toHaveBeenCalled()
  })
})
