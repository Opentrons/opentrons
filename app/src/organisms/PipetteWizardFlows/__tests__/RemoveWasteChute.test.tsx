import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LEFT, NINETY_SIX_CHANNEL } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockAttachedPipetteInformation } from '/app/resources/instruments/__fixtures__'
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
    screen.getByText('Remove waste chute before calibrating.')
    screen.getByText(
      'A collision will occur with the pipette if the waste chute remains on deck.'
    )
    const proceedBtn = screen.getByRole('button', { name: 'Begin calibration' })
    fireEvent.click(proceedBtn)
    await waitFor(() => {
      expect(props.chainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'verifyTipPresence',
            params: {
              pipetteId: 'abc',
              expectedState: 'present',
              followSingularSensor: 'primary',
            },
          },
        ],
        false
      )
    })
    await waitFor(() => {
      expect(props.chainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'home',
            params: { axes: ['leftZ'] },
          },
          {
            commandType: 'home',
            params: { skipIfMountPositionOk: 'left' },
          },
          {
            commandType: 'calibration/calibratePipette',
            params: { mount: 'left' },
          },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: 'left' },
          },
        ],
        false
      )
    })
  })
})
