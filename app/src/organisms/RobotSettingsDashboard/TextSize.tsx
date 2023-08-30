import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  Flex,
  Btn,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_FLEX_START,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  Icon,
  Box,
  TYPOGRAPHY,
  COLORS,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

import type { SetSettingOption } from '../../pages/OnDeviceDisplay/RobotSettingsDashboard'

interface RectProps {
  isActive: boolean
}

const TextSizeTile = styled(Box)`
  width: 10.5625rem;
  height: 6.25rem;
  border-radius: ${BORDERS.borderRadiusSize2};
  background: ${(props: RectProps) =>
    props.isActive ? COLORS.highlightPurple1 : COLORS.highlightPurple2};
`

interface TextSizeProps {
  setCurrentOption: SetSettingOption
}

// ToDo (kj:03/03/2023) We need to define the max text size and min text size also decided to the default text size position in the rectangles
export function TextSize({ setCurrentOption }: TextSizeProps): JSX.Element {
  const { t } = useTranslation(['device_settings'])

  const handleClick = (changeType: 'up' | 'down'): void => {
    // dispatch updateConfigValue with OnDeviceDisplaySettings.textSize and value
  }
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex justifyContent={JUSTIFY_FLEX_START} alignItems={ALIGN_CENTER}>
        <Btn
          onClick={() => setCurrentOption(null)}
          data-testid="DisplayTextSize_back_button"
        >
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
        <StyledText fontSize="2rem" textAlign={TYPOGRAPHY.textAlignCenter}>
          {t('text_size')}
        </StyledText>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} marginTop="8.125rem">
        <StyledText
          textSize="1.375rem"
          lineHeight="1.75rem"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkBlack70}
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          {t('text_size_description')}
        </StyledText>
        <Flex
          flexDirection={DIRECTION_ROW}
          width="56.5rem"
          height="8.75rem"
          marginTop="3.75rem"
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
        >
          <Btn
            onClick={() => handleClick('down')}
            data-testid="DisplayTextSize_decrease"
          >
            <Icon size="5rem" name="minus" />
          </Btn>
          <Flex flexDirection={DIRECTION_ROW} gridGap="0.4375rem">
            <TextSizeTile isActive={true} />
            <TextSizeTile isActive={true} />
            <TextSizeTile isActive={true} />
            <TextSizeTile isActive={true} />
          </Flex>

          <Btn
            onClick={() => handleClick('up')}
            data-testid="DisplayTextSize_increase"
          >
            <Icon size="5rem" name="plus" />
          </Btn>
        </Flex>
      </Flex>
    </Flex>
  )
}
