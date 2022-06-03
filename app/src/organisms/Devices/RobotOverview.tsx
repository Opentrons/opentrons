import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  ALIGN_START,
  C_MED_LIGHT_GRAY,
  C_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_2,
  SPACING,
  TEXT_TRANSFORM_NONE,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { ToggleButton, PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { ChooseProtocolSlideout } from '../ChooseProtocolSlideout'
import { Portal } from '../../App/portal'
import { CONNECTABLE } from '../../redux/discovery'
import { UpdateRobotBanner } from '../UpdateRobotBanner'
import { RobotStatusBanner } from './RobotStatusBanner'
import { ReachableBanner } from './ReachableBanner'
import { RobotOverviewOverflowMenu } from './RobotOverviewOverflowMenu'
import { useLights, useRobot } from './hooks'

interface RobotOverviewProps {
  robotName: string
}

export function RobotOverview({
  robotName,
}: RobotOverviewProps): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])

  const robot = useRobot(robotName)
  const [
    showChooseProtocolSlideout,
    setShowChooseProtocolSlideout,
  ] = React.useState<boolean>(false)
  const { lightsOn, toggleLights } = useLights(robotName)
  const currentRunId = useCurrentRunId()

  return robot != null ? (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={C_WHITE}
      borderBottom={`1px solid ${C_MED_LIGHT_GRAY}`}
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING.spacing4}
      padding={SPACING.spacing3}
      width="100%"
    >
      <img
        src={OT2_PNG}
        style={{ width: '6rem' }}
        id="RobotOverview_robotImage"
      />
      <Box padding={SPACING.spacing3} width="100%">
        <ReachableBanner robot={robot} />
        {robot != null ? (
          <UpdateRobotBanner robot={robot} marginBottom={SPACING.spacing3} />
        ) : null}
        <RobotStatusBanner name={robot.name} local={robot.local} />
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            paddingRight={SPACING.spacing4}
          >
            <StyledText as="h6" textTransform={TEXT_TRANSFORM_UPPERCASE}>
              {t('controls')}
            </StyledText>
            <Flex alignItems={ALIGN_CENTER}>
              <ToggleButton
                label={t('lights')}
                toggledOn={lightsOn != null ? lightsOn : false}
                disabled={lightsOn === null || robot.status !== CONNECTABLE}
                onClick={toggleLights}
                size={SIZE_2}
                marginRight={SPACING.spacing3}
                id={`RobotOverview_lightsToggle`}
              />
              <StyledText as="p">{t('lights')}</StyledText>
            </Flex>
          </Flex>
          <PrimaryButton
            textTransform={TEXT_TRANSFORM_NONE}
            disabled={currentRunId != null || robot.status !== CONNECTABLE}
            onClick={() => {
              setShowChooseProtocolSlideout(true)
            }}
          >
            {t('run_a_protocol')}
          </PrimaryButton>
          {robot.status === CONNECTABLE ? (
            <Portal level="top">
              <ChooseProtocolSlideout
                robot={robot}
                showSlideout={showChooseProtocolSlideout}
                onCloseClick={() => setShowChooseProtocolSlideout(false)}
              />
            </Portal>
          ) : null}
        </Flex>
      </Box>
      <Box alignSelf={ALIGN_START}>
        <RobotOverviewOverflowMenu robot={robot} />
      </Box>
    </Flex>
  ) : null
}
