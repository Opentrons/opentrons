import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  Flex,
  LiquidIcon,
  Icon,
  SPACING,
  LegacyStyledText,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { parseLiquidsInLoadOrder } from '@opentrons/shared-data'

import { Divider } from '/app/atoms/structure'

import type { Liquid, RunTimeCommand } from '@opentrons/shared-data'

interface ProtocolLiquidsDetailsProps {
  commands: RunTimeCommand[]
  liquids: Liquid[]
}

export const ProtocolLiquidsDetails = (
  props: ProtocolLiquidsDetailsProps
): JSX.Element => {
  const { commands, liquids } = props
  const { i18n, t } = useTranslation('protocol_details')
  const liquidsInLoadOrder = parseLiquidsInLoadOrder(liquids, commands)
  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `
  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      maxHeight="25rem"
      overflowY="auto"
      data-testid="LiquidsDetailsTab"
    >
      {liquidsInLoadOrder.length > 0 ? (
        liquidsInLoadOrder?.map((liquid, index) => {
          return (
            <Fragment key={liquid.id}>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                marginY={SPACING.spacing16}
              >
                <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
                  <LiquidIcon color={liquid.displayColor} />
                  <Flex
                    flexDirection={DIRECTION_COLUMN}
                    justifyContent={JUSTIFY_CENTER}
                  >
                    <StyledText
                      desktopStyle="bodyDefaultSemiBold"
                      marginX={SPACING.spacing16}
                    >
                      {liquid.displayName}
                    </StyledText>
                    <StyledText
                      desktopStyle="bodyDefaultRegular"
                      color={COLORS.grey60}
                      marginX={SPACING.spacing16}
                    >
                      {liquid.description}
                    </StyledText>
                  </Flex>
                </Flex>
              </Flex>
              {index < liquidsInLoadOrder.length - 1 && <Divider />}
            </Fragment>
          )
        })
      ) : (
        <Flex
          padding={`${SPACING.spacing40} ${SPACING.spacing16}`}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing12}
          flexDirection={DIRECTION_COLUMN}
          backgroundColor={COLORS.grey30}
          borderRadius={BORDERS.borderRadius8}
        >
          <Icon
            color={COLORS.grey60}
            size="1.25rem"
            name="ot-alert"
            aria-label="ProtocolLIquidsDetails_noLiquidsIcon"
          />
          <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {i18n.format(t('liquids_not_in_protocol'), 'capitalize')}
          </LegacyStyledText>
        </Flex>
      )}
    </Flex>
  )
}
