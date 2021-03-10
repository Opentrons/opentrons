// @flow
import * as React from 'react'
import { Box, AlertModal, Flex, InputField, SecondaryBtn, Text, FONT_SIZE_BODY_1, FONT_WEIGHT_SEMIBOLD, SPACING_1, C_LIGHT_GRAY, TEXT_TRANSFORM_UPPERCASE, SIZE_5, SIZE_4, SPACING_3, SPACING_2, DISPLAY_INLINE, JUSTIFY_SPACE_BETWEEN, ALIGN_CENTER } from '@opentrons/components'
import { sendModuleCommand } from '../../redux/modules'
import { Portal } from '../../App/portal'

import { MAGNETIC_MODULE_V1 } from '@opentrons/shared-data'
import type {
  MagneticModule,
  ModuleCommand,
} from '../../redux/modules/types'
import { getModuleDisplayName } from '@opentrons/shared-data'

// const MODULE_IMGS: { [ModuleModel]: mixed } = {
//   magneticModuleV1: require('../../../../assets/images/modules/magneticModuleV1@3x.png'),
//   magneticModuleV2: require('../../../../assets/images/modules/magneticModuleV2@3x.png'),
// }

type ModelContents = {|
  version: string, 
  unit: string | null,
  maxHeight: number,
  labwareBottomHeight: number,
  disengagedHeight: number,
|}

const contentsByModel: (ModuleModel) => ModelContents = (
  model
) => {
  if (model === MAGNETIC_MODULE_V1) {
    return {
      version: "GEN 1",
      unit: null,
      maxHeight: 40,
      labwareBottomHeight: 0,
      disengagedHeight: -5,
    }
  } else {
      return {
        version: "GEN 2",
        unit: 'mm',
        maxHeight: 16,
        labwareBottomHeight: 0,
        disengagedHeight: -4
      }
    }
  }

function EngageHeightRangeCard(props: ModelContents) {
  return (
    <Box width="14rem" paddingX={SPACING_3} paddingY={SPACING_2} backgroundColor={C_LIGHT_GRAY}>
      <Text fontWeight={FONT_WEIGHT_SEMIBOLD} textTransform={TEXT_TRANSFORM_UPPERCASE} marginBottom={SPACING_2}>{`${props.version} Height Ranges`}</Text>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} marginBottom={SPACING_1}>
        <Text>Max Engage Height</Text>
        <Text>{props.maxHeight} {props.unit}</Text>
      </Flex>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} marginBottom={SPACING_1}>
        <Text>Labware Bottom</Text>
        <Text>{props.labwareBottomHeight} {props.unit}</Text>
      </Flex>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Text>Disengaged</Text>
        <Text>{props.disengagedHeight} {props.unit}</Text>
      </Flex>
    </Box>
  ) 
}

type Props = {|
  module: MagneticModule,
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: Array<mixed>
  ) => mixed,
|}

export const MagnetControl = ({ module, sendModuleCommand }: Props): React.Node => {
  const [engageHeightValue, setEngageHeightValue] = React.useState(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const isEngaged = module.status === 'engaged'

  const handleClick = () => {
    if (isEngaged) {
      sendModuleCommand(module.serial, 'deactivate')
    } else {
      setIsModalOpen(true) 
    }
  }
  
  const handleSumbitHeight = () => {
    if (engageHeightValue != null) {
      sendModuleCommand(module.serial, 'engage', [
        Number(engageHeightValue),
      ])
    }
    setIsModalOpen(false)
    setEngageHeightValue(null)
  }
  const displayName = getModuleDisplayName(module.model)
  const alertHeading = `Set Engage Height for ${displayName}`
  const contents = contentsByModel(module.model)
  return (
    <>
      {isModalOpen && (
        <Portal>
          <AlertModal
            heading={alertHeading}
            iconName={null}
            buttons={[
              {
                children: 'Cancel',
                onClick: () => setIsModalOpen(false),
              },
              {
                children: 'Set height',
                disabled: engageHeightValue == null,
                onClick: handleSumbitHeight,
              },
            ]}
            alertOverlay
          >
            <Text>Set the engage height for this magnetic module.</Text>
            <Flex fontSize={FONT_SIZE_BODY_1} alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
              <Box>
                <Text fontWeight={FONT_WEIGHT_SEMIBOLD}>Set Engage Height: </Text>
                <Flex width="6rem" marginTop={SPACING_1}>
                  <InputField
                    units="mm"
                    value={engageHeightValue}
                    onChange={e => setEngageHeightValue(e.target.value)}
                  />
                </Flex>
              </Box>
              <EngageHeightRangeCard {...contentsByModel(module.model)} />
            </Flex>
          </AlertModal>
        </Portal>
      )}
      <SecondaryBtn width="10rem" onClick={handleClick}>
        {module.status === 'engaged' ? 'Deactivate' : 'Engage'}
      </SecondaryBtn>
    </>
  )

}
