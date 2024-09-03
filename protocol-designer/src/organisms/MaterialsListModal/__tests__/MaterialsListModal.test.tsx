import * as React from 'react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { MaterialsListModal } from '..'

import type { InfoScreen } from '@opentrons/components'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof InfoScreen>()
  return {
    ...actual,
    InfoScreen: () => <div>mock InfoScreen</div>,
  }
})

const mockSetShowMaterialsListModal = vi.fn()

const render = (props: React.ComponentProps<typeof MaterialsListModal>) => {
  return renderWithProviders(<MaterialsListModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('MaterialsListModal', () => {
  let props: React.ComponentProps<typeof MaterialsListModal>

  beforeEach(() => {
    props = {
      hardware: [],
      labware: [],
      liquids: [],
      setShowMaterialsListModal: mockSetShowMaterialsListModal,
    }
  })

  it('should render render text', () => {
    render(props)
    screen.getByText('Materials list')
    screen.getByText('Deck hardware')
    screen.getByText('Labware')
    screen.getByText('Liquids')
  })

  it('should render InfoScreen component', () => {
    render(props)
    expect(screen.getAllByText('mock InfoScreen').length).toBe(3)
  })

  it('should render hardware info', () => {})
  it('should render labware info', () => {})
  it('should render liquids info', () => {})
})
