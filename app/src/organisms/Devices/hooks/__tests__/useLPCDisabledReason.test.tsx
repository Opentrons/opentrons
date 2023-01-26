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
  useProtocolDetailsForRun,
  useRunCalibrationStatus,
  useRunHasStarted,
  useStoredProtocolAnalysis,
  useUnmatchedModulesForProtocol,
} from '..'
import type { Store } from 'redux'
import type { LegacySchemaAdapterOutput } from '@opentrons/shared-data'
import type { State } from '../../../../redux/types'
import type { StoredProtocolAnalysis } from '..'

jest.mock('..')
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getLoadedLabwareDefinitionsByUri: jest.fn(),
  }
})

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
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
const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as LegacySchemaAdapterOutput

describe('useLPCDisabledReason', () => {
  const store: Store<State> = createStore(jest.fn(), {})
  const wrapper: React.FunctionComponent<{}> = ({ children }) => (
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>{children}</Provider>
    </I18nextProvider>
  )
  beforeEach(() => {
    store.dispatch = jest.fn()
    mockUseProtocolDetailsForRun.mockReturnValue({
      protocolData: simpleV6Protocol,
    } as any)
    mockUseStoredProtocolAnalysis.mockReturnValue(
      (simpleV6Protocol as unknown) as StoredProtocolAnalysis
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
      () => useLPCDisabledReason('otie', RUN_ID_1),
      { wrapper }
    )
    expect(result.current).toBeNull()
  })
  it('renders disabled reason for calibration incomponent', () => {
    mockUseRunCalibrationStatus.mockReturnValue({ complete: false })
    const { result } = renderHook(
      () => useLPCDisabledReason('otie', RUN_ID_1),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Make sure robot calibration is complete before running Labware Position Check'
    )
  })
  it('renders disabled reason for missing modules', () => {
    mockUseUnmatchedModulesForProtocol.mockReturnValue({
      missingModuleIds: ['mockId'],
      remainingAttachedModules: [],
    })
    const { result } = renderHook(
      () => useLPCDisabledReason('otie', RUN_ID_1),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Make sure all modules are connected before running Labware Position Check'
    )
  })
  it('renders disabled reason for run has started', () => {
    mockUseRunHasStarted.mockReturnValue(true)

    const { result } = renderHook(
      () => useLPCDisabledReason('otie', RUN_ID_1),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Labware Position Check is not available after run has started'
    )
  })
  it('renders disabled reason if robot protocol anaylsis is null', () => {
    mockUseProtocolDetailsForRun.mockReturnValue({
      protocolData: null,
    } as any)
    const { result } = renderHook(
      () => useLPCDisabledReason('otie', RUN_ID_1),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Labware Position Check is not available while protocol is analyzing on robot'
    )
  })
  it('renders disabled reason if no pipettes in protocol', () => {
    mockUseProtocolDetailsForRun.mockReturnValue({
      protocolData: { ...simpleV6Protocol, pipettes: {} },
    } as any)
    const { result } = renderHook(
      () => useLPCDisabledReason('otie', RUN_ID_1),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Labware Position Check requires that the protocol loads labware and pipettes'
    )
  })
  it('renders disabled reason if no tipracks in protocols', () => {
    mockGetLoadedLabwareDefinitionsByUri.mockReturnValue({})

    const { result } = renderHook(
      () => useLPCDisabledReason('otie', RUN_ID_1),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Labware Position Check requires that the protocol loads a tip rack'
    )
  })
  it('renders disabled reason if no tips are being used in the protocols', () => {
    mockUseProtocolDetailsForRun.mockReturnValue({
      protocolData: { ...simpleV6Protocol, commands: {} },
    } as any)
    const { result } = renderHook(
      () => useLPCDisabledReason('otie', RUN_ID_1),
      { wrapper }
    )
    expect(result.current).toStrictEqual(
      'Labware Position Check requires that the protocol has at least one pipette that picks up a tip'
    )
  })
})
