// @flow

export const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

const mockDeckCheckSessionData = {
  instruments: {},
  currentStep: 'sessionStart',
  nextSteps: {
    links: { specifyLabware: '/fake/route' },
  },
  sessionToken: 'abc123',
}

// fetch deck check session fixtures

export const mockFetchDeckCheckSessionSuccessMeta = {
  method: 'POST',
  path: '/calibration/check/session',
  ok: true,
  status: 200,
}

export const mockFetchDeckCheckSessionSuccess = {
  ...mockFetchDeckCheckSessionSuccessMeta,
  host: mockRobot,
  body: mockDeckCheckSessionData,
}

export const mockFetchDeckCheckSessionSuccessActionPayload = mockDeckCheckSessionData

export const mockFetchDeckCheckSessionFailureMeta = {
  method: 'POST',
  path: '/calibration/check/session',
  ok: false,
  status: 500,
}

export const mockFetchDeckCheckSessionFailure = {
  ...mockFetchDeckCheckSessionFailureMeta,
  host: mockRobot,
  body: { message: 'Heck, your deck check wrecked!' },
}
