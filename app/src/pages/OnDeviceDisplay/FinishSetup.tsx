import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getLocalRobot } from '../../redux/discovery'
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'
import screenImage from '../../assets/images/odd/odd_abstract@x2.png'

const IMAGE_ALT = 'finish setting up a robot'

export function FinishSetup(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name
  return (
    <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom="3.041875rem">
        <StyledText css={TYPOGRAPHY.oddHeaderDefault}>
          {t('name_love_it', { name: robotName })}
        </StyledText>
      </Flex>
      <Flex height="26.5625rem" justifyContent={JUSTIFY_CENTER}>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
        >
          <img alt={IMAGE_ALT} src={screenImage} width="944px" height="236px" />
          <StyledText
            marginTop={SPACING.spacingXXL}
            fontSize="1.625rem"
            lineHeight="2.1875rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {t('your_robot_is_ready_to_go')}
          </StyledText>
          <PrimaryButton
            marginTop={SPACING.spacingXXL}
            onClick={() => console.log('not designed yet')}
            width="100%"
            height="4.375rem"
            fontSize="1.5rem"
            lineHeight="1.375rem"
          >
            {t('finish_setup')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
