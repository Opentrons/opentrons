import * as React from 'react'
import path from 'path'
import first from 'lodash/first'
import { useTranslation, Trans } from 'react-i18next'
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
import { ApiHostProvider } from '@opentrons/react-api-client'

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
  const [createRunError, setCreateRunError] = React.useState<string | null>(
    null
  )
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
  const [selectedRobot, setSelectedRobot] = React.useState<Robot | null>(
    healthyReachableRobots[0] ?? null
  )

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
        <ApiHostProvider
          hostname={selectedRobot != null ? selectedRobot.ip : null}
        >
          <CreateRunButton
            disabled={
              selectedRobot == null || isSelectedRobotOnWrongVersionOfSoftware
            }
            protocolKey={protocolKey}
            srcFileObjects={srcFileObjects}
            setError={setCreateRunError}
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
                    setCreateRunError(null)
                    setSelectedRobot(isSelected ? null : robot)
                  }}
                  isError={createRunError != null}
                  isSelected={isSelected}
                  isOnDifferentSoftwareVersion={
                    isSelectedRobotOnWrongVersionOfSoftware
                  }
                />
                {createRunError != null && isSelected && (
                  <StyledText
                    as="label"
                    color={COLORS.errorText}
                    display={DISPLAY_INLINE_BLOCK}
                    marginTop={`-${SPACING.spacing2}`}
                    marginBottom={SPACING.spacing3}
                  >
                    {createRunError}
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

interface CreateRunButtonProps
  extends React.ComponentProps<typeof PrimaryButton> {
  srcFileObjects: File[]
  protocolKey: string
  robotName: string
  setError: (error: string | null) => void
}
function CreateRunButton(props: CreateRunButtonProps): JSX.Element {
  const { t } = useTranslation('protocol_details')
  const history = useHistory()
  const {
    protocolKey,
    srcFileObjects,
    robotName,
    setError,
    disabled,
    ...buttonProps
  } = props
  const {
    createRunFromProtocolSource,
    runCreationError,
    isCreatingRun,
  } = useCreateRunFromProtocol({
    onSuccess: ({ data: runData }) => {
      history.push(`/devices/${robotName}/protocol-runs/${runData.id}`)
    },
  })

  React.useEffect(() => {
    if (runCreationError != null) {
      setError(runCreationError)
    }
  }, [runCreationError, setError])

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    createRunFromProtocolSource({ files: srcFileObjects, protocolKey })
  }

  return (
    <PrimaryButton
      onClick={handleClick}
      width="100%"
      disabled={isCreatingRun || disabled}
      {...buttonProps}
    >
      {t('proceed_to_setup')}
    </PrimaryButton>
  )
}
