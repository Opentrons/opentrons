import type { FlexStackerArgs } from '@opentrons/step-generation'
import type { HydratedFlexStackerFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

export const flexStackerFormToArgs = (
  castFormData: GetCastFormData<HydratedFlexStackerFormData>
): FlexStackerArgs | null => {
  const {
    fillPrimaryLabwareUri,
    fillLidLabwareUri,
    fillAdapterLabwareUri,
    flexStackerFormType,
    interventionMessage,
    moduleId,
    fillQuantity,
  } = castFormData
  switch (flexStackerFormType) {
    case 'empty':
      return {
        moduleId: moduleId!,
        commandCreatorFnName: 'flexStackerEmpty',
        interventionMessage,
      }
    case 'fill':
      return {
        moduleId: moduleId!,
        commandCreatorFnName: 'flexStackerFillItems',
        fillPrimaryLabwareUri,
        fillLidLabwareUri,
        fillAdapterLabwareUri,
        fillQuantity,
        interventionMessage,
      }
    case 'retrieve':
      return {
        moduleId: moduleId!,
        commandCreatorFnName: 'flexStackerRetrieve',
      }
    case 'store':
      return {
        moduleId: moduleId!,
        commandCreatorFnName: 'flexStackerStore',
      }

    default:
      return null
  }
}
