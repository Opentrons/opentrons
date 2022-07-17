import * as React from 'react'
import { css } from 'styled-components'
import {
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
} from '@opentrons/api-client'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { Divider } from '../../atoms/structure'
import { LiquidsListItemDetails } from '../Devices/ProtocolRun/SetupLiquids/SetupLiquidsList'

export const ProtocolLiquidsDetails = (): JSX.Element => {
  const liquidsInLoadOrder = parseLiquidsInLoadOrder()
  const labwareByLiquidId = parseLabwareInfoByLiquidId()
  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `
  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      maxHeight={'25rem'}
      overflowY={'auto'}
      data-testid={'LiquidsDetailsTab'}
    >
      {liquidsInLoadOrder?.map((liquid, index) => {
        return (
          <>
            <Flex
              key={liquid.liquidId}
              flexDirection={DIRECTION_COLUMN}
              marginY={SPACING.spacing4}
            >
              <LiquidsListItemDetails
                liquidId={liquid.liquidId}
                displayColor={liquid.displayColor}
                displayName={liquid.displayName}
                description={liquid.description}
                labwareByLiquidId={labwareByLiquidId}
              />
            </Flex>
            {index < liquidsInLoadOrder.length - 1 && <Divider />}
          </>
        )
      })}
    </Flex>
  )
}
