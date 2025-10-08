import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LEFT, NINETY_SIX_CHANNEL } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockAttachedPipetteInformation } from '/app/redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '/app/resources/runs/__fixtures__'

import { FLOWS } from '../constants'
import { RemoveWasteChute } from '../RemoveWasteChute'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof RemoveWasteChute>) => {
  return renderWithProviders(<RemoveWasteChute {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RemoveWasteChute', () => {
  let props: ComponentProps<typeof RemoveWasteChute>
  beforeEach(() => {
    props = {
      mount: LEFT,
      goBack: vi.fn(),
      proceed: vi.fn(),
      chainRunCommands: vi.fn().mockImplementationOnce(() => Promise.resolve()),
      maintenanceRunId: RUN_ID_1,
      attachedPipettes: { left: mockAttachedPipetteInformation, right: null },
      flowType: FLOWS.ATTACH,
      errorMessage: null,
      setShowErrorMessage: vi.fn(),
      isRobotMoving: false,
      selectedPipette: NINETY_SIX_CHANNEL,
      isOnDevice: false,
    }
  })
  it('returns the correct information, buttons work as expected for attach flow', async () => {
    render(props)
    screen.getByText('Remove waste chute')
    screen.getByText(
      'Remove the waste chute from the deck plate adapter before proceeding.'
    )
    screen.getByLabelText('icon_error')
    screen.getByText(
      'If the waste chute isn’t removed, the pipette WILL crash into it.'
    )
    const proceedBtn = screen.getByRole('button', { name: 'Continue' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
    const backBtn = screen.getByLabelText('back')
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })
})
