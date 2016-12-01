<template>
	<div class='coords'>
		<label class='label'>X: </label>
		<input type='text' v-bind:value='coords.x' />
		<label class='label'>Y: </label>
		<input type='text' v-bind:value='coords.y' />
		<label class='label'>Z: </label>
		<input type='text' v-bind:value='coords.z' />
		<label class='label' v-if='instrument'>{{axis}}: </label>
		<input type='text' v-bind:value='coords[axis.toLowerCase()]' v-if='instrument'/>
	</div>
</template>

<script>
	export default {
		name: 'DeckSlot',
		props: ['placeable', 'instrument', 'axis'],
		computed: {
			coords () {
				let coords = this.$store.state.coordinates
				for (var coord in coords) {
					coords[coord] = Math.floor(coords[coord] * 100) / 100
				}
				return coords
			}
		}
	}
</script>
