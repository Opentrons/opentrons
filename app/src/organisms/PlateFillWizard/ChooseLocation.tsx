import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  useDeckLocationSelect,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'

import type { RobotType } from '@opentrons/shared-data'

interface ChooseLocationProps {
  handleProceed: () => void
  title: string
  body: string | JSX.Element
  robotType: RobotType
  setErrorMessage: (arg0: string) => void
}

export const ChooseLocation = (
  props: ChooseLocationProps
): JSX.Element | null => {
  const {
    handleProceed,
    title,
    body,
    robotType,
  } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])
  const { DeckLocationSelect, selectedLocation } = useDeckLocationSelect(
    robotType
  )

    return (
      <Flex
        padding={SPACING.spacing32}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        flex="1"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing24}
          flex="1"
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            width="100%"
            flex="1"
          >
            <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {title}
            </StyledText>
            <StyledText as="p">{body}</StyledText>
          </Flex>
          <Flex
            flex="1"
            justifyContent={JUSTIFY_CENTER}
            paddingLeft={SPACING.spacing24}
          >
            {DeckLocationSelect}
          </Flex>
        </Flex>
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <SmallButton
            buttonText={i18n.format(t('move_to_slot'), 'capitalize')}
            onClick={() => {
              console.log('selectedLocation', selectedLocation)
              handleProceed()
            }}
          />
        </Flex>
      </Flex>
    )
}
