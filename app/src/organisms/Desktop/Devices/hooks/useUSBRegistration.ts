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

export function useUSBRegistration(robot: DiscoveredRobot | null): void {
  const userId = useSelector(getConfig)?.userInfo?.userId ?? 'Opentrons-user'

  console.error('USERID', userId)

  const host = useHost()
  console.error('HOST', host)
  const robotName = robot?.name ?? null

  const selectAddresses = useCallback(
    (state: State) => {
      if (robotName == null) {
        return []
      }
      console.error('MAX:', state, robotName, getRobotAddressesByName)
      const result = getRobotAddressesByName(state, robotName)
      console.error('Returned', result)
      return result
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
        // may change when ODD no longer needs to rely on this
        isUSBConnected ? 'com.opentrons.app.usb' : 'com.opentrons.app',
      agentId: userId,
    }
    registerAndAuthorize(host, registrationParams)
  }, [host, isUSBConnected, userId])
}

async function registerAndAuthorize(
  host: HostConfig,
  registrationParams: CreateRegistrationParams
): Promise<void> {
  const registrationResult = await createRegistration(host, registrationParams)
  await createAuthorization(host, registrationResult.data)
}
