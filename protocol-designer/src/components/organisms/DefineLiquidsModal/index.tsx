import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { yupResolver } from '@hookform/resolvers/yup'
import { clsx } from 'clsx'
import * as Yup from 'yup'

import {
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InlineNotification,
  InputField,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  LiquidIcon,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TextAreaField,
  TYPOGRAPHY,
  useOnClickOutside,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getSortedLiquidClassDefs,
} from '@opentrons/shared-data'
import { swatchColors } from '@opentrons/step-generation'

import {
  HandleEnter,
  LINK_BUTTON_STYLE,
} from '/protocol-designer/components/atoms'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import * as labwareIngredActions from '/protocol-designer/labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '/protocol-designer/labware-ingred/selectors'
import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'

import { LiquidClassDropdown } from './LiquidClassDropdown'
import { LiquidColorPicker } from './LiquidColorPicker'

import type { ThunkDispatch } from 'redux-thunk'
import type { MouseEvent } from 'react'
import type { Ingredient } from '@opentrons/step-generation'
import type { BaseState } from '/protocol-designer/types'

const liquidEditFormSchema: any = Yup.object().shape({
  displayName: Yup.string().required('liquid name is required'),
  displayColor: Yup.string(),
  description: Yup.string(),
  liquidClass: Yup.string(),
})

