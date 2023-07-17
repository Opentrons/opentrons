import * as React from 'react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import {
  useInstrumentsQuery,
  useSubsystemUpdateQuery,
  useUpdateSubsystemMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { UpdateNeededModal } from '../UpdateNeededModal'
import { UpdateInProgressModal } from '../UpdateInProgressModal'
import { UpdateResultsModal } from '../UpdateResultsModal'
import type {
  BadPipette,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../UpdateInProgressModal')
jest.mock('../UpdateResultsModal')

const mockUseInstrumentQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseSubsystemUpdateQuery = useSubsystemUpdateQuery as jest.MockedFunction<
  typeof useSubsystemUpdateQuery
>
const mockUseUpdateSubsystemMutation = useUpdateSubsystemMutation as jest.MockedFunction<
  typeof useUpdateSubsystemMutation
>
const mockUpdateInProgressModal = UpdateInProgressModal as jest.MockedFunction<
  typeof UpdateInProgressModal
>
const mockUpdateResultsModal = UpdateResultsModal as jest.MockedFunction<
  typeof UpdateResultsModal
>

const render = (props: React.ComponentProps<typeof UpdateNeededModal>) => {
  return renderWithProviders(<UpdateNeededModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UpdateNeededModal', () => {
  let props: React.ComponentProps<typeof UpdateNeededModal>
  const refetch = jest.fn(() => Promise.resolve())
  const updateSubsystem = jest.fn(() => Promise.resolve())
  beforeEach(() => {
    props = {
      setShowUpdateModal: jest.fn(),
      subsystem: 'pipette_left',
    }
    mockUseInstrumentQuery.mockReturnValue({
      data: {
        data: [
          {
            subsystem: 'pipette_left',
            ok: false,
          } as BadPipette,
        ],
      },
      refetch,
    } as any)
    mockUseSubsystemUpdateQuery.mockReturnValue({
      data: {
        data: {
          id: 'update id',
          updateStatus: 'updating',
        } as any,
      } as SubsystemUpdateProgressData,
    } as any)
    mockUseUpdateSubsystemMutation.mockReturnValue({
      data: {
        data: {
          id: 'update id',
          updateStatus: 'updating',
          updateProgress: 20,
        } as any,
      } as SubsystemUpdateProgressData,
      updateSubsystem,
    } as any)
    mockUpdateInProgressModal.mockReturnValue(
      <>Mock Update In Progress Modal</>
    )
    mockUpdateResultsModal.mockReturnValue(<>Mock Update Results Modal</>)
  })
  it('renders update needed info and calles update firmware when button pressed', () => {
    mockUseSubsystemUpdateQuery.mockReturnValue({} as any)
    const { getByText } = render(props)
    getByText('Instrument firmware update needed')
    getByText(
      nestedTextMatcher(
        'The firmware for Left Pipette is out of date. You need to update it before running protocols that use this instrument'
      )
    )
    getByText('Update firmware').click()
    expect(mockUseUpdateSubsystemMutation).toHaveBeenCalled()
  })
  it('renders the update in progress modal when update is pending', () => {
    const { getByText } = render(props)
    getByText('Mock Update In Progress Modal')
  })
  it('renders the update results modal when update is done', () => {
    mockUseSubsystemUpdateQuery.mockReturnValue({
      data: {
        data: {
          id: 'update id',
          updateStatus: 'done',
        } as any,
      } as SubsystemUpdateProgressData,
    } as any)
    mockUseUpdateSubsystemMutation.mockReturnValue({
      data: {
        data: {
          id: 'update id',
          updateStatus: 'done',
          updateProgress: 100,
        } as any,
      } as SubsystemUpdateProgressData,
      updateSubsystem,
    } as any)
    const { getByText } = render(props)
    getByText('Mock Update Results Modal')
  })
})
