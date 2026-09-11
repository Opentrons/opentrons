'use strict'

const { RuleTester } = require('eslint')
const rule = require('../../../lib/rules/no-direct-use-mutation')

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

ruleTester.run('no-direct-use-mutation', rule, {
  valid: [
    {
      code: 'useMutation(() => {})',
      filename:
        '/repo/react-api-client/src/accessControl/useDocumentedMutation.ts',
    },
    {
      code: 'useQuery(() => {})',
      filename: '/repo/react-api-client/src/runs/usePlayRunMutation.ts',
    },
    {
      code: 'const useMutation = () => {}; const x = useMutation',
      filename: '/repo/react-api-client/src/runs/usePlayRunMutation.ts',
    },
    {
      code: 'foo.useMutation(() => {})',
      filename: '/repo/react-api-client/src/runs/usePlayRunMutation.ts',
    },
  ],
  invalid: [
    {
      code: 'useMutation(() => {})',
      filename: '/repo/react-api-client/src/runs/usePlayRunMutation.ts',
      errors: [{ messageId: 'noDirectUseMutation' }],
    },
    {
      code: 'const result = useMutation({ mutationFn: async () => {} })',
      filename:
        '/repo/app/src/organisms/Desktop/RobotCertImport/useHandleRobotCertImport.ts',
      errors: [{ messageId: 'noDirectUseMutation' }],
    },
  ],
})
