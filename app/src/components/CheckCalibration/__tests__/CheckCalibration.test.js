// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import * as Calibration from '../../../calibration'
import { mockRobotCalibrationCheckSessionData } from '../../../calibration/__fixtures__'

import { CheckCalibration } from '../index'
import { Introduction } from '../Introduction'
import { DeckSetup } from '../DeckSetup'
import { TipPickUp } from '../TipPickUp'
import { CheckXYPoint } from '../CheckXYPoint'
import { CheckHeight } from '../CheckHeight'
import { CompleteConfirmation } from '../CompleteConfirmation'

import type { State } from '../../../types'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../calibration/selectors')

const getRobotCalibrationCheckSession: JestMockFn<
  [State, string],
  $Call<typeof Calibration.getRobotCalibrationCheckSession, State, string>
> = Calibration.getRobotCalibrationCheckSession

const mockGetDeckDefinitions: JestMockFn<
  [],
  $Call<typeof getDeckDefinitions, any>
> = getDeckDefinitions

describe('CheckCalibration', () => {
  let mockStore
  let render

  const mockCloseCalibrationCheck = jest.fn()

  const getBackButton = wrapper =>
    wrapper.find({ title: 'Back' }).find('button')

  beforeEach(() => {
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        mockState: true,
      }),
      dispatch: jest.fn(),
    }

    render = () => {
      return mount(
        <CheckCalibration
          robotName="robot-name"
          closeCalibrationCheck={mockCloseCalibrationCheck}
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

  it('fetches robot cal check session on mount', () => {
    getRobotCalibrationCheckSession.mockReturnValue(
      mockRobotCalibrationCheckSessionData
    )
    render()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.fetchRobotCalibrationCheckSession('robot-name')
    )
  })

  it('renders Introduction contents when currentStep is sessionStarted', () => {
    getRobotCalibrationCheckSession.mockReturnValue({
      ...mockRobotCalibrationCheckSessionData,
      currentStep: 'sessionStarted',
    })
    const wrapper = render()

    expect(wrapper.exists(Introduction)).toBe(true)
    expect(wrapper.exists(DeckSetup)).toBe(false)
    expect(wrapper.exists(TipPickUp)).toBe(false)
    expect(wrapper.exists(CheckXYPoint)).toBe(false)
    expect(wrapper.exists(CheckHeight)).toBe(false)
    expect(wrapper.exists(CompleteConfirmation)).toBe(false)
  })

  it('renders DeckSetup contents when currentStep is labwareLoaded', () => {
    mockGetDeckDefinitions.mockReturnValue({})
    getRobotCalibrationCheckSession.mockReturnValue({
      ...mockRobotCalibrationCheckSessionData,
      currentStep: 'labwareLoaded',
    })
    const wrapper = render()

    expect(wrapper.exists(Introduction)).toBe(false)
    expect(wrapper.exists(DeckSetup)).toBe(true)
    expect(wrapper.exists(TipPickUp)).toBe(false)
    expect(wrapper.exists(CheckXYPoint)).toBe(false)
    expect(wrapper.exists(CheckHeight)).toBe(false)
    expect(wrapper.exists(CompleteConfirmation)).toBe(false)
  })

  it('renders TipPickUp contents when currentStep is preparingPipette', () => {
    getRobotCalibrationCheckSession.mockReturnValue({
      ...mockRobotCalibrationCheckSessionData,
      currentStep: 'preparingPipette',
    })
    const wrapper = render()

    expect(wrapper.exists(Introduction)).toBe(false)
    expect(wrapper.exists(DeckSetup)).toBe(false)
    expect(wrapper.exists(TipPickUp)).toBe(true)
    expect(wrapper.exists(CheckXYPoint)).toBe(false)
    expect(wrapper.exists(CheckHeight)).toBe(false)
    expect(wrapper.exists(CompleteConfirmation)).toBe(false)
  })

  it('renders TipPickUp contents when currentStep is inspectingTip', () => {
    getRobotCalibrationCheckSession.mockReturnValue({
      ...mockRobotCalibrationCheckSessionData,
      currentStep: 'inspectingTip',
    })
    const wrapper = render()

    expect(wrapper.exists(Introduction)).toBe(false)
    expect(wrapper.exists(DeckSetup)).toBe(false)
    expect(wrapper.exists(TipPickUp)).toBe(true)
    expect(wrapper.exists(CheckXYPoint)).toBe(false)
    expect(wrapper.exists(CheckHeight)).toBe(false)
    expect(wrapper.exists(CompleteConfirmation)).toBe(false)
  })

  it('renders CheckXYPoint contents when currentStep is checkingPointOne', () => {
    getRobotCalibrationCheckSession.mockReturnValue({
      ...mockRobotCalibrationCheckSessionData,
      currentStep: 'checkingPointOne',
    })
    const wrapper = render()

    expect(wrapper.exists(Introduction)).toBe(false)
    expect(wrapper.exists(DeckSetup)).toBe(false)
    expect(wrapper.exists(TipPickUp)).toBe(false)
    expect(wrapper.exists(CheckXYPoint)).toBe(true)
    expect(wrapper.exists(CheckHeight)).toBe(false)
    expect(wrapper.exists(CompleteConfirmation)).toBe(false)
  })

  it('renders CheckXYPoint contents when currentStep is checkingPointTwo', () => {
    getRobotCalibrationCheckSession.mockReturnValue({
      ...mockRobotCalibrationCheckSessionData,
      currentStep: 'checkingPointTwo',
    })
    const wrapper = render()

    expect(wrapper.exists(Introduction)).toBe(false)
    expect(wrapper.exists(DeckSetup)).toBe(false)
    expect(wrapper.exists(TipPickUp)).toBe(false)
    expect(wrapper.exists(CheckXYPoint)).toBe(true)
    expect(wrapper.exists(CheckHeight)).toBe(false)
    expect(wrapper.exists(CompleteConfirmation)).toBe(false)
  })

  it('renders CheckXYPoint contents when currentStep is checkingPointThree', () => {
    getRobotCalibrationCheckSession.mockReturnValue({
      ...mockRobotCalibrationCheckSessionData,
      currentStep: 'checkingPointThree',
    })
    const wrapper = render()

    expect(wrapper.exists(Introduction)).toBe(false)
    expect(wrapper.exists(DeckSetup)).toBe(false)
    expect(wrapper.exists(TipPickUp)).toBe(false)
    expect(wrapper.exists(CheckXYPoint)).toBe(true)
    expect(wrapper.exists(CheckHeight)).toBe(false)
    expect(wrapper.exists(CompleteConfirmation)).toBe(false)
  })

  it('renders CheckHeight contents when currentStep is checkingHeight', () => {
    getRobotCalibrationCheckSession.mockReturnValue({
      ...mockRobotCalibrationCheckSessionData,
      currentStep: 'checkingHeight',
    })
    const wrapper = render()

    expect(wrapper.exists(Introduction)).toBe(false)
    expect(wrapper.exists(DeckSetup)).toBe(false)
    expect(wrapper.exists(TipPickUp)).toBe(false)
    expect(wrapper.exists(CheckXYPoint)).toBe(false)
    expect(wrapper.exists(CheckHeight)).toBe(true)
    expect(wrapper.exists(CompleteConfirmation)).toBe(false)
  })

  it('calls deleteRobotCalibrationCheckSession on exit click', () => {
    const wrapper = render()

    getBackButton(wrapper).invoke('onClick')()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.deleteRobotCalibrationCheckSession('robot-name')
    )
    expect(mockCloseCalibrationCheck).toHaveBeenCalled()
  })
})
