import * as React from 'react'
import { act, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  useInstrumentsQuery,
  useSubsystemUpdateQuery,
  useUpdateSubsystemMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { FirmwareUpdateModal } from '..'
import {
  BadPipette,
  PipetteData,
  SubsystemUpdateProgressData,
} from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')

const mockUseInstrumentQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseSubsystemUpdateQuery = useSubsystemUpdateQuery as jest.MockedFunction<
  typeof useSubsystemUpdateQuery
>
const mockUseUpdateSubsystemMutation = useUpdateSubsystemMutation as jest.MockedFunction<
  typeof useUpdateSubsystemMutation
>

const render = (props: React.ComponentProps<typeof FirmwareUpdateModal>) => {
  return renderWithProviders(<FirmwareUpdateModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FirmwareUpdateModal', () => {
  let props: React.ComponentProps<typeof FirmwareUpdateModal>
  const refetch = jest.fn(() => Promise.resolve())
  const updateSubsystem = jest.fn(() => Promise.resolve())
  beforeEach(() => {
    props = {
      proceed: jest.fn(),
      description: 'A firmware update is required, instrument is updating',
      subsystem: 'pipette_left',
      proceedDescription: 'Firmware is up to date.',
      isOnDevice: true,
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
          updateStatus: 'done',
        } as any,
      } as SubsystemUpdateProgressData,
    } as any)
    mockUseUpdateSubsystemMutation.mockReturnValue({
      data: {
        data: {
          id: 'update id',
          updateStatus: 'in progress',
          updateProgress: 20,
        } as any,
      } as SubsystemUpdateProgressData,
      updateSubsystem,
    } as any)
  })
  it('initially renders a spinner and text', () => {
    mockUseInstrumentQuery.mockReturnValue({
      data: {
        data: [
          {
            subsystem: 'pipette_left',
            ok: true,
          } as PipetteData,
        ],
      },
      refetch,
    } as any)
    mockUseSubsystemUpdateQuery.mockReturnValue({
      data: {
        data: {
          id: 'update id',
          updateStatus: null,
        } as any,
      } as SubsystemUpdateProgressData,
    } as any)
    const { getByText, getByLabelText } = render(props)
    getByLabelText('spinner')
    getByText('Checking for updates...')
  })
  it('calls proceed if no update is needed', async () => {
    mockUseInstrumentQuery.mockReturnValue({
      data: {
        data: [
          {
            subsystem: 'pipette_left',
            ok: true,
          } as PipetteData,
        ],
      },
      refetch,
    } as any)
    mockUseSubsystemUpdateQuery.mockReturnValue({
      data: {
        data: {
          id: 'update id',
          updateStatus: null,
        } as any,
      } as SubsystemUpdateProgressData,
    } as any)
    jest.useFakeTimers()
    render(props)
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    screen.getByText('Firmware is up to date.')
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    await waitFor(() => expect(props.proceed).toHaveBeenCalled())
  })
  it('does not render text or a progress bar until instrument update status is known', () => {
    mockUseSubsystemUpdateQuery.mockReturnValue({
      data: {
        data: {
          id: 'update id',
          updateStatus: undefined,
        } as any,
      } as SubsystemUpdateProgressData,
    } as any)
    mockUseInstrumentQuery.mockReturnValue({
      data: undefined,
      refetch,
    } as any)
    render(props)
    expect(
      screen.queryByText(
        'A firmware update is required, instrument is updating'
      )
    ).not.toBeInTheDocument()
  })
  it('calls update subsystem if update is needed', () => {
    mockUseSubsystemUpdateQuery.mockReturnValue({
      data: {
        data: {
          id: 'update id',
          updateStatus: 'in progress',
        } as any,
      } as SubsystemUpdateProgressData,
    } as any)
    jest.useFakeTimers()
    render(props)
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    screen.getByText('A firmware update is required, instrument is updating')
    expect(updateSubsystem).toHaveBeenCalled()
  })
  it('calls refetch instruments and then proceed once update is complete', async () => {
    jest.useFakeTimers()
    render(props)
    screen.getByText('A firmware update is required, instrument is updating')
    await waitFor(() => expect(refetch).toHaveBeenCalled())
    act(() => {
      jest.advanceTimersByTime(10000)
    })
    await waitFor(() => expect(props.proceed).toHaveBeenCalled())
  })
})
