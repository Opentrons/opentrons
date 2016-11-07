<template>
	<section id="task">
		<h1 class="title">Calibrate the {{this.instrument.label}}
			pipette to the center of the {{this.placeable.slot}} position of your {{this.placeable.label}} container</h1>
		<button class="btn-calibrate save" @click="calibratePlaceable(placeable, instrument)">SAVE</button>
		<button class="btn-calibrate move-to" @click="moveToPlaceable(placeable, instrument)">MOVE TO</button>
		<button class="btn-calibrate move-to" @click="pickUpTip(instrument)">PICK UP TIP</button>
		<button class="btn-calibrate move-to" @click="dropTip(instrument)">DROP TIP</button>
		<div class="well-img">
			<img src="../assets/img/well_bottom.png" v-show="placeableType('default')" />
			<img src="../assets/img/tiprack_top.png" v-show="placeableType('tiprack')"/>
			<img src="../assets/img/point_top.png" v-show="placeableType('point')"/>
		</div>
	</section>
</template>

<script>
  export default {
    name: 'CalibratePlaceable',
    methods: {
			placeableType(type) {
				return this.type === type
			},
			calibratePlaceable(placeable, instrument) {
				let slot = placeable.slot
				let label = placeable.label
				let axis = instrument.axis
				this.$store.dispatch("calibrate", {slot: slot, label: label, axis: axis})
			},
			moveToPlaceable(placeable,instrument) {
        let slot = placeable.slot
        let label = placeable.label
        let axis = instrument.axis
        this.$store.dispatch("moveToPosition", {slot: slot, label: label, axis: axis})
      },
			pickUpTip(instrument) {
		    let axis = instrument.axis
		    this.$store.dispatch("pickUpTip", { axis: axis })
		  },
		  dropTip(instrument) {
		    let axis = instrument.axis
		    this.$store.dispatch("dropTip", { axis: axis })
		  },
			currentInstrument(tasks) {
				return tasks.filter((instrument) => {
					return instrument.axis == this.$route.params.instrument
				})[0]
			},
			currentPlaceable(tasks) {
				return this.currentInstrument(tasks).placeables.filter((placeable) => {
					return placeable.label ==  this.$route.params.placeable
				})[0]
			},
			containerType(type){
				if (type === "point"){
					return "point"
				} else if (type.includes("tiprack")){
					return "tiprack"
				}
				else {
					return "default"
				}
			}
    },
		computed: {
			calibration() {
				let tasks = this.$store.state.tasks
				let placeable = this.currentPlaceable(tasks)
				return placeable
			},
			instrument() {
				let tasks = this.$store.state.tasks
				return this.currentInstrument(tasks)
			},
			placeable() {
				let tasks = this.$store.state.tasks
				return this.currentPlaceable(tasks)
			},
			type() {
				let tasks = this.$store.state.tasks
				let placeable = this.currentPlaceable(tasks)
				let type = this.containerType(placeable.type)
				return type
			}
		}
  }
</script>
