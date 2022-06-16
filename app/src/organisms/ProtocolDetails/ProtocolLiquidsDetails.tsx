import * as React from 'react'
import { css } from 'styled-components'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { Divider } from '../../atoms/structure'
import { LiquidsListItemDetails } from '../Devices/ProtocolRun/SetupLiquids/SetupLiquidsList'

import type { Liquid } from '../Devices/ProtocolRun/SetupLiquids/getMockLiquidData'

interface ProtocolLiquidsDetailsProps {
  liquids: Liquid[] | null
}

export const ProtocolLiquidsDetails = (
  props: ProtocolLiquidsDetailsProps
): JSX.Element => {
  const { liquids } = props
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
      {liquids?.map(liquid => {
        return (
          <>
            <Flex
              key={liquid.liquidId}
              flexDirection={DIRECTION_COLUMN}
              marginY={SPACING.spacing4}
            >
              <LiquidsListItemDetails
                displayColor={liquid.displayColor}
                displayName={liquid.displayName}
                description={liquid.description}
                locations={liquid.locations}
              />
            </Flex>
            <Divider />
          </>
        )
      })}
    </Flex>
  )
}
