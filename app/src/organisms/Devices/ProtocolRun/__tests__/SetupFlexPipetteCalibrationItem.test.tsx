import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/dom'

import { renderWithProviders } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { PipetteWizardFlows } from '../../../PipetteWizardFlows'
import { SetupFlexPipetteCalibrationItem } from '../SetupFlexPipetteCalibrationItem'
import _uncastedModifiedSimpleV6Protocol from '../../hooks/__fixtures__/modifiedSimpleV6.json'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../PipetteWizardFlows')
jest.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
jest.mock('../../hooks')

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockPipetteWizardFlows = PipetteWizardFlows as jest.MockedFunction<
  typeof PipetteWizardFlows
>

const RUN_ID = '1'
const modifiedSimpleV6Protocol = ({
  ..._uncastedModifiedSimpleV6Protocol,
  pipettes: [
    {
      id: 'pipetteId',
      pipetteName: 'p10_single',
    },
  ],
} as any) as CompletedProtocolAnalysis

describe('SetupFlexPipetteCalibrationItem', () => {
  const render = ({
    mount = 'left',
    runId = RUN_ID,
  }: Partial<
    React.ComponentProps<typeof SetupFlexPipetteCalibrationItem>
  > = {}) => {
    return renderWithProviders(
      <MemoryRouter>
        <SetupFlexPipetteCalibrationItem
          {...{
            mount,
            runId,
          }}
        />
      </MemoryRouter>,
      { i18nInstance: i18n }
    )[0]
  }

  beforeEach(() => {
    mockPipetteWizardFlows.mockReturnValue(<div>pipette wizard flows</div>)
    mockUseMostRecentCompletedAnalysis.mockReturnValue(modifiedSimpleV6Protocol)
    mockUseInstrumentsQuery.mockReturnValue({
      data: {
        data: [],
      },
    } as any)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders the mount and pipette name', () => {
    const { getByText } = render()
    getByText('Left Mount')
    getByText('P10 Single-Channel GEN1')
  })

  it('renders an attach button if on a Flex and pipette is not attached', () => {
    const { getByText, getByRole } = render()
    getByText('Left Mount')
    getByText('P10 Single-Channel GEN1')
    const attach = getByRole('button', { name: 'Attach Pipette' })
    fireEvent.click(attach)
    getByText('pipette wizard flows')
  })
  it('renders a calibrate button if on a Flex and pipette is not calibrated', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      data: {
        data: [
          {
            instrumentType: 'pipette',
            mount: 'left',
            ok: true,
            firmwareVersion: 12,
            instrumentName: 'p10_single',
            data: {},
          } as any,
        ],
      },
    } as any)
    const { getByText, getByRole } = render()
    getByText('Left Mount')
    getByText('P10 Single-Channel GEN1')
    const attach = getByRole('button', { name: 'Calibrate now' })
    fireEvent.click(attach)
    getByText('pipette wizard flows')
  })
  it('renders calibrated text if on a Flex and pipette is calibrated', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      data: {
        data: [
          {
            instrumentType: 'pipette',
            mount: 'left',
            ok: true,
            firmwareVersion: 12,
            instrumentName: 'p10_single',
            data: {
              calibratedOffset: {
                last_modified: 'today',
              },
            },
          } as any,
        ],
      },
    } as any)
    const { getByText } = render()
    getByText('Left Mount')
    getByText('P10 Single-Channel GEN1')
    getByText('Last calibrated: today')
  })
})
