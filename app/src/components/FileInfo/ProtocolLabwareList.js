// @flow
import * as React from 'react'

import {
  useHoverTooltip,
  Box,
  Flex,
  Text,
  Tooltip,
  ALIGN_FLEX_END,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  LINE_HEIGHT_COPY,
  SPACING_2,
  SPACING_3,
  SPACING_AUTO,
  TOOLTIP_TOP_START,
} from '@opentrons/components'

import type { LabwareSummary } from '../../calibration/types'

// TODO(mc, 2020-07-27): i18n
const TYPE = 'Type'
const QUANTITY = 'Quantity'
const CALIBRATION_DATA = 'Calibration Data'
const LEGACY_DEFINITION = 'Legacy definition'
const NOT_CALIBRATED = 'Not yet calibrated'
const CALIBRATION_DESCRIPTION = 'Calibrated offset from labware origin point'

export type ProtocolLabwareListProps = {|
  labware: Array<LabwareSummary>,
|}

const TYPE_COL_STYLE = { marginRight: SPACING_AUTO }
const QUANTITY_COL_STYLE = { width: '12.5%', marginX: SPACING_3 }
const CAL_DATA_COL_STYLE = { width: '25%' }

const renderCalValue = (axis: string, value: number): React.Node => (
  <>
    <Text as="span" fontWeight={FONT_WEIGHT_SEMIBOLD}>
      {axis.toUpperCase()}
    </Text>{' '}
    <Text as="span" marginRight={SPACING_3}>
      {value.toFixed(1)}
    </Text>
  </>
)

export function ProtocolLabwareList(
  props: ProtocolLabwareListProps
): React.Node {
  const { labware } = props
  const [calDescTooltipTargetProps, calDescTooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP_START,
  })

  return (
    <Box fontSize={FONT_SIZE_BODY_1}>
      <Flex fontWeight={FONT_WEIGHT_SEMIBOLD}>
        <Text {...TYPE_COL_STYLE}>{TYPE}</Text>
        <Text {...QUANTITY_COL_STYLE}>{QUANTITY}</Text>
        <Flex {...CAL_DATA_COL_STYLE} {...calDescTooltipTargetProps}>
          <Text>{CALIBRATION_DATA}</Text>
          <Tooltip {...calDescTooltipProps}>{CALIBRATION_DESCRIPTION}</Tooltip>
        </Flex>
      </Flex>
      <ul>
        {labware.map((lw, index) => {
          const {
            displayName,
            parentDisplayName,
            quantity,
            calibration,
            legacy,
          } = lw

          return (
            <Flex
              as="li"
              key={index}
              marginTop={SPACING_2}
              alignItems={ALIGN_FLEX_END}
              lineHeight={LINE_HEIGHT_COPY}
            >
              <Box {...TYPE_COL_STYLE}>
                {parentDisplayName && <Text>{parentDisplayName}</Text>}
                <Text>{displayName}</Text>
              </Box>
              <Text {...QUANTITY_COL_STYLE}>x {quantity}</Text>
              <Text {...CAL_DATA_COL_STYLE}>
                {calibration !== null ? (
                  <>
                    {renderCalValue('x', calibration.x)}
                    {renderCalValue('y', calibration.y)}
                    {renderCalValue('z', calibration.z)}
                  </>
                ) : legacy ? (
                  LEGACY_DEFINITION
                ) : (
                  NOT_CALIBRATED
                )}
              </Text>
            </Flex>
          )
        })}
      </ul>
    </Box>
  )
}
