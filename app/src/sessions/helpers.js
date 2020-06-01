// @flow
import * as Constants from './constants'
import * as Types from './types'

export const getAnalyticsPropsForSession = (
  session: Types.Session | null
): Types.SessionAnalyticsProps | null => {
  if (!session) return null
  if (session.sessionType === Constants.SESSION_TYPE_CALIBRATION_CHECK) {
    const { instruments, comparisonsByStep } = session.details
    const initialModelsByMount: Types.AnalyticsModelsByMount = {}
    const modelsByMount: Types.AnalyticsModelsByMount = Object.keys(
      instruments
    ).reduce(
      (acc, mount) => ({
        ...acc,
        [`${mount.toLowerCase()}PipetteModel`]: instruments[mount].model,
      }),
      initialModelsByMount
    )
    const initialStepData: Types.CalibrationCheckAnalyticsData = {}
    const normalizedStepData = Object.keys(comparisonsByStep).reduce(
      (acc, stepName) => {
        const {
          differenceVector,
          thresholdVector,
          exceedsThreshold,
          transformType,
        } = comparisonsByStep[stepName]
        return {
          ...acc,
          [`${stepName}DifferenceVector`]: differenceVector,
          [`${stepName}ThresholdVector`]: thresholdVector,
          [`${stepName}ExceedsThreshold`]: exceedsThreshold,
          [`${stepName}ErrorSource`]: transformType,
        }
      },
      initialStepData
    )
    return {
      sessionType: session.sessionType,
      ...modelsByMount,
      ...normalizedStepData,
    }
  }
  return null
}
