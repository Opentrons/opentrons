import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { FirmwareUpdateTakeover } from '../FirmwareUpdateTakeover'
import { UpdateNeededModal } from '../UpdateNeededModal'
import { BadPipette, PipetteData } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../UpdateNeededModal')

const mockUseInstrumentQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

const mockUpdateNeededModal = UpdateNeededModal as jest.MockedFunction<
  typeof UpdateNeededModal
>

const render = () => {
  return renderWithProviders(<FirmwareUpdateTakeover />, {
    i18nInstance: i18n,
  })[0]
}

describe('FirmwareUpdateTakeover', () => {
  beforeEach(() => {
    mockUseInstrumentQuery.mockReturnValue({
      data: {
        data: [
          {
            subsystem: 'pipette_left',
            ok: false,
          } as BadPipette,
        ],
      },
    } as any)
    mockUpdateNeededModal.mockReturnValue(<>Mock Update Needed Modal</>)
  })
  it('renders update needed modal when an instrument is not ok', () => {
    const { getByText } = render()
    getByText('Mock Update Needed Modal')
  })
  it('does not render modal when no update is needed', () => {
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
    const { queryByText } = render()
    expect(queryByText('Mock Update In Progress Modal')).not.toBeInTheDocument()
  })
})
