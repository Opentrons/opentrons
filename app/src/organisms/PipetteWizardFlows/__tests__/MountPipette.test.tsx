import * as React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { FLOWS } from '../constants'
import { MountPipette } from '../MountPipette'

const render = (props: React.ComponentProps<typeof MountPipette>) => {
  return renderWithProviders(<MountPipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('MountPipette', () => {
  let props: React.ComponentProps<typeof MountPipette>
  jest.useFakeTimers()
  beforeEach(() => {
    props = {
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      flowType: FLOWS.ATTACH,
    }
  })
  it('returns the correct information, buttons work as expected', async () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Mount Pipette')
    getByText(
      'Hold onto the pipette so it does not fall. Attach the pipette to the robot by alinging the pins and ensuring a secure connection with the pins.'
    )
    getByText(
      'If you are stuck on this screen after you have connected a pipette, there is more than likely a problem with the pipette.'
    )
    getByRole('button', { name: 'Detach and reattach pipette' })
    getByAltText('Screw pattern')

    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    expect(props.goBack).toHaveBeenCalled()

    await waitFor(() => {
      jest.runOnlyPendingTimers()
    })

    getByText('P1000 Single-Channel GEN3 Pipette Detected')
    getByText(
      'While continuing to hold in place, grab your 2.5mm driver and tighten screws as shown in the animation. Test the pipette attachment by giving it a wiggle before pressing continue'
    )
    getByAltText('Screw pattern pt 2')
    getByRole('button', { name: 'Go back' })
    const proceedBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
  })
})
