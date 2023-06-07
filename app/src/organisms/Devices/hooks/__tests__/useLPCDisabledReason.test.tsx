import * as React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { createStore } from 'redux'
import { getLoadedLabwareDefinitionsByUri } from '@opentrons/shared-data'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import { i18n } from '../../../../i18n'
import { RUN_ID_1 } from '../../../RunTimeControl/__fixtures__'
import { useLPCDisabledReason } from '../useLPCDisabledReason'
import {
  useRunCalibrationStatus,
  useRunHasStarted,
  useStoredProtocolAnalysis,
  useUnmatchedModulesForProtocol,
} from '..'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import type { Store } from 'redux'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { State } from '../../../../redux/types'

jest.mock('..')
jest.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getLoadedLabwareDefinitionsByUri: jest.fn(),
  }
})

const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockUseStoredProtocolAnalysis = useStoredProtocolAnalysis as jest.MockedFunction<
  typeof useStoredProtocolAnalysis
>
const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>
const mockUseRunCalibrationStatus = useRunCalibrationStatus as jest.MockedFunction<
  typeof useRunCalibrationStatus
>
const mockUseUnmatchedModulesForProtocol = useUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof useUnmatchedModulesForProtocol
>
const mockGetLoadedLabwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri as jest.MockedFunction<
  typeof getLoadedLabwareDefinitionsByUri
>
const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolAnalysisOutput

