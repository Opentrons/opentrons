import * as React from 'react'
import path from 'path'
import first from 'lodash/first'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { ApiHostProvider } from '@opentrons/react-api-client'

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

import { Slideout } from '../../atoms/Slideout'
import { PrimaryButton } from '../../atoms/Buttons'
import {
  getConnectableRobots,
  getReachableRobots,
  getScanning,
  getUnreachableRobots,
  startDiscovery,
} from '../../redux/discovery'

import { StyledText } from '../../atoms/text'
import { StoredProtocolData } from '../../redux/protocol-storage'

import { NavLink, useHistory } from 'react-router-dom'
import { Robot } from '../../redux/discovery/types'
import { useCreateRunFromProtocol } from './useCreateRunFromProtocol'
import { AvailableRobotOption } from './AvailableRobotOption'

import type { State, Dispatch } from '../../redux/types'
import type { StyleProps } from '@opentrons/components'

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
  const {
    protocolKey,
    srcFileNames,
    srcFiles,
    mostRecentAnalysis,
  } = storedProtocolData
  const protocolDisplayName =
    mostRecentAnalysis?.metadata?.protocolName ??
    first(srcFileNames) ??
    protocolKey
  const [selectedRobot, setSelectedRobot] = React.useState<Robot | null>(null)

  const srcFileObjects = srcFiles.map((srcFileBuffer, index) => {
    const srcFilePath = srcFileNames[index]
    return new File([srcFileBuffer], path.basename(srcFilePath))
  })
  const dispatch = useDispatch<Dispatch>()
  const isScanning = useSelector((state: State) => getScanning(state))
  const connectableRobots = useSelector<
    State,
    ReturnType<typeof getConnectableRobots>
  >(getConnectableRobots)
  const reachableRobots = useSelector<
    State,
    ReturnType<typeof getReachableRobots>
  >(getReachableRobots)
  const unavailableRobots = useSelector<
    State,
    ReturnType<typeof getUnreachableRobots>
  >(getUnreachableRobots)
  const availableRobots = connectableRobots.filter(robot => {
    // TODO: filter out robots who have a current run that is in thie paused or running status
    return true
  })
  const unavailableOrBusyCount =
    unavailableRobots.length +
    reachableRobots.length +
    (connectableRobots.length - availableRobots.length)

  return (
    <Slideout
      isExpanded={showSlideout}
      onCloseClick={onCloseClick}
      zIndex="10"
      height={`calc(100vh - ${SPACING.spacing4})`}
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
            >
              {t('shared:refresh')}
            </Link>
          )}
        </Flex>
        {!isScanning && connectableRobots.length === 0 ? (
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
          connectableRobots.map(robot => (
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
  const { createRun } = useCreateRunFromProtocol({
    onSuccess: ({ data: runData }) => {
      history.push(`/devices/${robotName}/protocol-runs/${runData.id}`)
    },
  })

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    createRun(srcFileObjects)
  }

  return (
    <PrimaryButton onClick={handleClick} width="100%" {...buttonProps}>
      {t('proceed_to_setup')}
    </PrimaryButton>
  )
}
