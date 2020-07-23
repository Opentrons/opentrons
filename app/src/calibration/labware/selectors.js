// @flow
import { createSelector } from 'reselect'

import type { State } from '../../types'
import type { LabwareCalibrationObjects } from './../types'
import type { LabwareWithCalibration } from './types'
import {
  getLabwareDisplayName,
  getModuleDisplayName,
} from '@opentrons/shared-data'

import filter from 'lodash/filter'
import countBy from 'lodash/countBy'
import keyBy from 'lodash/keyBy'

import { selectors as robotSelectors } from '../../robot'

export const getListOfLabwareCalibrations = (
  state: State,
  robotName: string
): Array<LabwareCalibrationObjects | null> | null => {
  return state.calibration[robotName]?.labwareCalibration?.data ?? null
}

// Note: due to some circular dependencies, this selector needs
// to live in calibration/labware though it should actually be
// a part of the protocol/ selectors
export const associateLabwareWithCalibration: (
  state: State,
  robotName: string
) => Array<LabwareWithCalibration> = createSelector<
  State,
  string,
  Array<LabwareWithCalibration>,
  _,
  _,
  _
>(
  (state: State) => robotSelectors.getLabware(state),
  robotSelectors.getModulesBySlot,
  getListOfLabwareCalibrations,
  (labware, modulesBySlot, labwareCalibrations) => {
    const updatedLabwareType = []
    labware.map(lw => {
      const moduleName = modulesBySlot[lw.slot]?.model ?? ''
      const newDataModel = { ...lw }
      newDataModel.type = lw.type + moduleName
      updatedLabwareType.push(newDataModel)
    })

    const labwareCount = countBy(updatedLabwareType, 'type')
    const calibrations = filter(labwareCalibrations, function(l) {
      return Object.keys(labwareCount).includes(l?.attributes.loadName)
    })

    const calibrationLoadNamesMap = keyBy(calibrations, function(
      labwareObject
    ) {
      const loadName = labwareObject?.attributes.loadName ?? ''
      const parent = labwareObject?.attributes.parent ?? ''
      return loadName + parent
    })

    const labwareDisplayNames = []
    updatedLabwareType.map(lw => {
      const moduleName = modulesBySlot[lw.slot]?.model ?? ''
      const parentName = (moduleName && getModuleDisplayName(moduleName)) || ''
      const data =
        calibrationLoadNamesMap[lw.type]?.attributes.calibrationData.offset
          .value
      const calibrationData = data
        ? { x: data[0], y: data[1], z: data[2] }
        : null
      const displayName =
        (lw.definition && getLabwareDisplayName(lw.definition)) || ''
      return labwareDisplayNames.push({
        display: displayName,
        quantity: labwareCount[lw.type],
        parent: parentName,
        calibration: calibrationData,
      })
    })
    return labwareDisplayNames
  }
)
