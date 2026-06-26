import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LEFT, NINETY_SIX_CHANNEL } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockAttachedPipetteInformation } from '/app/resources/instruments/__fixtures__'
import { RUN_ID_1 } from '/app/resources/runs/__fixtures__'

import { AttachWasteChute } from '../AttachWasteChute'
import { FLOWS } from '../constants'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof AttachWasteChute>) => {
  return renderWithProviders(<AttachWasteChute {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AttachWasteChute', () => {
  let props: ComponentProps<typeof AttachWasteChute>
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
    screen.getByText('Re-attach waste chute')
    screen.getByText(
      'Re-attach waste chute to match current deck configuration.'
    )
    const proceedBtn = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
  })
})
