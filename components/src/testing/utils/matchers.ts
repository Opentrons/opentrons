import { when } from 'jest-when'

// these are needed because under the hood react calls components with two arguments (props and some second argument nobody seems to know)
// https://github.com/timkindberg/jest-when/issues/66
export const componentPropsMatcher = (matcher: unknown): any =>
  // @ts-expect-error(sa, 2021-08-03): when.allArgs not part of type definition yet for jest-when
  when.allArgs((args, equals) => equals(args[0], matcher))

export const partialComponentPropsMatcher = (argsToMatch: unknown): any =>
  // @ts-expect-error(sa, 2021-08-03): when.allArgs not part of type definition yet for jest-when
  when.allArgs((args, equals) =>
    equals(args[0], expect.objectContaining(argsToMatch))
  )

export const anyProps = (): any => partialComponentPropsMatcher({})
