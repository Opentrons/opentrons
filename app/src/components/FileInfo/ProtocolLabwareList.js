// @flow
import * as React from 'react'

import {
  Flex,
  Text,
  Tooltip,
  useHoverTooltip,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_REGULAR,
  C_DARK_GRAY,
  TOOLTIP_TOP,
  SIZE_2,
} from '@opentrons/components'
import { css } from 'styled-components'

export type LoadNameMapProps = {|
  parent: string,
  quantity: string,
  display: string,
  calibration: React.Node,
|}

export type ProtocolLabwareListProps = {|
  loadNameMap: { [key: string]: LoadNameMapProps },
|}

export function ProtocolLabwareList({
  loadNameMap,
}: ProtocolLabwareListProps): React.Node {
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
  })
  const TOOL_TIP_MESSAGE = 'calibrated offset from labware origin point'
  const LABWARE_TYPE = 'Type'
  const LABWARE_QUANTITY = 'Quantity'
  const CALIBRATION_DATA = 'Calibration Data'

  return (
    <Flex
      fontSize={FONT_SIZE_BODY_1}
      fontWeight={FONT_WEIGHT_REGULAR}
      color={C_DARK_GRAY}
    >
      <table
        css={css`
          border-collapse: separate;
          border-spacing: ${SIZE_2} 0;
        `}
      >
        <tbody>
          <tr>
            <th>{LABWARE_TYPE}</th>
            <th>{LABWARE_QUANTITY}</th>
            <th>
              <div {...targetProps}>
                {CALIBRATION_DATA}
                <Tooltip {...tooltipProps}>{TOOL_TIP_MESSAGE}</Tooltip>
              </div>
            </th>
          </tr>
          {Object.keys(loadNameMap).map(type => {
            const loadNameObject = loadNameMap[type]
            return (
              <tr key={type}>
                <td>
                  <div>
                    <Text>{loadNameObject.parent}</Text>
                    <Text>{loadNameObject.display}</Text>
                  </div>
                </td>
                <td>{loadNameObject.quantity}</td>
                <td
                  css={css`
                    border-spacing: 0;
                  `}
                >
                  {loadNameObject.calibration}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Flex>
  )
}
