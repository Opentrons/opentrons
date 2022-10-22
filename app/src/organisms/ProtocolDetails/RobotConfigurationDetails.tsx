import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  ModuleIcon,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  getModuleType,
  getPipetteNameSpecs,
  TC_MODULE_LOCATION,
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
  isLoading: boolean
}

export const RobotConfigurationDetails = (
  props: RobotConfigurationDetailsProps
): JSX.Element => {
  const {
    leftMountPipetteName,
    rightMountPipetteName,
    requiredModuleDetails,
    isLoading,
  } = props
  const { t } = useTranslation(['protocol_details', 'shared'])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <RobotConfigurationDetailsItem
        label={t('left_mount')}
        item={
          isLoading
            ? t('shared:loading')
            : getPipetteNameSpecs(leftMountPipetteName as PipetteName)
                ?.displayName ?? t('shared:not_used')
        }
      />
      <Divider width="100%" />
      <RobotConfigurationDetailsItem
        label={t('right_mount')}
        item={
          isLoading
            ? t('shared:loading')
            : getPipetteNameSpecs(rightMountPipetteName as PipetteName)
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
                    color={COLORS.darkGreyPressed}
                    textTransform={TYPOGRAPHY.textTransformUppercase}
                    minWidth="6rem"
                  >
                    {t('run_details:module_slot_number', {
                      slot_number:
                        getModuleType(module.params.model) ===
                        THERMOCYCLER_MODULE_TYPE
                          ? TC_MODULE_LOCATION
                          : module.params.location.slotName,
                    })}
                  </StyledText>
                  <Flex paddingLeft={SPACING.spacing4}>
                    <ModuleIcon
                      key={index}
                      moduleType={getModuleType(module.params.model)}
                      marginRight={SPACING.spacing2}
                      alignSelf={ALIGN_CENTER}
                      height={SIZE_1}
                      minWidth={SIZE_1}
                      minHeight={SIZE_1}
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
        textTransform={TYPOGRAPHY.textTransformUppercase}
        minWidth="6rem"
      >
        {label}
      </StyledText>
      <Flex>
        <StyledText
          as="p"
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          data-testid={`RobotConfigurationDetails_${label}`}
        >
          {item}
        </StyledText>
      </Flex>
    </Flex>
  )
}
