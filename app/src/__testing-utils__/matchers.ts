import { when } from 'vitest-when'
import type { Matcher } from '@testing-library/react'

// Match things like <p>Some <strong>nested</strong> text</p>
// Use with either string match: getByText(nestedTextMatcher("Some nested text"))
// or regexp: getByText(nestedTextMatcher(/Some nested text/))
export const nestedTextMatcher = (textMatch: string | RegExp): Matcher => (
  content,
  node
) => {
  const hasText = (n: typeof node): boolean => {
    if (n == null || n.textContent === null) return false
    return typeof textMatch === 'string'
      ? Boolean(n?.textContent.match(textMatch))
      : textMatch.test(n.textContent)
  }
  const nodeHasText = hasText(node)
  const childrenDontHaveText =
    node != null && Array.from(node.children).every(child => !hasText(child))

  return nodeHasText && childrenDontHaveText
}

export const partialComponentPropsMatcher = (argsToMatch: unknown): any =>
  // @ts-expect-error(sa, 2021-08-03): when.allArgs not part of type definition yet for jest-when
  when.allArgs((args, equals) =>
    equals(args[0], expect.objectContaining(argsToMatch))
  )
