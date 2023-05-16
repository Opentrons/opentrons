import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import { Trans, useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import {
  SPACING,
  Icon,
  Flex,
  Box,
  DIRECTION_COLUMN,
  COLORS,
  TYPOGRAPHY,
  SIZE_1,
} from '@opentrons/components'
import { useAllRunsQuery } from '@opentrons/react-api-client'

import { StyledText } from '../../atoms/text'
import { MiniCard } from '../../molecules/MiniCard'
import { getRobotModelByName, OPENTRONS_USB } from '../../redux/discovery'
import { appShellRequestor } from '../../redux/shell/remote'
import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import OT3_PNG from '../../assets/images/OT3.png'
import { RobotBusyStatusAction } from '.'

import type { Robot } from '../../redux/discovery/types'
import type { State } from '../../redux/types'

interface AvailableRobotOptionProps {
  robot: Robot
  onClick: () => void
  isSelected: boolean
  isOnDifferentSoftwareVersion: boolean
  registerRobotBusyStatus: React.Dispatch<RobotBusyStatusAction>
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
    isOnDifferentSoftwareVersion,
    showIdleOnly = false,
    registerRobotBusyStatus,
  } = props
  const { ip, local, name: robotName } = robot ?? {}
  const { t } = useTranslation('protocol_list')
  const robotModel = useSelector((state: State) =>
    getRobotModelByName(state, robotName)
  )

  const { data: runsData } = useAllRunsQuery(
    {},
    {
      onSuccess: data => {
        if (data?.links?.current != null)
          registerRobotBusyStatus({ type: 'robotIsBusy', robotName })
        else {
          registerRobotBusyStatus({ type: 'robotIsIdle', robotName })
        }
      },
    },
    {
      hostname: ip,
      requestor: ip === OPENTRONS_USB ? appShellRequestor : undefined,
    }
  )
  const robotHasCurrentRun = runsData?.links?.current != null

  return showIdleOnly && robotHasCurrentRun ? null : (
    <>
      <MiniCard
        onClick={onClick}
        isSelected={isSelected}
        isError={(isError || isOnDifferentSoftwareVersion) && isSelected}
      >
        <img
          src={robotModel === 'OT-2' ? OT2_PNG : OT3_PNG}
          css={css`
            width: 4rem;
            height: 3.5625rem;
          `}
        />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          marginLeft={SPACING.spacing16}
          marginTop={SPACING.spacing8}
          marginBottom={SPACING.spacing16}
        >
          <StyledText as="h6" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {robotModel}
          </StyledText>
          <Box maxWidth="9.5rem">
            <StyledText
              as="p"
              overflowWrap="break-word"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {robotName}
              <Icon
                // local boolean corresponds to a wired usb connection
                aria-label={local ?? false ? 'usb' : 'wifi'}
                marginBottom={`-${SPACING.spacing4}`}
                marginLeft={SPACING.spacing8}
                name={local ?? false ? 'usb' : 'wifi'}
                size={SIZE_1}
              />
            </StyledText>
          </Box>
        </Flex>
        {(isError || isOnDifferentSoftwareVersion) && isSelected ? (
          <>
            <Box flex="1 1 auto" />
            <Icon
              name="alert-circle"
              size="1.25rem"
              color={COLORS.errorEnabled}
            />
          </>
        ) : null}
      </MiniCard>

      {isOnDifferentSoftwareVersion && isSelected ? (
        <StyledText
          as="label"
          color={COLORS.errorText}
          marginBottom={SPACING.spacing8}
          css={css`
            & > a {
              color: ${COLORS.errorText};
              text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
            }
          `}
        >
          <Trans
            t={t}
            i18nKey="a_software_update_is_available_please_update"
            components={{
              robotLink: <NavLink to={`/devices/${robotName}`} />,
            }}
          />
        </StyledText>
      ) : null}
    </>
  )
}
