import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { css } from 'styled-components'

import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  LegacyStyledText,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import FLEX_PNG from '/app/assets/images/FLEX.png'
import OT2_PNG from '/app/assets/images/OT2-R_HERO.png'
import { StatusLabel } from '/app/atoms/StatusLabel'
import { MiniCard } from '/app/molecules/MiniCard'
import { getRobotModelByName, OPENTRONS_USB } from '/app/redux/discovery'
import { appShellUSBRequestor } from '/app/redux/shell/remote'
import { useNetworkInterfaces } from '/app/resources/networking/hooks'
import { useCurrentRunId, useNotifyRunQuery } from '/app/resources/runs'

import type { Dispatch as ReactDispatch } from 'react'
import type { Runs } from '@opentrons/api-client'
import type { IconName } from '@opentrons/components'
import type { Robot } from '/app/redux/discovery/types'
import type { State } from '/app/redux/types'
import type { RobotBusyStatusAction } from '.'

interface AvailableRobotOptionProps {
  robot: Robot
  onClick: () => void
  isSelected: boolean
  isSelectedRobotOnDifferentSoftwareVersion: boolean
  registerRobotBusyStatus: ReactDispatch<RobotBusyStatusAction>
  isError?: boolean
  showIdleOnly?: boolean
}

export function AvailableRobotOption(
  props: AvailableRobotOptionProps
): JSX.Element | null {
  const {
    robot,
    onClick,
    isSelected,
    isError = false,
    isSelectedRobotOnDifferentSoftwareVersion,
    showIdleOnly = false,
    registerRobotBusyStatus,
  } = props
  const { ip, local, name: robotName } = robot ?? {}
  const { t } = useTranslation(['protocol_list', 'branded'])
  const robotModel = useSelector((state: State) =>
    getRobotModelByName(state, robotName)
  )

  const [isBusy, setIsBusy] = useState(true)

  const currentRunId = useCurrentRunId(
    {
      onSuccess: data => {
        const definitelyIdle = (data as Runs)?.links?.current == null
        if (definitelyIdle) {
          registerRobotBusyStatus({ type: 'robotIsIdle', robotName })
          setIsBusy(false)
        }
      },
    },
    {
      hostname: ip,
      requestor: ip === OPENTRONS_USB ? appShellUSBRequestor : undefined,
    }
  )

  useNotifyRunQuery(
    currentRunId,
    {
      onSuccess: data => {
        const busy = data?.data != null && data.data.completedAt == null
        registerRobotBusyStatus({
          type: busy ? 'robotIsBusy' : 'robotIsIdle',
          robotName,
        })
        setIsBusy(busy)
      },
      onError: () => {
        registerRobotBusyStatus({ type: 'robotIsIdle', robotName })
        setIsBusy(false)
      },
    },
    {
      hostname: ip,
      requestor: ip === OPENTRONS_USB ? appShellUSBRequestor : undefined,
    }
  )

  const { ethernet, wifi } = useNetworkInterfaces(robotName)

  const { data: complianceReadyData } = useAccessControlEnabledQuery({})
  const isComplianceReady =
    complianceReadyData?.data.accessControlEnabled ?? false

  let iconName: IconName | null = null
  if (ethernet?.ipAddress != null) {
    iconName = 'ethernet'
  } else if (wifi?.ipAddress != null) {
    iconName = 'wifi'
  } else if (local != null && local) {
    iconName = 'usb'
  }

  return showIdleOnly && isBusy ? null : (
    <>
      <MiniCard
        onClick={onClick}
        isSelected={isSelected}
        isError={
          (isError || isSelectedRobotOnDifferentSoftwareVersion) && isSelected
        }
      >
        <img
          src={robotModel === 'OT-2' ? OT2_PNG : FLEX_PNG}
          css={css`
            width: 4rem;
            height: 3.5625rem;
          `}
          alt={robotModel === 'OT-2' ? 'Image of `OT-2 image' : 'Flex image'}
        />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          marginLeft={SPACING.spacing16}
          marginTop={SPACING.spacing8}
          marginBottom={SPACING.spacing16}
        >
          <LegacyStyledText
            forwardedAs="h6"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {robotModel}
          </LegacyStyledText>
          <Box maxWidth="9.5rem">
            <LegacyStyledText
              forwardedAs="p"
              overflowWrap="break-word"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {robotName}
              <Icon
                aria-label={iconName ?? 'wifi-icon'}
                name={iconName ?? 'wifi'}
                size={SIZE_1}
                style={{
                  marginLeft: SPACING.spacing8,
                  marginBottom: `-${SPACING.spacing4}`,
                }}
              />
            </LegacyStyledText>
          </Box>
          {isComplianceReady ? (
            <StatusLabel
              status={t('protocol_list:compliance_ready')}
              backgroundColor={COLORS.blue30}
              showIcon={false}
              // override capitalization since both words should be capitalized in this instance
              capitalizeStatus={false}
            />
          ) : null}
        </Flex>
        {(isError || isSelectedRobotOnDifferentSoftwareVersion) &&
        isSelected ? (
          <>
            <Box flex="1 1 auto" />
            <Icon name="ot-alert" size="1.25rem" color={COLORS.red50} />
          </>
        ) : null}
      </MiniCard>
      {isSelectedRobotOnDifferentSoftwareVersion && isSelected ? (
        <LegacyStyledText
          forwardedAs="label"
          color={COLORS.red60}
          marginBottom={SPACING.spacing8}
          css={css`
            & > a {
              color: ${COLORS.red60};
              text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
            }
          `}
        >
          <Trans
            t={t}
            i18nKey="branded:a_robot_software_update_is_available"
            components={{
              robotLink: <NavLink to={`/devices/${robotName}`} />,
            }}
          />
        </LegacyStyledText>
      ) : null}
    </>
  )
}
