// @flow
import mapValues from 'lodash/mapValues'

export const PD_VERSION = '5.0.0'

export const migrateSavedStepForms = (savedStepForms: {
  [string]: any,
  ...,
}): { [string]: any, ... } => {
  // NOTE: intentionally not importing constants or getDefaultsForStepType
  // to protect this particular migration fn from breaking if those values are ever changed.

  // Add keys for new fields introduced in PD v5.0.0, with default values
  return mapValues(savedStepForms, stepForm => {
    if (stepForm.stepType === 'moveLiquid') {
      const DEFAULT_MM_FROM_BOTTOM_ASPIRATE = 1
      const DEFAULT_MM_FROM_BOTTOM_DISPENSE = 0.5
      const DEFAULT_DELAY_SECONDS = 1
      return {
        ...stepForm,
        aspirate_airGap_checkbox: false,
        aspirate_airGap_volume: null,
        aspirate_delay_checkbox: false,
        aspirate_delay_mmFromBottom: `${DEFAULT_MM_FROM_BOTTOM_ASPIRATE}`,
        aspirate_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        dispense_delay_checkbox: false,
        dispense_delay_mmFromBottom: `${DEFAULT_MM_FROM_BOTTOM_DISPENSE}`,
        dispense_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
      }
    }
    return stepForm
  })
}

export const migrateFile = (fileData: any): any => {
  return {
    ...fileData,
    designerApplication: {
      ...fileData.designerApplication,
      version: PD_VERSION,
      data: {
        ...fileData.designerApplication.data,
        savedStepForms: migrateSavedStepForms(
          fileData.designerApplication.data.savedStepForms
        ),
      },
    },
  }
}
