// @flow
import * as React from 'react'

import {
  DIRECTION_COLUMN,
  Flex,
  Text,
  Icon,
  Tooltip,
  useHoverTooltip,
  FLEX_AUTO,
  JUSTIFY_SPACE_BETWEEN,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_REGULAR,
  C_DARK_GRAY,
  TOOLTIP_AUTO,
  SPACING_1,
} from '@opentrons/components'
import { SectionContentFlex } from '../layout'
import styles from './styles.css'

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
    <Icon name="information" className={styles.calibration_data_info_icon} />
  )
  const toolTipComponent = (
    <Tooltip {...tooltipProps}>
      {'calibrated offset from labware origin point'}
    </Tooltip>
  )

  return (
    <Flex
      textAlign={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      fontSize={FONT_SIZE_BODY_1}
      fontWeight={FONT_WEIGHT_REGULAR}
      color={C_DARK_GRAY}
    >
      <SectionContentFlex title="Type" width={FLEX_AUTO}>
        {labware.map(name => (
          <Text key={name}>{name}</Text>
        ))}
      </SectionContentFlex>
      <SectionContentFlex title="Quantity" width={FLEX_AUTO}>
        {quantity.map((item, index) => (
          <Text key={`${index}`}>{item}</Text>
        ))}
      </SectionContentFlex>
      <SectionContentFlex
        title="Calibration Data"
        width={FLEX_AUTO}
        icon={iconComponent}
        toolTipComponent={toolTipComponent}
        toolTipProps={targetProps}
      >
        <table style={{ borderSpacing: { SPACING_1 } }}>
          <tbody>{calibration}</tbody>
        </table>
      </SectionContentFlex>
    </Flex>
  )
}
