import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_6,
  SPACING,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { RobotCard } from '../../../organisms/Devices/RobotCard'
import { DevicesEmptyState } from '../../../organisms/Devices/DevicesEmptyState'
import { CollapsibleSection } from '../../../molecules/CollapsibleSection'
import { getScanning } from '../../../redux/discovery'

import { Divider } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import { useAvailableAndUnavailableDevices } from './hooks'
import { NewRobotSetupHelp } from './NewRobotSetupHelp'
import type { State } from '../../../redux/types'

export function DevicesLanding(): JSX.Element {
  const { t } = useTranslation('devices_landing')

  const isScanning = useSelector((state: State) => getScanning(state))
  const {
    availableDevices,
    unavailableDevices,
  } = useAvailableAndUnavailableDevices()

  return (
    <Box minWidth={SIZE_6} padding={`${SPACING.spacing3} ${SPACING.spacing4}`}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <StyledText as="h3" id="DevicesLanding_title">
          {t('devices')}
        </StyledText>
        <NewRobotSetupHelp />
      </Flex>
      {!isScanning &&
      [...availableDevices, ...unavailableDevices].length === 0 ? (
        <DevicesEmptyState />
      ) : null}

      {availableDevices.length > 0 ? (
        <>
          <CollapsibleSection
            marginY={SPACING.spacing4}
            title={t('available', { count: availableDevices.length })}
          >
            {availableDevices.map(robot => (
              <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
                <RobotCard robot={robot} />
              </ApiHostProvider>
            ))}
          </CollapsibleSection>
          {unavailableDevices.length > 0 ? <Divider /> : null}
        </>
      ) : null}
      {unavailableDevices.length > 0 ? (
        <CollapsibleSection
          marginY={SPACING.spacing4}
          title={t('unavailable', { count: unavailableDevices.length })}
        >
          {unavailableDevices.map(robot => (
            <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
              <RobotCard robot={robot} />
            </ApiHostProvider>
          ))}
        </CollapsibleSection>
      ) : null}
    </Box>
  )
}
