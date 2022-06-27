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
  TEXT_DECORATION_UNDERLINE,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { MiniCard } from '../../molecules/MiniCard'
import OT2_PNG from '../../assets/images/OT2-R_HERO.png'

interface AvailableRobotOptionProps {
  robotName: string
  robotModel: string
  local: boolean | null
  onClick: () => void
  isSelected: boolean
  isOnDifferentSoftwareVersion: boolean
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
    isOnDifferentSoftwareVersion,
  } = props
  const { t } = useTranslation('protocol_list')
  return (
    <>
      <MiniCard
        onClick={onClick}
        isSelected={isSelected}
        isNonviable={isOnDifferentSoftwareVersion && isSelected}
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
          <Box maxWidth="9.5rem">
            <StyledText
              as="p"
              css={{ 'overflow-wrap': 'break-word' }}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {robotName}
              <Icon
                // local boolean corresponds to a wired usb connection
                aria-label={local ? 'usb' : 'wifi'}
                marginBottom={`-${SPACING.spacing2}`}
                marginLeft={SPACING.spacing3}
                name={local ? 'usb' : 'wifi'}
                size={SIZE_1}
              />
            </StyledText>
          </Box>
        </Flex>
        {isOnDifferentSoftwareVersion && isSelected ? (
          <>
            <Box flex="1 1 auto" />
            <Icon name="ot-alert" size="1.25rem" color={COLORS.error} />
          </>
        ) : null}
      </MiniCard>

      {isOnDifferentSoftwareVersion && isSelected ? (
        <StyledText
          as="label"
          color={COLORS.errorText}
          css={css`
            & > a {
              color: ${COLORS.errorText};
              text-decoration: ${TEXT_DECORATION_UNDERLINE};
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
