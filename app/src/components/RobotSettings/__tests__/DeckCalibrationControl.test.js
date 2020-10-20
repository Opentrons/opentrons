// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as Sessions from '../../../sessions'

import {
  DECK_CAL_STATUS_OK,
  DECK_CAL_STATUS_IDENTITY,
  DECK_CAL_STATUS_BAD_CALIBRATION,
  DECK_CAL_STATUS_SINGULARITY,
  CALIBRATION_SOURCE_USER,
  CALIBRATION_SOURCE_FACTORY,
  CALIBRATION_SOURCE_LEGACY,
  CALIBRATION_SOURCE_UNKNOWN,
} from '../../../calibration'
import { DeckCalibrationControl } from '../DeckCalibrationControl'
import { InlineCalibrationWarning } from '../../InlineCalibrationWarning'

jest.mock('../../../robot-api/selectors')
jest.mock('../../../sessions/selectors')

describe('DeckCalibrationControl', () => {
  let mockStore
  let render

  const getDeckCalButton = wrapper =>
    wrapper
      .find('TitledControl[title="Calibrate deck"]')
      .find('button')
      .filter({ children: 'Calibrate' })

  const getCancelDeckCalButton = wrapper =>
    wrapper.find('OutlineButton[children="cancel"]').find('button')

  const getConfirmDeckCalButton = wrapper =>
    wrapper.find('OutlineButton[children="continue"]').find('button')

  const getCalibrationWarning = wrapper =>
    wrapper.find(InlineCalibrationWarning)

  beforeEach(() => {
    jest.useFakeTimers()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        mockState: true,
      }),
      dispatch: jest.fn(),
    }

    render = (props = {}) => {
      const {
        robotName = 'robot-name',
        disabledReason = null,
        deckCalStatus = DECK_CAL_STATUS_OK,
        deckCalData = {
          type: 'affine',
          matrix: [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 16],
          ],
          lastModified: null,
          pipetteCalibratedWith: null,
          tiprack: null,
          source: 'user',
          status: {
            markedBad: false,
            source: 'unknown',
            markedAt: '',
          },
        },
      } = props
      return mount(
        <DeckCalibrationControl
          robotName={robotName}
          disabledReason={disabledReason}
          deckCalStatus={deckCalStatus}
          deckCalData={deckCalData}
          pipOffsetDataPresent={true}
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
  const SOURCE_SPECS = [
    {
      it: 'displays migrated if source is legacy',
      source: CALIBRATION_SOURCE_LEGACY,
      shouldMatch: /migrated/i,
    },
    {
      it: 'displays calibrated if source is user',
      source: CALIBRATION_SOURCE_USER,
      shouldMatch: /calibrated/i,
    },
    {
      it: 'displays calibrated if source is factory',
      source: CALIBRATION_SOURCE_FACTORY,
      shouldMatch: /calibrated/i,
    },
    {
      it: 'displays calibrated if source is unknown',
      source: CALIBRATION_SOURCE_UNKNOWN,
      shouldMatch: /calibrated/i,
    },
  ]
  SOURCE_SPECS.forEach(spec => {
    it(spec.it, () => {
      const wrapper = render({
        deckCalData: {
          type: 'affine',
          matrix: [[1, 2, 3], [5, 6, 7], [8, 9, 10]],
          lastModified: '2020-10-19T00:01:02+00:00',
          pipetteCalibratedWith: null,
          tiprack: null,
          source: spec.source,
          status: { markedBad: false, source: 'unknown', markedAt: '' },
        },
      })
      expect(
        wrapper.findWhere(elem => elem.prop('fontStyle') === 'italic').html()
      ).toMatch(spec.shouldMatch)
    })
  })

  it('button launches new deck calibration after confirm', () => {
    const wrapper = render()
    expect(wrapper.find('ConfirmStartDeckCalModal').exists()).toBe(false)
    getDeckCalButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('ConfirmStartDeckCalModal').exists()).toBe(true)

    getConfirmDeckCalButton(wrapper).invoke('onClick')()

    expect(mockStore.dispatch).toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        'robot-name',
        Sessions.SESSION_TYPE_DECK_CALIBRATION
      ),
      meta: expect.objectContaining({ requestId: expect.any(String) }),
    })
  })

  it('button launches new deck calibration and cancel closes', () => {
    const wrapper = render()
    expect(wrapper.find('ConfirmStartDeckCalModal').exists()).toBe(false)
    getDeckCalButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('ConfirmStartDeckCalModal').exists()).toBe(true)

    getCancelDeckCalButton(wrapper).invoke('onClick')()

    expect(wrapper.find('ConfirmStartDeckCalModal').exists()).toBe(false)
    expect(mockStore.dispatch).not.toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        'robot-name',
        Sessions.SESSION_TYPE_DECK_CALIBRATION
      ),
      meta: expect.objectContaining({ requestId: expect.any(String) }),
    })
  })

  const BAD_STATUSES = [
    DECK_CAL_STATUS_IDENTITY,
    DECK_CAL_STATUS_BAD_CALIBRATION,
    DECK_CAL_STATUS_SINGULARITY,
  ]

  BAD_STATUSES.forEach(badStatus => {
    it(`InlineCalibrationWarning component requested with error if deck cal is ${badStatus}`, () => {
      const wrapper = render({ deckCalStatus: badStatus })

      expect(getCalibrationWarning(wrapper).html()).toMatch(/required/i)
    })
  })

  BAD_STATUSES.forEach(badStatus => {
    it(`InlineCalibrationWarning component requested with error if deck cal is ${badStatus} and marked bad`, () => {
      const wrapper = render({
        deckCalStatus: badStatus,
        deckCalData: {
          type: 'affine',
          matrix: [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 16],
          ],
          lastModified: null,
          pipetteCalibratedWith: null,
          tiprack: null,
          source: 'user',
          status: {
            markedBad: true,
            source: 'calibration_check',
            markedAt: '',
          },
        },
      })
      expect(getCalibrationWarning(wrapper).html()).toMatch(/required/i)
    })
  })

  it('InlineCalibrationWarning component requested with warning if deck cal is good but marked bad', () => {
    const wrapper = render({
      deckCalData: {
        type: 'affine',
        matrix: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]],
        lastModified: null,
        pipetteCalibratedWith: null,
        tiprack: null,
        source: 'user',
        status: {
          markedBad: true,
          source: 'calibration_check',
          markedAt: '',
        },
      },
    })
    expect(getCalibrationWarning(wrapper).html()).toMatch(/recommended/i)
  })

  it('InlineCalibrationWarning component not rendered if deck cal is good and marked ok', () => {
    const wrapper = render()
    expect(getCalibrationWarning(wrapper).children()).toHaveLength(0)
  })
})
