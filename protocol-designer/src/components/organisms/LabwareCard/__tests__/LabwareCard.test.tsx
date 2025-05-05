import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { openIngredientSelector } from '../../../../labware-ingred/actions'
import { LabwareCard } from '../index'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const mockNavigate = vi.fn()

vi.mock('../../../../labware-ingred/actions')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: ComponentProps<typeof LabwareCard>) => {
  return renderWithProviders(<LabwareCard {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LabwareCard', () => {
  let props: ComponentProps<typeof LabwareCard>

  beforeEach(() => {
    props = {
      labware: {
        id: 'labwareId',
        pythonName: 'mockPythonName',
        stack: ['labwareId', 'A1'],
        labwareDefURI: 'mockuri',
        def: fixture96Plate as LabwareDefinition2,
      },
      lidDisplayName: 'mock lid',
    }
  })

  it('renders a labware card with the liquids button and overflow menu', () => {
    render(props)
    screen.getByText('ANSI 96 Standard Microplate')
    screen.getByText('mock lid')
    fireEvent.click(screen.getByText('Add liquid'))
    expect(mockNavigate).toHaveBeenCalledWith('/liquids')
    expect(vi.mocked(openIngredientSelector)).toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('LabwareCard_overflowBtn'))
  })
})
