import mapValues from 'lodash/mapValues'
export const PD_VERSION = '5.2.0'
export const migrateSavedStepForms = (
  savedStepForms: Record<string, any>
): Record<string, any> => {
  // Add keys for new fields introduced in PD v5.2.0, with default values
  return mapValues(savedStepForms, stepForm => {
    if (stepForm.stepType === 'moveLiquid') {
      return {
        ...stepForm,
        dispense_airGap_checkbox: false,
        dispense_airGap_volume: null,
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
