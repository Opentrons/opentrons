import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import reduce from 'lodash/reduce'

import { LiquidIcon, StyledText } from '@opentrons/components'
import { swatchColors } from '@opentrons/step-generation'

import { formatPercentage } from '../utils/formatPercentage'
import { formatVolume } from '../utils/formatVolume'
import styles from './welltooltip.module.css'

import type { MouseEvent, ReactNode } from 'react'
import type { LocationLiquidState } from '@opentrons/step-generation'

const DEFAULT_TOOLTIP_OFFSET = 22
const WELL_BORDER_WIDTH = 4

interface WellTooltipParams {
  liquidDisplayColors: Record<string, string>
  makeHandleMouseEnterWell: (
    wellName: string,
    wellIngreds: LocationLiquidState
  ) => (e: MouseEvent<any>) => void
  handleMouseLeaveWell: (val: unknown) => void
}

interface WellTooltipProps {
  children: (wellTooltipParams: WellTooltipParams) => ReactNode
  ingredNames: Record<string, string | null>
  liquidDisplayColors: Record<string, string>
}

interface TooltipState {
  tooltipX?: number | null
  tooltipY?: number | null
  tooltipWellName?: string | null
  tooltipWellIngreds?: LocationLiquidState | null
  tooltipOffset?: number | null
}

const initialTooltipState: TooltipState = {
  tooltipX: null,
  tooltipY: null,
  tooltipWellName: null,
  tooltipWellIngreds: null,
  tooltipOffset: DEFAULT_TOOLTIP_OFFSET,
}
export function WellTooltip({
  children,
  ingredNames,
  liquidDisplayColors,
}: WellTooltipProps): ReactNode {
  const { t } = useTranslation('protocol_visualization')
  const [tooltipState, setTooltipState] =
    useState<TooltipState>(initialTooltipState)

  const makeHandleMouseEnterWell =
    (wellName: string, wellIngreds: LocationLiquidState) =>
    (e: MouseEvent): void => {
      const target = e.currentTarget as HTMLElement
      const { left, top, height, width } = target.getBoundingClientRect()
      if (wellIngreds != null && Object.keys(wellIngreds).length > 0) {
        setTooltipState({
          tooltipX: left + width / 2,
          tooltipY: top + height / 3,
          tooltipWellName: wellName,
          tooltipWellIngreds: wellIngreds,
          tooltipOffset: height / 2,
        })
      }
    }

  const handleMouseLeaveWell = (): void => {
    setTooltipState(initialTooltipState)
  }

  const {
    tooltipX,
    tooltipY,
    tooltipOffset,
    tooltipWellIngreds,
    tooltipWellName,
  } = tooltipState

  const totalLiquidVolume = reduce(
    tooltipWellIngreds,
    (acc, ingred) => acc + ingred.volume,
    0
  )
  const hasMultipleIngreds = Object.keys(tooltipWellIngreds ?? {}).length > 1

  return (
    <>
      {children({
        liquidDisplayColors,
        makeHandleMouseEnterWell,
        handleMouseLeaveWell,
      })}
      {tooltipWellName != null && tooltipX != null && tooltipY != null
        ? createPortal(
            <div
              className={styles.popper_content}
              style={{
                top:
                  tooltipY +
                  (tooltipOffset ?? DEFAULT_TOOLTIP_OFFSET) +
                  WELL_BORDER_WIDTH * 2,
                left: tooltipX,
                transform: 'translate(-50%, 0)',
              }}
            >
              <table className={styles.tooltip_table}>
                <tbody>
                  {map(tooltipWellIngreds || {}, (ingred, groupId) => (
                    <tr key={groupId} className={styles.tooltip_row}>
                      <td>
                        <LiquidIcon
                          size="xSmall"
                          color={
                            liquidDisplayColors[groupId] ??
                            swatchColors(groupId)
                          }
                        />
                      </td>
                      <td>
                        <StyledText desktopStyle="captionSemiBold">
                          {ingredNames[groupId]}
                        </StyledText>
                      </td>
                      {hasMultipleIngreds ? (
                        <td>
                          <StyledText desktopStyle="captionRegular">
                            {`(${formatPercentage(ingred.volume, totalLiquidVolume)})`}
                          </StyledText>
                        </td>
                      ) : null}
                      <td>
                        <StyledText desktopStyle="captionRegular">
                          {t('well_volume', {
                            volume: formatVolume(ingred.volume, 2),
                          })}
                        </StyledText>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {hasMultipleIngreds ? (
                <>
                  <div className={styles.divider} />
                  <div className={styles.footer}>
                    <StyledText desktopStyle="captionRegular">{`${tooltipWellName} Total Volume`}</StyledText>
                    <StyledText desktopStyle="captionRegular">
                      {t('well_volume', {
                        volume: formatVolume(totalLiquidVolume, 2),
                      })}
                    </StyledText>
                  </div>
                </>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </>
  )
}
