import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { css } from 'styled-components'

import {
  SPACING,
  Icon,
  Flex,
  Link,
  COLORS,
  BORDERS,
  DIRECTION_COLUMN,
  DISPLAY_INLINE_BLOCK,
  TYPOGRAPHY,
  SIZE_1,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  JUSTIFY_CENTER,
  SIZE_4,
  DIRECTION_ROW,
} from '@opentrons/components'

import {
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  getScanning,
  startDiscovery,
  RE_ROBOT_MODEL_OT3,
  ROBOT_MODEL_OT3,
} from '../../redux/discovery'
import { getRobotUpdateDisplayInfo } from '../../redux/robot-update'
import { Banner } from '../../atoms/Banner'
import { Slideout } from '../../atoms/Slideout'
import { StyledText } from '../../atoms/text'
import { AvailableRobotOption } from './AvailableRobotOption'

import type { SlideoutProps } from '../../atoms/Slideout'
import type { UseCreateRun } from '../../organisms/ChooseRobotToRunProtocolSlideout/useCreateRunFromProtocol'
import type { State, Dispatch } from '../../redux/types'
import type { Robot } from '../../redux/discovery/types'

interface RobotIsBusyAction {
  type: 'robotIsBusy'
  robotName: string
}

interface RobotIsIdleAction {
  type: 'robotIsIdle'
  robotName: string
}

interface RobotBusyStatusByName {
  [robotName: string]: boolean
}

export type RobotBusyStatusAction = RobotIsBusyAction | RobotIsIdleAction

function robotBusyStatusByNameReducer(
  state: RobotBusyStatusByName,
  action: RobotBusyStatusAction
): RobotBusyStatusByName {
  switch (action.type) {
    case 'robotIsBusy': {
      return {
        ...state,
        [action.robotName]: true,
      }
    }
    case 'robotIsIdle': {
      return {
        ...state,
        [action.robotName]: false,
      }
    }
  }
}

interface ChooseRobotSlideoutProps
  extends Omit<SlideoutProps, 'children'>,
    Partial<UseCreateRun> {
  selectedRobot: Robot | null
  setSelectedRobot: (robot: Robot | null) => void
  showOT3Only?: boolean
  isAnalysisError?: boolean
}

