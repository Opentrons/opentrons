import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { RobotIsBusyModal } from '../RobotIsBusyModal'

const render = (props: React.ComponentProps<typeof RobotIsBusyModal>) => {
  return renderWithProviders(<RobotIsBusyModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RobotIsBusyModal', () => {
  let props: React.ComponentProps<typeof RobotIsBusyModal>
  beforeEach(() => {
    props = {
      closeModal: jest.fn(),
      proceed: jest.fn(),
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description, and buttons', () => {
    const { getByText, getByRole } = render(props)

    getByText('Robot is busy')
    getByText(
      'This robot has to restart to update its software. Restarting will immediately stop the current run or calibration.'
    )
    getByText('Do you want to update now anyway?')
    getByRole('button', { name: 'cancel' })
    getByRole('button', { name: 'Yes, update now' })
  })

  it('should render buttons and they should be clickable', () => {
    const { getByRole } = render(props)
    const cancelBtn = getByRole('button', { name: 'cancel' })
    const proceedBtn = getByRole('button', { name: 'Yes, update now' })
    fireEvent.click(cancelBtn)
    expect(props.closeModal).toHaveBeenCalled()
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
  })
})
