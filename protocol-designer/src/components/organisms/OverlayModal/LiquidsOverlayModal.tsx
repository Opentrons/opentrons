import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { removeWellsContents } from '/protocol-designer/labware-ingred/actions'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'

import { OverlayModal } from '.'

import type { Dispatch, ReactNode, SetStateAction } from 'react'

export function LiquidLayoutOverlayModalContainer({
  showLiquidOverflowMenu,
}: {
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
}): ReactNode {
  const { t } = useTranslation('liquids')

  const dispatch = useDispatch()
  const allWellContents = useSelector(
    wellContentsSelectors.getWellContentsAllLabware
  )
  const selectedLabwareIds = useSelector(selectors.getSelectedLabwareIds)

  const handleClearLiquids = (): void => {
    for (const labwareId of selectedLabwareIds ?? []) {
      const wellContents = allWellContents[labwareId] ?? {}
      dispatch(
        removeWellsContents({
          labwareId,
          wells: Object.keys(wellContents),
        })
      )
    }
  }

  return (
    <OverlayModal
      header={t('selected_labware_have_different_liquid_layouts')}
      subText={t('clear_liquids_in_labware_to_edit_together')}
      primaryButtonProps={{
        text: t('clear_liquids'),
        onClick: () => {
          handleClearLiquids()
          showLiquidOverflowMenu(false)
        },
      }}
      secondaryButtonProps={{
        text: t('cancel'),
        onClick: () => {
          showLiquidOverflowMenu(false)
        },
      }}
    />
  )
}
