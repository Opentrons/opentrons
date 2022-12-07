import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { CheckPipetteButton } from '../CheckPipetteButton'
import { MountPipette } from '../MountPipette'
import type { AttachedPipette } from '../../../redux/pipettes/types'

jest.mock('../CheckPipetteButton')

const mockCheckPipetteButton = CheckPipetteButton as jest.MockedFunction<
  typeof CheckPipetteButton
>
const render = (props: React.ComponentProps<typeof MountPipette>) => {
  return renderWithProviders(<MountPipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('MountPipette', () => {
  let props: React.ComponentProps<typeof MountPipette>
  beforeEach(() => {
    props = {
      robotName: 'otie',
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest.fn(),
      runId: RUN_ID_1,
      attachedPipette: { left: mockPipette, right: null },
      flowType: FLOWS.ATTACH,
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isRobotMoving: false,
    }
    mockCheckPipetteButton.mockReturnValue(<div>mock check pipette button</div>)
  })
  it('returns the correct information, buttons work as expected', () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Connect and screw in pipette')
    getByText(
      'Hold onto the pipette so it does not fall. Attach the pipette to the robot by alinging the pins and ensuring a secure connection with the pins.'
    )
    getByText(
      'Hold the pipette in place and use the hex screwdriver to tighten the pipette screws. Then test that the pipette is securely attached by gently pulling it side to side.'
    )
    getByAltText('Screw pattern')

    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    expect(props.goBack).toHaveBeenCalled()
    getByText('mock check pipette button')
  })
})
