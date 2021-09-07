import mapValues from 'lodash/mapValues'
export const PD_VERSION = '5.1.0'
export const migrateSavedStepForms = (
  savedStepForms: Record<string, any>
): Record<string, any> => {
  return mapValues(savedStepForms, stepForm => {
    if (stepForm.stepType === 'mix') {
      // add default values for new fields in Mix forms
      return {
        ...stepForm,
        aspirate_delay_checkbox: false,
        aspirate_delay_seconds: '1',
        dispense_delay_checkbox: false,
        dispense_delay_seconds: '1',
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
