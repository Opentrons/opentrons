// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'
import { vi } from 'vitest'

import type { Mock } from 'vitest'

export const MockLPCContentContainer: Mock = vi.fn(
  ({
    header,
    onClickButton,
    onClickBack,
    oddHeaderBtnCopy,
    desktopFooterBtnCopy,
    secondaryButtonProps,
    children,
  }) => {
    const buttonText =
      oddHeaderBtnCopy !== '' ? oddHeaderBtnCopy : desktopFooterBtnCopy

    return (
      <div data-testid="mock-container">
        <div data-testid="header-prop">{header}</div>
        <button
          data-testid="primary-button"
          data-click-handler={String(!!onClickButton)}
          data-button-text={buttonText}
          onClick={onClickButton}
        />
        <button
          data-testid="secondary-button"
          data-text={secondaryButtonProps?.buttonText}
          data-category={secondaryButtonProps?.buttonCategory}
          data-type={secondaryButtonProps?.buttonType}
          data-has-click={String(!!secondaryButtonProps?.onClick)}
        />
        {onClickBack != null && (
          <button data-testid="back-button" onClick={onClickBack} />
        )}
        {children}
      </div>
    )
  }
)
