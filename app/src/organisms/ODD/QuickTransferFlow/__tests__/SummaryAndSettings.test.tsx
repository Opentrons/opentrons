import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCreateProtocolMutation,
  useCreateRunMutation,
} from '@opentrons/react-api-client'
import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_RUN_NOW } from '/app/redux/analytics'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { NameQuickTransfer } from '../NameQuickTransfer'
import { Overview } from '../Overview'
import mockQuickTransferState from '../QuickTransferAdvancedSettings/__fixtures__/QuickTransferState.json'
import { SummaryAndSettings } from '../SummaryAndSettings'
import { createQuickTransferPythonFile, getInitialSummaryState } from '../utils'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()
const mockFixture = {
  cutoutId: 'cutoutA3',
  cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
}

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<NavigateFunction>()
  return {
    ...reactRouterDom,
    useNavigate: () => mockNavigate,
  }
})
vi.mock('../Overview')
vi.mock('../NameQuickTransfer')
vi.mock('/app/redux-resources/analytics')
vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils')
  return {
    ...actual,
    getInitialSummaryState: vi.fn(),
  }
})
vi.mock('../utils/createQuickTransferFile')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/deck_configuration')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const render = (props: ComponentProps<typeof SummaryAndSettings>) => {
  return renderWithProviders(<SummaryAndSettings {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('SummaryAndSettings', () => {
  let props: ComponentProps<typeof SummaryAndSettings>
  const createProtocol = vi.fn()
  const createRun = vi.fn()

  beforeEach(() => {
    props = {
      exitButtonProps: {
        buttonType: 'tertiaryLowLight',
        buttonText: 'Exit',
        onClick: vi.fn(),
      },
      state: {
        pipette: mockQuickTransferState.pipette as any,
        mount: 'left',
        tipRack: mockQuickTransferState.tipRack as any,
        source: {} as any,
        sourceWells: ['A1'],
        destination: {} as any,
        destinationWells: ['A1'],
        transferType: 'transfer',
        volume: 25,
        path: 'single',
        liquidClassName: 'none',
        changeTip: 'once',
        dropTipLocation: undefined,
      },
      analyticsStartTime: new Date(),
    }
    mockTrackEventWithRobotSerial = vi.fn(
      () => new Promise(resolve => resolve({}))
    )
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [mockFixture],
    } as any)
    vi.mocked(useTrackEventWithRobotSerial).mockReturnValue({
      trackEventWithRobotSerial: mockTrackEventWithRobotSerial,
    })
    vi.mocked(useCreateProtocolMutation).mockReturnValue({
      mutateAsync: createProtocol,
    } as any)
    vi.mocked(useCreateRunMutation).mockReturnValue({
      createRun,
    } as any)
    vi.mocked(createQuickTransferPythonFile).mockReturnValue('' as any)
    vi.mocked(getInitialSummaryState).mockReturnValue({
      liquidClassValuesInitialized: true,
    } as any)
    createProtocol.mockResolvedValue({
      data: {
        data: {
          id: '123',
        },
      },
    })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the header and buttons for the summary and settings screen', () => {
    render(props)
    screen.getByText('Quick Transfer 25µL')
    const exitBtn = screen.getByText('Exit')
    fireEvent.click(exitBtn)
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
    screen.getByText('Create transfer')
    const continueBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    fireEvent.click(continueBtn)
  })
  it('renders the three tabs and shows overview screen by default', () => {
    render(props)
    screen.getByText('Overview')
    screen.getByText('Aspirate')
    screen.getByText('Dispense')
    expect(vi.mocked(Overview)).toHaveBeenCalled()
  })
  it('renders the save or run modal when continue is pressed', () => {
    render(props)
    const continueBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    fireEvent.click(continueBtn)
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalled()
    screen.getByText('Do you want to run your quick transfer now?')
    screen.getByText('Save your quick transfer to run it in the future.')
  })
  it('renders name quick transfer screen when pressing save', () => {
    render(props)
    const continueBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    fireEvent.click(continueBtn)
    const saveBtn = screen.getByText('Save for later')
    fireEvent.click(saveBtn)
    expect(vi.mocked(NameQuickTransfer)).toHaveBeenCalled()
  })
  it('calls the proper functions when pressing run', () => {
    render(props)
    const continueBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    fireEvent.click(continueBtn)
    const runBtn = screen.getByText('Run now')
    fireEvent.click(runBtn)
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: ANALYTICS_QUICK_TRANSFER_RUN_NOW,
      properties: {},
    })
    expect(vi.mocked(createQuickTransferPythonFile)).toHaveBeenCalled()
    expect(vi.mocked(createProtocol)).toHaveBeenCalled()
  })
})
