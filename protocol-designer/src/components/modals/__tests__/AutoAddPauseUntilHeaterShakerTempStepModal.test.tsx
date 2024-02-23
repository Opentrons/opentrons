import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
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
      handleCancelClick: jest.fn(),
      handleContinueClick: jest.fn(),
    }
  })

  it('should render the correct text with 10 C temp and buttons are clickable', () => {
    const { getByText, getByRole } = render(props)
    getByText('Pause protocol until Heater-Shaker module is at 10°C?')
    getByText(
      'Pause protocol now to wait until module reaches 10°C before continuing on to the next step.'
    )
    getByText(
      'Build a pause later if you want your protocol to proceed to the next steps while the Heater-Shaker module goes to 10°C'
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
