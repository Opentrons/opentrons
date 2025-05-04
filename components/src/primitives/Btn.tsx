// import styled, { css } from 'styled-components'

// import * as Styles from '../styles'
// import { RESPONSIVENESS } from '../ui-style-constants'
// import { isntStyleProp, styleProps } from './style-props'

// import type { StyledComponent } from 'styled-components'
// import type { HTMLProps } from 'react'
// import type { StyleProps } from './types'

// export const BUTTON_TYPE_SUBMIT: 'submit' = 'submit'
// export const BUTTON_TYPE_RESET: 'reset' = 'reset'
// export const BUTTON_TYPE_BUTTON: 'button' = 'button'

// const BUTTON_BASE_STYLE = css`
//   appearance: none;
//   padding: 0;
//   border-width: 0;
//   border-style: solid;
//   background-color: transparent;
//   cursor: ${Styles.CURSOR_POINTER};

//   &:disabled,
//   &.disabled {
//     cursor: ${Styles.CURSOR_DEFAULT};
//   }

//   @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
//     cursor: ${Styles.CURSOR_DEFAULT};
//   }
// `

// const BUTTON_VARIANT_STYLE = css`
//   border-color: inherit;
//   border-radius: ${Styles.BORDER_RADIUS_DEFAULT};
//   display: ${Styles.DISPLAY_INLINE_BLOCK};
//   font-size: ${Styles.FONT_SIZE_BODY_2};
//   font-weight: ${Styles.FONT_WEIGHT_SEMIBOLD};
//   line-height: 1.4;
//   padding-left: ${Styles.SPACING_4};
//   padding-right: ${Styles.SPACING_4};
//   padding-top: ${Styles.SPACING_2};
//   padding-bottom: ${Styles.SPACING_2};
//   text-align: ${Styles.TEXT_ALIGN_CENTER};
//   text-transform: ${Styles.TEXT_TRANSFORM_UPPERCASE};
// `

// /**
//  * Button primitive
//  *
//  * @component
//  */
// export const Btn: StyledComponent<
//   'button',
//   any,
//   StyleProps,
//   any
// > = styled.button
//   .withConfig({
//     shouldForwardProp: isntStyleProp,
//   })
//   .attrs((props: HTMLProps<HTMLButtonElement>) => ({
//     type: props.type ?? BUTTON_TYPE_BUTTON,
//   }))`
//   ${BUTTON_BASE_STYLE}
//   ${styleProps}
// `

// /**
//  * Primary button variant
//  *
//  * @component
//  */
// export const PrimaryBtn = styled(Btn)`
//   ${BUTTON_VARIANT_STYLE}
//   background-color: ${Styles.C_DARK_GRAY};
//   color: ${Styles.C_WHITE};
//   box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.2);

//   &:hover,
//   &:focus {
//     background-color: ${Styles.C_BLACK};
//   }

//   &:active {
//     background-color: ${Styles.C_MED_DARK_GRAY};
//   }

//   &:disabled,
//   &.disabled {
//     background-color: ${Styles.C_LIGHT_GRAY};
//     color: ${Styles.C_MED_GRAY};
//     box-shadow: none;
//   }

//   ${styleProps}
// `

// /**
//  * Secondary button variant
//  *
//  * @component
//  */
// export const SecondaryBtn = styled(Btn)`
//   ${BUTTON_VARIANT_STYLE}
//   background-color: ${Styles.C_WHITE};
//   border-width: ${Styles.BORDER_WIDTH_DEFAULT};
//   color: ${Styles.C_DARK_GRAY};

//   &:hover,
//   &:focus {
//     background-color: ${Styles.C_LIGHT_GRAY};
//   }

//   &:active {
//     background-color: ${Styles.C_MED_LIGHT_GRAY};
//   }

//   &:disabled,
//   &.disabled {
//     background-color: ${Styles.C_WHITE};
//     color: ${Styles.C_MED_GRAY};
//   }

//   ${styleProps}
// `

// /**
//  * New primary button variant used in app
//  *
//  * @component
//  */
// export const NewPrimaryBtn = styled(PrimaryBtn)`
//   background-color: ${Styles.C_BLUE};
//   color: ${Styles.C_WHITE};

//   &:hover,
//   &:focus {
//     background-color: ${Styles.C_BLUE};
//     box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.23);
//   }

