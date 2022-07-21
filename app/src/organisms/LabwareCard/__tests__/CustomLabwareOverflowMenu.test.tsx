import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { useTrackEvent } from '../../../redux/analytics'
import {
  renderWithProviders,
  useConditionalConfirm,
} from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CustomLabwareOverflowMenu } from '../CustomLabwareOverflowMenu'

jest.mock('../../../redux/analytics')
jest.mock('@opentrons/components/src/hooks')

const render = (
  props: React.ComponentProps<typeof CustomLabwareOverflowMenu>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<CustomLabwareOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

const mockUseConditionalConfirm = useConditionalConfirm as jest.MockedFunction<
  typeof useConditionalConfirm
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

const mockConfirm = jest.fn()
const mockCancel = jest.fn()
let mockTrackEvent: jest.Mock

describe('CustomLabwareOverflowMenu', () => {
  let props: React.ComponentProps<typeof CustomLabwareOverflowMenu>

  beforeEach(() => {
    props = {
      filename: 'name',
      onDelete: jest.fn(),
    }
    mockUseConditionalConfirm.mockReturnValue({
      confirm: mockConfirm,
      showConfirmation: true,
      cancel: mockCancel,
    })
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render correct button texts and they are clickable', () => {
    const [{ getByText, getByRole, getByLabelText }] = render(props)
    const button = getByLabelText('CustomLabwareOverflowMenu_button')
    fireEvent.click(button)
    getByRole('button', { name: 'Show in folder' })
    getByRole('button', { name: 'Open Labware Creator' })
    const deleteBtn = getByRole('button', { name: 'Delete' })
    fireEvent.click(deleteBtn)
    getByText('Delete this labware definition?')
    getByText(
      'This labware definition will be moved to this computer’s trash and may be unrecoverable.'
    )
    getByText(
      'Robots cannot run Python protocols with missing labware definitions.'
    )
    const cancelBtn = getByText('cancel')
    fireEvent.click(cancelBtn)
    expect(mockCancel).toHaveBeenCalled()
    const deleteConfirm = getByText('Yes, delete definition')
    fireEvent.click(deleteConfirm)
    expect(mockConfirm).toHaveBeenCalled()
  })
})
