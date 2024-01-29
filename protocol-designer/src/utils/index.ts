import uuidv1 from 'uuid/v4'
import {
  WellSetHelpers,
  makeWellSetHelpers,
  AddressableAreaName,
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
  CutoutId,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  isAddressableAreaStandardSlot,
  CutoutFixtureId,
  RobotType,
  INTERACTIVE_WELL_DATA_ATTRIBUTE
} from '@opentrons/shared-data'
import { BoundingRect, GenericRect } from '../collision-types'
import type {
  AdditionalEquipmentEntity,
  LabwareEntities,
  PipetteEntities,
} from '@opentrons/step-generation'
import type { WellGroup } from '@opentrons/components'

export const uuid: () => string = uuidv1
// Collision detection for SelectionRect / SelectableLabware
export const rectCollision = (
  rect1: BoundingRect,
  rect2: BoundingRect
): boolean =>
  rect1.x < rect2.x + rect2.width &&
  rect1.x + rect1.width > rect2.x &&
  rect1.y < rect2.y + rect2.height &&
  rect1.height + rect1.y > rect2.y
export function clientRectToBoundingRect(rect: ClientRect): BoundingRect {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  }
}
export const getCollidingWells = (rectPositions: GenericRect): WellGroup => {
  // Returns set of selected wells under a collision rect
  const { x0, y0, x1, y1 } = rectPositions
  const selectionBoundingRect = {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  }
  // NOTE: querySelectorAll returns a NodeList, so you need to unpack it as an Array to do .filter
  const selectableElems: HTMLElement[] = [
    ...document.querySelectorAll<HTMLElement>(
      `[${INTERACTIVE_WELL_DATA_ATTRIBUTE}]`
    ),
  ]
  const collidedElems = selectableElems.filter((selectableElem, i) =>
    rectCollision(
      selectionBoundingRect,
      clientRectToBoundingRect(selectableElem.getBoundingClientRect())
    )
  )
  const collidedWellData = collidedElems.reduce(
    (acc: WellGroup, elem): WellGroup => {
      if (
        INTERACTIVE_WELL_DATA_ATTRIBUTE.replace('data-', '') in elem.dataset
      ) {
        const wellName = elem.dataset.wellname
        return wellName != null ? { ...acc, [wellName]: null } : acc
      }

      return acc
    },
    {}
  )
  return collidedWellData
}
export const arrayToWellGroup = (w: string[]): WellGroup =>
  w.reduce((acc, wellName) => ({ ...acc, [wellName]: null }), {})
// cross-PD memoization of well set utils
const wellSetHelpers: WellSetHelpers = makeWellSetHelpers()
const {
  canPipetteUseLabware,
  getAllWellSetsForLabware,
  getWellSetForMultichannel,
} = wellSetHelpers
export {
  canPipetteUseLabware,
  getAllWellSetsForLabware,
  getWellSetForMultichannel,
}
export const makeTemperatureText = (
  temperature: number | string | null,
  t: any
): string =>
  temperature === null
    ? t('modules:status.deactivated')
    : `${temperature} ${t('application:units.degrees')}`
export const makeLidLabelText = (lidOpen: boolean, t: any): string =>
  t(`modules:lid_label`, {
    lidStatus: t(lidOpen ? 'modules:lid_open' : 'modules:lid_closed'),
  })

export const makeSpeedText = (
  targetSpeed: number | string | null,
  t: any
): string =>
  targetSpeed === null
    ? t('modules:status.deactivated')
    : `${targetSpeed} ${t('application:units.rpm')}`

export const makeTimerText = (
  targetMinutes: number | string | null,
  targetSeconds: number | string | null,
  t: any
): string | null =>
  targetMinutes === null && targetSeconds === null
    ? null
    : `${targetMinutes}  ${t(
        'application:units.minutes'
      )} ${targetSeconds}  ${t('application:units.seconds')} timer`

export const getIsAdapter = (
  labwareId: string,
  labwareEntities: LabwareEntities
): boolean => {
  if (labwareEntities[labwareId] == null) return false
  return (
    labwareEntities[labwareId].def.allowedRoles?.includes('adapter') ?? false
  )
}

export const getStagingAreaSlots = (
  stagingAreas?: AdditionalEquipmentEntity[]
): string[] | null => {
  if (stagingAreas == null) return null
  //  we can assume that the location is always a string
  return stagingAreas.map(area => area.location as string)
}

export const getHas96Channel = (pipettes: PipetteEntities): boolean => {
  return Object.values(pipettes).some(pip => pip.spec.channels === 96)
}

export const getStagingAreaAddressableAreas = (
  cutoutIds: CutoutId[]
): AddressableAreaName[] => {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const cutoutFixtures = deckDef.cutoutFixtures

  return cutoutIds
    .flatMap(cutoutId => {
      const addressableAreasOnCutout = cutoutFixtures.find(
        cutoutFixture => cutoutFixture.id === STAGING_AREA_RIGHT_SLOT_FIXTURE
      )?.providesAddressableAreas[cutoutId]
      return addressableAreasOnCutout ?? []
    })
    .filter(aa => !isAddressableAreaStandardSlot(aa, deckDef))
}

export const getCutoutIdByAddressableArea = (
  addressableAreaName: AddressableAreaName,
  cutoutFixtureId: CutoutFixtureId,
  robotType: RobotType
): CutoutId => {
  const deckDef = getDeckDefFromRobotType(robotType)
  const cutoutFixtures = deckDef.cutoutFixtures
  const providesAddressableAreasForAddressableArea = cutoutFixtures.find(
    cutoutFixture => cutoutFixture.id.includes(cutoutFixtureId)
  )?.providesAddressableAreas

  const findCutoutIdByAddressableArea = (
    addressableAreaName: AddressableAreaName
  ): CutoutId | null => {
    if (providesAddressableAreasForAddressableArea != null) {
      for (const cutoutId in providesAddressableAreasForAddressableArea) {
        if (
          providesAddressableAreasForAddressableArea[
            cutoutId as keyof typeof providesAddressableAreasForAddressableArea
          ].includes(addressableAreaName)
        ) {
          return cutoutId as CutoutId
        }
      }
    }
    return null
  }

  const cutoutId = findCutoutIdByAddressableArea(addressableAreaName)

  if (cutoutId == null) {
    throw Error(
      `expected to find cutoutId from addressableAreaName ${addressableAreaName} but could not`
    )
  }
  return cutoutId
}
