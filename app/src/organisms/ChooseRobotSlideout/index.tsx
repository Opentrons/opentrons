import * as React from 'react'
import path from 'path'
import first from 'lodash/first'
import { useTranslation, Trans } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { NavLink, useHistory } from 'react-router-dom'
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
  SIZE_2,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_CENTER,
  SIZE_4,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

import {
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  getScanning,
  startDiscovery,
} from '../../redux/discovery'
import { getBuildrootUpdateDisplayInfo } from '../../redux/buildroot'
import { PrimaryButton } from '../../atoms/buttons'
import { Slideout } from '../../atoms/Slideout'
import { StyledText } from '../../atoms/text'
import { StoredProtocolData } from '../../redux/protocol-storage'
import { AvailableRobotOption } from './AvailableRobotOption'
import { useCreateRunFromProtocol } from './useCreateRunFromProtocol'

import type { StyleProps } from '@opentrons/components'
import type { State, Dispatch } from '../../redux/types'
import type { Robot } from '../../redux/discovery/types'

interface ChooseRobotSlideoutProps extends StyleProps {
  storedProtocolData: StoredProtocolData
  onCloseClick: () => void
  showSlideout: boolean
}
export function ChooseRobotSlideout(
  props: ChooseRobotSlideoutProps
): JSX.Element | null {
  const { t } = useTranslation(['protocol_details', 'shared'])
  const { storedProtocolData, showSlideout, onCloseClick, ...restProps } = props
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const isScanning = useSelector((state: State) => getScanning(state))

  const unhealthyReachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  )
  const unreachableRobots = useSelector((state: State) =>
    getUnreachableRobots(state)
  )
  const healthyReachableRobots = useSelector((state: State) =>
    getConnectableRobots(state)
  )
  const [selectedRobot, setSelectedRobot] = React.useState<Robot | null>(
    healthyReachableRobots[0] ?? null
  )
  const {
    createRunFromProtocolSource,
    runCreationError,
    reset: resetCreateRun,
    isCreatingRun,
  } = useCreateRunFromProtocol(
    {
      onSuccess: ({ data: runData }) => {
        if (selectedRobot != null) {
          history.push(
            `/devices/${selectedRobot.name}/protocol-runs/${runData.id}`
          )
        }
      },
    },
    selectedRobot != null ? { hostname: selectedRobot.ip } : null
  )
  const handleProceed: React.MouseEventHandler<HTMLButtonElement> = () => {
    createRunFromProtocolSource({ files: srcFileObjects, protocolKey })
  }

  const isSelectedRobotOnWrongVersionOfSoftware = [
    'upgrade',
    'downgrade',
  ].includes(
    useSelector((state: State) => {
      const value =
        selectedRobot != null
          ? getBuildrootUpdateDisplayInfo(state, selectedRobot.name)
          : { autoUpdateAction: '' }
      return value
    })?.autoUpdateAction
  )

  const {
    protocolKey,
    srcFileNames,
    srcFiles,
    mostRecentAnalysis,
  } = storedProtocolData
  if (
    protocolKey == null ||
    srcFileNames == null ||
    srcFiles == null ||
    mostRecentAnalysis == null
  ) {
    // TODO: do more robust corrupt file catching and handling here
    return null
  }
  const srcFileObjects = srcFiles.map((srcFileBuffer, index) => {
    const srcFilePath = srcFileNames[index]
    return new File([srcFileBuffer], path.basename(srcFilePath))
  })
  const protocolDisplayName =
    mostRecentAnalysis?.metadata?.protocolName ??
    first(srcFileNames) ??
    protocolKey
  const unavailableCount =
    unhealthyReachableRobots.length + unreachableRobots.length

  return (
    <Slideout
      isExpanded={showSlideout}
      onCloseClick={onCloseClick}
      title={t('choose_robot_to_run', {
        protocol_name: protocolDisplayName,
      })}
      footer={
        <PrimaryButton
          onClick={handleProceed}
          width="100%"
          disabled={
            isCreatingRun ||
            selectedRobot == null ||
            isSelectedRobotOnWrongVersionOfSoftware
          }
        >
          {isCreatingRun ? (
            <Icon name="ot-spinner" spin size={SIZE_1} />
          ) : (
            t('shared:proceed_to_setup')
          )}
        </PrimaryButton>
      }
      {...restProps}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex
          alignSelf={ALIGN_FLEX_END}
          marginY={SPACING.spacing3}
          height={SIZE_2}
        >
          {isScanning ? (
            <Icon name="ot-spinner" spin size={SIZE_1} />
          ) : (
            <Link
              color={COLORS.blue}
              onClick={() => dispatch(startDiscovery())}
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
              role="button"
              css={TYPOGRAPHY.pSemiBold}
            >
              {t('shared:refresh_list')}
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
                  robotName={robot.name}
                  robotModel="OT-2"
                  local={robot.local}
                  onClick={() => {
                    if (!isCreatingRun) {
                      resetCreateRun()
                      setSelectedRobot(isSelected ? null : robot)
                    }
                  }}
                  isError={runCreationError != null}
                  isSelected={isSelected}
                  isOnDifferentSoftwareVersion={
                    isSelectedRobotOnWrongVersionOfSoftware
                  }
                />
                {isSelected && (
                  <StyledText
                    as="label"
                    color={COLORS.errorText}
                    css={{ 'overflow-wrap': 'anywhere' }}
                    display={DISPLAY_INLINE_BLOCK}
                    marginTop={`-${SPACING.spacing2}`}
                    marginBottom={SPACING.spacing3}
                  >
                    {runCreationError ===
                    'Current run is not idle or stopped.' ? (
                      <Trans
                        t={t}
                        i18nKey="robot_is_busy_no_protocol_run_allowed"
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
            textAlign={TEXT_ALIGN_CENTER}
            marginTop={SPACING.spacing5}
          >
            <StyledText as="p">
              {t('unavailable_robot_not_listed', { count: unavailableCount })}
            </StyledText>
            <StyledText as="p">
              <Trans
                t={t}
                i18nKey="view_unavailable_robots"
                components={{
                  devicesLink: <NavLink to="/devices" />,
                }}
              />
            </StyledText>
          </Flex>
        ) : null}
      </Flex>
    </Slideout>
  )
}
