import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Btn,
  SPACING,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  Icon,
  TYPOGRAPHY,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'
import { MiniCardButton } from '../../molecules/MiniCardButton'
import { getLocalRobot } from '../../redux/discovery'

import abstractImage from '../../assets/images/odd/abstract@x2.png'

import type { MiniCardButtonProps } from '../../molecules/MiniCardButton'

// TODO: kj 12/0/7/2022 this part will be update when hi-fi is ready
const DASHBOARD_ITEMS: MiniCardButtonProps[] = [
  {
    iconName: 'wifi',
    cardName: 'Run a protocol',
    destinationPath: '/protocols',
  },
  {
    iconName: 'wifi',
    cardName: 'Instrument + Module Hub',
    destinationPath: '/attach-instruments',
  },
  {
    iconName: 'wifi',
    cardName: 'Settings',
    destinationPath: '/robot-settings',
  },
]

export function RobotDashboard(): JSX.Element {
  const { t } = useTranslation('device_details')
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'

  // ToDo kj 12/07/2022 get protocol runs and add conditional rendering
  // if there is no run data, shows the following
  return (
    <Flex
      padding={`${String(SPACING.spacing6)} ${String(
        SPACING.spacingXXL
      )} ${String(SPACING.spacingXXL)}`}
      flexDirection={DIRECTION_COLUMN}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <StyledText
            fontSize="2rem"
            lineHeight="2.75rem"
            fontWeight="700"
            color={COLORS.black}
          >
            {robotName}
          </StyledText>
          <Icon
            marginLeft={SPACING.spacing4}
            name="circle"
            color={COLORS.successEnabled}
            size="0.875rem"
          />
          <StyledText
            marginLeft={SPACING.spacing3}
            fontSize="1.375rem"
            lineHeight="1.625rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.black}
          >
            {t('ready')}
          </StyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} columnGap={SPACING.spacing5}>
          {/* Note kj 12/07/2022 icons are dummy and data-testid will be changed */}
          <Btn
            onClick={() => console.log('do something')}
            data-testid="RobotDashboard_left_button"
          >
            <Icon name="information" size="2.5rem" />
          </Btn>
          <Btn
            onClick={() => console.log('do something')}
            data-testid="RobotDashboard_right_button"
          >
            <Icon name="information" size="2.5rem" />
          </Btn>
        </Flex>
      </Flex>
      <StyledText
        fontSize="1.25rem"
        lineHeight="1.6875rem"
        fontWeight={TYPOGRAPHY.fontWeightRegular}
      >
        {t('run_again')}
      </StyledText>
      <Flex
        width="100%"
        height="14.375rem"
        backgroundColor={COLORS.fundamentalsBackground}
        flexDirection={DIRECTION_COLUMN}
        padding={`${String(SPACING.spacing4)} ${String(
          SPACING.spacingXXL
        )} ${String(SPACING.spacing6)}`}
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
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing4}
        marginTop="1.3125rem"
      >
        {DASHBOARD_ITEMS.map((card, index) => (
          <MiniCardButton key={`miniCardButton_${index}`} {...card} />
        ))}
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
