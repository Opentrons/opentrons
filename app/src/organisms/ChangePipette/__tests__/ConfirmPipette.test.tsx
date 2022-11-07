import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { LEFT } from '@opentrons/shared-data'
import { mockPipetteInfo } from '../../../redux/pipettes/__fixtures__'
import { CheckPipettesButton } from '../CheckPipettesButton'
import { ConfirmPipette } from '../ConfirmPipette'

import type {
  PipetteModelSpecs,
  PipetteNameSpecs,
} from '@opentrons/shared-data'
import type { PipetteOffsetCalibration } from '../../../redux/calibration/types'

jest.mock('../CheckPipettesButton')

const mockCheckPipettesButton = CheckPipettesButton as jest.MockedFunction<
  typeof CheckPipettesButton
>

const render = (props: React.ComponentProps<typeof ConfirmPipette>) => {
  return renderWithProviders(<ConfirmPipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const MOCK_ACTUAL_PIPETTE = {
  ...mockPipetteInfo.pipetteSpecs,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as any as PipetteModelSpecs

const MOCK_ACTUAL_PIPETTE_EIGHT_CHANNEL = {
  channels: 8,
  name: 'p10_multi',
} as PipetteModelSpecs

const MOCK_WANTED_PIPETTE = {
  displayName: 'P300 8-Channel GEN2',
  displayCategory: 'GEN2',
  defaultAspirateFlowRate: {
    value: 94,
    min: 1,
    max: 275,
    valuesByApiLevel: {
      '2.0': 94,
    },
  },
  defaultDispenseFlowRate: {
    value: 94,
    min: 1,
    max: 275,
    valuesByApiLevel: {
      '2.0': 94,
    },
  },
  defaultBlowOutFlowRate: {
    value: 94,
    min: 1,
    max: 275,
    valuesByApiLevel: {
      '2.0': 94,
    },
  },
  channels: 8,
  minVolume: 20,
  maxVolume: 300,
  smoothieConfigs: {
    stepsPerMM: 3200,
    homePosition: 155.75,
    travelDistance: 60,
  },
  defaultTipracks: [
    'opentrons/opentrons_96_tiprack_300ul/1',
    'opentrons/opentrons_96_filtertiprack_200ul/1',
  ],
  name: 'p300_multi_gen2',
} as PipetteNameSpecs

describe('ConfirmPipette', () => {
  let props: React.ComponentProps<typeof ConfirmPipette>

  it('Should detach a pipette successfully', () => {
    props = {
      robotName: 'otie',
      success: true,
      attachedWrong: false,
      wantedPipette: null,
      actualPipette: MOCK_ACTUAL_PIPETTE,
      actualPipetteOffset: {} as PipetteOffsetCalibration,
      displayName: 'P10',
      displayCategory: 'GEN1',
      tryAgain: jest.fn(),
      exit: jest.fn(),
      toCalibrationDashboard: jest.fn(),
      mount: LEFT,
      setWrongWantedPipette: jest.fn(),
      wrongWantedPipette: null,
      confirmPipetteLevel: false,
      setConfirmPipetteLevel: jest.fn(),
    }

    const { getByText, getByRole } = render(props)
    getByText('Successfully detached pipette!')
    const btn = getByRole('button', { name: 'exit' })
    fireEvent.click(btn)
    expect(props.exit).toHaveBeenCalled()
  })

  it('Should detect a pipette if still attached when detaching', () => {
    props = {
      robotName: 'otie',
      success: false,
      attachedWrong: false,
      wantedPipette: null,
      actualPipette: MOCK_ACTUAL_PIPETTE,
      actualPipetteOffset: {} as PipetteOffsetCalibration,
      displayName: 'P10',
      displayCategory: 'GEN1',
      tryAgain: jest.fn(),
      exit: jest.fn(),
      toCalibrationDashboard: jest.fn(),
      mount: LEFT,
      setWrongWantedPipette: jest.fn(),
      wrongWantedPipette: null,
      confirmPipetteLevel: false,
      setConfirmPipetteLevel: jest.fn(),
    }

    const { getByText, getByRole } = render(props)
    getByText('Pipette still detected')
    getByText(
      'Check again to ensure that pipette is unplugged and entirely detached from the robot.'
    )

    const leaveAttachedBtn = getByRole('button', { name: 'Leave attached' })
    fireEvent.click(leaveAttachedBtn)
    expect(props.exit).toBeCalled()

    const tryAgainBtn = getByRole('button', { name: 'Try again' })
    fireEvent.click(tryAgainBtn)
    expect(props.tryAgain).toBeCalled()
  })

  it('Should show incorrect pipette attached for single channel when the actual pipette is different', () => {
    props = {
      robotName: 'otie',
      success: false,
      attachedWrong: true,
      wantedPipette: MOCK_WANTED_PIPETTE,
      actualPipette: MOCK_ACTUAL_PIPETTE,
      actualPipetteOffset: {} as PipetteOffsetCalibration,
      displayName: '',
      displayCategory: null,
      tryAgain: jest.fn(),
      exit: jest.fn(),
      toCalibrationDashboard: jest.fn(),
      mount: LEFT,
      setWrongWantedPipette: jest.fn(),
      wrongWantedPipette: null,
      confirmPipetteLevel: false,
      setConfirmPipetteLevel: jest.fn(),
    }

    const { getByText, getByRole } = render(props)
    getByText('Incorrect pipette attached')
    getByText(
      'The attached does not match the P300 8-Channel GEN2 you had originally selected.'
    )
    const detachTryAgainBtn = getByRole('button', {
      name: 'Detach and try again',
    })
    fireEvent.click(detachTryAgainBtn)
    expect(props.tryAgain).toBeCalled()
    const useAttachedBtn = getByRole('button', { name: 'Use attached pipette' })
    fireEvent.click(useAttachedBtn)
    expect(props.setWrongWantedPipette).toHaveBeenCalled()
  })

  it('Should show success modal when incorrect pipette attached but user accepts it', () => {
    props = {
      robotName: 'otie',
      success: false,
      attachedWrong: true,
      wantedPipette: MOCK_ACTUAL_PIPETTE,
      actualPipette: MOCK_ACTUAL_PIPETTE,
      actualPipetteOffset: {} as PipetteOffsetCalibration,
      displayName: '',
      displayCategory: null,
      tryAgain: jest.fn(),
      exit: jest.fn(),
      toCalibrationDashboard: jest.fn(),
      mount: LEFT,
      setWrongWantedPipette: jest.fn(),
      wrongWantedPipette: MOCK_ACTUAL_PIPETTE,
      confirmPipetteLevel: false,
      setConfirmPipetteLevel: jest.fn(),
    }

    const { getByText, getByRole } = render(props)
    getByText('Pipette attached!')
    getByText('P10 Single-Channel is now ready to use.')
    const btn = getByRole('button', { name: 'exit' })
    fireEvent.click(btn)
    expect(props.exit).toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Calibrate pipette offset' })
    ).not.toBeInTheDocument()
  })

  it('renders incorrect pipette attached for eight channel when the actual pipette is different', () => {
    props = {
      robotName: 'otie',
      success: false,
      attachedWrong: true,
      wantedPipette: MOCK_WANTED_PIPETTE,
      actualPipette: MOCK_ACTUAL_PIPETTE_EIGHT_CHANNEL,
      actualPipetteOffset: {} as PipetteOffsetCalibration,
      displayName: '',
      displayCategory: null,
      tryAgain: jest.fn(),
      exit: jest.fn(),
      toCalibrationDashboard: jest.fn(),
      mount: LEFT,
      setWrongWantedPipette: jest.fn(),
      wrongWantedPipette: null,
      confirmPipetteLevel: false,
      setConfirmPipetteLevel: jest.fn(),
    }

    const { getByText, getByRole } = render(props)
    getByText('Incorrect pipette attached')
    getByText(
      'The attached does not match the P300 8-Channel GEN2 you had originally selected.'
    )
    const detachTryAgainBtn = getByRole('button', {
      name: 'Detach and try again',
    })
    fireEvent.click(detachTryAgainBtn)
    expect(props.tryAgain).toBeCalled()
    const useAttachedBtn = getByRole('button', { name: 'Use attached pipette' })
    fireEvent.click(useAttachedBtn)
    expect(props.setWrongWantedPipette).toHaveBeenCalled()
  })

  it('Should show pipette leveling modal when incorrect pipette attached for 8 channel but user accepts it', () => {
    props = {
      robotName: 'otie',
      success: false,
      attachedWrong: true,
      wantedPipette: MOCK_WANTED_PIPETTE,
      actualPipette: MOCK_WANTED_PIPETTE as PipetteModelSpecs,
      actualPipetteOffset: {} as PipetteOffsetCalibration,
      displayName: '',
      displayCategory: null,
      tryAgain: jest.fn(),
      exit: jest.fn(),
      toCalibrationDashboard: jest.fn(),
      mount: LEFT,
      setWrongWantedPipette: jest.fn(),
      wrongWantedPipette: MOCK_WANTED_PIPETTE,
      confirmPipetteLevel: false,
      setConfirmPipetteLevel: jest.fn(),
    }

    const { getByText, getByRole } = render(props)
    getByText('Level the pipette')
    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    expect(props.tryAgain).toHaveBeenCalled()
    const continueBtn = getByRole('button', { name: 'Confirm level' })
    fireEvent.click(continueBtn)
    expect(props.setConfirmPipetteLevel).toHaveBeenCalled()
  })

  it('renders the success modal when the confirmPipetteLevel is true when attaching an incorrect 8 channel pipette with no pipetteoffset data', () => {
    props = {
      robotName: 'otie',
      success: false,
      attachedWrong: true,
      wantedPipette: MOCK_WANTED_PIPETTE,
      actualPipette: MOCK_WANTED_PIPETTE as PipetteModelSpecs,
      actualPipetteOffset: null,
      displayName: '',
      displayCategory: null,
      tryAgain: jest.fn(),
      exit: jest.fn(),
      toCalibrationDashboard: jest.fn(),
      mount: LEFT,
      setWrongWantedPipette: jest.fn(),
      wrongWantedPipette: MOCK_WANTED_PIPETTE,
      confirmPipetteLevel: true,
      setConfirmPipetteLevel: jest.fn(),
    }

    const { getByText, getByRole } = render(props)
    getByText('Pipette attached!')
    getByText('P300 8-Channel GEN2 is now ready to use.')
    const btn = getByRole('button', { name: 'exit' })
    fireEvent.click(btn)
    expect(props.exit).toHaveBeenCalled()
    const pocBtn = getByRole('button', { name: 'Calibrate pipette offset' })
    fireEvent.click(pocBtn)
    expect(props.toCalibrationDashboard).toBeCalled()
  })

  it('Should show unable to detect pipette when a pipette is not connected', () => {
    mockCheckPipettesButton.mockReturnValue(<div>mock re-check connection</div>)
    props = {
      robotName: 'otie',
      success: false,
      attachedWrong: false,
      wantedPipette: MOCK_WANTED_PIPETTE,
      actualPipette: null,
      actualPipetteOffset: {} as PipetteOffsetCalibration,
      displayName: '',
      displayCategory: null,
      tryAgain: jest.fn(),
      exit: jest.fn(),
      toCalibrationDashboard: jest.fn(),
      mount: LEFT,
      setWrongWantedPipette: jest.fn(),
      wrongWantedPipette: null,
      confirmPipetteLevel: false,
      setConfirmPipetteLevel: jest.fn(),
    }

    const { getByText, getByRole } = render(props)
    getByText('Unable to detect P300 8-Channel GEN2')
    getByText(
      'Make sure to press the white connector tab in as far as you can, and that you feel it connect with the pipette.'
    )

    const cancelAttachmentBtn = getByRole('button', {
      name: 'Cancel attachment',
    })
    fireEvent.click(cancelAttachmentBtn)
    expect(props.exit).toBeCalled()

    getByText('mock re-check connection')
  })

  it('Should attach a pipette successfully', () => {
    props = {
      robotName: 'otie',
      success: true,
      attachedWrong: false,
      wantedPipette: MOCK_ACTUAL_PIPETTE,
      actualPipette: MOCK_ACTUAL_PIPETTE,
      actualPipetteOffset: {} as PipetteOffsetCalibration,
      displayName: '',
      displayCategory: null,
      tryAgain: jest.fn(),
      exit: jest.fn(),
      toCalibrationDashboard: jest.fn(),
      mount: LEFT,
      setWrongWantedPipette: jest.fn(),
      wrongWantedPipette: null,
      confirmPipetteLevel: false,
      setConfirmPipetteLevel: jest.fn(),
    }

    const { getByText, getByRole } = render(props)
    getByText('Pipette attached!')
    getByText('P10 Single-Channel is now ready to use.')
    const btn = getByRole('button', { name: 'exit' })
    fireEvent.click(btn)
    expect(props.exit).toHaveBeenCalled()
  })

  it('Should attach a pipette successfully when there is no POC data', () => {
    props = {
      robotName: 'otie',
      success: true,
      attachedWrong: false,
      wantedPipette: MOCK_ACTUAL_PIPETTE,
      actualPipette: MOCK_ACTUAL_PIPETTE,
      actualPipetteOffset: null,
      displayName: '',
      displayCategory: null,
      tryAgain: jest.fn(),
      exit: jest.fn(),
      toCalibrationDashboard: jest.fn(),
      mount: LEFT,
      setWrongWantedPipette: jest.fn(),
      wrongWantedPipette: null,
      confirmPipetteLevel: false,
      setConfirmPipetteLevel: jest.fn(),
    }

    const { getByText, getByRole } = render(props)
    getByText('Pipette attached!')
    getByText('P10 Single-Channel is now ready to use.')
    const btn = getByRole('button', { name: 'exit' })
    fireEvent.click(btn)
    expect(props.exit).toHaveBeenCalled()

    const pocBtn = getByRole('button', { name: 'Calibrate pipette offset' })
    fireEvent.click(pocBtn)
    expect(props.toCalibrationDashboard).toBeCalled()
  })
})
