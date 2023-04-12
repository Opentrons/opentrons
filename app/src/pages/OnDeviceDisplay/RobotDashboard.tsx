import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  BORDERS,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'

import abstractImage from '../../assets/images/odd/abstract@x2.png'

export function RobotDashboard(): JSX.Element {
  const { t } = useTranslation('device_details')

  // ToDo kj 12/07/2022 get protocol runs and add conditional rendering
  // if there is no run data, shows the following
  return (
    <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
      <Navigation routes={onDeviceDisplayRoutes} />
      <Flex
        width="100%"
        height="27.25rem"
        backgroundColor={COLORS.fundamentalsBackground}
        borderRadius={BORDERS.radiusRoundEdge}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <img
          src={abstractImage}
          alt="Robot Dashboard no protocol run data"
          width="864px"
          height="108px"
        />
        <StyledText
          fontSize="1.5rem"
          lineHeight="2.25rem"
          fontWeight="700"
          color={COLORS.black}
        >
          {t('have_not_run')}
        </StyledText>
        <StyledText
          fontSize="1.375rem"
          lineHeight="1.875rem"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.black}
        >
          {t('have_not_run_description')}
        </StyledText>
      </Flex>

      {/* temp button to robot dashboard until we can detect setup status */}
      <Flex
        alignSelf={ALIGN_FLEX_END}
        marginTop={SPACING.spacing5}
        width="fit-content"
      >
        <Link to="menu">
          <TertiaryButton>To ODD Menu</TertiaryButton>
        </Link>
      </Flex>
    </Flex>
  )
}
