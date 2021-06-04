import * as React from 'react'
import { useTranslation } from 'react-i18next'

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

import type { LabwareSummary } from '../../../redux/calibration/types'

export interface ProtocolLabwareListProps {
  labware: LabwareSummary[]
}

const TYPE_COL_STYLE = { marginRight: SPACING_AUTO }
const QUANTITY_COL_STYLE = { width: '12.5%', marginX: SPACING_3 }
const CAL_DATA_COL_STYLE = { width: '25%' }

const renderCalValue = (axis: string, value: number): JSX.Element => (
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
): JSX.Element {
  const { labware } = props
  const { t } = useTranslation(['protocol_info', 'protocol_calibration'])
  const [calDescTooltipTargetProps, calDescTooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP_START,
  })

  return (
    <Box fontSize={FONT_SIZE_BODY_1}>
      <Flex fontWeight={FONT_WEIGHT_SEMIBOLD}>
        <Text {...TYPE_COL_STYLE}>
          {t('protocol_info:required_type_title')}
        </Text>
        <Text {...QUANTITY_COL_STYLE}>
          {t('protocol_info:required_quantity_title')}
        </Text>
        <Flex {...CAL_DATA_COL_STYLE} {...calDescTooltipTargetProps}>
          <Text>{t('protocol_info:required_cal_data_title')}</Text>
          <Tooltip {...calDescTooltipProps}>
            {t('protocol_info:labware_cal_description')}
          </Tooltip>
        </Flex>
      </Flex>
      <ul>
        {labware.map((lw, index) => {
          const {
            displayName,
            parentDisplayName,
            quantity,
            calibration,
            calDataAvailable,
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
                {!calDataAvailable ? (
                  t('protocol_info:labware_legacy_definition')
                ) : calibration !== null ? (
                  <>
                    {renderCalValue('x', calibration.x)}
                    {renderCalValue('y', calibration.y)}
                    {renderCalValue('z', calibration.z)}
                  </>
                ) : (
                  t('protocol_calibration:cal_data_not_calibrated')
                )}
              </Text>
            </Flex>
          )
        })}
      </ul>
    </Box>
  )
}
