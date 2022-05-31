import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  ModuleIcon,
  POSITION_ABSOLUTE,
  SIZE_1,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  TEXT_TRANSFORM_UPPERCASE,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  getModuleType,
  getPipetteNameSpecs,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'

import type { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type { PipetteName } from '@opentrons/shared-data'

interface RobotConfigurationDetailsProps {
  leftMountPipetteName: PipetteName | null
  rightMountPipetteName: PipetteName | null
  requiredModuleDetails: LoadModuleRunTimeCommand[] | null
}

export const RobotConfigurationDetails = (
  props: RobotConfigurationDetailsProps
): JSX.Element => {
  const {
    leftMountPipetteName,
    rightMountPipetteName,
    requiredModuleDetails,
  } = props
  const { t } = useTranslation(['protocol_details', 'shared'])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <RobotConfigurationDetailsItem
        label={t('left_mount')}
        item={
          getPipetteNameSpecs(leftMountPipetteName as PipetteName)
            ?.displayName ?? t('shared:not_used')
        }
      />
      <Divider width="100%" />
      <RobotConfigurationDetailsItem
        label={t('right_mount')}
        item={
          getPipetteNameSpecs(rightMountPipetteName as PipetteName)
            ?.displayName ?? t('shared:not_used')
        }
      />
      {requiredModuleDetails != null
        ? requiredModuleDetails.map((module, index) => {
            return (
              <React.Fragment key={index}>
                <Divider width="100%" />
                <Flex
                  flexDirection={DIRECTION_ROW}
                  alignItems={ALIGN_CENTER}
                  marginY={SPACING.spacing3}
                  data-testid={`RobotConfigurationDetails__${module.params.model}_slot_${module.params.location.slotName}`}
                >
                  <StyledText
                    as="h6"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    marginRight={SPACING.spacing4}
                    color={COLORS.darkGreyPressed}
                    textTransform={TEXT_TRANSFORM_UPPERCASE}
                  >
                    {t('run_details:module_slot_number', {
                      slot_number:
                        getModuleType(module.params.model) ===
                        THERMOCYCLER_MODULE_TYPE
                          ? '7/10'
                          : module.params.location.slotName,
                    })}
                  </StyledText>
                  <Flex marginX={'6rem'} position={POSITION_ABSOLUTE}>
                    <ModuleIcon
                      key={index}
                      moduleType={getModuleType(module.params.model)}
                      height={SIZE_1}
                      marginRight={SPACING.spacing3}
                      alignSelf={ALIGN_CENTER}
                    />
                    <StyledText as="p">
                      {getModuleDisplayName(module.params.model)}
                    </StyledText>
                  </Flex>
                </Flex>
              </React.Fragment>
            )
          })
        : null}
    </Flex>
  )
}

interface RobotConfigurationDetailsItemProps {
  label: string
  item: string
}

export const RobotConfigurationDetailsItem = (
  props: RobotConfigurationDetailsItemProps
): JSX.Element => {
  const { label, item } = props
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      marginY={SPACING.spacing3}
    >
      <StyledText
        as="h6"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        marginRight={SPACING.spacing4}
        color={COLORS.darkGreyPressed}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
      >
        {label}
      </StyledText>
      <Flex marginX={'6rem'} position={POSITION_ABSOLUTE}>
        <StyledText
          as="p"
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          data-testid={`RobotConfigurationDetails_${label}`}
        >
          {item}
        </StyledText>
      </Flex>
    </Flex>
  )
}