interface DefineLiquidsModalProps {
  onClose: () => void
}
export function DefineLiquidsModal(
  props: DefineLiquidsModalProps
): JSX.Element {
  const { onClose } = props
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const { t } = useTranslation(['liquids', 'shared'])
  const selectedLiquid = useSelector(
    labwareIngredSelectors.getSelectedLiquidGroupState
  )
  const allLabwareWellContents = useSelector(
    labwareIngredSelectors.getLiquidsByLabwareId
  )
  const nextGroupId = useSelector(labwareIngredSelectors.getNextLiquidGroupId)
  const selectedLiquidGroupState = useSelector(
    labwareIngredSelectors.getSelectedLiquidGroupState
  )
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false)
  const chooseColorWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowColorPicker(false)
    },
  })
  const allIngredientGroupFields = useSelector(
    labwareIngredSelectors.allIngredientGroupFields
  )
  const robotType = useSelector(getRobotType)
  const sortedLiquidClassDefs = getSortedLiquidClassDefs()

  const liquidGroupId = selectedLiquidGroupState.liquidGroupId
  const volumePerWell = Object.values(allLabwareWellContents).flatMap(
    labwareWithIngred =>
      Object.values(labwareWithIngred).map(ingred =>
        liquidGroupId != null ? ingred[liquidGroupId]?.volume : 0
      )
  )
  const liquidHasAssignedWell = volumePerWell.some(volume => volume > 0)

  const deleteLiquidGroup = (): void => {
    if (liquidGroupId != null) {
      dispatch(labwareIngredActions.deleteLiquidGroup(liquidGroupId))
    }
    onClose()
  }

  const cancelForm = (): void => {
    dispatch(labwareIngredActions.deselectLiquidGroup())
    onClose()
  }

  const saveForm = (formData: Ingredient): void => {
    dispatch(
      labwareIngredActions.editLiquidGroup({
        ...formData,
      })
    )
    onClose()
  }

  const selectedIngredFields =
    liquidGroupId != null ? allIngredientGroupFields[liquidGroupId] : null
  const liquidId = selectedLiquid.liquidGroupId ?? nextGroupId

  const initialValues: Ingredient = {
    displayName: selectedIngredFields?.displayName ?? '',
    displayColor: selectedIngredFields?.displayColor ?? swatchColors(liquidId),
    liquidClass: selectedIngredFields?.liquidClass ?? '',
    description: selectedIngredFields?.description ?? '',
    liquidGroupId: liquidGroupId ?? nextGroupId,
  }

  const { handleSubmit, formState, control, watch, setValue, register } =
    useForm<Ingredient>({
      defaultValues: initialValues,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      resolver: yupResolver(liquidEditFormSchema),
    })
  const name = watch('displayName')
  const color = watch('displayColor')
  const liquidClass = watch('liquidClass')
  const { errors, touchedFields } = formState

  const handleLiquidEdits = (values: Ingredient): void => {
    saveForm({
      displayName: values.displayName,
      displayColor: values.displayColor,
      liquidClass:
        values.liquidClass !== ''
          ? (values.liquidClass ?? undefined)
          : undefined,
      description: values.description !== '' ? values.description : null,
      liquidGroupId: values.liquidGroupId,
    })
  }

  const liquidClassOptions = [
    { name: t('liquids:dont_use_liquid_class'), value: '' },
    ...Object.entries(sortedLiquidClassDefs).map(
      ([liquidClassDefName, { displayName, description }]) => {
        return {
          value: liquidClassDefName,
          name: t('liquids:liquid_class_name_description', {
            displayName,
            description,
          }),
        }
      }
    ),
  ]

  const handleClickLiquidIcon = (
    e: MouseEvent<HTMLButtonElement | HTMLDivElement>
  ): void => {
    e.preventDefault()
    setShowColorPicker(prev => !prev)
  }

  return (
    <HandleEnter
      onEnter={() => {
        void handleSubmit(handleLiquidEdits)()
      }}
    >
      <Modal
        zIndexOverlay={15}
        width="37.125rem"
        title={
          selectedIngredFields != null ? (
            <Flex gridGap={SPACING.spacing8}>
              <LiquidIcon color={initialValues.displayColor} />
              <StyledText
                desktopStyle="bodyLargeSemiBold"
                className={clsx(
                  lineClampStyles.line_clamp,
                  lineClampStyles.word_break_all
                )}
                style={{ WebkitLineClamp: 1 }}
              >
                {initialValues.displayName}
              </StyledText>
            </Flex>
          ) : (
            t('define_liquid')
          )
        }
        type="info"
        onClose={onClose}
      >
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            void handleSubmit(handleLiquidEdits)()
          }}
        >
          <>
            {showColorPicker ? (
              <LiquidColorPicker
                chooseColorWrapperRef={chooseColorWrapperRef}
                control={control}
                color={color}
                setValue={setValue}
              />
            ) : null}

            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing12}
              >
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  color={COLORS.grey60}
                  gridGap={SPACING.spacing4}
                >
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('name')}
                  </StyledText>
                  <Controller
                    control={control}
                    name="displayName"
                    render={({ field }) => (
                      <InputField
                        autoFocus
                        name="displayName"
                        error={
                          touchedFields.displayName != null
                            ? errors.displayName?.message
                            : null
                        }
                        value={name}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  color={COLORS.grey60}
                  gridGap={SPACING.spacing4}
                >
                  <TextAreaField
                    label={t('description')}
                    {...register('description')}
                    value={watch('description') ?? ''}
                    height="4.75rem"
                  />
                </Flex>
                {robotType === FLEX_ROBOT_TYPE ? (
                  <LiquidClassDropdown
                    control={control}
                    setValue={setValue}
                    liquidClassOptions={liquidClassOptions}
                    liquidClass={liquidClass}
                  />
                ) : null}
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  color={COLORS.grey60}
                  gridGap={SPACING.spacing4}
                >
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('display_color')}
                  </StyledText>

                  <LiquidIcon
                    onClick={handleClickLiquidIcon}
                    color={color}
                    size="medium"
                  />
                </Flex>
              </Flex>
              <Flex
                justifyContent={
                  selectedIngredFields != null
                    ? JUSTIFY_SPACE_BETWEEN
                    : JUSTIFY_END
                }
                gridGap={SPACING.spacing8}
              >
                {selectedIngredFields != null ? (
                  <Flex>
                    <Btn
                      css={LINK_BUTTON_STYLE}
                      padding={SPACING.spacing4}
                      onClick={deleteLiquidGroup}
                      width="7.1875rem"
                      textDecoration={TYPOGRAPHY.textDecorationUnderline}
                    >
                      <StyledText desktopStyle="bodyDefaultRegular">
                        {t('delete_liquid')}
                      </StyledText>
                    </Btn>
                    {liquidHasAssignedWell ? (
                      <InlineNotification
                        type="alert"
                        message={t('liquid_in_use')}
                      />
                    ) : null}
                  </Flex>
                ) : (
                  <SecondaryButton onClick={cancelForm}>
                    {t('shared:close')}
                  </SecondaryButton>
                )}
                <PrimaryButton
                  type="submit"
                  disabled={
                    errors.displayName != null ||
                    name === '' ||
                    errors.displayColor != null
                  }
                >
                  {t('shared:save')}
                </PrimaryButton>
              </Flex>
            </Flex>
          </>
        </form>
      </Modal>
    </HandleEnter>
  )
}
