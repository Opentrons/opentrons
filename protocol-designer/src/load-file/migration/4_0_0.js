// @flow
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'

// NOTE: unlike other major bump (schema change) migrations, the only change
// from v3 to v4 protocol schema is adding additional commands.
// In designerApplication.data, there's a "minor bump" migration for changes
// in the Pause form.

export const PD_VERSION = '4.0.0'

export const migrateSavedStepForms = (savedStepForms: { [string]: any }) => {
  // NOTE: intentionally not importing PAUSE_UNTIL_TIME / PAUSE_UNTIL_TEMP from constants.js
  // to protect this particular migration fn from breaking if those values are ever changed.
  const PAUSE_ACTION_MAP = {
    true: 'untilTime',
    false: 'untilResume',
  }

  // Pause form key name and value enum changed
  return mapValues(savedStepForms, stepForm => {
    if (stepForm.stepType === 'pause') {
      const prevPauseActionValue = stepForm.pauseForAmountOfTime
      let res = omit(stepForm, 'pauseForAmountOfTime')
      res.pauseAction = PAUSE_ACTION_MAP[prevPauseActionValue]
      return res
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
