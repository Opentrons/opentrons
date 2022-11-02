import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { FLOWS } from '../constants'
import { ExitModal } from '../ExitModal'

const render = (props: React.ComponentProps<typeof ExitModal>) => {
  return renderWithProviders(<ExitModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ExitModal', () => {
  let props: React.ComponentProps<typeof ExitModal>

  beforeEach(() => {
    props = {
      goBack: jest.fn(),
      proceed: jest.fn(),
      flowType: FLOWS.CALIBRATE,
    }
  })
  it('returns the correct information for exit modal for calibration flow ', () => {
    const { getByText, getByRole } = render(props)
    getByText('Pipette Calibration progress will be lost')
    getByText(
      'Are you sure you want to exit before completing Pipette Calibration?'
    )
    const back = getByRole('button', { name: 'Go back' })
    const exit = getByRole('button', { name: 'exit' })
    fireEvent.click(back)
    expect(props.goBack).toHaveBeenCalled()
    fireEvent.click(exit)
    expect(props.proceed).toHaveBeenCalled()
  })

  it('returns the correct information for exit modal for attach flow ', () => {
    props = {
      ...props,
      flowType: FLOWS.ATTACH,
    }
    const { getByText, getByRole } = render(props)
    getByText('Attaching Pipette progress will be lost')
    getByText(
      'Are you sure you want to exit before completing Attaching Pipette?'
    )
    const back = getByRole('button', { name: 'Go back' })
    const exit = getByRole('button', { name: 'exit' })
    fireEvent.click(back)
    expect(props.goBack).toHaveBeenCalled()
    fireEvent.click(exit)
    expect(props.proceed).toHaveBeenCalled()
  })

  it('returns the correct information for exit modal for detach flow ', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
    }
    const { getByText, getByRole } = render(props)
    getByText('Detaching Pipette progress will be lost')
    getByText(
      'Are you sure you want to exit before completing Detaching Pipette?'
    )
    const back = getByRole('button', { name: 'Go back' })
    const exit = getByRole('button', { name: 'exit' })
    fireEvent.click(back)
    expect(props.goBack).toHaveBeenCalled()
    fireEvent.click(exit)
    expect(props.proceed).toHaveBeenCalled()
  })
})
