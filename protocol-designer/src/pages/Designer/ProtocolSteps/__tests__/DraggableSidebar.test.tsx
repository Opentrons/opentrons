import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { getFileMetadata } from '../../../../file-data/selectors'
import { getInitialDeckSetup } from '../../../../step-forms/selectors'
import { DraggableSidebar } from '../DraggableSidebar'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../ui/steps/selectors')
vi.mock('../../../../feature-flags/selectors')
vi.mock('../Timeline/DraggableSteps')
vi.mock('../Timeline/PresavedStep')
vi.mock('../Timeline/AddStepButton')
vi.mock('../../../../file-data/selectors')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
const mockSetTargetWidth = vi.fn()

const render = (props: ComponentProps<typeof DraggableSidebar>) => {
  return renderWithProviders(<DraggableSidebar {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DraggableSidebar', () => {
  let props: ComponentProps<typeof DraggableSidebar>
  beforeEach(() => {
    props = {
      setTargetWidth: mockSetTargetWidth,
      showLiquidOverflowMenu: vi.fn(),
    }
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
  })

  it('renders initial timeline toolbox', () => {
    render(props)
    screen.getByText('mock protocolName')
    screen.getByText('Back to overview')
    screen.getByText('Starting deck')
    screen.getByText('Ending deck')
  })

  // ToDo (kk: 2024/12/12): Add more tests
})
