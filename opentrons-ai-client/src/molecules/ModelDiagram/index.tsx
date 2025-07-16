import { css } from 'styled-components'

import {
  ABSORBANCE_READER_TYPE,
  ABSORBANCE_READER_V1,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import heater_shaker_module_transparent from '/ai-client/assets/images/modules/heater_shaker_module_transparent.png'
import magdeck_gen1 from '/ai-client/assets/images/modules/magdeck_gen1.png'
import magdeck_gen2 from '/ai-client/assets/images/modules/magdeck_gen2.png'
import mag_block from '/ai-client/assets/images/modules/MagneticBlock_GEN1_HERO.png'
import temp_deck_gen_2_transparent from '/ai-client/assets/images/modules/temp_deck_gen_2_transparent.png'
import tempdeck_gen1 from '/ai-client/assets/images/modules/tempdeck_gen1.png'
import thermocycler_gen2 from '/ai-client/assets/images/modules/thermocycler_gen2.png'
import thermocycler from '/ai-client/assets/images/modules/thermocycler.png'

import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

interface Props {
  type: ModuleType
  model: ModuleModel
}

type ModuleImg = {
  [type in ModuleType]: {
    [model in ModuleModel]?: string
  }
}

const MODULE_IMG_BY_TYPE: ModuleImg = {
  [MAGNETIC_MODULE_TYPE]: {
    [MAGNETIC_MODULE_V1]: magdeck_gen1,
    [MAGNETIC_MODULE_V2]: magdeck_gen2,
  },
  [TEMPERATURE_MODULE_TYPE]: {
    [TEMPERATURE_MODULE_V1]: tempdeck_gen1,
    [TEMPERATURE_MODULE_V2]: temp_deck_gen_2_transparent,
  },
  [THERMOCYCLER_MODULE_TYPE]: {
    [THERMOCYCLER_MODULE_V1]: thermocycler,
    [THERMOCYCLER_MODULE_V2]: thermocycler_gen2,
  },
  [HEATERSHAKER_MODULE_TYPE]: {
    [HEATERSHAKER_MODULE_V1]: heater_shaker_module_transparent,
  },
  [MAGNETIC_BLOCK_TYPE]: {
    [MAGNETIC_BLOCK_V1]: mag_block,
  },
  [ABSORBANCE_READER_TYPE]: {
    // TODO (AA): update absorbance reader image
    [ABSORBANCE_READER_V1]: heater_shaker_module_transparent,
  },
}

const IMAGE_MAX_WIDTH = '96px'
export function ModuleDiagram(props: Props): JSX.Element {
  const model = MODULE_IMG_BY_TYPE[props.type][props.model]
  return (
    <img
      css={css`
        max-width: ${IMAGE_MAX_WIDTH};
        width: 100%;
        height: auto;
      `}
      src={model}
      alt={props.type}
    />
  )
}
