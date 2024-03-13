import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, cleanup } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../localization'
import { AutoAddPauseUntilHeaterShakerTempStepModal } from '../AutoAddPauseUntilHeaterShakerTempStepModal'

const render = (
  props: React.ComponentProps<typeof AutoAddPauseUntilHeaterShakerTempStepModal>
) => {
  return renderWithProviders(
    <AutoAddPauseUntilHeaterShakerTempStepModal {...props} />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('AutoAddPauseUntilHeaterShakerTempStepModal ', () => {
  let props: React.ComponentProps<
    typeof AutoAddPauseUntilHeaterShakerTempStepModal
  >
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
    screen.getByText('Pause protocol until Heater-Shaker module is at 10°C?')
    screen.getByText(
      'Pause protocol now to wait until module reaches 10°C before continuing on to the next step.'
    )
    screen.getByText(
      'Build a pause later if you want your protocol to proceed to the next steps while the Heater-Shaker module goes to 10°C'
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