describe('useLPCDisabledReason', () => {
  const store: Store<State> = createStore(jest.fn(), {})
  const wrapper: React.FunctionComponent<{}> = ({ children }) => (
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>{children}</Provider>
    </I18nextProvider>
  )
  beforeEach(() => {
    store.dispatch = jest.fn()
    mockUseMostRecentCompletedAnalysis.mockReturnValue(simpleV6Protocol as any)
    mockUseStoredProtocolAnalysis.mockReturnValue(
      (simpleV6Protocol as unknown) as ProtocolAnalysisOutput
    )
    mockUseRunHasStarted.mockReturnValue(false)
    mockUseRunCalibrationStatus.mockReturnValue({ complete: true })
    mockUseUnmatchedModulesForProtocol.mockReturnValue({
      missingModuleIds: [],
      remainingAttachedModules: [],
    })
    mockGetLoadedLabwareDefinitionsByUri.mockReturnValue(
      _uncastedSimpleV6Protocol.labwareDefinitions as {}
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders no disabled reason', () => {
    const { result } = renderHook(
      () => useLPCDisabledReason({ robotName: 'otie', runId: RUN_ID_1 }),
      { wrapper }
    )
    expect(result.current).toBeNull()
  })
  it('renders no disabled reason for odd', () => {
    const { result } = renderHook(
      () =>
        useLPCDisabledReason({
          runId: RUN_ID_1,
          hasMissingModulesForOdd: false,
          hasMissingPipCalForOdd: false,
        }),
      { wrapper }
    )
    expect(result.current).toBeNull()
  })
  it('renders disabled reason for module and calibration incomponent for odd', () => {
    const { result } = renderHook(
      () =>
        useLPCDisabledReason({
          runId: RUN_ID_1,
          hasMissingModulesForOdd: true,
          hasMissingPipCalForOdd: true,
        }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Connect and calibrate all hardware first'
    )
  })
  it('renders disabled reason for module and calibration incomponent', () => {
    mockUseUnmatchedModulesForProtocol.mockReturnValue({
      missingModuleIds: ['mockId'],
      remainingAttachedModules: [],
    })
    mockUseRunCalibrationStatus.mockReturnValue({ complete: false })
    const { result } = renderHook(
      () => useLPCDisabledReason({ robotName: 'otie', runId: RUN_ID_1 }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Make sure robot calibration is complete and all modules are connected before running Labware Position Check'
    )
  })
  it('renders disabled reason for calibration incomponent for odd', () => {
    const { result } = renderHook(
      () =>
        useLPCDisabledReason({
          runId: RUN_ID_1,
          hasMissingModulesForOdd: false,
          hasMissingPipCalForOdd: true,
        }),
      { wrapper }
    )
    expect(result.current).toStrictEqual('Calibrate pipettes first')
  })
  it('renders disabled reason for calibration incomponent', () => {
    mockUseRunCalibrationStatus.mockReturnValue({ complete: false })
    const { result } = renderHook(
      () => useLPCDisabledReason({ robotName: 'otie', runId: RUN_ID_1 }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Make sure robot calibration is complete before running Labware Position Check'
    )
  })
  it('renders disabled reason for missing modules for odd', () => {
    const { result } = renderHook(
      () =>
        useLPCDisabledReason({
          runId: RUN_ID_1,
          hasMissingModulesForOdd: true,
          hasMissingPipCalForOdd: false,
        }),
      { wrapper }
    )
    expect(result.current).toStrictEqual('Connect all modules first')
  })
  it('renders disabled reason for missing modules', () => {
    mockUseUnmatchedModulesForProtocol.mockReturnValue({
      missingModuleIds: ['mockId'],
      remainingAttachedModules: [],
    })
    const { result } = renderHook(
      () => useLPCDisabledReason({ robotName: 'otie', runId: RUN_ID_1 }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Make sure all modules are connected before running Labware Position Check'
    )
  })
  it('renders disabled reason for run has started for odd', () => {
    mockUseRunHasStarted.mockReturnValue(true)

    const { result } = renderHook(
      () =>
        useLPCDisabledReason({
          runId: RUN_ID_1,
          hasMissingModulesForOdd: false,
          hasMissingPipCalForOdd: false,
        }),
      { wrapper }
    )
    expect(result.current).toStrictEqual('Robot is busy')
  })
  it('renders disabled reason for run has started', () => {
    mockUseRunHasStarted.mockReturnValue(true)

    const { result } = renderHook(
      () => useLPCDisabledReason({ robotName: 'otie', runId: RUN_ID_1 }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Labware Position Check is not available after run has started'
    )
  })
  it('renders disabled reason if robot protocol anaylsis is null for odd', () => {
    mockUseMostRecentCompletedAnalysis.mockReturnValue(null as any)
    const { result } = renderHook(
      () =>
        useLPCDisabledReason({
          runId: RUN_ID_1,
          hasMissingModulesForOdd: false,
          hasMissingPipCalForOdd: false,
        }),
      { wrapper }
    )
    expect(result.current).toStrictEqual('Robot is analyzing')
  })
  it('renders disabled reason if robot protocol anaylsis is null', () => {
    mockUseMostRecentCompletedAnalysis.mockReturnValue(null as any)
    const { result } = renderHook(
      () => useLPCDisabledReason({ robotName: 'otie', runId: RUN_ID_1 }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Labware Position Check is not available while protocol is analyzing on robot'
    )
  })
  it('renders disabled reason if no pipettes in protocol for odd', () => {
    mockUseMostRecentCompletedAnalysis.mockReturnValue({
      ...simpleV6Protocol,
      pipettes: {},
    } as any)
    const { result } = renderHook(
      () =>
        useLPCDisabledReason({
          runId: RUN_ID_1,
          hasMissingModulesForOdd: false,
          hasMissingPipCalForOdd: false,
        }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Protocol must load labware and a pipette'
    )
  })
  it('renders disabled reason if no pipettes in protocol', () => {
    mockUseMostRecentCompletedAnalysis.mockReturnValue({
      ...simpleV6Protocol,
      pipettes: {},
    } as any)
    const { result } = renderHook(
      () => useLPCDisabledReason({ robotName: 'otie', runId: RUN_ID_1 }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Labware Position Check requires that the protocol loads labware and pipettes'
    )
  })
  it('renders disabled reason if no tipracks in protocols for odd', () => {
    mockGetLoadedLabwareDefinitionsByUri.mockReturnValue({})

    const { result } = renderHook(
      () =>
        useLPCDisabledReason({
          runId: RUN_ID_1,
          hasMissingModulesForOdd: false,
          hasMissingPipCalForOdd: false,
        }),
      { wrapper }
    )
    expect(result.current).toStrictEqual('Protocol must load a tip rack')
  })
  it('renders disabled reason if no tipracks in protocols', () => {
    mockGetLoadedLabwareDefinitionsByUri.mockReturnValue({})

    const { result } = renderHook(
      () => useLPCDisabledReason({ robotName: 'otie', runId: RUN_ID_1 }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Labware Position Check requires that the protocol loads a tip rack'
    )
  })
  it('renders disabled reason if no tips are being used in the protocols for odd', () => {
    mockUseMostRecentCompletedAnalysis.mockReturnValue({
      ...simpleV6Protocol,
      commands: {},
    } as any)
    const { result } = renderHook(
      () =>
        useLPCDisabledReason({
          runId: RUN_ID_1,
          hasMissingModulesForOdd: false,
          hasMissingPipCalForOdd: false,
        }),
      { wrapper }
    )
    expect(result.current).toStrictEqual('Protocol must pick up a tip')
  })
  it('renders disabled reason if no tips are being used in the protocols', () => {
    mockUseMostRecentCompletedAnalysis.mockReturnValue({
      ...simpleV6Protocol,
      commands: {},
    } as any)
    const { result } = renderHook(
      () => useLPCDisabledReason({ robotName: 'otie', runId: RUN_ID_1 }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Labware Position Check requires that the protocol has at least one pipette that picks up a tip'
    )
  })
  it('renders disabled reason as null if only runId is present', () => {
    const { result } = renderHook(
      () => useLPCDisabledReason({ runId: RUN_ID_1 }),
      { wrapper }
    )
    expect(result.current).toStrictEqual(null)
  })
})
