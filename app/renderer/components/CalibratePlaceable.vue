<template>
	<section id='task'>
		<h1 class='title'>
			Calibrate the {{this.instrument ? this.instrument.label : ''}}
			pipette to the
			{{this.containerType(this.type) === 'tiprack' ? 'center' : 'bottom'}}
			{{this.calibrationPoint}}
			of your {{this.placeable ? this.placeable.label : ''}} container
		</h1>
		<button class='btn-calibrate save' @click='calibratePlaceable(placeable, instrument)'>SAVE</button>
		<button :class="[{'disabled': !placeable.calibrated}, 'btn-calibrate', 'move-to']" @click='moveToPlaceable(placeable, instrument)'>MOVE TO</button>
		<button v-show='placeableType("tiprack")' :class="[{'disabled': !placeable.calibrated}, 'btn-calibrate', 'move-to']" @click='pickUpTip(instrument)'>PICK UP TIP</button>
		<button v-show='placeableType("tiprack")' :class="[{'disabled': !placeable.calibrated}, 'btn-calibrate', 'move-to']" @click='dropTip(instrument)'>DROP TIP</button>
		<div class='well-img'>
			<span v-if='instrument.channels === 1'>
				<img src='../assets/img/well_single.png' v-show='placeableType("default")' />
				<img src='../assets/img/tiprack_single.png' v-show='placeableType("tiprack")'/>
				<img src='../assets/img/trough_single.png' v-show='placeableType("trough")'/>
				<img src='../assets/img/tuberack_single.png' v-show='placeableType("tuberack")'/>
				<img src='../assets/img/point_trash.png' v-show='placeableType("point")'/>
			</span>
			<span v-else>
				<img src='../assets/img/well_multi.png' v-show='placeableType("default")' />
				<img src='../assets/img/tiprack_multi.png' v-show='placeableType("tiprack")'/>
				<img src='../assets/img/trough_multi.png' v-show='placeableType("trough")'/>
				<img src='../assets/img/tuberack_single.png' v-show='placeableType("tuberack")'/>
				<img src='../assets/img/point_trash.png' v-show='placeableType("point")'/>
			</span>
		</div>
	</section>
</template>

<script>
  export default {
    name: 'CalibratePlaceable',
    methods: {
			placeableType (type) {
				return this.type === type
			},
			calibratePlaceable (placeable, instrument) {
				let slot = placeable.slot
				let label = placeable.label
				let axis = instrument.axis
				this.$store.dispatch('calibrate', {slot: slot, label: label, axis: axis})
			},
			moveToPlaceable (placeable,instrument) {
        let slot = placeable.slot
        let label = placeable.label
        let axis = instrument.axis
        this.$store.dispatch('moveToPosition', {slot: slot, label: label, axis: axis})
      },
			pickUpTip (instrument) {
		    let axis = instrument.axis
		    this.$store.dispatch('pickUpTip', { axis: axis })
		  },
		  dropTip (instrument) {
		    let axis = instrument.axis
		    this.$store.dispatch('dropTip', { axis: axis })
		  },
			currentInstrument (tasks) {
				return tasks.filter((instrument) => {
					return instrument.axis === this.$route.params.instrument
				})[0]
			},
			currentPlaceable (tasks) {
				return this.currentInstrument(tasks).placeables.filter((placeable) => {
					return placeable.label === this.$route.params.placeable
				})[0]
			},
			containerType (type){
				if (type === 'point') {
					return 'point'
				} else if (type.includes('tiprack')) {
					return 'tiprack'
				} else if (type.includes('trough')) {
					return 'trough'
				} else if (type.includes('tuberack')) {
					return 'tuberack'
				}else {
					return 'default'
				}
			}
    },
		computed: {
			instrument () {
				let tasks = this.$store.state.tasks
				return this.currentInstrument(tasks)
			},
			placeable () {
				let tasks = this.$store.state.tasks
				return this.currentPlaceable(tasks)
			},
			type () {
				let tasks = this.$store.state.tasks
				let placeable = this.currentPlaceable(tasks)
				let type = this.containerType(placeable.type)
				return type
			},
			calibrationPoint () {
				let type = this.containerType(this.type)
				let position = 'of the A1 well'
				if (type === 'trough') {
					position = 'of the A1 slot'
				} else if ((type === 'tiprack' || type === 'default') && this.instrument.channels === 8) {
					position = 'of the A1 row'
				} else if (type === 'point') {
					position = ''
				}
				return position
			}
		},
		created: function () {
			if (this.$store.state.tasks) {
				this.$store.dispatch('loadProtocol')
			}
		}
  }
</script>
