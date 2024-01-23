import * as React from 'react'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { fireEvent, screen } from '@testing-library/react'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { mockAttachedPipetteInformation } from '../../../redux/pipettes/__fixtures__'
import { getIsOnDevice } from '../../../redux/config'
import { useAttachedPipettesFromInstrumentsQuery } from '../../Devices/hooks'
import { ChoosePipette } from '../ChoosePipette'
import { getIsGantryEmpty } from '../utils'

jest.mock('../utils')
jest.mock('../../Devices/hooks')
jest.mock('../../../redux/config')

const mockUseAttachedPipettesFromInstrumentsQuery = useAttachedPipettesFromInstrumentsQuery as jest.MockedFunction<
  typeof useAttachedPipettesFromInstrumentsQuery
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

describe('ChoosePipette', () => {
  let props: React.ComponentProps<typeof ChoosePipette>
  beforeEach(() => {
    mockGetIsOnDevice.mockReturnValue(false)
    mockGetIsGantryEmpty.mockReturnValue(true)
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: null,
    })
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
    render(props)
    screen.getByText('Attach Left Pipette')
    screen.getByText('Choose a pipette to attach')
    screen.getByText('1- or 8-Channel pipette')
    screen.getByText('96-Channel pipette')
    screen.getByAltText('1- or 8-Channel pipette')
    screen.getByAltText('96-Channel pipette')
    const singleMountPipettes = screen.getByRole('radio', {
      name: '1- or 8-Channel pipette 1- or 8-Channel pipette',
    })
    const ninetySixPipette = screen.getByRole('radio', {
      name: '96-Channel pipette 96-Channel pipette',
    })

    //  Single and 8-Channel pipettes are selected first by default
    expect(singleMountPipettes).toHaveStyle(
      `background-color: ${COLORS.blue10}`
    )
    expect(ninetySixPipette).toHaveStyle(`background-color: ${COLORS.white}`)

    //  Selecting 96-Channel called setSelectedPipette prop
    fireEvent.click(ninetySixPipette)
    expect(props.setSelectedPipette).toHaveBeenCalled()

    //  Selecting Single and 8-Channel pipettes called setSelectedPipette prop
    fireEvent.click(singleMountPipettes)
    expect(props.setSelectedPipette).toHaveBeenCalled()

    const proceedBtn = screen.getByRole('button', { name: 'Continue' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
  })
  it('returns the correct information, buttons work as expected for on device display', () => {
    mockGetIsOnDevice.mockReturnValue(true)
    render(props)
    screen.getByText('Attach Left Pipette')
    screen.getByText('Choose a pipette to attach')
    const singleMountPipettes = screen.getByText('1- or 8-Channel pipette')
    const ninetySixPipette = screen.getByText('96-Channel pipette')

    //  Selecting 96-Channel called setSelectedPipette prop
    fireEvent.click(ninetySixPipette)
    expect(props.setSelectedPipette).toHaveBeenCalled()

    //  Selecting Single and 8-Channel pipettes called setSelectedPipette prop
    fireEvent.click(singleMountPipettes)
    expect(props.setSelectedPipette).toHaveBeenCalled()

    const proceedBtn = screen.getByRole('button', { name: 'Continue' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders exit button and clicking on it renders the exit modal, clicking on back button works', () => {
    render(props)
    const exit = screen.getByLabelText('Exit')
    fireEvent.click(exit)
    screen.getByText('Attaching Pipette progress will be lost')
    screen.getByText(
      'Are you sure you want to exit before completing Attaching Pipette?'
    )
    const goBack = screen.getByText('Go back')
    fireEvent.click(goBack)
    screen.getByText('Choose a pipette to attach')
  })
  it('renders exit button and clicking on it renders the exit modal, clicking on exit button works', () => {
    render(props)
    const exit = screen.getByLabelText('Exit')
    fireEvent.click(exit)
    screen.getByText('Attaching Pipette progress will be lost')
    screen.getByText(
      'Are you sure you want to exit before completing Attaching Pipette?'
    )
    const exitButton = screen.getByRole('button', { name: 'exit' })
    fireEvent.click(exitButton)
    expect(props.exit).toHaveBeenCalled()
  })
  it('renders the 96 channel pipette option selected', () => {
    props = { ...props, selectedPipette: NINETY_SIX_CHANNEL }
    render(props)
    const singleMountPipettes = screen.getByRole('radio', {
      name: '1- or 8-Channel pipette 1- or 8-Channel pipette',
    })
    const ninetySixPipette = screen.getByRole('radio', {
      name: '96-Channel pipette 96-Channel pipette',
    })
    expect(singleMountPipettes).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(ninetySixPipette).toHaveStyle(`background-color: ${COLORS.blue10}`)
  })
  it('renders the correct text for the 96 channel button when there is a left pipette attached', () => {
    mockGetIsGantryEmpty.mockReturnValue(false)
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    props = { ...props, selectedPipette: NINETY_SIX_CHANNEL }
    render(props)
    screen.getByText(
      'Detach Flex 1-Channel 1000 μL and attach 96-Channel pipette'
    )
  })
  it('renders the correct text for the 96 channel button when there is a right pipette attached', () => {
    mockGetIsGantryEmpty.mockReturnValue(false)
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: mockAttachedPipetteInformation,
    })
    props = { ...props, selectedPipette: NINETY_SIX_CHANNEL }
    render(props)
    screen.getByText(
      'Detach Flex 1-Channel 1000 μL and attach 96-Channel pipette'
    )
  })
})
