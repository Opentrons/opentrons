import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { useCurrentProtocolRun } from '../hooks/useCurrentProtocolRun'
import { ConfirmExitProtocolUploadModal } from '../ConfirmExitProtocolUploadModal'

jest.mock('../hooks/useCurrentProtocolRun')
const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
>

const render = (
  props: React.ComponentProps<typeof ConfirmExitProtocolUploadModal>
) => {
  return renderWithProviders(<ConfirmExitProtocolUploadModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfirmExitProtocolUploadModal', () => {
  let props: React.ComponentProps<typeof ConfirmExitProtocolUploadModal>
  beforeEach(() => {
    props = { back: jest.fn(), exit: jest.fn() }

    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: {},
        runRecord: {},
      } as any)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render the correct title', () => {
    const { getByText } = render(props)
    getByText('Confirm Close Protocol')
  })
  it('should render the correct body', () => {
    const { getByText } = render(props)
    getByText('Are you sure you want to close this protocol?')
  })
  it('should render both buttons', () => {
    const { getByRole } = render(props)
    expect(props.back).not.toHaveBeenCalled()
    expect(props.exit).not.toHaveBeenCalled()
    getByRole('button', { name: 'Yes, close now' })
    getByRole('button', { name: 'No, go back' })
  })
  it('should call Yes close now button and render closing button when protocol and run records exist', () => {
    const { getByRole, getByText } = render(props)
    expect(props.exit).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'Yes, close now' })
    fireEvent.click(closeButton)
    expect(props.exit).toHaveBeenCalled()
    expect(props.back).not.toHaveBeenCalled()
    const closingButton = getByText('Closing...')
    expect(closingButton).toBeTruthy()
  })
  it('should call Yes close now button and call back when protocol and run records do not exist', () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: null,
        runRecord: null,
      } as any)

    const { getByRole } = render(props)
    expect(props.exit).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'Yes, close now' })
    fireEvent.click(closeButton)
    expect(props.exit).toHaveBeenCalled()
    expect(props.back).toHaveBeenCalled()
  })
  it('should call No go back button', () => {
    const { getByRole } = render(props)
    expect(props.back).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'No, go back' })
    fireEvent.click(closeButton)
    expect(props.back).toHaveBeenCalled()
  })
})
