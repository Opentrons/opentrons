import * as React from 'react'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/6/transferSettings.json'
import { i18n } from '../../../../../i18n'
import { SecureLabwareModal } from '../../../../ProtocolSetup/RunSetupCard/LabwareSetup/SecureLabwareModal'
import { RUN_ID_1 } from '../../../../RunTimeControl/__fixtures__'
import { useProtocolDetailsForRun } from '../../../hooks'
import { getAllLabwareAndTiprackIdsInOrder } from '../utils'
import { SetupLabwareList } from '../SetupLabwareList'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
  }
})

jest.mock('../../../hooks')
jest.mock(
  '../../../../ProtocolSetup/RunSetupCard/LabwareSetup/SecureLabwareModal'
)
jest.mock('../utils')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockSecureLabwareModal = SecureLabwareModal as jest.MockedFunction<
  typeof SecureLabwareModal
>
const mockGetAllLabwareAndTiprackIdsInOrder = getAllLabwareAndTiprackIdsInOrder as jest.MockedFunction<
  typeof getAllLabwareAndTiprackIdsInOrder
>
const render = () => {
  return renderWithProviders(
    <SetupLabwareList
      runId={RUN_ID_1}
      extraAttentionModules={['thermocyclerModuleType', 'magneticModuleType']}
    />,
    {
      i18nInstance: i18n,
    }
  )
}
const protocolWithMagTempTC = (_protocolWithMagTempTC as unknown) as ProtocolAnalysisFile

describe('SetupLabwareList', () => {
  beforeEach(() => {
    when(mockUseProtocolDetailsForRun).calledWith(RUN_ID_1).mockReturnValue({
      displayName: null,
      protocolData: protocolWithMagTempTC,
      protocolKey: null,
    })
    mockSecureLabwareModal.mockReturnValue(<div>mock secure labware modal</div>)
    mockGetAllLabwareAndTiprackIdsInOrder.mockReturnValue([
      'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      '3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1',
      'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1',
      '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1',
      '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b',
      'b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      'faa13a50-a9bf-11eb-bce6-9f1d5b9c1a1b:opentrons/opentrons_96_tiprack_20ul/1',
    ])
  })

  it('renders all the labware and the correct info', () => {
    const [{ getByText, getAllByText }] = render()
    getByText('Labware Name')
    getByText('Initial Location')
    getByText('Opentrons 96 Tip Rack 1000 µL')
    getAllByText('NEST 1 Well Reservoir 195 mL')
    getAllByText('NEST 96 Well Plate 100 µL PCR Full Skirt')
    getByText('Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 µL')
    getByText('Opentrons 96 Tip Rack 20 µL')
    getAllByText('mock RobotWorkSpace')
    getByText('Slot 7+10, Thermocycler Module GEN1')
    getByText('Slot 3, Temperature Module GEN2')
    getByText('Slot 5')
  })

  it('renders the extra attention information for magnetic module and clicking the button renders the modal', () => {
    const [{ getByText, getByTestId, getAllByText }] = render()
    getAllByText('Secure labware instructions')
    const magneticMod = getByTestId('SetupLabwareList_magneticModuleType_0')
    fireEvent.click(magneticMod)
    getByText('mock secure labware modal')
  })

  it('renders the extra attention information for thermocycler module and clicking the button renders the modal', () => {
    const [{ getByText, getByTestId, getAllByText }] = render()
    getAllByText('Secure labware instructions')
    const tcMod = getByTestId('SetupLabwareList_thermocyclerModuleType_6')
    fireEvent.click(tcMod)
    getByText('mock secure labware modal')
  })
})
