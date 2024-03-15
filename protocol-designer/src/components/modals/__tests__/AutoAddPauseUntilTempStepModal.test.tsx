import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../localization'
import { AutoAddPauseUntilTempStepModal } from '../AutoAddPauseUntilTempStepModal'

const render = (
  props: React.ComponentProps<typeof AutoAddPauseUntilTempStepModal>
) => {
  return renderWithProviders(<AutoAddPauseUntilTempStepModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AutoAddPauseUntilTempStepModal ', () => {
  let props: React.ComponentProps<typeof AutoAddPauseUntilTempStepModal>
  beforeEach(() => {
    props = {
      displayTemperature: '10',
      handleCancelClick: vi.fn(),
      handleContinueClick: vi.fn(),
    }
  })
  afterEach(() => {
    cleanup()
  })
  it('should render the correct text with 10 C temp and buttons are clickable', () => {
    render(props)
    screen.getByText('Pause protocol until temperature module is at 10°C?')
    screen.getByText(
      'Pause protocol now to wait until module reaches 10°C before continuing on to the next step.'
    )
    screen.getByText(
      'Build a pause later if you want your protocol to proceed to the next steps while the temperature module ramps up to 10°C.'
    )
    const cancelBtn = screen.getByRole('button', {
      name: 'I will build a pause later',
    })
    const contBtn = screen.getByRole('button', { name: 'Pause protocol now' })
    fireEvent.click(cancelBtn)
    expect(props.handleCancelClick).toHaveBeenCalled()
    fireEvent.click(contBtn)
    expect(props.handleContinueClick).toHaveBeenCalled()
  })
})
