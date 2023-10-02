import {
  CommandCreatorError,
  FLEX_TRASH_DEF_URI,
  OT_2_TRASH_DEF_URI,
} from '../..'
import * as errorCreators from '../../errorCreators'
import type { CommandCreator } from '../../types'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { dropTip } from './dropTip'

/** Drop all tips from equipped pipettes.
 * If no tips are attached to a pipette, do nothing.
 */
export const dropAllTips: CommandCreator<null> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const errors: CommandCreatorError[] = []
  const pipetteIds: string[] = Object.keys(prevRobotState.pipettes)
  const trashId = Object.values(invariantContext.labwareEntities).find(
    lw =>
      lw.labwareDefURI === FLEX_TRASH_DEF_URI ||
      lw.labwareDefURI === OT_2_TRASH_DEF_URI
  )?.id
  const wasteChuteId = Object.values(
    invariantContext.additionalEquipmentEntities
  ).find(aE => aE.name === 'wasteChute')?.id

  let dropTipLocation: string | null = null
  if (trashId != null && wasteChuteId != null) {
    dropTipLocation = wasteChuteId
  } else if (trashId == null && wasteChuteId != null) {
    dropTipLocation = wasteChuteId
  } else if (trashId != null && wasteChuteId == null) {
    dropTipLocation = trashId
  }

  if (dropTipLocation == null) {
    errors.push(errorCreators.dropTipLocationDoesNotExist())
  }

  const commandCreators = pipetteIds.map(pipette =>
    curryCommandCreator(dropTip, {
      pipette,
      dropTipLocation: dropTipLocation ?? '',
    })
  )
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
