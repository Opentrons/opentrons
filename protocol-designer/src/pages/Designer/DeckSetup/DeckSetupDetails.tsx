import * as React from 'react'
import compact from 'lodash/compact'
import values from 'lodash/values'
import { useDispatch, useSelector } from 'react-redux'

import {
  LabwareRender,
  Module,
  POSITION_ABSOLUTE,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { MODULES_WITH_COLLISION_ISSUES } from '@opentrons/step-generation'
import {
  getAddressableAreaFromSlotId,
  getLabwareHasQuirk,
  getModuleDef2,
  getPositionFromSlotId,
  inferModuleOrientationFromSlot,
  inferModuleOrientationFromXCoordinate,
  isAddressableAreaStandardSlot,
  SPAN7_8_10_11_SLOT,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getSlotIdsBlockedBySpanningForThermocycler } from '../../../step-forms'
import { LabwareOnDeck } from '../../../components/DeckSetup/LabwareOnDeck'
import { selectors } from '../../../labware-ingred/selectors'
import { SlotWarning } from '../../../components/DeckSetup/SlotWarning'
import { getStagingAreaAddressableAreas } from '../../../utils'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { selectPreselectedSlotInfo } from '../../../labware-ingred/actions'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { getRobotType } from '../../../file-data/selectors'
import { getSlotInformation } from '../utils'
import { Fixture } from './constants'
import { FixtureRender } from './FixtureRender'
import { DeckItemHover } from './DeckItemHover'
import { SlotOverflowMenu } from './SlotOverflowMenu'

import type { ModuleTemporalProperties } from '@opentrons/step-generation'
import type {
  AddressableAreaName,
  CutoutId,
  DeckDefinition,
  DeckSlotId,
  Dimensions,
  ModuleModel,
} from '@opentrons/shared-data'
import type {
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '../../../step-forms'
import type { TerminalItemId } from '../../../steplist'

interface DeckSetupDetailsProps {
  activeDeckSetup: InitialDeckSetup
  showGen1MultichannelCollisionWarnings: boolean
  deckDef: DeckDefinition
  stagingAreaCutoutIds: CutoutId[]
  trashSlot: string | null
  addEquipment: (slotId: string) => void
  hover: string | null
  setHover: React.Dispatch<React.SetStateAction<string | null>>
  selectedTerminalItemId?: TerminalItemId | null
  zoomedInSlot?: DeckSlotId
  hoveredLabware: string | null
  hoveredModule: ModuleModel | null
  hoveredFixture: Fixture | null
}

export const DeckSetupDetails = (props: DeckSetupDetailsProps): JSX.Element => {
  const {
    activeDeckSetup,
    showGen1MultichannelCollisionWarnings,
    deckDef,
    trashSlot,
    addEquipment,
    stagingAreaCutoutIds,
    selectedTerminalItemId,
    hover,
    setHover,
    hoveredLabware,
    zoomedInSlot,
    hoveredModule,
    hoveredFixture,
  } = props
  const robotType = useSelector(getRobotType)
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanningForThermocycler(
    activeDeckSetup,
    robotType
  )
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const [menuListId, setShowMenuListForId] = React.useState<DeckSlotId | null>(
    null
  )
  const dispatch = useDispatch<any>()

  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getOnlyLatestDefs()
  const {
    createdLabwareForSlot,
    createdNestedLabwareForSlot,
    createdModuleForSlot,
    preSelectedFixture,
    slotPosition,
  } = getSlotInformation({
    deckSetup: activeDeckSetup,
    slot: zoomedInSlot ?? '',
    deckDef,
  })

  //  conditionally render the slot's info
  React.useEffect(() => {
    dispatch(
      selectPreselectedSlotInfo({
        createdNestedLabwareForSlot,
        createdLabwareForSlot,
        createdModuleForSlot,
        preSelectedFixture,
      })
    )
  }, [
    createdLabwareForSlot,
    createdNestedLabwareForSlot,
    createdModuleForSlot,
    preSelectedFixture,
  ])

  const hoveredLabwareDef =
    hoveredLabware != null
      ? defs[hoveredLabware] ?? customLabwareDefs[hoveredLabware] ?? null
      : null

  const hoveredSlotPosition = React.useMemo(
    () => getPositionFromSlotId(zoomedInSlot ?? '', deckDef),
    [zoomedInSlot, deckDef]
  )
  const allLabware: LabwareOnDeckType[] = Object.keys(
    activeDeckSetup.labware
  ).reduce<LabwareOnDeckType[]>((acc, labwareId) => {
    const labware = activeDeckSetup.labware[labwareId]
    return getLabwareHasQuirk(labware.def, 'fixedTrash')
      ? acc
      : [...acc, labware]
  }, [])

  const allModules: ModuleOnDeck[] = values(activeDeckSetup.modules)
  const menuListSlotPosition = getPositionFromSlotId(menuListId ?? '', deckDef)

  // NOTE: naively hard-coded to show warning north of slots 1 or 3 when occupied by any module
  const multichannelWarningSlotIds: AddressableAreaName[] = showGen1MultichannelCollisionWarnings
    ? compact([
        allModules.some(
          moduleOnDeck =>
            moduleOnDeck.slot === '1' &&
            MODULES_WITH_COLLISION_ISSUES.includes(moduleOnDeck.model)
        )
          ? deckDef.locations.addressableAreas.find(s => s.id === '4')?.id
          : null,
        allModules.some(
          moduleOnDeck =>
            moduleOnDeck.slot === '3' &&
            MODULES_WITH_COLLISION_ISSUES.includes(moduleOnDeck.model)
        )
          ? deckDef.locations.addressableAreas.find(s => s.id === '6')?.id
          : null,
      ])
    : []

  return (
    <>
      {/* all modules */}
      {allModules.map(moduleOnDeck => {
        const slotId =
          moduleOnDeck.slot === SPAN7_8_10_11_SLOT ? '7' : moduleOnDeck.slot

        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        if (slotPosition == null) {
          console.warn(`no slot ${slotId} for module ${moduleOnDeck.id}`)
          return null
        }
        const moduleDef = getModuleDef2(moduleOnDeck.model)
        const getModuleInnerProps = (
          moduleState: ModuleTemporalProperties['moduleState']
        ): React.ComponentProps<typeof Module>['innerProps'] => {
          if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
            let lidMotorState = 'unknown'
            if (
              selectedTerminalItemId === '__initial_setup__' ||
              moduleState.lidOpen === true
            ) {
              lidMotorState = 'open'
            } else if (moduleState.lidOpen === false) {
              lidMotorState = 'closed'
            }
            return {
              lidMotorState,
              blockTargetTemp: moduleState.blockTargetTemp,
            }
          } else if (
            'targetTemperature' in moduleState &&
            moduleState.type === 'temperatureModuleType'
          ) {
            return {
              targetTemperature: moduleState.targetTemperature,
            }
          } else if ('targetTemp' in moduleState) {
            return {
              targetTemp: moduleState.targetTemp,
            }
          }
        }

        const labwareLoadedOnModule = allLabware.find(
          lw => lw.slot === moduleOnDeck.id
        )
        const labwareInterfaceBoundingBox = {
          xDimension: moduleDef.dimensions.labwareInterfaceXDimension ?? 0,
          yDimension: moduleDef.dimensions.labwareInterfaceYDimension ?? 0,
          zDimension: 0,
        }
        const controlSelectDimensions = {
          xDimension: labwareLoadedOnModule?.def.dimensions.xDimension ?? 0,
          yDimension: labwareLoadedOnModule?.def.dimensions.yDimension ?? 0,
          zDimension: labwareLoadedOnModule?.def.dimensions.zDimension ?? 0,
        }
        return hoveredModule == null &&
          zoomedInSlotInfo.selectedModuleModel == null ? (
          <React.Fragment key={moduleOnDeck.id}>
            <Module
              key={moduleOnDeck.id}
              x={slotPosition[0]}
              y={slotPosition[1]}
              def={moduleDef}
              orientation={inferModuleOrientationFromXCoordinate(
                slotPosition[0]
              )}
              innerProps={getModuleInnerProps(moduleOnDeck.moduleState)}
              targetSlotId={slotId}
              targetDeckId={deckDef.otId}
            >
              {labwareLoadedOnModule != null ? (
                <>
                  <LabwareOnDeck
                    x={0}
                    y={0}
                    labwareOnDeck={labwareLoadedOnModule}
                  />
                  <DeckItemHover
                    isZoomed={zoomedInSlot != null}
                    hover={hover}
                    setHover={setHover}
                    setShowMenuListForId={setShowMenuListForId}
                    menuListId={menuListId}
                    slotBoundingBox={controlSelectDimensions}
                    slotPosition={[0, 0, 0]}
                    itemId={slotId}
                    selectedTerminalItemId={props.selectedTerminalItemId}
                  />
                </>
              ) : null}

              {labwareLoadedOnModule == null ? (
                <DeckItemHover
                  isZoomed={zoomedInSlot != null}
                  hover={hover}
                  setHover={setHover}
                  setShowMenuListForId={setShowMenuListForId}
                  menuListId={menuListId}
                  slotBoundingBox={labwareInterfaceBoundingBox}
                  slotPosition={[0, 0, 0]}
                  itemId={slotId}
                  selectedTerminalItemId={props.selectedTerminalItemId}
                />
              ) : null}
            </Module>
          </React.Fragment>
        ) : null
      })}

      {/* on-deck warnings for OT-2 and GEN1 8-channels only */}
      {multichannelWarningSlotIds.map(slotId => {
        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(slotId, deckDef)
          ?.boundingBox
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

      {/* SlotControls for all empty deck */}
      {deckDef.locations.addressableAreas
        .filter(addressableArea => {
          const stagingAreaAddressableAreas = getStagingAreaAddressableAreas(
            stagingAreaCutoutIds
          )
          const addressableAreas =
            isAddressableAreaStandardSlot(addressableArea.id, deckDef) ||
            stagingAreaAddressableAreas.includes(addressableArea.id)
          return (
            addressableAreas &&
            !slotIdsBlockedBySpanning.includes(addressableArea.id)
          )
        })
        .map(addressableArea => {
          return (
            <React.Fragment key={addressableArea.id}>
              <DeckItemHover
                isZoomed={zoomedInSlot != null}
                hover={hover}
                setHover={setHover}
                setShowMenuListForId={setShowMenuListForId}
                menuListId={menuListId}
                slotBoundingBox={addressableArea.boundingBox}
                slotPosition={getPositionFromSlotId(
                  addressableArea.id,
                  deckDef
                )}
                itemId={addressableArea.id}
                selectedTerminalItemId={props.selectedTerminalItemId}
              />
            </React.Fragment>
          )
        })}
      {/* all labware on deck NOT those in modules */}
      {allLabware.map(labware => {
        if (
          labware.slot === 'offDeck' ||
          allModules.some(m => m.id === labware.slot) ||
          allLabware.some(lab => lab.id === labware.slot)
        )
          return null

        const slotPosition = getPositionFromSlotId(labware.slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          labware.slot,
          deckDef
        )?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            <DeckItemHover
              isZoomed={zoomedInSlot != null}
              hover={hover}
              setHover={setHover}
              setShowMenuListForId={setShowMenuListForId}
              menuListId={menuListId}
              slotBoundingBox={slotBoundingBox}
              slotPosition={slotPosition}
              itemId={labware.slot}
              selectedTerminalItemId={props.selectedTerminalItemId}
            />
          </React.Fragment>
        )
      })}

      {/* all nested labwares on deck  */}
      {allLabware.map(labware => {
        if (
          allModules.some(m => m.id === labware.slot) ||
          labware.slot === 'offDeck'
        )
          return null
        if (
          deckDef.locations.addressableAreas.some(
            addressableArea => addressableArea.id === labware.slot
          )
        ) {
          return null
        }
        const slotForOnTheDeck = allLabware.find(lab => lab.id === labware.slot)
          ?.slot
        const slotForOnMod = allModules.find(mod => mod.id === slotForOnTheDeck)
          ?.slot
        let slotPosition = null
        if (slotForOnMod != null) {
          slotPosition = getPositionFromSlotId(slotForOnMod, deckDef)
        } else if (slotForOnTheDeck != null) {
          slotPosition = getPositionFromSlotId(slotForOnTheDeck, deckDef)
        }
        if (slotPosition == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        const slotBoundingBox: Dimensions = {
          xDimension: labware.def.dimensions.xDimension,
          yDimension: labware.def.dimensions.yDimension,
          zDimension: labware.def.dimensions.zDimension,
        }
        const slotOnDeck =
          slotForOnTheDeck != null
            ? allModules.find(module => module.id === slotForOnTheDeck)?.slot
            : null
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            <DeckItemHover
              isZoomed={zoomedInSlot != null}
              hover={hover}
              setShowMenuListForId={setShowMenuListForId}
              menuListId={menuListId}
              setHover={setHover}
              slotBoundingBox={slotBoundingBox}
              slotPosition={slotPosition}
              itemId={slotOnDeck ?? ''}
              selectedTerminalItemId={props.selectedTerminalItemId}
            />
          </React.Fragment>
        )
      })}

      {/* selected hardware + labware */}
      {zoomedInSlotInfo.selectedFixture != null &&
      zoomedInSlotInfo.zoomedInSlot.cutout != null ? (
        <FixtureRender
          fixture={zoomedInSlotInfo.selectedFixture}
          cutout={zoomedInSlotInfo.zoomedInSlot.cutout}
          robotType={robotType}
          deckDef={deckDef}
        />
      ) : null}

      {zoomedInSlotInfo.selectedModuleModel != null &&
      slotPosition != null &&
      hoveredModule == null ? (
        <Module
          key={`${zoomedInSlotInfo.selectedModuleModel}_${zoomedInSlot}_selected`}
          x={slotPosition[0]}
          y={slotPosition[1]}
          def={getModuleDef2(zoomedInSlotInfo.selectedModuleModel)}
          orientation={inferModuleOrientationFromXCoordinate(slotPosition[0])}
        >
          <>
            {zoomedInSlotInfo.selectedLabwareDefUri != null &&
            zoomedInSlotInfo.selectedModuleModel != null ? (
              <g transform={`translate(0, 0)`}>
                <LabwareRender
                  definition={defs[zoomedInSlotInfo.selectedLabwareDefUri]}
                />
              </g>
            ) : null}
            {hoveredLabwareDef != null &&
            zoomedInSlotInfo.selectedModuleModel != null ? (
              <g transform={`translate(0, 0)`}>
                <LabwareRender definition={hoveredLabwareDef} />
              </g>
            ) : null}
          </>
        </Module>
      ) : null}

      {zoomedInSlotInfo.selectedLabwareDefUri != null &&
      slotPosition != null &&
      zoomedInSlotInfo.selectedModuleModel == null ? (
        <g transform={`translate(${slotPosition[0]}, ${slotPosition[1]})`}>
          <LabwareRender
            definition={defs[zoomedInSlotInfo.selectedLabwareDefUri]}
          />
        </g>
      ) : null}

      {/* hovered hardware + labware */}
      {/* TODO add the deck label tags and blue outlines */}
      {hoveredFixture != null &&
      zoomedInSlotInfo.zoomedInSlot.cutout != null ? (
        <FixtureRender
          fixture={hoveredFixture}
          cutout={zoomedInSlotInfo.zoomedInSlot.cutout}
          robotType={robotType}
          deckDef={deckDef}
        />
      ) : null}
      {hoveredModule != null && hoveredSlotPosition != null ? (
        <Module
          key={`${hoveredModule}_${zoomedInSlot}_hover`}
          x={hoveredSlotPosition[0]}
          y={hoveredSlotPosition[1]}
          def={getModuleDef2(hoveredModule)}
          orientation={inferModuleOrientationFromXCoordinate(
            hoveredSlotPosition[0]
          )}
        />
      ) : null}

      {hoveredLabwareDef != null &&
      hoveredSlotPosition != null &&
      zoomedInSlotInfo.selectedModuleModel == null ? (
        <React.Fragment key={`${hoveredLabwareDef.parameters.loadName}_hover`}>
          <g
            transform={`translate(${hoveredSlotPosition[0]}, ${hoveredSlotPosition[1]})`}
          >
            <LabwareRender definition={hoveredLabwareDef} />
          </g>
        </React.Fragment>
      ) : null}

      {menuListSlotPosition != null && menuListId != null ? (
        <RobotCoordsForeignDiv
          x={menuListSlotPosition[0] + 50}
          y={menuListSlotPosition[1] - 160}
          width="172px"
          height="180px"
          innerDivProps={{
            style: {
              position: POSITION_ABSOLUTE,
              transform: 'rotate(180deg) scaleX(-1)',
              zIndex: 5,
            },
          }}
        >
          <SlotOverflowMenu
            slot={menuListId}
            addEquipment={addEquipment}
            setShowMenuList={() => {
              setShowMenuListForId(null)
            }}
          />
        </RobotCoordsForeignDiv>
      ) : null}
    </>
  )
}
