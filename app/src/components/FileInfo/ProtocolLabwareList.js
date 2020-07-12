// @flow
import * as React from 'react'
import { css } from 'styled-components'

import {
  DIRECTION_ROW,
  Flex,
  Text,
  Icon,
  Tooltip,
  useHoverTooltip,
  JUSTIFY_SPACE_BETWEEN,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_REGULAR,
  C_DARK_GRAY,
  TOOLTIP_AUTO,
  SPACING_1,
  SIZE_1,
  C_MED_GRAY,
} from '@opentrons/components'
import { SectionContentFlex } from '../layout'

export type ProtocolLabwareListProps = {|
  labware: Array<?string>,
  quantity: Array<?string>,
  calibration: Array<?React.Node>,
|}

export function ProtocolLabwareList({
  labware,
  quantity,
  calibration,
}: ProtocolLabwareListProps): React.Node {
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_AUTO,
  })
  const iconComponent = (
    <Icon name="information" size={SIZE_1} color={C_MED_GRAY} />
  )
  const TOOL_TIP_MESSAGE = 'calibrated offset from labware origin point'
  const toolTipComponent = (
    <Tooltip {...tooltipProps}>{TOOL_TIP_MESSAGE}</Tooltip>
  )
  const LABWARE_TYPE = 'Type'
  const LABWARE_QUANTITY = 'Quantity'
  const CALIBRATION_DATA = 'Calibration Data'

  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      fontSize={FONT_SIZE_BODY_1}
      fontWeight={FONT_WEIGHT_REGULAR}
      color={C_DARK_GRAY}
    >
      <SectionContentFlex title={LABWARE_TYPE}>
        {labware.map(name => (
          <Text key={name}>{name}</Text>
        ))}
      </SectionContentFlex>
      <SectionContentFlex title={LABWARE_QUANTITY}>
        {quantity.map((item, index) => (
          <Text key={index}>{item}</Text>
        ))}
      </SectionContentFlex>
      <SectionContentFlex
        title={CALIBRATION_DATA}
        icon={iconComponent}
        toolTipComponent={toolTipComponent}
        toolTipProps={targetProps}
      >
        <table
          css={css`
            border-spacing: ${SPACING_1};
          `}
        >
          <tbody>{calibration}</tbody>
        </table>
      </SectionContentFlex>
    </Flex>
  )
}
