import { vi, describe, beforeEach, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../__testing-utils__'
import {
  getCurrentFormHasUnsavedChanges,
  getCurrentFormIsPresaved,
  getInitialDeckSetup,
} from '../../step-forms/selectors'
import { getIsMultiSelectMode } from '../../ui/steps'
import { i18n } from '../../assets/localization'
import { getEnableComment } from '../../feature-flags/selectors'
import { StepCreationButton } from '../StepCreationButton'

vi.mock('../../step-forms/selectors')
vi.mock('../../ui/steps')
vi.mock('../../feature-flags/selectors')

const render = () => {
  return renderWithProviders(<StepCreationButton />, { i18nInstance: i18n })[0]
}

describe('StepCreationButton', () => {
  beforeEach(() => {
    vi.mocked(getEnableComment).mockReturnValue(true)
    vi.mocked(getCurrentFormIsPresaved).mockReturnValue(false)
    vi.mocked(getCurrentFormHasUnsavedChanges).mockReturnValue(false)
    vi.mocked(getIsMultiSelectMode).mockReturnValue(false)
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
  })
  it('renders the add step button and clicking on it reveals all the button option, no modules', () => {
    render()
    const addStep = screen.getByRole('button', { name: '+ Add Step' })
    fireEvent.click(addStep)
    screen.getByText('comment')
    screen.getByText('move labware')
    screen.getByText('transfer')
    screen.getByText('mix')
    screen.getByText('pause')
  })
  it('renders the add step button and clicking on it reveals all the button options, with modules', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        hs: { id: 'hs', type: 'heaterShakerModuleType' },
        mag: { id: 'mag', type: 'magneticModuleType' },
        temp: { id: 'temp', type: 'temperatureModuleType' },
        tc: { id: 'tc', type: 'thermocyclerModuleType' },
      } as any,
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    render()
    const addStep = screen.getByRole('button', { name: '+ Add Step' })
    fireEvent.click(addStep)
    screen.getByText('heater-shaker')
    screen.getByText('thermocycler')
    screen.getByText('magnet')
    screen.getByText('temperature')
  })
})
