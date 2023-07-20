import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
} from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { LiquidsListItemDetails } from '../Devices/ProtocolRun/SetupLiquids/SetupLiquidsList'

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
  const labwareByLiquidId = parseLabwareInfoByLiquidId(commands)
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
      {liquids.length > 0 ? (
        liquidsInLoadOrder?.map((liquid, index) => {
          return (
            <React.Fragment key={liquid.id}>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                marginY={SPACING.spacing16}
              >
                <LiquidsListItemDetails
                  liquidId={liquid.id}
                  displayColor={liquid.displayColor}
                  displayName={liquid.displayName}
                  description={liquid.description}
                  labwareByLiquidId={labwareByLiquidId}
                />
              </Flex>
              {index < liquidsInLoadOrder.length - 1 && <Divider />}
            </React.Fragment>
          )
        })
      ) : (
        <Flex
          paddingTop={SPACING.spacing16}
          paddingBottom={SPACING.spacing32}
          textAlign={TYPOGRAPHY.textAlignCenter}
          gridGap={SPACING.spacing12}
          flexDirection={DIRECTION_COLUMN}
        >
          <Icon
            color={COLORS.medGreyEnabled}
            alignSelf={ALIGN_CENTER}
            size="1.25rem"
            name="ot-alert"
            aria-label="ProtocolLIquidsDetails_noLiquidsIcon"
          />
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {i18n.format(t('liquids_not_in_protocol'), 'capitalize')}
          </StyledText>
        </Flex>
      )}
    </Flex>
  )
}
