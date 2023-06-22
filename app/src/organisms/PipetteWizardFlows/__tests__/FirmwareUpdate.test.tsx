import * as React from 'react'
import { waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  useInstrumentsQuery,
  useSubsystemUpdateQuery,
  useUpdateSubsystemMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { FirmwareUpdate } from '../FirmwareUpdate'
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

const render = (props: React.ComponentProps<typeof FirmwareUpdate>) => {
  return renderWithProviders(<FirmwareUpdate {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FirmwareUpdate', () => {
  let props: React.ComponentProps<typeof FirmwareUpdate>
  const refetch = jest.fn(() => Promise.resolve())
  const updateSubsystem = jest.fn(() => Promise.resolve())
  beforeEach(() => {
    props = {
      proceed: jest.fn(),
      mount: 'left',
    } as any
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
          updateStatus: 'done',
        } as any,
      } as SubsystemUpdateProgressData,
      updateSubsystem,
    } as any)
  })
  it('calls proceed if no update is needed', () => {
    mockUseInstrumentQuery.mockReturnValue({
      data: {
        data: [
          {
            subsystem: 'pipette_left',
            ok: true,
          } as PipetteData,
        ],
      },
    } as any)
    mockUseSubsystemUpdateQuery.mockReturnValue({} as any)
    const { getByText } = render(props)
    getByText('A firmware update is required, instrument is updating')
    expect(props.proceed).toHaveBeenCalled()
  })
  it('calls update subsystem if update is needed', () => {
    mockUseSubsystemUpdateQuery.mockReturnValue({} as any)
    const { getByText } = render(props)
    getByText('A firmware update is required, instrument is updating')
    expect(updateSubsystem).toHaveBeenCalled()
  })
  it('calls refetch instruments and then proceed once update is complete', async () => {
    const { getByText } = render(props)
    getByText('A firmware update is required, instrument is updating')
    await waitFor(() => expect(refetch).toHaveBeenCalled())
    await waitFor(() => expect(props.proceed).toHaveBeenCalled())
  })
})
