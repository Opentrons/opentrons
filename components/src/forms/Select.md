Thin wrapper around `react-select` to apply our Opentrons-specific styles. All props are passed directly to [`react-select`](https://react-select.com/props) except for `styles`, `components`, and `classNamePrefix`. The `className` prop appends to the `className` we pass `react-select`. Those props are not passed directly because they provide the base styling of the component

```js
<Select
  options={[
    { value: 'foo', label: 'Foo!' },
    { value: 'bar', label: 'Bar?', isDisabled: true },
    { value: 'baz', label: 'Baz?!' },
  ]}
/>
```

You can also pass grouped options:

```js
<Select
  options={[
    {
      label: 'Classics',
      options: [
        { value: 'foo', label: 'Foo!' },
        { value: 'bar', label: 'Bar?' },
      ],
    },
    {
      label: 'Modern',
      options: [
        { value: 'baz', label: 'Baz?!' },
        { value: 'quux', label: 'Quux.' },
      ],
    },
  ]}
/>
```

Passing `value` controls the input. **Note that `value` has the same format as an entry in `options`**:

```js
<Select
  value={{ value: 'bar', label: 'Bar?' }}
  options={[
    { value: 'foo', label: 'Foo!' },
    { value: 'bar', label: 'Bar?' },
    { value: 'baz', label: 'Baz?!' },
  ]}
/>
```

You can control the renders of individual options with the `formatOptionLabel` prop:

```js
<Select
  options={[
    { value: 'foo', label: 'Foo!' },
    { value: 'bar', label: 'Bar?' },
    { value: 'baz', label: 'Baz?!' },
  ]}
  formatOptionLabel={(option, { context }) =>
    context === 'menu' && option.value === 'bar' ? (
      <span style={{ color: 'green' }}>{option.label}</span>
    ) : (
      option.label
    )
  }
/>
```

To override any styling, we use [`react-select`'s BEM](https://react-select.com/styles#using-classnames) class names with our specific prefix, which is `ot_select`. See `SelectField` for a specific example, where the background color of the `Control` element is modified if the field has an error

```css
.my_class_name {
  & :global(.ot_select__control) {
    background-color: blue;
  }
}
```

```js static
<Select
  className={styles.my_class_name}
  options={[
    { value: 'foo', label: 'Foo!' },
    { value: 'bar', label: 'Bar?' },
    { value: 'baz', label: 'Baz?!' },
  ]}
/>
```
