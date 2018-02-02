**Important** - Please be sure to:

*   Specify a concrete width or height for the button style
*   Use `<Icon>` prop `name`, _not_ `<Button>` prop `iconName`

```js
<div>
  <IconButton
    onClick={() => alert('you clicked me')}
    title='left'
    name='chevron left'
    className='height-3-rem'
  />
  <IconButton
    onClick={() => alert("can't click")}
    title='in progress'
    name='spinner'
    className='width-3-rem'
    disabled
    spin
  />
</div>
```
