Basic usage:

```js
<Card title='Hello Title Card'>
  <LabeledValue label={'Label'} value={'Value'} />
  <LabeledValue label={'Label'} value={'Value'} />
  <LabeledValue label={'Label'} value={'Value'} />
</Card>
```

Display content in a flex-column:
```js
<Card title='Hello Title Card' column>
  <LabeledValue label={'Label'} value={'Value'} />
  <span>Some child content</span>
  <span>Some more child content</span>  
</Card>
```

Disable the card:
```js
<Card title='Hello Title Card' disabled>
  <LabeledValue label={'Label'} value={'Value'} />
  <LabeledValue label={'Label'} value={'Value'} />
  <LabeledValue label={'Label'} value={'Value'} />
</Card>
```
