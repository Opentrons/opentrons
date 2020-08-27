// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { saveAs } from 'file-saver'

import * as Calibration from '../../../calibration'
import { Text } from '@opentrons/components'
import { DeckCalibrationDownload } from '../DeckCalibrationDownload'

jest.mock('file-saver')

const mockSaveAs: JestMockFn<
  [Blob, string],
  $Call<typeof saveAs, Blob, string>
> = saveAs

describe('Calibration Download Component', () => {
  let render

  const getDownloadButton = wrapper => wrapper.find('button')

  const getLastModifedText = wrapper =>
    wrapper.find(Text).filter({ children: 'Last calibrated:' })

  beforeEach(() => {
    render = (props = {}) => {
      const {
        calData = {
          type: 'attitude',
          matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          lastModified: '2020-08-25T14:14:30.422070+00:00',
          pipetteCalibratedWith: 'P20MV202020042206',
          tiprack: 'somehash',
        },
        calStatus = Calibration.DECK_CAL_STATUS_OK,
        name = 'opentrons',
      } = props
      return mount(
        <DeckCalibrationDownload
          deckCalibrationData={calData}
          deckCalibrationStatus={calStatus}
          robotName={name}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders when deck calibration status is ok', () => {
    const wrapper = render()
    expect(wrapper.exists()).toEqual(true)
  })

  it('renders when deck calibration status is IDENTITY', () => {
    const wrapper = render({
      deckCalibrationStatus: Calibration.DECK_CAL_STATUS_IDENTITY,
    })
    expect(wrapper.exists()).toEqual(true)
  })

  it('renders when deck calibration status is SINGULARITY', () => {
    const wrapper = render({
      deckCalibrationStatus: Calibration.DECK_CAL_STATUS_SINGULARITY,
    })
    expect(wrapper.exists()).toEqual(true)
  })

  it('renders when deck calibration status is BAD_CALIBRATION', () => {
    const wrapper = render({
      deckCalibrationStatus: Calibration.DECK_CAL_STATUS_BAD_CALIBRATION,
    })
    expect(wrapper.exists()).toEqual(true)
  })

  it('renders nothing when deck calibration status is unknown', () => {
    const wrapper = render({ deckCalibrationStatus: null })
    expect(wrapper).toEqual({})
  })

  it('saves the deck calibration data when the button is clicked', () => {
    const wrapper = render()

    act(() => getDownloadButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(mockSaveAs).toHaveBeenCalled()
  })

  it('renders last modified when deck calibration type is attitude', () => {
    const wrapper = render()

    expect(getLastModifedText(wrapper).exists()).toEqual(true)
  })

  it('should not render last modified when deck calibration type is affine', () => {
    const wrapper = render({
      deckCalibrationData: {
        type: 'affine',
        matrix: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]],
        lastModified: null,
        pipetteCalibratedWith: null,
        tiprack: null,
      },
    })

    expect(getLastModifedText(wrapper)).toEqual({})
  })
})