//   &:active {
//     background-color: #004aaa;
//     box-shadow: none;
//   }

//   &:disabled,
//   &.disabled {
//     background-color: ${Styles.C_FONT_DISABLED};
//     color: ${Styles.C_WHITE};
//     box-shadow: none;
//   }

//   ${styleProps}
// `

// /**
//  * New secondary button variant used in app
//  *
//  * @component
//  */
// export const NewSecondaryBtn = styled(SecondaryBtn)`
//   background-color: ${Styles.C_WHITE};
//   color: ${Styles.C_BLUE};

//   &:hover,
//   &:focus {
//     border-width: '2px';
//     background-color: ${Styles.C_WHITE};
//     color: ${Styles.C_BLUE};
//     box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.23);
//   }

//   &:active {
//     border-width: '2px';
//     background-color: ${Styles.C_WHITE};
//     color: ${Styles.C_BLUE};
//     color: #004aaa;
//     box-shadow: none;
//   }

//   &:disabled,
//   &.disabled {
//     border-width: '2px';
//     background-color: ${Styles.C_WHITE};
//     color: ${Styles.C_FONT_DISABLED};
//     box-shadow: none;
//   }

//   ${styleProps}
// `
// /**
//  * Red primary button variant used in app
//  *
//  * @component
//  */
// export const NewAlertPrimaryBtn = styled(NewPrimaryBtn)`
//   background-color: ${Styles.C_ERROR_DARK};

//   &:hover,
//   &:focus {
//     background-color: ${Styles.C_ERROR_DARK};
//   }

//   &:active {
//     background-color: ${Styles.C_ERROR_LIGHT};
//   }

//   ${styleProps}
// `

// /**
//  * Red secondary button variant used in app
//  *
//  * @component
//  */
// export const NewAlertSecondaryBtn = styled(NewSecondaryBtn)`
//   color: ${Styles.C_ERROR_DARK};

//   &:hover,
//   &:focus {
//     color: ${Styles.C_ERROR_DARK};
//   }

//   &:active {
//     color: ${Styles.C_ERROR_LIGHT};
//   }

//   ${styleProps}
// `

// /**
//  * Light secondary button variant
//  *
//  * @component
//  */
// export const LightSecondaryBtn = styled(SecondaryBtn)`
//   background-color: ${Styles.C_TRANSPARENT};
//   color: ${Styles.C_WHITE};

//   &:hover,
//   &:focus {
//     background-color: ${Styles.OVERLAY_WHITE_10};
//   }

//   &:active {
//     background-color: ${Styles.OVERLAY_WHITE_20};
//   }

//   &:disabled,
//   &.disabled {
//     background-color: ${Styles.C_TRANSPARENT};
//     color: ${Styles.C_MED_GRAY};
//   }

//   ${styleProps}
// `

// /**
//  * Tertiary button variant
//  *
//  * @component
//  */
// export const TertiaryBtn = styled(LightSecondaryBtn)`
//   border-width: 0;
// `

// emotion/react と @emotion/styled をインポート
import { css } from '@emotion/react'
import styled from '@emotion/styled'

// 依存関係は変更なし (ただし、これらが Emotion/React 環境で動作することが前提)
import * as Styles from '../styles'
import { RESPONSIVENESS } from '../ui-style-constants'
// isntStyleProp と styleProps が Emotion 環境で動作する前提
import { isntStyleProp, styleProps } from './style-props'

// css ヘルパーの結果の型 (任意)
import type { SerializedStyles } from '@emotion/react'
// Emotion の StyledComponent 型
import type { StyledComponent } from '@emotion/styled'
// HTML 属性の型 (React 標準)
import type { ButtonHTMLAttributes } from 'react'
// Emotion 用に修正された StyleProps をインポートする想定
import type { StyleProps } from './types'

// 定数は変更なし
export const BUTTON_TYPE_SUBMIT: 'submit' = 'submit'
export const BUTTON_TYPE_RESET: 'reset' = 'reset'
export const BUTTON_TYPE_BUTTON: 'button' = 'button'

