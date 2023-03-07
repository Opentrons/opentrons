import * as React from 'react'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { fireEvent } from '@testing-library/react'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import {
  mockAttachedGen3Pipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { getIsOnDevice } from '../../../redux/config'
import { useAttachedPipettes } from '../../Devices/hooks'
import { ChoosePipette } from '../ChoosePipette'
import { getIsGantryEmpty } from '../utils'
import type { AttachedPipette } from '../../../redux/pipettes/types'

jest.mock('../utils')
jest.mock('../../Devices/hooks')
jest.mock('../../../redux/config')

const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockGetIsGantryEmpty = getIsGantryEmpty as jest.MockedFunction<
  typeof getIsGantryEmpty
>
const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>
const render = (props: React.ComponentProps<typeof ChoosePipette>) => {
  return renderWithProviders(<ChoosePipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedGen3Pipette,
  modelSpecs: {
    ...mockGen3P1000PipetteSpecs,
    displayName: 'mock pipette display name',
  },
}
describe('ChoosePipette', () => {
  let props: React.ComponentProps<typeof ChoosePipette>
  beforeEach(() => {
    mockGetIsOnDevice.mockReturnValue(false)
    mockGetIsGantryEmpty.mockReturnValue(true)
    mockUseAttachedPipettes.mockReturnValue({ left: null, right: null })
    props = {
      proceed: jest.fn(),
      exit: jest.fn(),
      setSelectedPipette: jest.fn(),
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      mount: LEFT,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('returns the correct information, buttons work as expected', () => {
    const { getByText, getByAltText, getByRole, getByTestId } = render(props)
    getByText('Attach Left Pipette')
    getByText('Choose a pipette to attach')
    getByText('1- or 8-Channel pipette')
    getByText('96-Channel pipette')
    getByAltText('1- or 8-Channel pipette')
    getByAltText('96-Channel pipette')
    const singleMountPipettes = getByTestId('ChoosePipette_SingleAndEight')
    const ninetySixPipette = getByTestId('ChoosePipette_NinetySix')

    //  Single and 8-Channel pipettes are selected first by default
    expect(singleMountPipettes).toHaveStyle(
      `background-color: ${String(COLORS.lightBlue)}`
    )
    expect(ninetySixPipette).toHaveStyle(
      `background-color: ${String(COLORS.white)}`
    )

    //  Selecting 96-Channel called setSelectedPipette prop
    fireEvent.click(ninetySixPipette)
    expect(props.setSelectedPipette).toHaveBeenCalled()

    //  Selecting Single and 8-Channel pipettes called setSelectedPipette prop
    fireEvent.click(singleMountPipettes)
    expect(props.setSelectedPipette).toHaveBeenCalled()

    const proceedBtn = getByRole('button', { name: 'next' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
  })
  it('returns the correct information, buttons work as expected for on device display', () => {
    mockGetIsOnDevice.mockReturnValue(true)
    const { getByText, getByLabelText, getByTestId } = render(props)
    getByText('Attach Left Pipette')
    getByText('Choose a pipette to attach')
    getByText('1- or 8-Channel pipette')
    getByText('96-Channel pipette')
    const singleMountPipettes = getByTestId(
      'ChoosePipette_SingleAndEight_OnDevice'
    )
    const ninetySixPipette = getByTestId('ChoosePipette_NinetySix_OnDevice')

    //  Single and 8-Channel pipettes are selected first by default
    expect(singleMountPipettes).toHaveStyle(`background-color: #9c3ba4`)
    expect(ninetySixPipette).toHaveStyle(`background-color: #cccccc`)

    //  Selecting 96-Channel called setSelectedPipette prop
    fireEvent.click(ninetySixPipette)
    expect(props.setSelectedPipette).toHaveBeenCalled()

    //  Selecting Single and 8-Channel pipettes called setSelectedPipette prop
    fireEvent.click(singleMountPipettes)
    expect(props.setSelectedPipette).toHaveBeenCalled()

    const proceedBtn = getByLabelText('SmallButton_Default')
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders exit button and clicking on it renders the exit modal, clicking on back button works', () => {
    const { getByText, getByLabelText } = render(props)
    const exit = getByLabelText('Exit')
    fireEvent.click(exit)
    getByText('Attaching Pipette progress will be lost')
    getByText(
      'Are you sure you want to exit before completing Attaching Pipette?'
    )
    const goBack = getByText('Go back')
    fireEvent.click(goBack)
    getByText('Choose a pipette to attach')
  })
  it('renders exit button and clicking on it renders the exit modal, clicking on exit button works', () => {
    const { getByText, getByRole, getByLabelText } = render(props)
    const exit = getByLabelText('Exit')
    fireEvent.click(exit)
    getByText('Attaching Pipette progress will be lost')
    getByText(
      'Are you sure you want to exit before completing Attaching Pipette?'
    )
    const exitButton = getByRole('button', { name: 'exit' })
    fireEvent.click(exitButton)
    expect(props.exit).toHaveBeenCalled()
  })
  it('renders the 96 channel pipette option selected', () => {
    props = { ...props, selectedPipette: NINETY_SIX_CHANNEL }
    const { getByTestId } = render(props)
    const singleMountPipettes = getByTestId('ChoosePipette_SingleAndEight')
    const ninetySixPipette = getByTestId('ChoosePipette_NinetySix')
    expect(singleMountPipettes).toHaveStyle(
      `background-color: ${String(COLORS.white)}`
    )
    expect(ninetySixPipette).toHaveStyle(
      `background-color: ${String(COLORS.lightBlue)}`
    )
  })
  it('renders the correct text for the 96 channel button when there is a left pipette attached', () => {
    mockGetIsGantryEmpty.mockReturnValue(false)
    mockUseAttachedPipettes.mockReturnValue({ left: mockPipette, right: null })
    props = { ...props, selectedPipette: NINETY_SIX_CHANNEL }
    const { getByText } = render(props)
    getByText('Detach mock pipette display name and attach 96-Channel pipette')
  })
  it('renders the correct text for the 96 channel button when there is a right pipette attached', () => {
    mockGetIsGantryEmpty.mockReturnValue(false)
    mockUseAttachedPipettes.mockReturnValue({ left: null, right: mockPipette })
    props = { ...props, selectedPipette: NINETY_SIX_CHANNEL }
    const { getByText } = render(props)
    getByText('Detach mock pipette display name and attach 96-Channel pipette')
  })
})
