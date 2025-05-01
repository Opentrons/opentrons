import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { LabwareCard } from '../index'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const mockNavigate = vi.fn()

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
        slot: 'A1',
        labwareDefURI: 'mockuri',
        def: fixture96Plate as LabwareDefinition2,
      },
    }
  })

  it('renders a labware card with the liquids button and overflow menu', () => {
    render(props)
    screen.getByText('ANSI 96 Standard Microplate')
    fireEvent.click(screen.getByText('Add liquid'))
    expect(mockNavigate).toHaveBeenCalledWith('/liquids')
    fireEvent.click(screen.getByTestId('LabwareCard_overflowBtn'))
  })
})
