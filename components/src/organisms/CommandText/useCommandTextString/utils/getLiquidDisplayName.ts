import type { TFunction } from 'i18next'
import type { Liquid } from '@opentrons/shared-data'

export function getLiquidDisplayName(
  liquids: Liquid[],
  liquidId: string,
  t: TFunction
): string {
  const liquid = liquids.find(liquid => liquid.id === liquidId)

  return liquid?.totalLiquids != null
    ? t('liquids_count', { totalLiquids: liquid.totalLiquids })
    : (liquid?.displayName ?? '')
}
