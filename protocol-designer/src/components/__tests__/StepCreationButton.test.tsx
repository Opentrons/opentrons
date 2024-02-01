import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'
import {
  getCurrentFormHasUnsavedChanges,
  getCurrentFormIsPresaved,
  getInitialDeckSetup,
} from '../../step-forms/selectors'
import { getIsMultiSelectMode } from '../../ui/steps'
import { i18n } from '../../localization'
import { StepCreationButton } from '../StepCreationButton'

jest.mock('../../step-forms/selectors')
jest.mock('../../ui/steps')

const mockGetCurrentFormIsPresaved = getCurrentFormIsPresaved as jest.MockedFunction<
  typeof getCurrentFormIsPresaved
>
const mockGetCurrentFormHasUnsavedChanges = getCurrentFormHasUnsavedChanges as jest.MockedFunction<
  typeof getCurrentFormHasUnsavedChanges
>
const mockGetIsMultiSelectMode = getIsMultiSelectMode as jest.MockedFunction<
  typeof getIsMultiSelectMode
>
const mockGetInitialDeckSetup = getInitialDeckSetup as jest.MockedFunction<
  typeof getInitialDeckSetup
>

const render = () => {
  return renderWithProviders(<StepCreationButton />, { i18nInstance: i18n })[0]
}

describe('StepCreationButton', () => {
  beforeEach(() => {
    mockGetCurrentFormIsPresaved.mockReturnValue(false)
    mockGetCurrentFormHasUnsavedChanges.mockReturnValue(false)
    mockGetIsMultiSelectMode.mockReturnValue(false)
    mockGetInitialDeckSetup.mockReturnValue({
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
    screen.getByText('move labware')
    screen.getByText('transfer')
    screen.getByText('mix')
    screen.getByText('pause')
  })
  it('renders the add step button and clicking on it reveals all the button options, with modules', () => {
    mockGetInitialDeckSetup.mockReturnValue({
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
