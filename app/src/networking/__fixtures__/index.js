// @flow
// mock responses for networking endpoints

export * from './status'

// Fetch wifi list fixtures

// export const mockWifiList = {
//   list: [
//     {
//       ssid: 'linksys',
//       signal: 50,
//       active: false,
//       security: 'WPA2 802.1X',
//       securityType: 'wpa-eap',
//     },
//   ],
// }

// export const mockWifiListSuccessMeta = makeSuccessMeta('GET', '/wifi/list')

// export const mockWifiListSuccess = makeResponse(
//   mockWifiListSuccessMeta,
//   mockRobot,
//   mockWifiList
// )

// export const mockWifiListFailureMeta = makeErrorMeta('GET', '/wifi/list')

// export const mockWifiListFailure = makeResponse(
//   mockWifiListFailureMeta,
//   mockRobot,
//   { message: 'Wifi List Fail' }
// )

// // Fetch wifi eap options fixtures

// export const mockEapOptions = {
//   options: [
//     {
//       name: 'peap/mschapv2',
//       displayName: 'PEAP/MS-CHAP v2',
//       options: [
//         {
//           name: 'identity',
//           displayName: 'Username',
//           required: true,
//           type: 'string',
//         },
//         {
//           name: 'anonymousIdentity',
//           displayName: 'Anonymous Identity',
//           required: false,
//           type: 'string',
//         },
//         {
//           name: 'caCert',
//           displayName: 'CA Certificate File',
//           required: false,
//           type: 'file',
//         },
//         {
//           name: 'password',
//           displayName: 'password',
//           required: true,
//           type: 'password',
//         },
//       ],
//     },
//   ],
// }

// export const mockWifiEapOptionsSuccessMeta = makeSuccessMeta(
//   'GET',
//   '/wifi/eap-options'
// )

// export const mockWifiEapOptionsSuccess = makeResponse(
//   mockWifiEapOptionsSuccessMeta,
//   mockRobot,
//   mockEapOptions
// )

// export const mockWifiEapOptionsFailureMeta = makeErrorMeta(
//   'GET',
//   '/wifi/eap-options'
// )

// export const mockWifiEapOptionsFailure = makeResponse(
//   mockWifiEapOptionsFailureMeta,
//   mockRobot,
//   { message: 'EAP Fail' }
// )

// // Fetch wifi keys fixtures

// export const mockWifiKeys = {
//   keys: [
//     { uri: '/wifi/keys/abda234a234', id: 'abda234a234', name: 'client.pem' },
//   ],
// }

// export const mockWifiKeysSuccessMeta = makeSuccessMeta('GET', '/wifi/keys')

// export const mockWifiKeysSuccess = makeResponse(
//   mockWifiKeysSuccessMeta,
//   mockRobot,
//   mockWifiKeys
// )

// export const mockWifiKeysFailureMeta = makeErrorMeta('GET', '/wifi/keys')

// export const mockWifiKeysFailure = makeResponse(
//   mockWifiKeysFailureMeta,
//   mockRobot,
//   { message: 'Key ListFail' }
// )

// // add wifi key fixtures

// // configure fixtures
