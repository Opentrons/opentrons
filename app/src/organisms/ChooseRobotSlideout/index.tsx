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
  DIRECTION_ROW,
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

import { Portal } from '../../App/portal'
import { PrimaryButton, SecondaryButton } from '../../atoms/Buttons'
import { Modal } from '../../atoms/Modal'
import { Slideout } from '../../atoms/Slideout'
import { StyledText } from '../../atoms/text'
import { useProtocolDetailsForRun } from '../../organisms/Devices/hooks'
import {
  useCloseCurrentRun,
  useCurrentRunId,
} from '../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../organisms/RunTimeControl/hooks'
import { useAvailableAndUnavailableDevices } from '../../pages/Devices/DevicesLanding/hooks'
import { getScanning, startDiscovery } from '../../redux/discovery'
import { StoredProtocolData } from '../../redux/protocol-storage'
import { AvailableRobotOption } from './AvailableRobotOption'
import { useCreateRunFromProtocol } from './useCreateRunFromProtocol'

import type { StyleProps } from '@opentrons/components'
import type { ModalProps } from '../../atoms/Modal'
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

  const {
    unavailableDevices,
    availableDevices,
  } = useAvailableAndUnavailableDevices()

  const availableRobots = availableDevices.filter(robot => {
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
    unavailableDevices.length + availableDevices.length - availableRobots.length

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

interface RobotIsBusyModalProps extends ModalProps {
  closeCurrentRunOnSuccess: () => void
  robotName: string
}

function RobotIsBusyModal({
  closeCurrentRunOnSuccess,
  onClose,
  robotName,
}: RobotIsBusyModalProps): JSX.Element {
  const { t } = useTranslation('protocol_details')
  const history = useHistory()
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()
  const currentRunId = useCurrentRunId()
  const runStatus = useCurrentRunStatus()
  const { displayName: protocolName } = useProtocolDetailsForRun(currentRunId)

  return (
    <Modal
      type="warning"
      title={t('robot_is_busy', { robotName })}
      onClose={onClose}
    >
      <Flex
        alignItems={ALIGN_FLEX_END}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing5}
        marginY={SPACING.spacing3}
      >
        <StyledText
          fontSize={TYPOGRAPHY.fontSizeLabel}
          lineHeight={TYPOGRAPHY.lineHeight16}
        >
          {t('robot_is_busy_with_protocol', {
            robotName,
            protocolName,
            runStatus,
          })}
        </StyledText>
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing3}>
          <SecondaryButton
            onClick={() =>
              history.push(
                `/devices/${robotName}/protocol-runs/${currentRunId}`
              )
            }
          >
            {t('view_run_details')}
          </SecondaryButton>
          <PrimaryButton
            disabled={isClosingCurrentRun}
            onClick={() =>
              closeCurrentRun({ onSuccess: closeCurrentRunOnSuccess })
            }
          >
            {t('clear_and_proceed_to_setup')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
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
  const currentRunId = useCurrentRunId()
  const [
    showRobotIsBusyModal,
    setShowRobotIsBusyModal,
  ] = React.useState<boolean>(false)

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    currentRunId != null
      ? setShowRobotIsBusyModal(true)
      : createRun(srcFileObjects)
  }

  return (
    <>
      <PrimaryButton onClick={handleClick} width="100%" {...buttonProps}>
        {t('proceed_to_setup')}
      </PrimaryButton>
      <Portal level="top">
        {showRobotIsBusyModal ? (
          <RobotIsBusyModal
            closeCurrentRunOnSuccess={() => createRun(srcFileObjects)}
            onClose={() => setShowRobotIsBusyModal(false)}
            robotName={robotName}
          />
        ) : null}
      </Portal>
    </>
  )
}
