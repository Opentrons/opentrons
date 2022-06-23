import * as React from 'react'
import path from 'path'
import first from 'lodash/first'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { NavLink, useHistory } from 'react-router-dom'

import {
  SPACING,
  Icon,
  Flex,
  Link,
  COLORS,
  BORDERS,
  DIRECTION_COLUMN,
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
import { ApiHostProvider } from '@opentrons/react-api-client'

import {
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  getScanning,
  startDiscovery,
} from '../../redux/discovery'
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
  const [selectedRobot, setSelectedRobot] = React.useState<Robot | null>(null)
  const dispatch = useDispatch<Dispatch>()
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

  const availableRobots = healthyReachableRobots.filter(robot => {
    // TODO: filter out robots who have a current run that is in thie paused or running status
    return true
  })
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
  const unavailableOrBusyCount =
    unhealthyReachableRobots.length +
    unreachableRobots.length +
    healthyReachableRobots.length -
    availableRobots.length

  return (
    <Slideout
      isExpanded={showSlideout}
      onCloseClick={onCloseClick}
      title={t('choose_robot_to_run', {
        protocol_name: protocolDisplayName,
      })}
      footer={
        <ApiHostProvider
          hostname={selectedRobot != null ? selectedRobot.ip : null}
        >
          <CreateRunButton
            disabled={selectedRobot == null}
            protocolKey={protocolKey}
            srcFileObjects={srcFileObjects}
            robotName={selectedRobot != null ? selectedRobot.name : ''}
          />
        </ApiHostProvider>
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
        {!isScanning && availableRobots.length === 0 ? (
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
          availableRobots.map(robot => (
            <AvailableRobotOption
              key={robot.ip}
              robotName={robot.name}
              robotModel="OT-2"
              local={robot.local}
              onClick={() =>
                setSelectedRobot(
                  selectedRobot != null && robot.ip === selectedRobot.ip
                    ? null
                    : robot
                )
              }
              isSelected={
                selectedRobot != null && selectedRobot.ip === robot.ip
              }
            />
          ))
        )}
        {!isScanning && unavailableOrBusyCount > 0 ? (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_CENTER}
            textAlign={TEXT_ALIGN_CENTER}
            marginTop={SPACING.spacing4}
          >
            <StyledText as="p">
              {t('unavailable_or_busy_robot_not_listed', {
                count: unavailableOrBusyCount,
              })}
            </StyledText>
            <NavLink to="/devices">
              <StyledText as="p">{t('view_all_robots')}</StyledText>
            </NavLink>
          </Flex>
        ) : null}
      </Flex>
    </Slideout>
  )
}

interface CreateRunButtonProps
  extends React.ComponentProps<typeof PrimaryButton> {
  srcFileObjects: File[]
  protocolKey: string
  robotName: string
}
function CreateRunButton(props: CreateRunButtonProps): JSX.Element {
  const { t } = useTranslation('protocol_details')
  const history = useHistory()
  const { protocolKey, srcFileObjects, robotName, ...buttonProps } = props
  const { createRunFromProtocolSource } = useCreateRunFromProtocol({
    onSuccess: ({ data: runData }) => {
      history.push(`/devices/${robotName}/protocol-runs/${runData.id}`)
    },
  })

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    createRunFromProtocolSource({ files: srcFileObjects, protocolKey })
  }

  return (
    <PrimaryButton onClick={handleClick} width="100%" {...buttonProps}>
      {t('proceed_to_setup')}
    </PrimaryButton>
  )
}
