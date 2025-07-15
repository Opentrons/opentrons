import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

type DispenseSettingOption =
  | {
      option: string
      copy: any
      value: any
      enabled: boolean
      onClick: () => void
    }
  | {
      option: string
      copy: any
      enabled: boolean
      onClick: () => void
      value?: undefined
    }

interface DispenseSettingItemProps {
  displayItem: DispenseSettingOption
}

export function DispenseSettingItem({
  displayItem,
}: DispenseSettingItemProps): JSX.Element {
  return (
    <ListItem
      type="default"
      key={displayItem.option}
      onClick={displayItem.onClick}
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
        <Flex
          width="20rem"
          color={displayItem.enabled ? COLORS.black90 : COLORS.grey50}
        >
          <StyledText oddStyle="level4HeaderSemiBold">
            {displayItem.copy}
          </StyledText>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          <Flex
            color={displayItem.enabled ? COLORS.grey60 : COLORS.grey50}
            textAlign={TYPOGRAPHY.textAlignRight}
          >
            <StyledText oddStyle="level4HeaderRegular">
              {displayItem.value}
            </StyledText>
          </Flex>
          {displayItem.enabled ? <Icon name="more" size="2rem" /> : null}
        </Flex>
      </Flex>
    </ListItem>
  )
}
