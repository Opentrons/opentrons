import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Box,
  Flex,
  Icon,
  NewPrimaryBtn,
  Text,
  ALIGN_CENTER,
  ALIGN_START,
  C_MED_DARK_GRAY,
  C_MED_LIGHT_GRAY,
  C_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_2,
  SPACING_2,
  SPACING_3,
  TEXT_TRANSFORM_NONE,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { ToggleBtn } from '../../atoms/ToggleBtn'
import { useLights, useRobot, useIsProtocolRunning } from './hooks'
import { RobotStatusBanner } from './RobotStatusBanner'

interface RobotOverviewProps {
  robotName: string
}

export function RobotOverview({
  robotName,
}: RobotOverviewProps): JSX.Element | null {
  const { t } = useTranslation('device_details')

  const robot = useRobot(robotName)

  const { lightsOn, toggleLights } = useLights(robotName)

  const isProtocolRunning = useIsProtocolRunning()

  return robot != null ? (
    <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={C_WHITE}
        borderBottom={`1px solid ${C_MED_LIGHT_GRAY}`}
        flexDirection={DIRECTION_ROW}
        marginBottom={SPACING_2}
        padding={SPACING_2}
        width="100%"
      >
        <img src={OT2_PNG} style={{ width: '6rem' }} />
        <Box padding={SPACING_2} width="100%">
          <RobotStatusBanner name={robot.name} local={robot.local} />
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
            <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING_3}>
              <Text textTransform={TEXT_TRANSFORM_UPPERCASE}>
                {t('controls')}
              </Text>
              <Flex alignItems={ALIGN_CENTER}>
                <ToggleBtn
                  label={t('lights')}
                  toggledOn={lightsOn != null ? lightsOn : false}
                  disabled={lightsOn === null}
                  onClick={toggleLights}
                  size={SIZE_2}
                  marginRight={SPACING_2}
                />
                <Text as="span">{t('lights')}</Text>
              </Flex>
            </Flex>
            {/* this link will change once protocol selection designs are finalized and functionality built out */}
            <Link to={`/devices/${robot.name}/protocol-runs/run`}>
              <NewPrimaryBtn
                textTransform={TEXT_TRANSFORM_NONE}
                disabled={isProtocolRunning}
              >
                {t('run_a_protocol')}
              </NewPrimaryBtn>
            </Link>
          </Flex>
        </Box>
        <Box alignSelf={ALIGN_START}>
          <Icon name="dots-vertical" color={C_MED_DARK_GRAY} size={SIZE_2} />
        </Box>
      </Flex>
    </ApiHostProvider>
  ) : null
}