// css ヘルパーの使用は変更なし (インポート元のみ変更)
// 型 SerializedStyles を追加 (任意)
const BUTTON_BASE_STYLE: SerializedStyles = css`
  appearance: none;
  padding: 0;
  border-width: 0;
  border-style: solid;
  background-color: transparent;
  cursor: ${Styles.CURSOR_POINTER};

  &:disabled,
  &.disabled {
    cursor: ${Styles.CURSOR_DEFAULT};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    cursor: ${Styles.CURSOR_DEFAULT};
  }
`

const BUTTON_VARIANT_STYLE: SerializedStyles = css`
  border-color: inherit;
  border-radius: ${Styles.BORDER_RADIUS_DEFAULT};
  display: ${Styles.DISPLAY_INLINE_BLOCK};
  font-size: ${Styles.FONT_SIZE_BODY_2};
  font-weight: ${Styles.FONT_WEIGHT_SEMIBOLD};
  line-height: 1.4;
  padding-left: ${Styles.SPACING_4};
  padding-right: ${Styles.SPACING_4};
  padding-top: ${Styles.SPACING_2};
  padding-bottom: ${Styles.SPACING_2};
  text-align: ${Styles.TEXT_ALIGN_CENTER};
  text-transform: ${Styles.TEXT_TRANSFORM_UPPERCASE};
`

/**
 * Button primitive
 *
 * @component
 */
// styled の構文を変更: styled(tag, options)<Props>`...`
// .attrs は削除。デフォルトの type="button" はブラウザの挙動に依存するか、
// 利用側で明示的に指定することを想定。
export const Btn: StyledComponent<
  StyleProps & ButtonHTMLAttributes<HTMLButtonElement>
> = styled('button', {
  shouldForwardProp: isntStyleProp,
})<StyleProps>`
  ${BUTTON_BASE_STYLE}
  ${styleProps} // StyleProps をここで適用
`

/**
 * Primary button variant
 *
 * @component
 */
// styled(BaseComponent) の構文は同じ
export const PrimaryBtn = styled(Btn)`
  ${BUTTON_VARIANT_STYLE}
  background-color: ${Styles.C_DARK_GRAY};
  color: ${Styles.C_WHITE};
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.2);

  &:hover,
  &:focus {
    background-color: ${Styles.C_BLACK};
  }

  &:active {
    background-color: ${Styles.C_MED_DARK_GRAY};
  }

  &:disabled,
  &.disabled {
    background-color: ${Styles.C_LIGHT_GRAY};
    color: ${Styles.C_MED_GRAY};
    box-shadow: none;
  }

  // 注意: styleProps は Btn でも適用されています。
  // ここでの再適用が意図通りか確認してください。
  ${styleProps}
`

/**
 * Secondary button variant
 *
 * @component
 */
export const SecondaryBtn = styled(Btn)`
  ${BUTTON_VARIANT_STYLE}
  background-color: ${Styles.C_WHITE};
  border-width: ${Styles.BORDER_WIDTH_DEFAULT};
  color: ${Styles.C_DARK_GRAY};

  &:hover,
  &:focus {
    background-color: ${Styles.C_LIGHT_GRAY};
  }

  &:active {
    background-color: ${Styles.C_MED_LIGHT_GRAY};
  }

  &:disabled,
  &.disabled {
    background-color: ${Styles.C_WHITE};
    color: ${Styles.C_MED_GRAY};
  }

  // 注意: styleProps は Btn でも適用されています。
  ${styleProps}
`

/**
 * New primary button variant used in app
 *
 * @component
 */
export const NewPrimaryBtn = styled(PrimaryBtn)`
  background-color: ${Styles.C_BLUE};
  color: ${Styles.C_WHITE};

  &:hover,
  &:focus {
    background-color: ${Styles.C_BLUE};
    box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.23);
  }

  &:active {
    background-color: #004aaa; // 直接指定されている色
    box-shadow: none;
  }

  &:disabled,
  &.disabled {
    background-color: ${Styles.C_FONT_DISABLED};
    color: ${Styles.C_WHITE};
    box-shadow: none;
  }

  // 注意: styleProps は Btn と PrimaryBtn でも適用されています。
  ${styleProps}
`

/**
 * New secondary button variant used in app
 *
 * @component
 */
