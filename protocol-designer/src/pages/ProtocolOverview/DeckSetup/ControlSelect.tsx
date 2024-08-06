import * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { css } from 'styled-components'
import { useSelector } from 'react-redux'
import {
  Flex,
  LegacyStyledText,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'

import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'
import type { TerminalItemId } from '../../../steplist'

import styles from './DeckSetup.module.css'

interface ControlSelectProps {
  slotPosition: CoordinateTuple | null
  slotBoundingBox: Dimensions
  slotId: string
  addEquipment: (slotId: string) => void
  hover: string | null
  setHover: React.Dispatch<React.SetStateAction<string | null>>
  slotTopLayerId: string // can be AddressableAreaName, moduleId, labwareId
  selectedTerminalItemId?: TerminalItemId | null
}

export const ControlSelect = (
  props: ControlSelectProps
): JSX.Element | null => {
  const {
    slotBoundingBox,
    slotPosition,
    slotId,
    selectedTerminalItemId,
    addEquipment,
    hover,
    setHover,
    slotTopLayerId,
  } = props
  const { t } = useTranslation('protocol_overview')
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const moduleId = Object.keys(activeDeckSetup.modules).find(
    moduleId => slotTopLayerId === moduleId
  )

  if (selectedTerminalItemId !== START_TERMINAL_ITEM_ID || slotPosition == null)
    return null

  return (
    <RobotCoordsForeignDiv
      x={slotPosition[0]}
      y={slotPosition[1]}
      width={slotBoundingBox.xDimension}
      height={slotBoundingBox.yDimension}
      innerDivProps={{
        //  TODO(jr, 8/6/24): refactor to not require className?
        className: cx(styles.slot_overlay, styles.appear_on_mouseover),
        onMouseEnter: () => setHover(slotId),
        onMouseLeave: () => setHover(null),
        onClick: () => addEquipment(slotId),
      }}
    >
      <Flex
        css={css`
          opacity: ${hover != null && hover === slotId ? `1` : `0`};
        `}
      >
        <a
          onClick={() => {
            addEquipment(slotId)
          }}
        >
          <LegacyStyledText>
            {moduleId != null ? t('add_labware') : t('edit')}
          </LegacyStyledText>
        </a>
      </Flex>
    </RobotCoordsForeignDiv>
  )
}
