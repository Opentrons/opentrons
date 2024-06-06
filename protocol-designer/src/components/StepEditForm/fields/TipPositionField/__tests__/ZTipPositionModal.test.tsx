import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../localization'
import { ZTipPositionModal } from '../ZTipPositionModal'
import { TipPositionZAxisViz } from '../TipPositionZAxisViz'

vi.mock('../TipPositionZAxisViz')
const render = (props: React.ComponentProps<typeof ZTipPositionModal>) => {
  return renderWithProviders(<ZTipPositionModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ZTipPositionModal', () => {
  let props: React.ComponentProps<typeof ZTipPositionModal>

  beforeEach(() => {
    props = {
      closeModal: vi.fn(),
      zValue: -2,
      updateValue: vi.fn(),
      wellDepthMm: 30,
      name: 'blowout_z_offset',
    }
    vi.mocked(TipPositionZAxisViz).mockReturnValue(
      <div>mock TipPositionZAxisViz</div>
    )
  })
  it('renders the text and radio buttons', () => {
    render(props)
    screen.getByText('Tip Positioning')
    screen.getByText('Change from where in the well the robot emits blowout')
    screen.getByRole('radio', { name: '0 mm from the top center (default)' })
    screen.getByRole('radio', { name: 'Custom' })
    fireEvent.click(screen.getByText('cancel'))
    expect(props.closeModal).toHaveBeenCalled()
    fireEvent.click(screen.getByText('done'))
    expect(props.closeModal).toHaveBeenCalled()
    expect(props.updateValue).toHaveBeenCalled()
  })
  it('renders the custom option, caption, and visual', () => {
    render(props)
    fireEvent.click(screen.getByRole('radio', { name: 'Custom' }))
    expect(screen.getAllByRole('textbox', { name: '' })).toHaveLength(1)
    screen.getByText('between -30 and 0')
    screen.getByText('mock TipPositionZAxisViz')
  })
})
