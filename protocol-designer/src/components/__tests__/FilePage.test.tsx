import * as React from 'react'
import { vi, describe, expect, afterEach, beforeEach, it } from 'vitest'
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
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

import type * as Components from '@opentrons/components'

vi.mock('../../file-data/selectors')
vi.mock('../../step-forms/selectors')
vi.mock('../modules')
vi.mock('@opentrons/components', async (importOriginal) => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    InstrumentGroup: () => (<div>mock InstrumentGroup</div>)
  }
})
vi.mock('../modals/FilePipettesModal')
vi.mock('../../steplist/actions')
vi.mock('../../navigation/actions')

const render = () => {
  return renderWithProviders(<FilePage />, { i18nInstance: i18n })[0]
}

describe('File Page', () => {
  beforeEach(() => {
    vi.mocked(getFileMetadata).mockReturnValue({})
    vi.mocked(getPipettesForInstrumentGroup).mockReturnValue({})
    vi.mocked(getModulesForEditModulesCard).mockReturnValue({})
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    vi.mocked(EditModulesCard).mockReturnValue(<div>mock EditModulesCard</div>)
    vi.mocked(FilePipettesModal).mockReturnValue(<div>mock FilePipettesModal</div>)
  })
  afterEach(() => {
    cleanup()
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
  it.only('renders the edit pipettes button and it opens the modal', async () => {
    render()
    const btn = screen.getByRole('button', { name: 'edit' })
    fireEvent.click(btn)
    screen.getByText('mock FilePipettesModal')
  })
  it('renders the swap pipettes button and it dispatches the changeSavedStepForm', () => {
    render()
    const btn = screen.getByRole('button', { name: 'swap' })
    fireEvent.click(btn)
    expect(vi.mocked(changeSavedStepForm)).toHaveBeenCalled()
  })
  it('renders the continue to liquids button and it dispatches the navigateToPage', () => {
    render()
    const btn = screen.getByRole('button', { name: 'Continue to Liquids' })
    fireEvent.click(btn)
    expect(vi.mocked(navigateToPage)).toHaveBeenCalled()
  })
})
