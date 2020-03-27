// @flow

export const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

export const mockRobotCalibrationCheckSessionData = {
  instruments: {},
  currentStep: 'sessionStart',
  nextSteps: {
    links: { specifyLabware: '/fake/route' },
  },
}

export const mockCreateCheckSessionSuccess = {
  host: mockRobot,
  method: 'POST',
  path: '/calibration/check/session',
  ok: true,
  status: 200,
  body: mockRobotCalibrationCheckSessionData,
}

export const mockCreateCheckSessionSuccessMeta = {
  method: 'POST',
  path: '/calibration/check/session',
  ok: true,
  status: 200,
}

export const mockCreateCheckSessionFailure = {
  host: mockRobot,
  method: 'POST',
  path: '/calibration/check/session',
  ok: false,
  status: 500,
  body: { message: 'Failed to make a check sesh' },
}

export const mockCreateCheckSessionFailureMeta = {
  method: 'POST',
  path: '/calibration/check/session',
  ok: false,
  status: 500,
}
