// @flow
import * as React from 'react'

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
  TOOLTIP_TOP,
  SIZE_1,
  C_MED_GRAY,
  SPACING_1,
} from '@opentrons/components'
import { SectionContentFlex } from '../layout'

export type ProtocolLabwareListProps = {|
  labware: Array<string>,
  quantity: Array<string>,
  calibration: React.Node,
  labwareToParent: Object,
|}

export function ProtocolLabwareList({
  labware,
  quantity,
  calibration,
  labwareToParent,
}: ProtocolLabwareListProps): React.Node {
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
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
      border={SPACING_1}
    >
      <SectionContentFlex title={LABWARE_TYPE}>
        {labware.map(name => (
          <div key={name}>
            <Text>{labwareToParent[name]}</Text>
            <Text>{name}</Text>
          </div>
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
        {calibration}
      </SectionContentFlex>
    </Flex>
  )
}
