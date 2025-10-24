import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import reduce from 'lodash/reduce'

import { LiquidIcon, StyledText } from '@opentrons/components'
import { swatchColors } from '@opentrons/step-generation'

import { getModalPortalEl } from '/app/App/portal'

import { formatPercentage, formatVolume } from './utils'
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
  ingredNames: Record<string, string>
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
}: WellTooltipProps): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  const [tooltipState, setTooltipState] = useState<TooltipState>(
    initialTooltipState
  )

  const makeHandleMouseEnterWell = (
    wellName: string,
    wellIngreds: LocationLiquidState
  ) => (e: MouseEvent): void => {
    const target = e.target as HTMLElement
    const { left, top, height, width } = target.getBoundingClientRect()
    if (Object.keys(wellIngreds).length > 0 && left && top) {
      setTooltipState({
        tooltipX: left + width / 2,
        tooltipY: top + height / 2,
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
  const liquidDisplayColors: Record<string, string> = {}

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
                          color={
                            liquidDisplayColors[groupId] ??
                            swatchColors(groupId)
                          }
                        />
                      </td>
                      <td>
                        <StyledText desktopStyle="captionRegular">
                          {ingredNames[groupId]}
                        </StyledText>
                      </td>
                      {hasMultipleIngreds ? (
                        <td>
                          <StyledText desktopStyle="captionRegular">
                            {formatPercentage(ingred.volume, totalLiquidVolume)}
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
            getModalPortalEl()
          )
        : null}
    </>
  )
}
