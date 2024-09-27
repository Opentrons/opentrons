import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  Flex,
  DIRECTION_ROW,
  COLORS,
  SPACING,
  ALIGN_CENTER,
  LegacyStyledText,
  BORDERS,
  useHoverTooltip,
  LegacyTooltip,
} from '@opentrons/components'

interface TiprackOptionProps {
  onClick: React.MouseEventHandler
  isSelected: boolean
  isDisabled: boolean
  text: React.ReactNode
}
export function TiprackOption(props: TiprackOptionProps): JSX.Element {
  const { text, onClick, isSelected, isDisabled } = props
  const { t } = useTranslation('tooltip')
  const [targetProps, tooltipProps] = useHoverTooltip()

  const OPTION_STYLE = css`
    background-color: ${COLORS.white};
    border-radius: ${BORDERS.borderRadius8};
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};

    &:hover {
      background-color: ${COLORS.grey10};
      border: 1px ${BORDERS.styleSolid} ${COLORS.grey35};
    }

    &:focus {
      outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
      outline-offset: 3px;
    }
  `

  const OPTION_SELECTED_STYLE = css`
    ${OPTION_STYLE}
    background-color: ${COLORS.blue10};
    border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};

    &:hover {
      border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};
      box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.2);
    }
  `

  const OPTION_DISABLED_STYLE = css`
    ${OPTION_STYLE}
    background-color: ${COLORS.white};
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};
    &:hover {
      border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};
      background-color: ${COLORS.white};
    }
  `

  let optionStyle
  if (isDisabled) {
    optionStyle = OPTION_DISABLED_STYLE
  } else if (isSelected) {
    optionStyle = OPTION_SELECTED_STYLE
  } else {
    optionStyle = OPTION_STYLE
  }

  return (
    <>
      <Flex
        aria-label={`TiprackOption_flex_${text}`}
        onClick={isDisabled ? undefined : onClick}
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        width="13.5rem"
        css={optionStyle}
        padding={SPACING.spacing8}
        border={
          isSelected && !isDisabled
            ? BORDERS.activeLineBorder
            : BORDERS.lineBorder
        }
        borderRadius={BORDERS.borderRadius8}
        cursor={isDisabled ? 'auto' : 'pointer'}
        {...targetProps}
      >
        <LegacyStyledText as="label">{text}</LegacyStyledText>
      </Flex>
      {isDisabled ? (
        <LegacyTooltip {...tooltipProps}>
          {t('disabled_no_space_pipette')}
        </LegacyTooltip>
      ) : null}
    </>
  )
}
