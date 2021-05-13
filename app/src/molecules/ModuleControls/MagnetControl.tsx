// @flow
import * as React from 'react'
import {
  Box,
  AlertModal,
  Flex,
  InputField,
  SecondaryBtn,
  Text,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  C_NEAR_WHITE,
  TEXT_TRANSFORM_UPPERCASE,
  SPACING_3,
  SPACING_2,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  useHoverTooltip,
  Tooltip,
} from '@opentrons/components'
import { Portal } from '../../App/portal'

import {
  MAGNETIC_MODULE_V1,
  getModuleDisplayName,
} from '@opentrons/shared-data'
import type { MagneticModule, ModuleCommand } from '../../redux/modules/types'
import type { ModuleModel } from '@opentrons/shared-data'

type ModelContents = {|
  version: string,
  units: string | null,
  maxHeight: number,
  labwareBottomHeight: number,
  disengagedHeight: number,
|}

const contentsByModel: ModuleModel => ModelContents = model => {
  if (model === MAGNETIC_MODULE_V1) {
    return {
      version: 'GEN 1',
      units: null,
      maxHeight: 40,
      labwareBottomHeight: 0,
      disengagedHeight: -5,
    }
  } else {
    return {
      version: 'GEN 2',
      units: 'mm',
      maxHeight: 16,
      labwareBottomHeight: 0,
      disengagedHeight: -4,
    }
  }
}

type Props = {|
  module: MagneticModule,
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: Array<mixed>
  ) => mixed,
  disabledReason?: string | null,
|}

export const MagnetControl = ({
  module,
  sendModuleCommand,
  disabledReason,
}: Props): React.Node => {
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
      sendModuleCommand(module.serial, 'engage', [Number(engageHeightValue)])
    }
    setIsModalOpen(false)
    setEngageHeightValue(null)
  }
  const displayName = getModuleDisplayName(module.model)
  const alertHeading = `Set Engage Height for ${displayName}`
  const contents = contentsByModel(module.model)

  const [targetProps, tooltipProps] = useHoverTooltip()
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
            <Text>{`Set the engage height for your ${displayName}.`}</Text>
            <Flex
              fontSize={FONT_SIZE_BODY_1}
              alignItems={ALIGN_CENTER}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <Box>
                <Text fontWeight={FONT_WEIGHT_SEMIBOLD}>
                  Set Engage Height:
                </Text>
                <Flex width="6rem" marginTop={SPACING_1}>
                  <InputField
                    units={contents.units}
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
      <SecondaryBtn
        width={'11rem'}
        onClick={handleClick}
        disabled={disabledReason != null}
        {...targetProps}
      >
        {module.status === 'engaged' ? 'Disengage' : 'Engage'}
      </SecondaryBtn>
      {disabledReason && <Tooltip {...tooltipProps}>{disabledReason}</Tooltip>}
    </>
  )
}

function EngageHeightRangeCard(props: ModelContents) {
  return (
    <Box
      width="14rem"
      paddingX={SPACING_3}
      paddingY={SPACING_2}
      backgroundColor={C_NEAR_WHITE}
    >
      <Text
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        marginBottom={SPACING_2}
      >{`${props.version} Height Ranges`}</Text>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} marginBottom={SPACING_1}>
        <Text>Max Engage Height</Text>
        <Text>
          {props.maxHeight} {props.units}
        </Text>
      </Flex>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} marginBottom={SPACING_1}>
        <Text>Labware Bottom</Text>
        <Text>
          {props.labwareBottomHeight} {props.units}
        </Text>
      </Flex>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Text>Disengaged</Text>
        <Text>
          {props.disengagedHeight} {props.units}
        </Text>
      </Flex>
    </Box>
  )
}
