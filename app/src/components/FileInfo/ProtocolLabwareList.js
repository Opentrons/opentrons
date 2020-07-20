// @flow
import * as React from 'react'

import {
  Flex,
  Text,
  Tooltip,
  useHoverTooltip,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_REGULAR,
  FONT_WEIGHT_SEMIBOLD,
  C_DARK_GRAY,
  TOOLTIP_TOP,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  ALIGN_CENTER,
} from '@opentrons/components'
import { css } from 'styled-components'

export type LoadNameMapProps = {|
  parent: string,
  quantity: number,
  display: string,
  calibration: {| x: string, y: string, z: string |} | null,
|}

export type ProtocolLabwareListProps = {|
  loadNameMap: Array<LoadNameMapProps>,
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
  const NOT_CALIBRATED = 'Not yet calibrated'

  return (
    <Flex
      fontSize={FONT_SIZE_BODY_1}
      fontWeight={FONT_WEIGHT_REGULAR}
      color={C_DARK_GRAY}
    >
      <table
        css={css`
          border-collapse: separate;
          border-spacing: ${SIZE_1} ${SIZE_1};
          width: 100%;
          text-align: left;
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
          {loadNameMap.map((labwareObj, index) => {
            return (
              <tr key={index}>
                <td>
                  <div>
                    <Text>{labwareObj.parent}</Text>
                    <Text>{labwareObj.display}</Text>
                  </div>
                </td>
                <td>{`x${labwareObj.quantity}`}</td>
                <td
                  css={css`
                    border-spacing: 0;
                  `}
                >
                  {labwareObj.calibration ? (
                    <Flex
                      flexDirection={DIRECTION_ROW}
                      justifyContent={JUSTIFY_SPACE_BETWEEN}
                      key={index}
                    >
                      <div style={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>X</div>
                      <div>{labwareObj.calibration.x}</div>
                      <div style={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>Y</div>
                      <div>{labwareObj.calibration.y}</div>
                      <div style={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>Z</div>
                      <div>{labwareObj.calibration.z}</div>
                    </Flex>
                  ) : (
                    <Flex align={ALIGN_CENTER} key={index}>
                      {NOT_CALIBRATED}
                    </Flex>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Flex>
  )
}
