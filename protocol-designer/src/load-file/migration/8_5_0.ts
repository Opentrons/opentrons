import { swatchColors } from '../../organisms/DefineLiquidsModal/swatchColors'
import type { ProtocolFile } from '@opentrons/shared-data'
import type { LiquidEntities } from '@opentrons/step-generation'
import type { DesignerApplicationDataV8_5 } from '../../file-data/selectors'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

export const migrateFile = (
  appData: ProtocolFile<DesignerApplicationData>
): ProtocolFile<DesignerApplicationDataV8_5> => {
  const { designerApplication, liquids } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const ingredients = designerApplication.data.ingredients

  const migratedIngredients: LiquidEntities = Object.entries(
    ingredients
  ).reduce<LiquidEntities>((acc, [id, ingredient]) => {
    acc[id] = {
      displayName: ingredient.name ?? '',
      liquidClass: ingredient.liquidClass,
      description: ingredient.description ?? null,
      liquidGroupId: id,
      pythonName: `liquid_${parseInt(id) + 1}`,
      displayColor: liquids[id].displayColor ?? swatchColors(id),
    }
    return acc
  }, {})

  return {
    ...appData,
    designerApplication: {
      ...designerApplication,
      data: {
        ...designerApplication.data,
        ingredients: migratedIngredients,
      },
    },
  }
}
