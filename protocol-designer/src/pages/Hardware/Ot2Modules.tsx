import { useDispatch, useSelector } from 'react-redux'
import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DeckFromLayers,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_START,
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
  getModuleDef2,
  getModuleDisplayName,
  getModuleType,
  getPositionFromSlotId,
  inferModuleOrientationFromSlot,
  inferModuleOrientationFromXCoordinate,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getHasGen1MultiChannelPipette } from '../../step-forms'
import { getDisableModuleRestrictions } from '../../feature-flags/selectors'
import { useKitchen } from '../../components/organisms/Kitchen/hooks'
import {
  getSlotsWithCollisions,
  ModuleEmptySelectorButtons,
} from '../../components/organisms'
import { createModule } from '../../step-forms/actions'
import { ModuleDiagram } from '../Onboarding/ModuleDiagram'
import { FixedTrashText } from '../../components/molecules'
import { deleteModule, getAllModuleSlotsByTypeOt2 } from '../../modules'
import { SlotWarning } from '../Designer/DeckSetup/SlotWarning'
import {
  DEFAULT_SLOT_MAP_OT2,
  OT2_SUPPORTED_MODULE_MODELS,
} from '../Onboarding/constants'
import type {
  AddressableAreaName,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'
import type { OT2ModuleType } from '../Onboarding/ModuleDiagram'
import type { ThunkDispatch } from '../../types'

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
  const deckDef = getDeckDefFromRobotType(OT2_ROBOT_TYPE)
  const { makeSnackbar } = useKitchen()
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const supportedModules = OT2_SUPPORTED_MODULE_MODELS
  const { modules, pipettes } = initialDeckSetup
  const hasThermocycler = Object.values(modules).some(
    module => module.type === THERMOCYCLER_MODULE_TYPE
  )
  const filteredSupportedModules = supportedModules.filter(
    moduleModel =>
      !Object.values(modules).some(
        module => module.type === getModuleType(moduleModel)
      )
  )

  const handleRemoveModule = (moduleType: ModuleType): void => {
    const moduleToDelete = Object.values(modules).find(
      module => module.type === moduleType
    )
    if (moduleToDelete != null) {
      dispatch(deleteModule({ moduleId: moduleToDelete.id }))
    }
  }

  const handleAddModule = (moduleModel: ModuleModel, slot?: string): void => {
    const moduleSlot = slot ?? DEFAULT_SLOT_MAP_OT2[getModuleType(moduleModel)]
    const somethingInSlot =
      Object.values(modules).some(module => module.slot === moduleSlot) ||
      (moduleSlot === '10' && hasThermocycler)
    if (somethingInSlot) {
      makeSnackbar(t('protocol_overview:conflict_on_slot') as string)
    } else {
      handleRemoveModule(getModuleType(moduleModel))
      dispatch(
        createModule({
          slot: moduleSlot ?? '1',
          model: moduleModel,
          type: getModuleType(moduleModel),
        })
      )
    }
  }
  //  for GEN1 8-channel pipette x GEN1 module collision warnings
  const _hasGen1MultichannelPipette = useMemo(
    () => getHasGen1MultiChannelPipette(pipettes),
    [pipettes]
  )
  const showGen1MultichannelCollisionWarnings =
    !disableCollisionWarnings && _hasGen1MultichannelPipette

  const multichannelWarningSlotIds: AddressableAreaName[] = showGen1MultichannelCollisionWarnings
    ? getSlotsWithCollisions(deckDef, Object.values(modules))
    : []

  return (
    <Flex justifyContent={JUSTIFY_FLEX_START} flexWrap={WRAP} width="100%">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        flex="1.27"
        width="100%"
        paddingTop={SPACING.spacing120}
      >
        <StyledText desktopStyle="headingSmallBold">
          {t('protocol_overview:modules')}
        </StyledText>
        <ModuleEmptySelectorButtons
          modules={filteredSupportedModules}
          addModule={handleAddModule}
        />
        {Object.keys(modules).length > 0 ? (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing12}
            paddingTop={SPACING.spacing60}
          >
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              {Object.values(modules).map(module => (
                <ListItem type="default" key={module.model}>
                  <ListItemCustomize
                    linkText={t('remove')}
                    onClick={() => {
                      handleRemoveModule(module.type)
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
                              handleAddModule(module.model, value)
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
              ))}
            </Flex>
          </Flex>
        ) : null}
      </Flex>
      <Flex flex="1.27" minWidth="50%">
        <RobotCoordinateSpaceWithRef
          height="80%"
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
                  const moduleDef = getModuleDef2(model)
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
  )
}
