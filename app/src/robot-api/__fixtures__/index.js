// @flow
// generic, robot HTTP API fixtures

export const mockRobot = { name: 'robot', ip: '127.0.0.1', port: 31950 }

export const mockFailedRequest = {
  response: {
    host: { name: 'robotName', ip: '8.6.75.309', port: 666 },
    path: '/modules/abc123/update',
    method: 'POST',
    body: {},
    status: 500,
    ok: false,
  },
  status: 'failure',
  error: { message: 'went bad' },
}