export const NewSecondaryBtn = styled(SecondaryBtn)`
  background-color: ${Styles.C_WHITE};
  color: ${Styles.C_BLUE};
  // border-width が SecondaryBtn ですでに設定されているため、上書き
  border-width: ${Styles.BORDER_WIDTH_DEFAULT}; // 明示的にベースを継承するか確認

  &:hover,
  &:focus {
    border-width: '2px'; // 文字列で指定
    background-color: ${Styles.C_WHITE};
    color: ${Styles.C_BLUE};
    box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.23);
  }

  &:active {
    border-width: '2px'; // 文字列で指定
    background-color: ${Styles.C_WHITE};
    // color が2回指定されている (C_BLUE と #004aaa)。最後のものが優先される
    color: #004aaa;
    box-shadow: none;
  }

  &:disabled,
  &.disabled {
    border-width: '2px'; // 文字列で指定、元の SecondaryBtn の disabled state を上書き
    background-color: ${Styles.C_WHITE};
    color: ${Styles.C_FONT_DISABLED};
    box-shadow: none;
  }

  // 注意: styleProps は Btn と SecondaryBtn でも適用されています。
  ${styleProps}
`
/**
 * Red primary button variant used in app
 *
 * @component
 */
export const NewAlertPrimaryBtn = styled(NewPrimaryBtn)`
  background-color: ${Styles.C_ERROR_DARK};

  &:hover,
  &:focus {
    background-color: ${Styles.C_ERROR_DARK};
    // NewPrimaryBtn の hover/focus スタイル (box-shadow) を上書き
    box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.23); // 維持する場合
    // box-shadow: none; // 上書きする場合
  }

  &:active {
    background-color: ${Styles.C_ERROR_LIGHT};
    // NewPrimaryBtn の active スタイル (box-shadow: none) を継承
  }

  // disabled スタイルは NewPrimaryBtn から継承

  // 注意: styleProps は基底コンポーネント群でも適用されています。
  ${styleProps}
`

/**
 * Red secondary button variant used in app
 *
 * @component
 */
export const NewAlertSecondaryBtn = styled(NewSecondaryBtn)`
  color: ${Styles.C_ERROR_DARK};
  // border-width は NewSecondaryBtn から継承

  &:hover,
  &:focus {
    // NewSecondaryBtn の hover/focus スタイルを上書き
    color: ${Styles.C_ERROR_DARK};
    border-width: '2px'; // 維持
    background-color: ${Styles.C_WHITE}; // 維持
    box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.23); // 維持
  }

  &:active {
    // NewSecondaryBtn の active スタイルを上書き
    color: ${Styles.C_ERROR_LIGHT};
    border-width: '2px'; // 維持
    background-color: ${Styles.C_WHITE}; // 維持
    box-shadow: none; // 維持
  }

  // disabled スタイルは NewSecondaryBtn から継承

  // 注意: styleProps は基底コンポーネント群でも適用されています。
  ${styleProps}
`

/**
 * Light secondary button variant
 *
 * @component
 */
export const LightSecondaryBtn = styled(SecondaryBtn)`
  background-color: ${Styles.C_TRANSPARENT};
  color: ${Styles.C_WHITE};
  // border-width は SecondaryBtn から継承

  &:hover,
  &:focus {
    background-color: ${Styles.OVERLAY_WHITE_10};
    // SecondaryBtn の hover/focus スタイル (C_LIGHT_GRAY) を上書き
    color: ${Styles.C_WHITE}; // 色を維持
  }

  &:active {
    background-color: ${Styles.OVERLAY_WHITE_20};
    // SecondaryBtn の active スタイル (C_MED_LIGHT_GRAY) を上書き
    color: ${Styles.C_WHITE}; // 色を維持
  }

  &:disabled,
  &.disabled {
    background-color: ${Styles.C_TRANSPARENT};
    // SecondaryBtn の disabled スタイル (color: C_MED_GRAY) を上書き
    color: ${Styles.C_MED_GRAY}; // 元の指定と同じだが明示
  }

  // 注意: styleProps は Btn と SecondaryBtn でも適用されています。
  ${styleProps}
`

/**
 * Tertiary button variant
 *
 * @component
 */
export const TertiaryBtn = styled(LightSecondaryBtn)`
  // LightSecondaryBtn (経由して SecondaryBtn) の border-width を上書き
  border-width: 0;

  // 他のスタイル (色、背景、ホバー/アクティブ/無効状態) は LightSecondaryBtn から継承

  // 注意: styleProps は基底コンポーネント群でも適用されています。
  ${styleProps}
`
