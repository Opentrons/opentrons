// @flow
import * as Constants from './constants'
import * as Types from './types'

export const getAnalyticsPropsForSession = (
  session: ?Types.Session
): Types.SessionAnalyticsProps | null => {
  if (!session) return null
  if (session.sessionType === Constants.SESSION_TYPE_CALIBRATION_CHECK) {
    //  session.details.comparisonsByStep,
    const { instruments, comparisonsByStep } = session.details
    const modelsByMount = Object.keys(instruments).reduce(
      (acc, mount) => ({
        ...acc,
        [`${mount.toLowerCase()}PipetteModel`]: instruments[mount].model,
      }),
      {}
    )
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
      {}
    )
    return {
      ...modelsByMount,
      ...normalizedStepData,
    }
  }
  return null
}
