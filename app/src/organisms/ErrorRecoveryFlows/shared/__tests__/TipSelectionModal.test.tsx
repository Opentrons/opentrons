import * as React from 'react'
import { describe, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { TipSelectionModal } from '../TipSelectionModal'
import { TipSelection } from '../TipSelection'

vi.mock('../TipSelection')

const render = (props: React.ComponentProps<typeof TipSelectionModal>) => {
  return renderWithProviders(<TipSelectionModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TipSelectionModal', () => {
  let props: React.ComponentProps<typeof TipSelectionModal>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      allowTipSelection: true,
      toggleModal: vi.fn(),
    }

    vi.mocked(TipSelection).mockReturnValue(<div>MOCK TIP SELECTION</div>)
  })

  it('renders the appropriate modal with the correct header title', () => {
    render(props)

    screen.getByText('Change tip pick-up location')
  })

  it('renders TipSelection', () => {
    render(props)

    screen.getByText('MOCK TIP SELECTION')
  })
})
