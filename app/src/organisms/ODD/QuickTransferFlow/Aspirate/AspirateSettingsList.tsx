import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { SettingItem } from './hooks/useAspirateSettingsConfig' // Import the type

interface AspirateSettingsListProps {
  items: SettingItem[]
}

export function AspirateSettingsList(
  props: AspirateSettingsListProps
): JSX.Element {
  const { items } = props

  return (
    <Flex gap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
      {items.map(displayItem => (
        <ListItem
          type="default"
          key={displayItem.option}
          onClick={displayItem.onClick}
        >
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
            <StyledText
              oddStyle="level4HeaderSemiBold"
              width="20rem"
              color={displayItem.enabled ? COLORS.black90 : COLORS.grey50}
            >
              {displayItem.copy}
            </StyledText>
            <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
              <StyledText
                oddStyle="level4HeaderRegular"
                color={displayItem.enabled ? COLORS.grey60 : COLORS.grey50}
                textAlign={TYPOGRAPHY.textAlignRight}
              >
                {displayItem.value}
              </StyledText>
              {displayItem.enabled ? <Icon name="more" size="2rem" /> : null}
            </Flex>
          </Flex>
        </ListItem>
      ))}
    </Flex>
  )
}
