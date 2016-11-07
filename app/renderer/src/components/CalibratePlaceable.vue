<template>
	<!-- <div class="calibration-modal">
		<div class="well-img">
			<img src="../assets/img/well_bottom.png" v-show="placeableType('default')" />
			<img src="../assets/img/tiprack_top.png" v-show="placeableType('tiprack')"/>
			<img src="../assets/img/point_top.png" v-show="placeableType('point')"/>
		</div>

		<div :class="['update bottom', disabled]" v-show="placeableType('default') || placeableType('point')">
			<span class="position bottom">Bottom</span>
			<button class="btn-placeable save bottom" @click="calibratePlaceable(placeable,instrument)">Save </button>
			<button class="btn-placeable moveto" :class="{'disabled': !placeable.calibrated}" @click="moveToPlaceable(placeable,instrument)">Move To </button>
		</div>

		<div :class="['update top', disabled]" v-show="placeableType('tiprack')">
			<span class="position top">Tiprack</span>
			<button class="btn-placeable save top" @click="calibratePlaceable(placeable,instrument)">Save </button>
			<button class="btn-placeable moveto" :class="{'disabled': !placeable.calibrated}" @click="moveToPlaceable(placeable,instrument)">Move To </button>
			<button class="pick-tip" :class="{'disabled': !placeable.calibrated}" @click="pickUpTip(instrument)">Pick Up Tip</button>
			<button class="drop-tip" :class="{'disabled': !placeable.calibrated}" @click="dropTip(instrument)">Drop Tip</button>
		</div>
	</div> -->
	<section id="task">
		<h1 class="title">Calibrate the {{currentInstrument(this.$store.state.tasks).label}}
			pipette to the center of your {{currentPlaceable(this.$store.state.tasks).label}} container</h1>
		<button class="btn-calibrate save">SAVE</button>
		<button class="btn-calibrate move-to">MOVE TO</button>
		<button class="btn-calibrate move-to">PICK UP TIP</button>
		<button class="btn-calibrate move-to">DROP TIP</button>
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
			type(){
				let tasks = this.$store.state.tasks
				let placeable = this.currentPlaceable(tasks)
				let type = this.containerType(placeable.type)
				return type
			}
		}
  }
</script>
