import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useHeaterShakerSlotNumber } from '../useHeaterShakerSlotNumber'
import { ConfirmAttachmentModal } from '../ConfirmAttachmentModal'
import { when } from 'jest-when'

jest.mock('../useHeaterShakerSlotNumber')

const mockUseHeaterShakerSlotNumber = useHeaterShakerSlotNumber as jest.MockedFunction<
  typeof useHeaterShakerSlotNumber
>

const render = (props: React.ComponentProps<typeof ConfirmAttachmentModal>) => {
  return renderWithProviders(<ConfirmAttachmentModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const SLOT_NUMBER = '1' as any
const SLOT_UNEDFINED = undefined as any

describe('ConfirmAttachmentBanner', () => {
  let props: React.ComponentProps<typeof ConfirmAttachmentModal>

  beforeEach(() => {
    props = {
      onCloseClick: jest.fn(),
    }
    when(mockUseHeaterShakerSlotNumber).calledWith().mockReturnValue(SLOT_UNEDFINED)
  })

  it('renders the correct modal info when slot number is unknown ', () => {
    const { getByText } = render(props)
    getByText('Confirm Heater Shaker Module attachment to deck')
    getByText(
      'Module should have both anchors fully extended for a firm attachment to the deck.'
    )
    getByText('The thermal adapter should be attached to the module.')
    getByText('Don’t show me again')
    getByText('cancel')
    getByText('Proceed to run')
  })

  it('renders the correct modal info when slot number is known ', () => {
    mockUseHeaterShakerSlotNumber.mockReturnValue(SLOT_NUMBER)

    const { getByText } = render(props)

    getByText(
      'Before the run begins, module should have both anchors fully extended for a firm attachment to Slot 1.'
    )
    getByText('The thermal adapter should be attached to the module.')
  })
})
