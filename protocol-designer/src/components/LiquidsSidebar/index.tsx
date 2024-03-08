import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  DeprecatedPrimaryButton,
  SidePanel,
  truncateString,
} from '@opentrons/components'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import * as labwareIngredActions from '../../labware-ingred/actions'
import { PDTitledList } from '../lists'
import { swatchColors } from '../swatchColors'
import listButtonStyles from '../listButtons.module.css'
import styles from './styles.module.css'

import type { ThunkDispatch } from '../../types'

export function LiquidsSidebar(): JSX.Element {
  const { t } = useTranslation('button')
  const selectedLiquidGroup = useSelector(
    labwareIngredSelectors.getSelectedLiquidGroupState
  )
  const liquids = useSelector(labwareIngredSelectors.allIngredientNamesIds)
  const dispatch: ThunkDispatch<any> = useDispatch()

  const selectLiquid = (liquidGroupId: string): void => {
    dispatch(labwareIngredActions.selectLiquidGroup(liquidGroupId))
  }
  const selectedLiquid =
    selectedLiquidGroup && selectedLiquidGroup.liquidGroupId
  return (
    <SidePanel title="Liquids">
      {liquids.map(({ ingredientId, name, displayColor }) => (
        <PDTitledList
          key={ingredientId}
          selected={selectedLiquid === ingredientId}
          onClick={() => selectLiquid(ingredientId)}
          iconName="circle"
          iconProps={{
            style: {
              fill: displayColor ?? swatchColors(ingredientId),
            },
            ...{
              className: styles.liquid_icon_container,
            },
          }}
          title={
            truncateString(name ?? '', 25) ??
            `Unnamed Ingredient ${ingredientId}`
          } // fallback, should not happen
        />
      ))}
      <div className={listButtonStyles.list_item_button}>
        <DeprecatedPrimaryButton
          iconName="water"
          onClick={() => dispatch(labwareIngredActions.createNewLiquidGroup())}
        >
          {t('new_liquid')}
        </DeprecatedPrimaryButton>
      </div>
    </SidePanel>
  )
}
