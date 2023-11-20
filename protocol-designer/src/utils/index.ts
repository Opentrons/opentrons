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
} from '@opentrons/shared-data'
import { i18n } from '../localization'
import { WellGroup } from '@opentrons/components'
import { BoundingRect, GenericRect } from '../collision-types'
import type {
  AdditionalEquipmentEntity,
  LabwareEntities,
  PipetteEntities,
} from '@opentrons/step-generation'

export const registerSelectors: (arg0: any) => void =
  process.env.NODE_ENV === 'development'
    ? // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('reselect-tools').registerSelectors
    : (a: any) => {}
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
export const getCollidingWells = (
  rectPositions: GenericRect,
  selectableClassname: string
): WellGroup => {
  // Returns set of selected wells under a collision rect
  const { x0, y0, x1, y1 } = rectPositions
  const selectionBoundingRect = {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  }
  // NOTE: querySelectorAll returns a NodeList, so you need to unpack it as an Array to do .filter
  // @ts-expect-error(sa, 2021-6-21): there is no option to query by class selector in HTMLElementTagNameMap (see type of querySelectorAll)
  const selectableElems: HTMLElement[] = [
    ...document.querySelectorAll('.' + selectableClassname),
  ]
  const collidedElems = selectableElems.filter((selectableElem, i) =>
    rectCollision(
      selectionBoundingRect,
      clientRectToBoundingRect(selectableElem.getBoundingClientRect())
    )
  )
  const collidedWellData = collidedElems.reduce(
    (acc: WellGroup, elem): WellGroup => {
      // TODO IMMEDIATELY no magic string 'wellname'
      if ('wellname' in elem.dataset) {
        const wellName = elem.dataset.wellname
        // @ts-expect-error(sa, 2021-6-21): wellName might be undefined
        return { ...acc, [wellName]: null }
      }

      return acc
    },
    {}
  )
  return collidedWellData
}
// TODO IMMEDIATELY use where appropriate
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
  temperature: number | string | null
): string =>
  temperature === null
    ? i18n.t('modules.status.deactivated')
    : `${temperature} ${i18n.t('application.units.degrees')}`
export const makeLidLabelText = (lidOpen: boolean): string =>
  i18n.t(`modules.lid_label`, {
    lidStatus: i18n.t(lidOpen ? 'modules.lid_open' : 'modules.lid_closed'),
  })

export const makeSpeedText = (targetSpeed: number | string | null): string =>
  targetSpeed === null
    ? i18n.t('modules.status.deactivated')
    : `${targetSpeed} ${i18n.t('application.units.rpm')}`

export const makeTimerText = (
  targetMinutes: number | string | null,
  targetSeconds: number | string | null
): string | null =>
  targetMinutes === null && targetSeconds === null
    ? null
    : `${targetMinutes}  ${i18n.t(
        'application.units.minutes'
      )} ${targetSeconds}  ${i18n.t('application.units.seconds')} timer`

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
