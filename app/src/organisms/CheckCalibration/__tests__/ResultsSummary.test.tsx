import * as React from 'react'
import { Provider } from 'react-redux'
import { HTMLAttributes, mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import * as Calibration from '../../../redux/calibration'
import { mockCalibrationStatus } from '../../../redux/calibration/__fixtures__'
import * as Fixtures from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'
import { ResultsSummary } from '../ResultsSummary'
import { saveAs } from 'file-saver'
import { PrimaryBtn, Flex, Text } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import type { ReactWrapper } from 'enzyme'
import type { Mount } from '../../../redux/pipettes/types'

jest.mock('file-saver')
jest.mock('../../../redux/calibration/selectors')
jest.mock('@opentrons/shared-data', () => ({
  getAllPipetteNames: jest.fn(
    jest.requireActual('@opentrons/shared-data').getAllPipetteNames
  ),
  getPipetteNameSpecs: jest.fn(
    jest.requireActual('@opentrons/shared-data').getPipetteNameSpecs
  ),
  getPipetteModelSpecs: jest.fn(),
}))

const mockSaveAs = saveAs as jest.MockedFunction<typeof saveAs>

const mockGetCalibrationStatus = Calibration.getCalibrationStatus as jest.MockedFunction<
  typeof Calibration.getCalibrationStatus
>

const mockSessionDetails = Fixtures.mockRobotCalibrationCheckSessionDetails

const mockGetPipetteModelSpecs = getPipetteModelSpecs as jest.MockedFunction<
  typeof getPipetteModelSpecs
>

describe('ResultsSummary', () => {
  let render: (
    props?: Partial<
      React.ComponentProps<typeof ResultsSummary> & { pipMount: Mount }
    >
  ) => ReactWrapper<React.ComponentProps<typeof ResultsSummary>>
  let mockStore: jest.MockedFunction<any>
  let dispatch
  let mockDeleteSession: jest.MockedFunction<any>

  const getExitButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof ResultsSummary>>
  ): ReactWrapper<React.ComponentProps<typeof PrimaryBtn>> =>
    wrapper.find(PrimaryBtn)

  const getSaveLink = (
    wrapper: ReactWrapper<React.ComponentProps<typeof ResultsSummary>>
  ): ReactWrapper<HTMLAttributes> =>
    wrapper.find('button[title="download-results-button"]')

  const getDeckParent = (
    wrapper: ReactWrapper<React.ComponentProps<typeof ResultsSummary>>
  ): ReactWrapper => wrapper.children(Flex).at(1)
  const getLeftPipParent = (
    wrapper: ReactWrapper<React.ComponentProps<typeof ResultsSummary>>
  ): ReactWrapper => wrapper.find('div[title="left-mount-container"]')
  const getLeftPipResultsParent = (
    wrapper: ReactWrapper<React.ComponentProps<typeof ResultsSummary>>
  ): ReactWrapper => wrapper.find('div[title="left-mount-results"]')
  const getRightPipParent = (
    wrapper: ReactWrapper<React.ComponentProps<typeof ResultsSummary>>
  ): ReactWrapper => wrapper.find('div[title="right-mount-container"]')
  const getRightPipResultsParent = (
    wrapper: ReactWrapper<React.ComponentProps<typeof ResultsSummary>>
  ): ReactWrapper => wrapper.find('div[title="right-mount-results"]')

  beforeEach(() => {
    mockDeleteSession = jest.fn()
    const mockSendCommands = jest.fn()
    mockGetCalibrationStatus.mockReturnValue(mockCalibrationStatus)
    dispatch = jest.fn()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        robotApi: {},
      }),
      dispatch,
    }
    mockGetPipetteModelSpecs.mockReturnValue({
      displayName: 'mock pipette display name',
    } as any)
    render = (props = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = Fixtures.mockDeckCalTipRack,
        calBlock = null,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.CHECK_STEP_RESULTS_SUMMARY,
        sessionType = Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
        comparisonsByPipette = mockSessionDetails.comparisonsByPipette,
        instruments = mockSessionDetails.instruments,
      } = props
      return mount(
        <ResultsSummary
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          calBlock={calBlock}
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          currentStep={currentStep}
          sessionType={sessionType}
          comparisonsByPipette={comparisonsByPipette}
          instruments={instruments}
        />,
        {
          wrappingComponent: Provider,
          wrappingComponentProps: { store: mockStore },
        }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('displays good deck calibration result', () => {
    const wrapper = render()
    const deckParent = getDeckParent(wrapper)
    expect(deckParent.text()).toEqual(
      expect.stringContaining('robot deck calibration')
    )
    expect(deckParent.find('RenderResult').text()).toEqual(
      expect.stringContaining('Good calibration')
    )
  })

  it('summarizes both pipettes & tip length calibrations if comparisons have been made', () => {
    const wrapper = render()
    const leftPipParent = getLeftPipParent(wrapper)
    const rightPipParent = getRightPipParent(wrapper)
    const leftPipResults = getLeftPipResultsParent(wrapper)
    const rightPipResults = getRightPipResultsParent(wrapper)
    // left pipette & tip length comparison
    expect(leftPipParent.find(Text).at(0).text()).toEqual('left mount')
    expect(leftPipResults.text()).toEqual(
      expect.stringContaining('pipette offset calibration')
    )
    expect(leftPipResults.find('RenderResult').at(0).text()).toEqual(
      expect.stringContaining('Good calibration')
    )
    expect(leftPipResults.text()).toEqual(
      expect.stringContaining('tip length calibration')
    )
    expect(leftPipResults.text()).toEqual(
      expect.stringContaining('mock pipette display name')
    )
    expect(leftPipResults.find('RenderResult').at(1).text()).toEqual(
      expect.stringContaining('Good calibration')
    )

    // right pipette & tip length comparison
    expect(rightPipParent.find(Text).at(0).text()).toEqual('right mount')
    expect(rightPipResults.text()).toEqual(
      expect.stringContaining('pipette offset calibration')
    )
    expect(rightPipResults.find('RenderResult').at(0).text()).toEqual(
      expect.stringContaining('Recalibration recommended')
    )
    expect(rightPipResults.text()).toEqual(
      expect.stringContaining('tip length calibration')
    )
    expect(rightPipResults.text()).toEqual(
      expect.stringContaining('mock pipette display name')
    )
    expect(rightPipResults.find('RenderResult').at(1).text()).toEqual(
      expect.stringContaining('Recalibration recommended')
    )
  })

  it('summarizes neither pipette if no comparisons have been made', () => {
    const emptyComparison = {
      first: {},
      second: {},
    }
    const wrapper = render({
      comparisonsByPipette: emptyComparison,
    })
    const leftPipResults = getLeftPipResultsParent(wrapper)
    const rightPipResults = getRightPipResultsParent(wrapper)
    expect(leftPipResults.text()).toEqual('No pipette attached')
    expect(rightPipResults.text()).toEqual('No pipette attached')
  })

  it('exits when button is clicked', () => {
    const wrapper = render()
    act((): void =>
      getExitButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    )
    wrapper.update()

    expect(mockDeleteSession).toHaveBeenCalled()
  })

  it('saves the calibration report when the button is clicked', () => {
    const wrapper = render()
    act((): void =>
      getSaveLink(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    )
    wrapper.update()
    expect(mockSaveAs).toHaveBeenCalled()
  })
})
