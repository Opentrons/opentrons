import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DeckFromLayers,
  DIRECTION_COLUMN,
  FixedTrashText,
  Flex,
  ListItem,
  ListItemCustomize,
  Module,
  RobotCoordinateSpaceWithRef,
  SPACING,
  StyledText,
  WRAP,
} from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getDeckDefFromRobotType,
  getModuleDef,
  getModuleDisplayName,
  getModuleType,
  getPositionFromSlotId,
  inferModuleOrientationFromSlot,
  inferModuleOrientationFromXCoordinate,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { MagnetModuleChangeContent } from '/protocol-designer/components/molecules'
import { getDisableModuleRestrictions } from '/protocol-designer/feature-flags/selectors'
import {
  deleteModule,
  getAllModuleSlotsByTypeOt2,
} from '/protocol-designer/modules'
import { SlotWarning } from '/protocol-designer/pages/Designer/DeckSetup/SlotWarning'
import { OT2_SUPPORTED_MODULE_MODELS } from '/protocol-designer/pages/Onboarding/constants'
import { ModuleDiagram } from '/protocol-designer/pages/Onboarding/ModuleDiagram'
import { getHasGen1MultiChannelPipette } from '/protocol-designer/step-forms'
import { createModule } from '/protocol-designer/step-forms/actions'
import { createModuleEntityAndChangeForm } from '/protocol-designer/step-forms/actions/thunks'
import {
  getInitialDeckSetup,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'
import { getDismissedHints } from '/protocol-designer/tutorial/selectors'
import { COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE } from '/protocol-designer/utils/labwareModuleCompatibility'

import { useBlockingHint } from '../BlockingHintModal'
import { ConfirmDeleteEntityInUseModal } from '../ConfirmDeleteEntityInUseModal'
import { useKitchen } from '../Kitchen/useKitchen'
import { ModuleEmptySelectorButtons } from '../ModuleEmptySelectorButtons'
import { getNextAvailableModuleSlot, getSlotsWithCollisions } from '../utils'
import { getModuleOnSlot } from './util'

import type { AddressableAreaName, ModuleModel } from '@opentrons/shared-data'
import type { StepType } from '/protocol-designer/form-types'
import type { OT2ModuleType, ThunkDispatch } from '/protocol-designer/types'

type MagneticModuleModels =
  | typeof MAGNETIC_MODULE_V1
  | typeof MAGNETIC_MODULE_V2

const mapModTypeToStepTypeOt2: Record<OT2ModuleType, StepType> = {
  heaterShakerModuleType: 'heaterShaker',
  magneticModuleType: 'magnet',
  temperatureModuleType: 'temperature',
  thermocyclerModuleType: 'thermocycler',
}

const THERMOCYCLER_SLOTS = ['7', '8', '10', '11']

const OT2_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST: string[] = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
  'fixedTrash',
]

