/* eslint-disable opentrons/no-direct-mutating */
import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { createAuthorization, createRegistration } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { getConfig } from '/app/redux/config'
import { getRobotAddressesByName, OPENTRONS_USB } from '/app/redux/discovery'

import type {
  CreateRegistrationParams,
  HostConfig,
} from '@opentrons/api-client'
import type { DiscoveredRobot } from '/app/redux/discovery/types'
import type { State } from '/app/redux/types'

/**
 * Let other clients of the robot know if we're connected via USB,
 * versus any other connection method.
 *
 * Parts of the ODD's first-time unboxing flow rely on this.
 */
export function useUSBRegistration(robot: DiscoveredRobot | null): void {
  // Calling useHost() AND taking a robot argument seems redundant.
  // This was inherited from prior code and I'm scared to touch it.
  // host.name exists, but it appears to be null/undefined in practice.
  const host = useHost()
  const robotName = robot?.name ?? null

  const userId = useSelector(getConfig)?.userInfo?.userId ?? 'Opentrons-user'

  const selectAddresses = useCallback(
    (state: State) => {
      if (robotName == null) {
        return []
      }
      return getRobotAddressesByName(state, robotName)
    },
    [robotName]
  )
  const addresses = useSelector(selectAddresses)
  const isUSBConnected = addresses.some(address => address.ip === OPENTRONS_USB)

  useEffect(() => {
    if (host == null) {
      return
    }

    const registrationParams: CreateRegistrationParams = {
      subject: 'Opentrons',
      agent:
        // define the registration agent as usb if any usb hostname address exists
        isUSBConnected ? 'com.opentrons.app.usb' : 'com.opentrons.app',
      agentId: userId,
    }
    registerAndAuthorize(host, registrationParams)
  }, [host, isUSBConnected, userId])
}

// Other clients will query /system/connected to see if anyone is connected over USB.
// To add ourselves there, we need to hit `/system/authorize` with a token that we get
// from `/system/register`.
//
// These are the robot's older, experimental auth endpoints. We're using them for the
// side effect of client-to-client communication, not for any actual auth.
// We probably can't change this, because we need to support factory-fresh robots that
// are running old ODD software that expects to find the USB info in /system/connected.
async function registerAndAuthorize(
  host: HostConfig,
  registrationParams: CreateRegistrationParams
): Promise<void> {
  const registrationResult = await createRegistration(host, registrationParams)
  await createAuthorization(host, registrationResult.data)
}
