import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
  TOOLTIP_BOTTOM,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import { ToggleButton } from '../../atoms/ToggleButton'

interface ToggleStepFormFieldProps {
  title: string
  isSelected: boolean
  onLabel: string
  offLabel: string
  toggleUpdateValue: (value: unknown) => void
  toggleValue: unknown
  tooltipContent: string | null
  isDisabled: boolean
}
export function ToggleStepFormField(
  props: ToggleStepFormFieldProps
): JSX.Element {
  const {
    title,
    isSelected,
    onLabel,
    offLabel,
    toggleUpdateValue,
    toggleValue,
    tooltipContent,
    isDisabled,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_BOTTOM,
  })

  return (
    <>
      <ListItem type="noActive">
        <Flex
          padding={SPACING.spacing12}
          width="100%"
          flexDirection={DIRECTION_COLUMN}
        >
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
            {...targetProps}
          >
            <StyledText desktopStyle="bodyDefaultRegular">{title}</StyledText>
            <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing4}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.grey60}
              >
                {isSelected ? onLabel : offLabel}
              </StyledText>
              {isDisabled ? null : (
                <ToggleButton
                  disabled={isDisabled}
                  onClick={() => {
                    toggleUpdateValue(!toggleValue)
                  }}
                  label={isSelected ? onLabel : offLabel}
                  toggledOn={isSelected}
                />
              )}
            </Flex>
          </Flex>
        </Flex>
      </ListItem>
      {tooltipContent != null ? (
        <Tooltip tooltipProps={tooltipProps}>{tooltipContent}</Tooltip>
      ) : null}
    </>
  )
}
