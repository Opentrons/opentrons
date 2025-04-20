import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { getHint } from '../../../../tutorial/selectors'
import { removeHint } from '../../../../tutorial/actions'
import { HintsModal } from '..'

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
    screen.getByText(
      'If the room temperature in your lab is higher than the temperature you have defined, the lid will never reach it. This will stall your protocol indefinitely.'
    )
    screen.getByText(
      'If the room temperature in your lab is higher than the temperature you have defined, the lid will never reach it. This will stall your protocol indefinitely.'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(vi.mocked(removeHint)).toHaveBeenCalled()
  })
})
