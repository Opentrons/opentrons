import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { ProtocolSteps } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { getEnableHotKeysDisplay } from '../../../../feature-flags/selectors'
import { getRobotStateTimeline } from '../../../../file-data/selectors'
import { useProtocolExportHandler } from '../../../../resources/hooks'
import {
  getAdditionalEquipmentEntities,
  getSavedStepForms,
  getUnsavedForm,
} from '../../../../step-forms/selectors'
import { getDeckSetupForActiveItem } from '../../../../top-selectors/labware-locations'
import {
  getActiveItem,
  getSelectedStepId,
  getSelectedSubstep,
} from '../../../../ui/steps/selectors'
import { DeckSetupContainer } from '../../DeckSetup'
import { OffDeck } from '../../OffDeck'
import { DraggableSidebar } from '../DraggableSidebar'
import { SubStepsToolbox } from '../Timeline'
import { getUserOS } from '../Timeline/utils'

import type { SavedStepFormState } from '../../../../step-forms'

vi.mock('../../OffDeck')
vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../ui/steps/selectors')
vi.mock('../../../../ui/labware/selectors')
vi.mock('../StepForm')
vi.mock('../../DeckSetup')
vi.mock('../Timeline')
vi.mock('../DraggableSidebar')
vi.mock('../../../../feature-flags/selectors')
vi.mock('../../../../file-data/selectors')
vi.mock('../../../../components/organisms/Alerts')
vi.mock('../../../../top-selectors/labware-locations')
vi.mock('../Timeline/utils')
vi.mock('../../../../components/organisms/StepSummary')
vi.mock('../../../../resources/hooks')

const render = () => {
  return renderWithProviders(
    <ProtocolSteps
      zoomedInSlot={null}
      showLiquidOverflowMenu={vi.fn()}
      targetWidth={235}
      setTargetWidth={vi.fn()}
    />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

const MOCK_STEP_FORMS = {
  '0522fde8-25a3-4840-b84a-af7282bd80d5': {
    moduleId: '781599b2-1eff-4594-8c96-06fcd54f4faa:heaterShakerModuleType',
    pauseAction: 'untilTime',
    pauseHour: '22',
    pauseMessage: 'sdfg',
    pauseMinute: '22',
    pauseSecond: '11',
    pauseTemperature: null,
    pauseTime: null,
    id: '0522fde8-25a3-4840-b84a-af7282bd80d5',
    stepType: 'pause',
    stepName: 'custom pause',
    stepDetails: '',
  },
}
const mockHandleExportClick = vi.fn()

describe('ProtocolSteps', () => {
  beforeEach(() => {
    vi.mocked(getUserOS).mockReturnValue('Mac OS')
    vi.mocked(getRobotStateTimeline).mockReturnValue({
      timeline: [],
      errors: [],
    })
    vi.mocked(DraggableSidebar).mockReturnValue(
      <div>mock DraggableSidebar</div>
    )
    vi.mocked(DeckSetupContainer).mockReturnValue(
      <div>mock DeckSetupContainer</div>
    )
    vi.mocked(getActiveItem).mockReturnValue({
      selectionType: 'SINGLE_STEP_SELECTION_TYPE',
      id: '0522fde8-25a3-4840-b84a-af7282bd80d5',
    })
    vi.mocked(OffDeck).mockReturnValue(<div>mock OffDeck</div>)
    vi.mocked(getUnsavedForm).mockReturnValue(null)
    vi.mocked(getSelectedSubstep).mockReturnValue(null)
    vi.mocked(SubStepsToolbox).mockReturnValue(<div>mock SubStepsToolbox</div>)
    vi.mocked(getEnableHotKeysDisplay).mockReturnValue(true)
    vi.mocked(getSavedStepForms).mockReturnValue(
      MOCK_STEP_FORMS as SavedStepFormState
    )
    vi.mocked(getSelectedStepId).mockReturnValue(
      '0522fde8-25a3-4840-b84a-af7282bd80d5'
    )
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      modules: {},
      labware: {},
      additionalEquipmentOnDeck: {
        trash: { id: 'trash', location: 'cutoutA3', name: 'trashBin' },
      },
      pipettes: {},
    })
    vi.mocked(getAdditionalEquipmentEntities).mockReturnValue({})
    vi.mocked(useProtocolExportHandler).mockReturnValue({
      handleExportClick: mockHandleExportClick,
      exportWarningModalElement: null,
    })
  })

  it('renders each component in ProtocolSteps', () => {
    render()
    screen.getByText('mock DraggableSidebar')
    screen.getByText('mock DeckSetupContainer')
  })

  it('renders the toggle when formData is null', () => {
    render()
    screen.getByText('mock DeckSetupContainer')
    fireEvent.click(screen.getByText('Off-deck'))
    screen.getByText('mock OffDeck')
  })

  it('renders the substepToolbox when selectedSubstep is not null', () => {
    vi.mocked(getSelectedSubstep).mockReturnValue('mockId')
    render()
    screen.getByText('mock SubStepsToolbox')
  })

  it('renders the hot keys display for mac', () => {
    render()
    screen.getByText('Double-click to edit')
    screen.getByText('⇧ + click to select range')
    screen.getByText('⌘ + click to select multiple')
  })

  it('renders the hot keys display for windows', () => {
    vi.mocked(getUserOS).mockReturnValue('Windows')
    render()
    screen.getByText('Double-click to edit')
    screen.getByText('⇧ + click to select range')
    screen.getByText('^ + click to select multiple')
  })
  it('renders the current step name', () => {
    render()
    screen.getByText('Custom Pause')
  })

  it('should render export button and call mock function when clicking it', () => {
    render()
    const exportButton = screen.getByRole('button', { name: 'Export' })
    fireEvent.click(exportButton)
    expect(mockHandleExportClick).toHaveBeenCalled()
  })
})
