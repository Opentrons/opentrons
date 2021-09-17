import * as React from 'react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components/__utils__'
import { i18n } from '../../../../../i18n'
import { mockProtocolPipetteTipRackCalInfo } from '../../../../../redux/pipettes/__fixtures__'
import { PipetteCalibration } from '../PipetteCalibration'

jest.mock('../../../../../redux/config/selectors')
jest.mock('../../../../../redux/sessions/selectors')

describe('PipetteCalibration', () => {
  const render = ({
    pipetteTipRackData = mockProtocolPipetteTipRackCalInfo,
    index = 1,
    mount = 'left',
    robotName = 'robot name',
  }: Partial<React.ComponentProps<typeof PipetteCalibration>> = {}) => {
    return renderWithProviders(
      <PipetteCalibration
        {...{
          pipetteTipRackData,
          index,
          mount,
          robotName,
        }}
      />,
      { i18nInstance: i18n }
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the pipette name and last calibrated date', () => {
    const { getByText } = render()
    expect(
      getByText(
        `LEFT MOUNT: ${mockProtocolPipetteTipRackCalInfo.pipetteDisplayName}`
      )
    ).toBeTruthy()
    expect(getByText('Last calibrated: April 09, 2021 20:00')).toBeTruthy()
  })
  // you should not use link outside a router
  //   it('renders the attach button if pipette not attached', () => {
  //     const { getByText, getByRole } = render({
  //       pipetteTipRackData: {
  //         pipetteDisplayName: 'my pipette',
  //         tipRacks: [],
  //         exactPipetteMatch: 'incompatible',
  //         pipetteCalDate: null,
  //       },
  //     })
  //     expect(getByRole('button', { name: 'Attach Pipette' })).toBeTruthy()
  //     expect(
  //       getByText('Attach pipette to see calibration information')
  //     ).toBeTruthy()
  //   })

  it('renders the calibrate now button if pipette attached but not calibrated', () => {
    const { getByText, getByRole } = render({
      pipetteTipRackData: {
        pipetteDisplayName: 'my pipette',
        tipRacks: [],
        exactPipetteMatch: 'match',
        pipetteCalDate: null,
      },
    })
    expect(getByRole('button', { name: 'Calibrate Now' })).toBeTruthy()
    expect(getByText('Not calibrated yet')).toBeTruthy()
  })
  it('renders the pipette mismatch info if pipette calibrated but an inexact match', () => {
    const { getByText, getByRole } = render({
      pipetteTipRackData: {
        pipetteDisplayName: 'my pipette',
        tipRacks: [],
        exactPipetteMatch: 'inexact_match',
        pipetteCalDate: 'september 3, 2020',
      },
    })
    expect(
      getByRole('link', { name: 'Pipette Compatibility Help' })
    ).toBeTruthy()
    expect(getByText('Pipette mismatch')).toBeTruthy()
  })
})
