import { AUTH_TYPE_FILE, AUTH_TYPE_PASSWORD, AUTH_TYPE_STRING } from '../types'

import type { EapOption, WifiAuthField } from '../types'

export const mockEapStringField: WifiAuthField = {
  name: 'stringField',
  displayName: 'String Field',
  required: true,
  type: AUTH_TYPE_STRING,
}

export const mockEapPasswordField: WifiAuthField = {
  name: 'passwordField',
  displayName: 'Password Field',
  required: false,
  type: AUTH_TYPE_PASSWORD,
}

export const mockEapFileField: WifiAuthField = {
  name: 'fileField',
  displayName: 'File Field',
  required: true,
  type: AUTH_TYPE_FILE,
}

export const mockEapOption: EapOption = {
  name: 'eapOption',
  displayName: 'EAP Option',
  options: [mockEapStringField, mockEapPasswordField, mockEapFileField],
}
