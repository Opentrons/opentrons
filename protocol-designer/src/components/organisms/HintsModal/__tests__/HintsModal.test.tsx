import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HintsModal } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { removeHint } from '../../../../tutorial/actions'
import { getHint } from '../../../../tutorial/selectors'

vi.mock('../../../../tutorial/actions')
vi.mock('../../../../tutorial/selectors')
const render = () => {
  return renderWithProviders(<HintsModal />, {
    i18nInstance: i18n,
  })[0]
}

describe('HintsModal', () => {
  beforeEach(() => {
    vi.mocked(getHint).mockReturnValue('waste_chute_warning')
  })
  it('renders the text for waste chute warning and clicking button calls action', () => {
    render()
    screen.getByText('Disposing labware')
    screen.getByText(
      'Moving labware to the Waste Chute permanently discards it. You can’t use this labware in later steps. During a protocol run, the labware will be dropped in the chute and become irretrievable.'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(vi.mocked(removeHint)).toHaveBeenCalled()
  })
  it('renders the text for tc lid passive cooling and clicking button calls action', () => {
    vi.mocked(getHint).mockReturnValue('thermocycler_lid_passive_cooling')
    render()
    screen.getByText('Lid temperature')
    screen.getByText('The Thermocycler lid does not actively cool.')
    screen.getByText(
      'When closed, the lid may take a very long time to reach a lower temperature.'
    )
    screen.getByText(
      'The lid might not ever reach a temperature below ambient.'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(vi.mocked(removeHint)).toHaveBeenCalled()
  })
})
