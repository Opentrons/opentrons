import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { getFileMetadata } from '../../../../../file-data/selectors'
import {
  getInitialDeckSetup,
  getOrderedStepIds,
  getUnsavedForm,
} from '../../../../../step-forms/selectors'
import {
  selectDropdownItem,
  selectTerminalItem,
} from '../../../../../ui/steps/actions/actions'
import { AddStepButton } from '../AddStepButton'
import { DraggableSteps } from '../DraggableSteps'
import { HardwareStep } from '../HardwareStep'
import { PresavedStep } from '../PresavedStep'
import { TerminalItemStep } from '../TerminalItemStep'
import { TimelineToolbox } from '../TimelineToolbox'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('../HardwareStep')
vi.mock('../AddStepButton')
vi.mock('../DraggableSteps')
vi.mock('../PresavedStep')
vi.mock('../TerminalItemStep')
vi.mock('../../../../../step-forms/selectors')
vi.mock('../../../../../file-data/selectors')
vi.mock('../../../../../ui/steps/actions/actions')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: ComponentProps<typeof TimelineToolbox>) => {
  return renderWithProviders(<TimelineToolbox {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TimelineToolbox', () => {
  let props: ComponentProps<typeof TimelineToolbox>

  beforeEach(() => {
    props = {
      sidebarWidth: 350,
      showLiquidOverflowMenu: vi.fn(),
    }
    vi.mocked(getOrderedStepIds).mockReturnValue(['mock1Step'])
    vi.mocked(getUnsavedForm).mockReturnValue(null)
    vi.mocked(TerminalItemStep).mockReturnValue(
      <div>mock TerminalItemStep</div>
    )
    vi.mocked(DraggableSteps).mockReturnValue(<div>mock DraggableSteps</div>)
    vi.mocked(PresavedStep).mockReturnValue(<div>mock PresavedStep</div>)
    vi.mocked(AddStepButton).mockReturnValue(<div>mock AddStepButton</div>)
    vi.mocked(getFileMetadata).mockReturnValue({
      protocolName: 'mock protocolName',
    })
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      additionalEquipmentOnDeck: {
        trash: { name: 'trashBin', id: 'trash', location: 'cutoutA3' },
      },
      labware: {},
      modules: {},
      pipettes: {},
    })
    vi.mocked(HardwareStep).mockReturnValue(<div>mock HardwareStep</div>)
  })

  it('renders hardware step, 2 terminal item steps, a draggable step and presaved step with toolbox title and back button', () => {
    render(props)
    screen.getByText('mock protocolName')
    screen.getByText('mock HardwareStep')
    screen.getByText('Timeline')
    screen.getByText('mock AddStepButton')
    screen.getByText('mock PresavedStep')
    screen.getByText('mock DraggableSteps')
    expect(screen.getAllByText('mock TerminalItemStep')).toHaveLength(2)
    fireEvent.click(screen.getByText('Back to overview'))
    expect(mockNavigate).toHaveBeenCalled()
    expect(vi.mocked(selectTerminalItem)).toHaveBeenCalled()
    expect(vi.mocked(selectDropdownItem)).toHaveBeenCalled()
  })
})
