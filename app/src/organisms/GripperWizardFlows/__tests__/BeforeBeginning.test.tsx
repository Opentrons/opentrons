import * as React from 'react'
import { waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { InProgressModal } from '../../../molecules/InProgressModal/InProgressModal'
// import { NeedHelpLink } from '../../CalibrationPanels'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { BeforeBeginning } from '../BeforeBeginning'
import { GRIPPER_FLOW_TYPES } from '../constants'

jest.mock('../../../molecules/InProgressModal/InProgressModal')

const mockInProgressModal = InProgressModal as jest.MockedFunction<
  typeof InProgressModal
>
// const mockNeedHelpLink = NeedHelpLink as jest.MockedFunction<
//   typeof NeedHelpLink
// >

const render = (props: React.ComponentProps<typeof BeforeBeginning>) => {
  return renderWithProviders(<BeforeBeginning {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('BeforeBeginning', () => {
  let props: React.ComponentProps<typeof BeforeBeginning>
  beforeEach(() => {
    props = {
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve()),
      maintenanceRunId: RUN_ID_1,
      attachedGripper: {},
      flowType: GRIPPER_FLOW_TYPES.ATTACH,
      createMaintenanceRun: jest.fn(),
      isCreateLoading: false,
      isRobotMoving: false,
      setShowErrorMessage: jest.fn(),
      errorMessage: null,
    }
    // mockNeedHelpLink.mockReturnValue(<div>mock need help link</div>)
    mockInProgressModal.mockReturnValue(<div>mock in progress</div>)
  })
  it('returns the correct information for attach flow', async () => {
    const { getByText, getByRole } = render(props)
    getByText('Before you begin')
    getByText(
      'To get started, remove labware from the rest of the deck and clean up the work area to make attachment and calibration easier. Also gather the needed equipment shown on the right hand side'
    )
    getByText(
      'The calibration pin is included with the gripper and should be stored on the exposed panel of the gripper.'
    )
    getByText('You will need:')
    // getByText('mock need help link')
    getByText('Calibration Pin')
    getByText('2.5 mm Hex Screwdriver')
    getByText(
      'Provided with robot. Using another size can strip the instrument’s screws.'
    )
    getByText('Gripper')

    getByRole('button', { name: 'Move gantry to front' }).click()
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'home',
          params: {},
        },
        {
          commandType: 'calibration/moveToMaintenancePosition',
          params: { mount: 'left' },
        },
      ],
      false
    )
    await waitFor(() => {
      expect(props.proceed).toHaveBeenCalled()
    })
  })
  it('returns the correct information for detach flow', async () => {
    props = { ...props, flowType: GRIPPER_FLOW_TYPES.DETACH }
    const { getByText, getByRole } = render(props)
    getByText('Before you begin')
    getByText(
      'To get started, remove labware from the rest of the deck and clean up the work area to make attachment and calibration easier. Also gather the needed equipment shown on the right hand side'
    )
    getByText('You will need:')
    getByText('2.5 mm Hex Screwdriver')
    getByText(
      'Provided with robot. Using another size can strip the instrument’s screws.'
    )
    // getByText('mock need help link')

    getByRole('button', { name: 'Move gantry to front' }).click()
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        { commandType: 'home', params: {} },
        {
          commandType: 'calibration/moveToMaintenancePosition',
          params: { mount: 'left' },
        },
      ],
      false
    )
    await waitFor(() => {
      expect(props.proceed).toHaveBeenCalled()
    })
  })
  it('returns the correct information for recalibrate flow', async () => {
    props = { ...props, flowType: GRIPPER_FLOW_TYPES.RECALIBRATE }
    const { getByText, getByRole } = render(props)
    getByText('Before you begin')
    getByText(
      'To get started, remove labware from the rest of the deck and clean up the work area to make attachment and calibration easier. Also gather the needed equipment shown on the right hand side'
    )
    getByText(
      'The calibration pin is included with the gripper and should be stored on the exposed panel of the gripper.'
    )
    getByText('You will need:')
    getByText('Calibration Pin')
    getByText('Gripper')
    // getByText('mock need help link')

    getByRole('button', { name: 'Move gantry to front' }).click()
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'home',
          params: {},
        },
        {
          commandType: 'calibration/moveToMaintenancePosition',
          params: { mount: 'left' },
        },
      ],
      false
    )
    await waitFor(() => {
      expect(props.proceed).toHaveBeenCalled()
    })
  })
  it('returns the correct information for in progress modal when robot is moving', () => {
    props = {
      ...props,
      isRobotMoving: true,
    }
    const { getByText } = render(props)
    getByText('mock in progress')
  })
})
