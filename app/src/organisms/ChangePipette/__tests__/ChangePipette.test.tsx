import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import { getAttachedPipettes } from '../../../redux/pipettes'
import { i18n } from '../../../i18n'
import { getHasCalibrationBlock, useFeatureFlag } from '../../../redux/config'
import { ChangePipette } from '..'
import { getMovementStatus } from '../../../redux/robot-controls'
import { getCalibrationForPipette } from '../../../redux/calibration'
import { useCalibratePipetteOffset } from '../../CalibratePipetteOffset/useCalibratePipetteOffset'
import {
  DispatchApiRequestType,
  getRequestById,
  useDispatchApiRequests,
} from '../../../redux/robot-api'

jest.mock('@opentrons/shared-data', () => ({
  getAllPipetteNames: jest.fn(
    jest.requireActual('@opentrons/shared-data').getAllPipetteNames
  ),
  getPipetteNameSpecs: jest.fn(),
}))
jest.mock('../../../redux/config')
jest.mock('../../../redux/pipettes')
jest.mock('../../../redux/robot-controls')
jest.mock('../../../redux/calibration')
jest.mock('../../CalibratePipetteOffset/useCalibratePipetteOffset')
jest.mock('../../../redux/robot-api')

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const mockGetPipetteNameSpecs = getPipetteNameSpecs as jest.MockedFunction<
  typeof getPipetteNameSpecs
>
const mockGetAttachedPipettes = getAttachedPipettes as jest.MockedFunction<
  typeof getAttachedPipettes
>
const mockGetMovementStatus = getMovementStatus as jest.MockedFunction<
  typeof getMovementStatus
>
const mockGetCalibrationForPipette = getCalibrationForPipette as jest.MockedFunction<
  typeof getCalibrationForPipette
>
const mockUseCalibratePipetteOffset = useCalibratePipetteOffset as jest.MockedFunction<
  typeof useCalibratePipetteOffset
>
const mockGetHasCalibrationBlock = getHasCalibrationBlock as jest.MockedFunction<
  typeof getHasCalibrationBlock
>
const mockGetRequestById = getRequestById as jest.MockedFunction<
  typeof getRequestById
>
const mockUseDispatchApiRequests = useDispatchApiRequests as jest.MockedFunction<
  typeof useDispatchApiRequests
>
const render = (props: React.ComponentProps<typeof ChangePipette>) => {
  return renderWithProviders(<ChangePipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ChangePipette', () => {
  let props: React.ComponentProps<typeof ChangePipette>
  let dispatchApiRequest: DispatchApiRequestType

  beforeEach(() => {
    props = {
      robotName: 'otie',
      mount: 'left',
      closeModal: jest.fn(),
    }
    dispatchApiRequest = jest.fn()
    mockUseFeatureFlag.mockReturnValue(true)
    mockGetPipetteNameSpecs.mockReturnValue(null)
    mockGetAttachedPipettes.mockReturnValue({ left: null, right: null })
    mockGetRequestById.mockReturnValue(null)
    mockUseDispatchApiRequests.mockReturnValue([dispatchApiRequest, []])
    mockGetCalibrationForPipette.mockReturnValue(null)
    mockGetMovementStatus.mockReturnValue(null)
    mockGetHasCalibrationBlock.mockReturnValue(false)
  })

  it('renders the Clear deck page of the wizard flow', () => {
    const { getByText } = render(props)
    getByText('test')
  })
})
