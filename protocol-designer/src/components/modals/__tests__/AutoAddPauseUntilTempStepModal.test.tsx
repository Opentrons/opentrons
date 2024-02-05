import * as React from 'react'
import { fireEvent } from '@testing-library/react'
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
      handleCancelClick: jest.fn(),
      handleContinueClick: jest.fn(),
    }
  })

  it('should render the correct text with 10 C temp and buttons are clickable', () => {
    const { getByText, getByRole } = render(props)
    getByText('Pause protocol until temperature module is at 10°C?')
    getByText(
      'Pause protocol now to wait until module reaches 10°C before continuing on to the next step.'
    )
    getByText(
      'Build a pause later if you want your protocol to proceed to the next steps while the temperature module ramps up to 10°C.'
    )
    const cancelBtn = getByRole('button', {
      name: 'I will build a pause later',
    })
    const contBtn = getByRole('button', { name: 'Pause protocol now' })
    fireEvent.click(cancelBtn)
    expect(props.handleCancelClick).toHaveBeenCalled()
    fireEvent.click(contBtn)
    expect(props.handleContinueClick).toHaveBeenCalled()
  })
})
