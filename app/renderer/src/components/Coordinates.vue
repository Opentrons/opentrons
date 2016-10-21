<template>
<div class="coords">
	<label class="label">X:</label>
  <input type="text" value="0" />
  <label class="label">Y:</label>
  <input type="text" value="0" />
  <label class="label">Z:</label>
  <input type="text" value="0" />
  <label class="label" v-if="instrument">{{axis}}</label>
	<input type="text" value="0" v-if="instrument"/>
</div>
</template>

<script>
export default {
  name: 'DeckSlot',
  props: ['placeable', 'instrument', 'axis'],
  computed: {

  }
}
</script>