export function ChooseRobotSlideout(
  props: ChooseRobotSlideoutProps
): JSX.Element {
  const { t } = useTranslation(['protocol_details', 'shared', 'app_settings'])
  const {
    isExpanded,
    onCloseClick,
    title,
    footer,
    showOT3Only = false,
    isAnalysisError = false,
    isCreatingRun = false,
    reset: resetCreateRun,
    runCreationError,
    runCreationErrorCode,
    selectedRobot,
    setSelectedRobot,
  } = props
  const dispatch = useDispatch<Dispatch>()
  const isScanning = useSelector((state: State) => getScanning(state))

  const unhealthyReachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  ).filter(robot =>
    showOT3Only ? RE_ROBOT_MODEL_OT3.test(robot.robotModel) : true
  )
  const unreachableRobots = useSelector((state: State) =>
    getUnreachableRobots(state)
  ).filter(robot =>
    showOT3Only ? RE_ROBOT_MODEL_OT3.test(robot.robotModel) : true
  )
  const healthyReachableRobots = useSelector((state: State) =>
    getConnectableRobots(state)
  ).filter(robot => (showOT3Only ? robot.robotModel === ROBOT_MODEL_OT3 : true))

  const [robotBusyStatusByName, registerRobotBusyStatus] = React.useReducer(
    robotBusyStatusByNameReducer,
    {}
  )

  const reducerBusyCount = healthyReachableRobots.filter(
    robot => robotBusyStatusByName[robot.name]
  ).length

  // this useEffect sets the default selection to the first robot in the list. state is managed by the caller
  React.useEffect(() => {
    if (selectedRobot == null && healthyReachableRobots.length > 0) {
      setSelectedRobot(healthyReachableRobots[0])
    } else if (healthyReachableRobots.length === 0) {
      setSelectedRobot(null)
    }
  }, [healthyReachableRobots, selectedRobot, setSelectedRobot])

  const isSelectedRobotOnWrongVersionOfSoftware = [
    'upgrade',
    'downgrade',
  ].includes(
    useSelector((state: State) => {
      const value =
        selectedRobot != null
          ? getRobotUpdateDisplayInfo(state, selectedRobot.name)
          : { autoUpdateAction: '' }
      return value
    })?.autoUpdateAction
  )

  const unavailableCount =
    unhealthyReachableRobots.length + unreachableRobots.length

  // for now, the only use case for showing idle only is also the only use case for showing OT-3 only
  const showIdleOnly = showOT3Only

  return (
    <Slideout
      isExpanded={isExpanded}
      onCloseClick={onCloseClick}
      title={title}
      footer={footer}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        {isAnalysisError ? (
          <Banner type="warning">{t('protocol_failed_app_analysis')}</Banner>
        ) : null}
        <Flex alignSelf={ALIGN_FLEX_END} marginY={SPACING.spacing4}>
          {isScanning ? (
            <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
              <StyledText
                as="p"
                color={COLORS.darkGreyEnabled}
                marginRight={SPACING.spacing12}
              >
                {t('app_settings:searching')}
              </StyledText>
              <Icon
                name="ot-spinner"
                spin
                size="1.25rem"
                color={COLORS.darkGreyEnabled}
              />
            </Flex>
          ) : (
            <Link
              onClick={() => dispatch(startDiscovery())}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              role="button"
              css={TYPOGRAPHY.linkPSemiBold}
            >
              {t('shared:refresh')}
            </Link>
          )}
        </Flex>
        {!isScanning && healthyReachableRobots.length === 0 ? (
          <Flex
            css={BORDERS.cardOutlineBorder}
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            height={SIZE_4}
            gridGap={SPACING.spacing8}
          >
            <Icon name="alert-circle" size={SIZE_1} />
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('no_available_robots_found')}
            </StyledText>
          </Flex>
        ) : (
          healthyReachableRobots.map(robot => {
            const isSelected =
              selectedRobot != null && selectedRobot.ip === robot.ip
            return (
              <Flex key={robot.ip} flexDirection={DIRECTION_COLUMN}>
                <AvailableRobotOption
                  key={robot.ip}
                  robot={robot}
                  // TODO: generalize to a disabled/reset prop
                  onClick={() => {
                    if (!isCreatingRun) {
                      resetCreateRun?.()
                      setSelectedRobot(robot)
                    }
                  }}
                  isError={runCreationError != null}
                  isSelected={isSelected}
                  isOnDifferentSoftwareVersion={
                    isSelectedRobotOnWrongVersionOfSoftware
                  }
                  showIdleOnly={showIdleOnly}
                  registerRobotBusyStatus={registerRobotBusyStatus}
                />
                {runCreationError != null && isSelected && (
                  <StyledText
                    as="label"
                    color={COLORS.errorText}
                    overflowWrap="anywhere"
                    display={DISPLAY_INLINE_BLOCK}
                    marginTop={`-${SPACING.spacing4}`}
                    marginBottom={SPACING.spacing8}
                  >
                    {runCreationErrorCode === 409 ? (
                      <Trans
                        t={t}
                        i18nKey="shared:robot_is_busy_no_protocol_run_allowed"
                        components={{
                          robotLink: (
                            <NavLink
                              css={css`
                                color: ${COLORS.errorText};
                                text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
                              `}
                              to={`/devices/${robot.name}`}
                            />
                          ),
                        }}
                      />
                    ) : (
                      runCreationError
                    )}
                  </StyledText>
                )}
              </Flex>
            )
          })
        )}
        {!isScanning && unavailableCount > 0 ? (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_CENTER}
            textAlign={TYPOGRAPHY.textAlignCenter}
            marginTop={SPACING.spacing24}
          >
            <StyledText as="p" color={COLORS.darkGreyEnabled}>
              {showIdleOnly
                ? t('unavailable_or_busy_robot_not_listed', {
                    count: unavailableCount + reducerBusyCount,
                  })
                : t('unavailable_robot_not_listed', {
                    count: unavailableCount,
                  })}
            </StyledText>
            <NavLink to="/devices" css={TYPOGRAPHY.linkPSemiBold}>
              {t('view_unavailable_robots')}
            </NavLink>
          </Flex>
        ) : null}
      </Flex>
    </Slideout>
  )
}
