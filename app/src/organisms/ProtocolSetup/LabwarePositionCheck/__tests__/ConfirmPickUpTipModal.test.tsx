import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { render } from '@testing-library/react'
import { AlertModal, partialComponentPropsMatcher } from '@opentrons/components'
import { ConfirmPickUpTipModal } from '../ConfirmPickUpTipModal'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    AlertModal: jest.fn(() => <div></div>),
  }
})

const mockAlertModal = AlertModal as jest.MockedFunction<typeof AlertModal>

describe('ConfirmPickUpTipModal', () => {
  let title: string
  let denyText: string
  let confirmText: string
  let onDeny: () => void
  let onConfirm: () => void
  beforeEach(() => {
    title = 'mock title'
    denyText = 'mock deny text'
    confirmText = 'mock confirm text'
    onDeny = jest.fn()
    onConfirm = jest.fn()
    when(mockAlertModal)
      .calledWith(
        partialComponentPropsMatcher({
          heading: title,
          buttons: [
            { children: denyText, onClick: onDeny },
            { children: confirmText, onClick: onConfirm },
          ],
        })
      )
      .mockReturnValue(<div>mock alert item</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('should render an alert modal with the correct props', () => {
    const { getByText } = render(
      <ConfirmPickUpTipModal
        title={title}
        denyText={denyText}
        confirmText={confirmText}
        onDeny={onDeny}
        onConfirm={onConfirm}
      />
    )
    getByText('mock alert item')
  })
})
