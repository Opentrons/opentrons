// @flow

import * as Helpers from '../helpers'
import * as Fixtures from '../__fixtures__'

describe('getAnalyticsPropsForSession', () => {
  it('returns analytics props for calibration check session', () => {
    expect(Helpers.getAnalyticsPropsForSession(Fixtures.mockSession)).toEqual({
      leftPipetteModel: Fixtures.mockSession.details.instruments.left.model,
      rightPipetteModel: Fixtures.mockSession.details.instruments.right.model,
      comparingFirstPipetteHeightDifferenceVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipetteHeight.differenceVector,
      comparingFirstPipetteHeightThresholdVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipetteHeight.thresholdVector,
      comparingFirstPipetteHeightExceedsThreshold:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipetteHeight.exceedsThreshold,
      comparingFirstPipetteHeightErrorSource:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipetteHeight.transformType,
      comparingFirstPipettePointOneDifferenceVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointOne.differenceVector,
      comparingFirstPipettePointOneThresholdVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointOne.thresholdVector,
      comparingFirstPipettePointOneExceedsThreshold:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointOne.exceedsThreshold,
      comparingFirstPipettePointOneErrorSource:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointOne.transformType,
      comparingFirstPipettePointTwoDifferenceVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointTwo.differenceVector,
      comparingFirstPipettePointTwoThresholdVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointTwo.thresholdVector,
      comparingFirstPipettePointTwoExceedsThreshold:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointTwo.exceedsThreshold,
      comparingFirstPipettePointTwoErrorSource:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointTwo.transformType,
      comparingFirstPipettePointThreeDifferenceVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointThree.differenceVector,
      comparingFirstPipettePointThreeThresholdVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointThree.thresholdVector,
      comparingFirstPipettePointThreeExceedsThreshold:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointThree.exceedsThreshold,
      comparingFirstPipettePointThreeErrorSource:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingFirstPipettePointThree.transformType,
      comparingSecondPipetteHeightDifferenceVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingSecondPipetteHeight.differenceVector,
      comparingSecondPipetteHeightThresholdVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingSecondPipetteHeight.thresholdVector,
      comparingSecondPipetteHeightExceedsThreshold:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingSecondPipetteHeight.exceedsThreshold,
      comparingSecondPipetteHeightErrorSource:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingSecondPipetteHeight.transformType,
      comparingSecondPipettePointOneDifferenceVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingSecondPipettePointOne.differenceVector,
      comparingSecondPipettePointOneThresholdVector:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingSecondPipettePointOne.thresholdVector,
      comparingSecondPipettePointOneExceedsThreshold:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingSecondPipettePointOne.exceedsThreshold,
      comparingSecondPipettePointOneErrorSource:
        Fixtures.mockSession.details.comparisonsByStep
          .comparingSecondPipettePointOne.transformType,
    })
  })
})