export function Ot2Modules(): JSX.Element {
  const { t } = useTranslation(['onboarding', 'protocol_overview', 'shared'])
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const disableCollisionWarnings = useSelector(getDisableModuleRestrictions)
  const savedSteps = useSelector(getSavedStepForms)
  const isDismissedModuleHint = useSelector(getDismissedHints).includes(
    'change_magnet_module_model'
  )
  const deckDef = getDeckDefFromRobotType(OT2_ROBOT_TYPE)
  const { makeSnackbar } = useKitchen()
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const [entityToDelete, setDeleteEntityInUseModal] = useState<string | null>(
    null
  )
  const [changeModuleWarningInfo, displayModuleWarning] =
    useState<boolean>(false)
  const { modules, pipettes, labware } = initialDeckSetup
  const hasMagneticModuleSteps = Object.values(savedSteps).find(
    step => step.stepType === 'magnet'
  )
  const magModModel = Object.values(modules).find(
    module => module.type === MAGNETIC_MODULE_TYPE
  )?.model

  const [magnetModuleModel, setMagnetModuleModel] =
    useState<MagneticModuleModels | null>(
      hasMagneticModuleSteps && magModModel
        ? (magModModel as MagneticModuleModels)
        : null
    )
  const supportedModules = OT2_SUPPORTED_MODULE_MODELS
  const hasThermocycler = Object.values(modules).some(
    module => module.type === THERMOCYCLER_MODULE_TYPE
  )
  const filteredSupportedModules = supportedModules.filter(
    moduleModel =>
      !Object.values(modules).some(
        module => module.type === getModuleType(moduleModel)
      )
  )
  const handleRemoveModule = (moduleId: string | null): void => {
    if (moduleId != null) {
      dispatch(deleteModule({ moduleId }))
    }
  }

  const handleAddModule = (
    moduleModel: ModuleModel,
    isModuleInUse: boolean,
    slot?: string
  ): void => {
    const moduleType = getModuleType(moduleModel)
    const moduleSlot =
      slot ??
      getNextAvailableModuleSlot(
        moduleModel,
        Object.values(modules),
        hasThermocycler
      )
    const somethingInSlotModule =
      Object.values(modules).some(module => module.slot === moduleSlot) ||
      (moduleSlot === '10' && hasThermocycler)
    const incompatibleLabwareDisplayNameInSlot = Object.values(labware).find(
      lw =>
        moduleSlot != null &&
        lw.stack.includes(moduleSlot) &&
        !Object.values(
          COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE[moduleType]
        ).includes(lw.def.parameters.loadName)
    )?.def.metadata.displayName
    const incompatibleLabwareSlots = [
      ...new Set(
        Object.values(labware)
          .filter(lw =>
            THERMOCYCLER_SLOTS.includes(getSlotInLocationStack(lw.stack))
          )
          .map(lw => getSlotInLocationStack(lw.stack))
      ),
    ]
    if (somethingInSlotModule) {
      makeSnackbar(t('protocol_overview:conflict_on_slot_module') as string)
    } else if (
      incompatibleLabwareSlots.length > 0 &&
      moduleType === THERMOCYCLER_MODULE_TYPE
    ) {
      const has1Conflict = incompatibleLabwareSlots.length === 1
      let slots: string
      if (incompatibleLabwareSlots.length === 1) {
        slots = incompatibleLabwareSlots[0]
      } else {
        const lastSlot =
          incompatibleLabwareSlots[incompatibleLabwareSlots.length - 1]
        const rest = incompatibleLabwareSlots.slice(0, -1)
        slots = `${rest.join(', ')} and ${lastSlot}`
      }
      makeSnackbar(
        has1Conflict
          ? (t('protocol_overview:conflict_on_slot_labware_tc', {
              slots,
            }) as string)
          : (t('protocol_overview:conflict_on_slot_labwares_tc', {
              slots,
            }) as string)
      )
    } else if (incompatibleLabwareDisplayNameInSlot != null) {
      makeSnackbar(
        t('protocol_overview:conflict_on_slot_labware', {
          displayName: incompatibleLabwareDisplayNameInSlot,
        }) as string
      )
    } else {
      const moduleIdToDelete = Object.values(modules).find(
        module => module.type === moduleType
      )?.id
      //   remove the module if it already exists on the deck
      handleRemoveModule(moduleIdToDelete ?? null)
      if (isModuleInUse) {
        const moduleSteps = Object.values(savedSteps).filter(step => {
          return (
            step.stepType ===
              mapModTypeToStepTypeOt2[moduleType as OT2ModuleType] &&
            //  only update module steps that match the old moduleId
            //  to accommodate instances of MoaM
            step.moduleId === moduleIdToDelete
          )
        })

        const pauseSteps = Object.values(savedSteps).filter(step => {
          return (
            step.stepType === 'pause' &&
            //  only update pause steps that match the old moduleId
            //  to accommodate instances of MoaM
            step.moduleId === moduleIdToDelete
          )
        })
        dispatch(
          createModuleEntityAndChangeForm({
            slot: moduleSlot ?? '1',
            model: moduleModel,
            type: getModuleType(moduleModel),
            moduleSteps,
            pauseSteps,
          })
        )
      } else {
        dispatch(
          createModule({
            slot: moduleSlot ?? '1',
            model: moduleModel,
            type: getModuleType(moduleModel),
          })
        )
      }
    }
  }
  const handleAddModuleButton = (moduleModel: ModuleModel): void => {
    if (
      !isDismissedModuleHint &&
      magnetModuleModel != null &&
      magnetModuleModel !== moduleModel
    ) {
      displayModuleWarning(true)
    } else {
      handleAddModule(moduleModel, false)
    }
  }
  const handleRemoveButton = (
    isModuleInUse: boolean,
    moduleId: string
  ): void => {
    if (isModuleInUse) {
      setDeleteEntityInUseModal(moduleId)
    } else {
      handleRemoveModule(moduleId)
    }
  }

  //  for GEN1 8-channel pipette x GEN1 module collision warnings
  const _hasGen1MultichannelPipette = useMemo(
    () => getHasGen1MultiChannelPipette(pipettes),
    [pipettes]
  )
  const showGen1MultichannelCollisionWarnings =
    !disableCollisionWarnings && _hasGen1MultichannelPipette

  const multichannelWarningSlotIds: AddressableAreaName[] =
    showGen1MultichannelCollisionWarnings
      ? getSlotsWithCollisions(deckDef, Object.values(modules))
      : []

  //  for switch magnetic module models since the units are 1/2mm and mm
  const changeModuleWarning = useBlockingHint({
    hintKey: 'change_magnet_module_model',
    handleCancel: () => {
      displayModuleWarning(false)
    },
    handleContinue: () => {
      const model =
        magnetModuleModel != null &&
        magnetModuleModel === (MAGNETIC_MODULE_V1 as MagneticModuleModels)
          ? MAGNETIC_MODULE_V2
          : MAGNETIC_MODULE_V1

      displayModuleWarning(false)
      setMagnetModuleModel(model as MagneticModuleModels)
      handleAddModule(model, false)
    },
    content: <MagnetModuleChangeContent />,
    enabled: changeModuleWarningInfo,
  })

  return (
    <>
      {entityToDelete != null ? (
        <ConfirmDeleteEntityInUseModal
          onClose={() => {
            setDeleteEntityInUseModal(null)
          }}
          onConfirm={() => {
            handleRemoveModule(entityToDelete)
            setDeleteEntityInUseModal(null)
          }}
        />
      ) : null}
      {changeModuleWarning}
      <Flex flexWrap={WRAP} width="100%">
        <Flex flexDirection={DIRECTION_COLUMN} flex="1.27" minWidth="30.375rem">
          {filteredSupportedModules.length > 0 ? (
            <StyledText
              desktopStyle="headingSmallBold"
              paddingBottom={SPACING.spacing20}
            >
              {t('protocol_overview:modules')}
            </StyledText>
          ) : null}
          <ModuleEmptySelectorButtons
            modules={filteredSupportedModules}
            addModule={moduleModel => {
              handleAddModuleButton(moduleModel)
            }}
            enableMultipleTempModules={false}
            numberOfTemps={0}
            hasGen1Temp={false}
          />
          {Object.keys(modules).length > 0 ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing12}
              paddingTop={SPACING.spacing60}
            >
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                {Object.values(modules).map((module, index) => {
                  const { isModuleInUse, moduleId } = getModuleOnSlot(
                    savedSteps,
                    module
                  )
                  return (
                    <ListItem type="default" key={`${module.model}_${index}`}>
                      <ListItemCustomize
                        linkText={t('remove')}
                        onClick={() => {
                          handleRemoveButton(isModuleInUse, moduleId)
                        }}
                        dropdown={
                          module.type === THERMOCYCLER_MODULE_TYPE
                            ? undefined
                            : {
                                dropdownType: 'neutral',
                                filterOptions: getAllModuleSlotsByTypeOt2(
                                  module.type
                                ),
                                onClick: value => {
                                  handleAddModule(
                                    module.model,
                                    isModuleInUse,
                                    value
                                  )
                                },
                                currentOption: {
                                  name: module.slot,
                                  value: module.slot,
                                },
                              }
                        }
                        header={getModuleDisplayName(module.model)}
                        label={
                          module.type === THERMOCYCLER_MODULE_TYPE
                            ? undefined
                            : t('protocol_overview:deck_slot')
                        }
                        leftHeaderItem={
                          <Flex
                            padding={SPACING.spacing2}
                            backgroundColor={COLORS.white}
                            borderRadius={BORDERS.borderRadius8}
                            alignItems={ALIGN_CENTER}
                            width="3.75rem"
                            height="3.625rem"
                          >
                            <ModuleDiagram
                              type={module.type as OT2ModuleType}
                              model={module.model}
                            />
                          </Flex>
                        }
                      />
                    </ListItem>
                  )
                })}
              </Flex>
            </Flex>
          ) : null}
        </Flex>
        <Flex flex="1.27" maxHeight="35rem" minWidth="50%">
          <RobotCoordinateSpaceWithRef
            height="100%"
            width="100%"
            deckDef={deckDef}
            viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
          >
            {() => (
              <>
                <DeckFromLayers
                  robotType={OT2_ROBOT_TYPE}
                  layerBlocklist={OT2_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST}
                />
                <FixedTrashText />
                {Object.values(modules).map(
                  ({ id, slot, model, moduleState }) => {
                    const slotId = slot
                    const slotPosition = getPositionFromSlotId(slotId, deckDef)
                    if (slotPosition == null) {
                      console.warn(`no slot ${slotId} for module ${id}`)
                      return null
                    }
                    const moduleDef = getModuleDef(model)
                    return (
                      <Fragment key={id}>
                        <Module
                          key={slot}
                          x={slotPosition[0]}
                          y={slotPosition[1]}
                          def={moduleDef}
                          orientation={inferModuleOrientationFromXCoordinate(
                            slotPosition[0]
                          )}
                          innerProps={
                            moduleState.type === THERMOCYCLER_MODULE_TYPE
                              ? { lidMotorState: 'open' }
                              : {}
                          }
                          targetSlotId={slotId}
                          targetDeckId={deckDef.otId}
                          childrenPositioningMode="passThrough"
                        />
                      </Fragment>
                    )
                  }
                )}
                {multichannelWarningSlotIds.map(slotId => {
                  const slotPosition = getPositionFromSlotId(slotId, deckDef)
                  const slotBoundingBox = getAddressableAreaFromSlotId(
                    slotId,
                    deckDef
                  )?.boundingBox
                  return slotPosition != null && slotBoundingBox != null ? (
                    <SlotWarning
                      key={slotId}
                      warningType="gen1multichannel"
                      x={slotPosition[0]}
                      y={slotPosition[1]}
                      xDimension={slotBoundingBox.xDimension}
                      yDimension={slotBoundingBox.yDimension}
                      orientation={inferModuleOrientationFromSlot(slotId)}
                    />
                  ) : null
                })}
              </>
            )}
          </RobotCoordinateSpaceWithRef>
        </Flex>
      </Flex>
    </>
  )
}
