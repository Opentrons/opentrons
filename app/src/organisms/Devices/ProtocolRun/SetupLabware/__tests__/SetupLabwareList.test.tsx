import * as React from 'react'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../../i18n'
import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/6/transferSettings.json'
import { renderWithProviders } from '@opentrons/components'
import { SecureLabwareModal } from '../../../../ProtocolSetup/RunSetupCard/LabwareSetup/SecureLabwareModal'
import { RUN_ID_1 } from '../../../../RunTimeControl/__fixtures__'
import { useProtocolDetailsForRun } from '../../../hooks'
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

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockSecureLabwareModal = SecureLabwareModal as jest.MockedFunction<
  typeof SecureLabwareModal
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
    const magneticMod = getByTestId('SetupLabwareList_magneticModuleType_2')
    fireEvent.click(magneticMod)
    getByText('mock secure labware modal')
    getByTestId('SetupLabwareList_thermocyclerModuleType_5')
  })

  it('renders the extra attention information for thermocycler module and clicking the button renders the modal', () => {
    const [{ getByText, getByTestId, getAllByText }] = render()
    getAllByText('Secure labware instructions')
    const tcMod = getByTestId('SetupLabwareList_thermocyclerModuleType_5')
    fireEvent.click(tcMod)
    getByText('mock secure labware modal')
  })
})
