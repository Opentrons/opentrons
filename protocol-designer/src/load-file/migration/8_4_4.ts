import { swatchColors } from '../../components/organisms/DefineLiquidsModal/swatchColors'
import { getAdditionalEquipmentLocationUpdate } from './utils/getAdditionalEquipmentLocationUpdate'
import { getEquipmentLoadInfoFromCommands } from './utils/getEquipmentLoadInfoFromCommands'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { Ingredients } from '@opentrons/step-generation'
import type { PDMetadata } from '../../file-types'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

export const migrateFile = (
  appData: ProtocolFile<DesignerApplicationData>
): ProtocolFile<PDMetadata> => {
  const {
    designerApplication,
    commands,
    labwareDefinitions,
    liquids,
    robot,
  } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const ingredients = designerApplication.data.ingredients
  const savedStepForms = designerApplication.data.savedStepForms

  const migratedIngredients: Ingredients = Object.entries(
    ingredients
  ).reduce<Ingredients>((acc, [id, ingredient]) => {
    acc[id] = {
      displayName: ingredient.name ?? '',
      description: ingredient.description ?? null,
      liquidGroupId: id,
      displayColor: liquids[id].displayColor ?? swatchColors(id),
    }
    return acc
  }, {})

  const updatedInitialStep = Object.values(savedStepForms).reduce(
    (acc, form) => {
      const { id } = form
      if (id === '__INITIAL_DECK_SETUP_STEP__') {
        return {
          ...acc,
          [id]: {
            ...form,
            ...getAdditionalEquipmentLocationUpdate(
              commands,
              robot.model,
              savedStepForms
            ),
          },
        }
      }
      return acc
    },
    {}
  )
  const equipmentLoadInfoFromCommands = getEquipmentLoadInfoFromCommands(
    commands,
    labwareDefinitions
  )
  return {
    ...appData,
    designerApplication: {
      ...designerApplication,
      data: {
        ...designerApplication.data,
        ingredients: migratedIngredients,
        ...equipmentLoadInfoFromCommands,
        savedStepForms: {
          ...designerApplication.data.savedStepForms,
          ...updatedInitialStep,
        },
      },
    },
  }
}
