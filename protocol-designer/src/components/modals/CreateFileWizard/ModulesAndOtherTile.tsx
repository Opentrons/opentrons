import * as React from 'react'
import styled from 'styled-components'
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
  useHoverTooltip,
  Tooltip,
  WRAP,
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
  FLEX_ROBOT_TYPE,
} from '@opentrons/shared-data'
import {
  FormModulesByType,
  getIsCrashablePipetteSelected,
} from '../../../step-forms'
import gripperImage from '../../../images/flex_gripper.png'
import { i18n } from '../../../localization'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import {
  CrashInfoBox,
  ModuleDiagram,
  isModuleWithCollisionIssue,
} from '../../modules'
import { ModuleFields } from '../FilePipettesModal/ModuleFields'
import { GoBack } from './GoBack'
import { EquipmentOption } from './EquipmentOption'
import { HandleEnter } from './HandleEnter'

import type { AdditionalEquipment, WizardTileProps } from './types'

const getCrashableModuleSelected = (
  modules: FormModulesByType,
  moduleType: ModuleType
): boolean => {
  const formModule = modules[moduleType]
  const crashableModuleOnDeck =
    formModule?.onDeck && formModule?.model != null
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
  const robotType = values.fields.robotType
  const moduleRestrictionsDisabled = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )
  const [targetProps, tooltipProps] = useHoverTooltip()
  const enableDeckModification = useSelector(
    featureFlagSelectors.getEnableDeckModification
  )
  const hasATrash =
    robotType === FLEX_ROBOT_TYPE && enableDeckModification
      ? values.additionalEquipment.includes('wasteChute') ||
        values.additionalEquipment.includes('trashBin')
      : true

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

  return (
    <HandleEnter disabled={!hasATrash} onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          minHeight="26rem"
          gridGap={SPACING.spacing32}
        >
          <Text as="h2">
            {i18n.t('modal.create_file_wizard.choose_additional_items')}
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
            <FlexModuleFields
              {...props}
              enableDeckModification={enableDeckModification}
            />
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
          <GoBack
            onClick={() => {
              if (!enableDeckModification || robotType === OT2_ROBOT_TYPE) {
                if (values.pipettesByMount.left.pipetteName === 'p1000_96') {
                  goBack(4)
                } else if (values.pipettesByMount.right.pipetteName === '') {
                  goBack(3)
                } else {
                  goBack(2)
                }
              } else {
                goBack()
              }
            }}
          />
          <PrimaryButton
            onClick={() => proceed()}
            disabled={!hasATrash}
            {...targetProps}
          >
            {i18n.t('modal.create_file_wizard.review_file_details')}
          </PrimaryButton>
          {!hasATrash ? (
            <Tooltip {...tooltipProps}>
              {i18n.t(`tooltip.disabled_no_trash`)}
            </Tooltip>
          ) : null}
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

interface FlexModuleFieldsProps extends WizardTileProps {
  enableDeckModification: boolean
}
function FlexModuleFields(props: FlexModuleFieldsProps): JSX.Element {
  const { values, setFieldValue, enableDeckModification } = props

  const isFlex = values.fields.robotType === FLEX_ROBOT_TYPE

  const handleSetEquipmentOption = (equipment: AdditionalEquipment): void => {
    if (values.additionalEquipment.includes(equipment)) {
      setFieldValue(
        'additionalEquipment',
        without(values.additionalEquipment, equipment)
      )
    } else {
      setFieldValue('additionalEquipment', [
        ...values.additionalEquipment,
        equipment,
      ])
    }
  }

  return (
    <Flex flexWrap={WRAP} gridGap={SPACING.spacing4} alignSelf={ALIGN_CENTER}>
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
                setFieldValue(`modulesByType.${moduleType}.onDeck`, false)
                setFieldValue(`modulesByType.${moduleType}.model`, null)
                setFieldValue(`modulesByType.${moduleType}.slot`, null)
              } else {
                setFieldValue(`modulesByType.${moduleType}.onDeck`, true)
                setFieldValue(`modulesByType.${moduleType}.model`, moduleModel)
                setFieldValue(
                  `modulesByType.${moduleType}.slot`,
                  DEFAULT_SLOT_MAP[moduleModel]
                )
              }
            }}
            showCheckbox
          />
        )
      })}
      <EquipmentOption
        onClick={() => handleSetEquipmentOption('gripper')}
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
      {enableDeckModification && isFlex ? (
        <>
          <EquipmentOption
            onClick={() => handleSetEquipmentOption('wasteChute')}
            isSelected={values.additionalEquipment.includes('wasteChute')}
            //  todo(jr, 9/14/23): update the asset
            image={
              <AdditionalItemImage
                src={gripperImage}
                alt="Opentrons Waste Chute"
              />
            }
            text="Waste Chute"
            showCheckbox
          />
          <EquipmentOption
            onClick={() => handleSetEquipmentOption('trashBin')}
            isSelected={values.additionalEquipment.includes('trashBin')}
            //  todo(jr, 9/14/23): update the asset with trash bin
            image={
              <AdditionalItemImage
                src={gripperImage}
                alt="Opentrons Trash Bin"
              />
            }
            text="Trash Bin"
            showCheckbox
          />
        </>
      ) : null}
    </Flex>
  )
}

const AdditionalItemImage = styled.img`
  width: 6rem;
  max-height: 4rem;
  display: block;
`
