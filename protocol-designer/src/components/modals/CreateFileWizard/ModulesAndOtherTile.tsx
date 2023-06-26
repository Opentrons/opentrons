import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import without from 'lodash/without'
import {
  DIRECTION_COLUMN,
  Flex,
  Text,
  SPACING,
  PrimaryButton,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  ModuleType,
  TEMPERATURE_MODULE_TYPE,
  getPipetteNameSpecs,
  PipetteName,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  TEMPERATURE_MODULE_V2,
  ModuleModel,
  getModuleDisplayName,
  getModuleType,
} from '@opentrons/shared-data'
import {
  FormModulesByType,
  getIsCrashablePipetteSelected,
} from '../../../step-forms'
import gripperImage from '../../../images/flex_gripper.svg'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import {
  CrashInfoBox,
  ModuleDiagram,
  isModuleWithCollisionIssue,
} from '../../modules'
import { ModuleFields } from '../FilePipettesModal/ModuleFields'
import { GoBackLink } from './GoBackLink'

import type { WizardTileProps } from './types'
import { EquipmentOption } from './EquipmentOption'
import { HandleEnter } from './HandleEnter'

const getCrashableModuleSelected = (
  modules: FormModulesByType,
  moduleType: ModuleType
): boolean => {
  const formModule = modules[moduleType]
  const crashableModuleOnDeck =
    formModule?.onDeck && formModule?.model
      ? isModuleWithCollisionIssue(formModule.model)
      : false

  return crashableModuleOnDeck
}
export function ModulesAndOtherTile(props: WizardTileProps): JSX.Element {
  const {
    handleChange,
    handleBlur,
    values,
    setFieldValue,
    errors,
    touched,
    setFieldTouched,
    goBack,
    proceed,
  } = props
  const { t } = useTranslation()
  const moduleRestrictionsDisabled = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )

  const { left, right } = values.pipettesByMount

  const hasCrashableMagnetModuleSelected = getCrashableModuleSelected(
    values.modulesByType,
    MAGNETIC_MODULE_TYPE
  )
  const hasCrashableTemperatureModuleSelected = getCrashableModuleSelected(
    values.modulesByType,
    TEMPERATURE_MODULE_TYPE
  )
  const hasHeaterShakerSelected = Boolean(
    values.modulesByType[HEATERSHAKER_MODULE_TYPE].onDeck
  )

  const showHeaterShakerPipetteCollisions =
    hasHeaterShakerSelected &&
    [
      getPipetteNameSpecs(left.pipetteName as PipetteName),
      getPipetteNameSpecs(right.pipetteName as PipetteName),
    ].some(pipetteSpecs => pipetteSpecs && pipetteSpecs.channels !== 1)

  const crashablePipetteSelected = getIsCrashablePipetteSelected(
    values.pipettesByMount
  )
  const modCrashWarning = (
    <CrashInfoBox
      showDiagram
      showMagPipetteCollisons={
        crashablePipetteSelected && hasCrashableMagnetModuleSelected
      }
      showTempPipetteCollisons={
        crashablePipetteSelected && hasCrashableTemperatureModuleSelected
      }
      showHeaterShakerLabwareCollisions={hasHeaterShakerSelected}
      showHeaterShakerModuleCollisions={hasHeaterShakerSelected}
      showHeaterShakerPipetteCollisions={showHeaterShakerPipetteCollisions}
    />
  )

  const robotType = values.fields.robotType
  return (
    <HandleEnter onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          minHeight="26rem"
          gridGap={SPACING.spacing32}
        >
          <Text as="h2">
            {t('modal.create_file_wizard.choose_additional_items')}
          </Text>
          {robotType === OT2_ROBOT_TYPE ? (
            <ModuleFields
              //  @ts-expect-error
              errors={errors.modulesByType ?? null}
              values={values.modulesByType}
              onFieldChange={handleChange}
              onSetFieldValue={setFieldValue}
              onBlur={handleBlur}
              //  @ts-expect-error
              touched={touched.modulesByType ?? null}
              onSetFieldTouched={setFieldTouched}
            />
          ) : (
            <FlexModuleFields {...props} />
          )}
          {robotType === OT2_ROBOT_TYPE && moduleRestrictionsDisabled !== true
            ? modCrashWarning
            : null}
        </Flex>

        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          width="100%"
        >
          <GoBackLink
            onClick={() => {
              if (
                props.values.pipettesByMount.left.pipetteName === 'p1000_96'
              ) {
                goBack(3)
              } else if (
                props.values.pipettesByMount.right.pipetteName === ''
              ) {
                goBack(2)
              } else {
                goBack()
              }
            }}
          />
          <PrimaryButton onClick={() => proceed()}>
            {t('modal.create_file_wizard.create_protocol_on_to_liquids')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </HandleEnter>
  )
}

const FLEX_SUPPORTED_MODULE_MODELS: ModuleModel[] = [
  THERMOCYCLER_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1,
  TEMPERATURE_MODULE_V2,
]
const DEFAULT_SLOT_MAP: { [moduleModel in ModuleModel]?: string } = {
  [THERMOCYCLER_MODULE_V2]: 'B1',
  [HEATERSHAKER_MODULE_V1]: 'D1',
  [MAGNETIC_BLOCK_V1]: 'D2',
  [TEMPERATURE_MODULE_V2]: 'D3',
}

function FlexModuleFields(props: WizardTileProps): JSX.Element {
  const { values } = props
  return (
    <Flex flexWrap="wrap" gridGap={SPACING.spacing4} alignSelf={ALIGN_CENTER}>
      <EquipmentOption
        onClick={() => {
          if (values.additionalEquipment.includes('gripper')) {
            props.setFieldValue(
              'additionalEquipment',
              without(values.additionalEquipment, 'gripper')
            )
          } else {
            props.setFieldValue('additionalEquipment', [
              ...values.additionalEquipment,
              'gripper',
            ])
          }
        }}
        isSelected={values.additionalEquipment.includes('gripper')}
        image={
          <AdditionalItemImage
            src={gripperImage}
            alt="Opentrons Flex Gripper"
          />
        }
        text="Gripper"
        showCheckbox
      />
      {FLEX_SUPPORTED_MODULE_MODELS.map(moduleModel => {
        const moduleType = getModuleType(moduleModel)
        return (
          <EquipmentOption
            key={moduleModel}
            isSelected={values.modulesByType[moduleType].onDeck}
            image={<ModuleDiagram type={moduleType} model={moduleModel} />}
            text={getModuleDisplayName(moduleModel)}
            onClick={() => {
              if (values.modulesByType[moduleType].onDeck) {
                props.setFieldValue(`modulesByType.${moduleType}.onDeck`, false)
                props.setFieldValue(`modulesByType.${moduleType}.model`, null)
                props.setFieldValue(`modulesByType.${moduleType}.slot`, null)
              } else {
                props.setFieldValue(`modulesByType.${moduleType}.onDeck`, true)
                props.setFieldValue(
                  `modulesByType.${moduleType}.model`,
                  moduleModel
                )
                props.setFieldValue(
                  `modulesByType.${moduleType}.slot`,
                  DEFAULT_SLOT_MAP[moduleModel]
                )
              }
            }}
            showCheckbox
          />
        )
      })}
    </Flex>
  )
}

const AdditionalItemImage = styled.img`
  width: 6rem;
  max-height: 4rem;
  display: block;
`
