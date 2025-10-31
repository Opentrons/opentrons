import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { removeWellsContents } from '/protocol-designer/labware-ingred/actions'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'

import { OverlayModal } from '.'

import type { Dispatch, SetStateAction } from 'react'

export function LiquidLayoutOverlayModalContainer({
  showLiquidOverflowMenu,
}: {
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
}): JSX.Element {
  const { t } = useTranslation('liquids')

  const dispatch = useDispatch()
  const allWellContents = useSelector(
    wellContentsSelectors.getWellContentsForLabwareStack
  )
  const labwareId = useSelector(selectors.getSelectedLabwareId)
  const wellContents = allWellContents[labwareId ?? ''] ?? {}
  const wellContentsId = Object.keys(wellContents)

  return (
    <OverlayModal
      header={t('selected_labware_have_different_liquid_layouts')}
      subText={t('clear_liquids_in_labware_to_edit_together')}
      primaryButtonProps={{
        text: t('clear_liquids'),
        onClick: () => {
          dispatch(
            removeWellsContents({
              labwareId: labwareId ?? '',
              wells: wellContentsId,
            })
          )
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
