import * as React from 'react'
import { fireEvent } from '@testing-library/dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import {
  UseCurrentProtocolRun,
  useCurrentProtocolRun,
} from '../../ProtocolUpload/hooks'
import { LabwareOffsetSuccessToast } from '../LabwareOffsetSuccessToast'
import { getLatestLabwareOffsetCount } from '../LabwarePositionCheck/utils/getLatestLabwareOffsetCount'
import type { LabwareOffset } from '@opentrons/api-client'

jest.mock('../../ProtocolUpload/hooks')
jest.mock('../LabwarePositionCheck/utils/getLatestLabwareOffsetCount')

const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
>
const mockGetLatestLabwareOffsetCount = getLatestLabwareOffsetCount as jest.MockedFunction<
  typeof getLatestLabwareOffsetCount
>

const render = (
  props: React.ComponentProps<typeof LabwareOffsetSuccessToast>
) => {
  return renderWithProviders(<LabwareOffsetSuccessToast {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwareOffsetSuccessToast', () => {
  let props: React.ComponentProps<typeof LabwareOffsetSuccessToast>
  let mockOffsets: LabwareOffset[]

  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
    mockOffsets = [
      {
        id: 'someId',
        createdAt: 'someTimestamp',
        definitionUri: 'some_def_uri',
        location: { slotName: '4' },
        vector: { x: 1, y: 1, z: 1 },
      },
    ]
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: { labwareOffsets: mockOffsets } },
      } as UseCurrentProtocolRun)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders an alert item with no offsets created', () => {
    when(mockGetLatestLabwareOffsetCount)
      .calledWith(mockOffsets)
      .mockReturnValue(0)

    const { getByText, getByRole } = render(props)
    expect(
      getByText('Labware Position Check complete. No Labware Offsets created.')
    ).toHaveStyle('backgroundColor: c-bg-success')
    const closeIcon = getByRole('button')
    fireEvent.click(closeIcon)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('renders an alert item with one offset created', () => {
    when(mockGetLatestLabwareOffsetCount)
      .calledWith(mockOffsets)
      .mockReturnValue(1)
    const { getByText, getByRole } = render(props)
    expect(
      getByText('Labware Position Check complete. 1 Labware Offset created.')
    ).toHaveStyle('backgroundColor: c-success')
    const closeIcon = getByRole('button')
    fireEvent.click(closeIcon)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('renders an alert item with many offsets created', () => {
    when(mockGetLatestLabwareOffsetCount)
      .calledWith(mockOffsets)
      .mockReturnValue(5)
    const { getByText, getByRole } = render(props)
    expect(
      getByText('Labware Position Check complete. 5 Labware Offsets created.')
    ).toHaveStyle('backgroundColor: c-success')
    const closeIcon = getByRole('button')
    fireEvent.click(closeIcon)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
