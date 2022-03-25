import * as React from 'react'
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
} from '@opentrons/components'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { Slideout } from '../../atoms/Slideout'
import { PrimaryButton } from '../../atoms/Buttons'
import { DevicesEmptyState } from '../../organisms/Devices/DevicesEmptyState'
import {
  getConnectableRobots,
  getScanning,
  startDiscovery,
} from '../../redux/discovery'

import { css } from 'styled-components'
import { StyledText } from '../../atoms/text'
import { StoredProtocolData } from '../../redux/protocol-storage'

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
  const { protocolKey, srcFileNames, mostRecentAnalysis } = storedProtocolData
  const protocolDisplayName =
    mostRecentAnalysis?.metadata?.protocolName ??
    first(srcFileNames) ??
    protocolKey
  const [selectedRobotIp, setSelectedRobotIp] = React.useState<string | null>(
    null
  )
  const dispatch = useDispatch<Dispatch>()

  const isScanning = useSelector((state: State) => getScanning(state))

  const connectableRobots = useSelector((state: State) =>
    getConnectableRobots(state)
  )

  return (
    <Slideout
      isExpanded={showSlideout}
      onCloseClick={onCloseClick}
      zIndex="10"
      height="100%"
      title={t('choose_robot_to_run', {
        protocol_name: protocolDisplayName,
      })}
      footer={
        <ApiHostProvider hostname={selectedRobotIp}>
          <PrimaryButton
            onClick={() =>
              console.log(
                'TODO: create run on robot with protocol',
                selectedRobotIp,
                protocolKey
              )
            }
            width="100%"
          >
            {t('proceed_to_setup')}
          </PrimaryButton>
        </ApiHostProvider>
      }
      {...restProps}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex alignSelf={ALIGN_FLEX_END} marginY={SPACING.spacing3} height={SIZE_2}>
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
          <DevicesEmptyState />
        ) : (
          connectableRobots.map(robot => (
            <AvailableRobotOption
              key={robot.ip}
              robotName={robot.name}
              robotModel="OT-2"
              local={robot.local}
              onClick={() =>
                setSelectedRobotIp(
                  robot.ip === selectedRobotIp ? null : robot.ip
                )
              }
              isSelected={selectedRobotIp === robot.ip}
            />
          ))
        )}
      </Flex>
    </Slideout>
  )
}

interface AvailableRobotOptionProps {
  robotName: string
  robotModel: string
  local: boolean | null
  onClick: () => void
  isSelected: boolean
}
const unselectedOptionStyles = css`
  background-color: ${COLORS.white};
  border: 1px solid ${COLORS.medGrey};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing3};
  width: 100%;
  cursor: pointer;
`
const selectedOptionStyles = css`
  ${unselectedOptionStyles}
  border: 1px solid ${COLORS.blue};
  background-color: ${COLORS.lightBlue};
`
function AvailableRobotOption(props: AvailableRobotOptionProps): JSX.Element {
  const { robotName, robotModel, local, onClick, isSelected } = props
  return (
    <Flex
      onClick={onClick}
      css={isSelected ? selectedOptionStyles : unselectedOptionStyles}
    >
      <img
        src={OT2_PNG}
        css={css`
          width: 6rem;
        `}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        marginLeft={SPACING.spacing4}
        marginTop={SPACING.spacing3}
      >
        <StyledText as="h6">{robotModel}</StyledText>
        <Flex alignItems={ALIGN_CENTER}>
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {robotName}
          </StyledText>
          <Icon
            // local boolean corresponds to a wired usb connection
            name={local ? 'usb' : 'wifi'}
            size={SIZE_1}
            marginLeft={SPACING.spacing3}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
