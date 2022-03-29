import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { i18n } from '../../../../i18n'
import { useTrackEvent } from '../../../../redux/analytics'
import { ProtocolRunDetails } from '../../../../pages/Devices/ProtocolRunDetails'
import { useHeaterShakerSlotNumber } from '../hooks'
import { ConfirmAttachmentModal } from '../ConfirmAttachmentModal'

import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'

jest.mock('../hooks')
jest.mock('../../../../redux/analytics')
jest.mock('../../../../pages/Devices/ProtocolRunDetails')
jest.mock('@opentrons/react-api-client')

const mockUseHeaterShakerSlotNumber = useHeaterShakerSlotNumber as jest.MockedFunction<
  typeof useHeaterShakerSlotNumber
>
const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockProtocolRunDetails = ProtocolRunDetails as jest.MockedFunction<
  typeof ProtocolRunDetails
>

const render = (props: React.ComponentProps<typeof ConfirmAttachmentModal>) => {
  return renderWithProviders(<ConfirmAttachmentModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}
let mockTrackEvent: jest.Mock

describe('ConfirmAttachmentBanner', () => {
  let props: React.ComponentProps<typeof ConfirmAttachmentModal>
  let mockCreateLiveCommand = jest.fn()

  beforeEach(() => {
    props = {
      onCloseClick: jest.fn(),
      isProceedToRunModal: false,
      shakerValue: '300',
    }
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockProtocolRunDetails.mockReturnValue(
      <div>mock protocol run details page</div>
    )
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    mockUseHeaterShakerSlotNumber.mockReturnValue('1')

    mockTrackEvent = jest.fn()
    when(mockUseTrackEvent).calledWith().mockReturnValue(mockTrackEvent)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the correct modal info when accessed through set shake slideout', () => {
    const { getByText } = render(props)
    getByText('Confirm Heater Shaker Module attachment to deck')
    getByText(
      'Module should have both anchors fully extended for a firm attachment to the deck.'
    )
    getByText('The thermal adapter should be attached to the module.')
    getByText('Don’t show me again')
    getByText('cancel')
    getByText('Confirm attachment')
  })

  it('renders the correct modal info when accessed through set shake slideout and clicks proceed button and sends shake command and closes modal', () => {
    props = {
      onCloseClick: jest.fn(),
      isProceedToRunModal: false,
      shakerValue: '300',
      onCloseSlideoutClick: jest.fn(),
      moduleId: mockHeaterShaker.id,
    }
    const { getByText, getByRole } = render(props)
    getByText(
      'Module should have both anchors fully extended for a firm attachment to the deck.'
    )
    const btn = getByRole('button', { name: 'Confirm attachment' })
    fireEvent.click(btn)
    expect(props.onCloseSlideoutClick).toHaveBeenCalled()
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShakerModule/setTargetShakeSpeed',
        params: {
          moduleId: mockHeaterShaker.id,
          rpm: 300,
        },
      },
    })
  })

  it('renders the correct modal info when accessed through proceed to run CTA and clicks proceed to run button ', () => {
    props = {
      onCloseClick: jest.fn(),
      isProceedToRunModal: true,
      shakerValue: null,
    }
    const { getByText, getByRole } = render(props)

    getByText(
      'Before the run begins, module should have both anchors fully extended for a firm attachment to Slot 1.'
    )
    getByText('The thermal adapter should be attached to the module.')
    const btn = getByRole('button', { name: 'Proceed to run' })
    fireEvent.click(btn)
    getByText('mock protocol run details page')
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'proceedToRun',
      properties: {},
    })
  })

  it('renders cancel button and clicks it closing the modal', () => {
    const { getByRole } = render(props)
    const btn = getByRole('button', { name: 'cancel' })
    fireEvent.click(btn)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
