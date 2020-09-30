```js
const [state, setState] = React.useState({ selectedValue: 'chocolate' })
;<RadioGroup
  value={state.selectedValue}
  options={[
    { name: 'Hazelnut', value: 'hazelnut' },
    { name: 'Chocolate', value: 'chocolate' },
    { name: 'Ginger', value: 'ginger' },
  ]}
  onChange={e => setState({ selectedValue: e.target.value })}
/>
```

Inline

```js
const [state, setState] = React.useState({ selectedValue: 'chocolate' })
;<RadioGroup
  value={state.selectedValue}
  options={[
    { name: 'Hazelnut', value: 'hazelnut' },
    { name: 'Chocolate', value: 'chocolate' },
    { name: 'Ginger', value: 'ginger' },
  ]}
  inline
  onChange={e => setState({ selectedValue: e.target.value })}
/>
```
