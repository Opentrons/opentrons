import * as React from 'react'
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
import { StyledText } from '../../atoms/text'
import { MiniCard } from '../../molecules/MiniCard'
import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import OT3_PNG from '../../assets/images/OT3.png'

interface AvailableRobotOptionProps {
  robotName: string
  robotModel: string
  local: boolean | null
  onClick: () => void
  isSelected: boolean
  isOnDifferentSoftwareVersion: boolean
  isError?: boolean
}

export function AvailableRobotOption(
  props: AvailableRobotOptionProps
): JSX.Element {
  const {
    robotName,
    robotModel,
    local,
    onClick,
    isSelected,
    isError = false,
    isOnDifferentSoftwareVersion,
  } = props
  const { t } = useTranslation('protocol_list')
  return (
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
          marginLeft={SPACING.spacing4}
          marginTop={SPACING.spacing3}
          marginBottom={SPACING.spacing4}
        >
          <StyledText as="h6">{robotModel}</StyledText>
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
                marginBottom={`-${SPACING.spacing2}`}
                marginLeft={SPACING.spacing3}
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
          marginBottom={SPACING.spacing3}
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
