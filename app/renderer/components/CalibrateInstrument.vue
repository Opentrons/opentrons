<template>
	<section id="task-pipette" >
		<h1 class="title">Calibrate the {{currentInstrument().label}} pipette on axis {{currentInstrument().axis | capitalize}} </h1>
		<span>
			<div class="calibrate-pipette">
				<section class="calibrate top" @mouseenter="toggleMode('top')">
					<span class="title">TOP</span>
					<button @click="calibrateInstrument(currentAxis(), 'top')" class="btn-calibrate save">SAVE</button>
					<button @click="moveToPlungerPosition(currentAxis(), 'top')" :class="[{'disabled': !calibrated('top')}, 'btn-calibrate', 'move-to']">MOVE TO</button>
				</section>

				<section class="calibrate bottom" @mouseenter="toggleMode('bottom')">
					<span class="title">BOTTOM</span>
					<button @click="calibrateInstrument(currentAxis(), 'bottom')" class="btn-calibrate save">SAVE</button>
					<button @click="moveToPlungerPosition(currentAxis(), 'bottom')" :class="[{'disabled': !calibrated('bottom')}, 'btn-calibrate', 'move-to']">MOVE TO</button>
				</section>

				<section class="calibrate blowout" @mouseenter="toggleMode('blow-out')">
					<span class="title">BLOW OUT</span>
					<button @click="calibrateInstrument(currentAxis(), 'blow_out')" class="btn-calibrate save">SAVE</button>
					<button @click="moveToPlungerPosition(currentAxis(), 'blow_out')" :class="[{'disabled': !calibrated('blow_out')}, 'btn-calibrate', 'move-to']">MOVE TO</button>
				</section>

				<section class="calibrate drop-tip" @mouseenter="toggleMode('drop-tip')">
					<span class="title">DROP TIP</span>
					<button @click="calibrateInstrument(currentAxis(), 'drop_tip')" class="btn-calibrate save">SAVE</button>
					<button @click="moveToPlungerPosition(currentAxis(), 'drop_tip')" :class="[{'disabled': !calibrated('drop_tip')}, 'btn-calibrate', 'move-to']">MOVE TO</button>
				</section>
				<section class="calibrate volume">
					<!-- <span class="title">MAX VOL ul</span> -->
					<input v-model="volume" placeholder="SET MAX VOL">
					<button @click="maxVolume(currentAxis(), volume)" class="btn-calibrate save">SAVE</button>
					<span class="title">{{currentInstrument().max_volume}}ul</span>
				</section>
			</div>
			<div class="pipette-diagrams" v-bind:class="currentMode">
	      <img src="../assets/img/pipette_top.png" class="top"/>
	      <img src="../assets/img/pipette_bottom.png" class="bottom"/>
	      <img src="../assets/img/pipette_blowout.png" class="blow-out"/>
	      <img src="../assets/img/pipette_droptip.png" class="drop-tip"/>
	    </div>
		</span>
		<section class="calibrate tips">
			<button @click="pickUpTip(currentAxis())" class="btn-calibrate move-to">PICK UP TIP</button>
			<button @click="dropTip(currentAxis())" class="btn-calibrate move-to">DROP TIP</button>
			<button @click="aspirate(currentAxis())" class="btn-calibrate move-to">ASPIRATE</button>
			<button @click="dispense(currentAxis())" class="btn-calibrate move-to">DISPENSE</button>
		</section>
	</section>
</template>

<script>
  export default {
    name: 'CalibrateInstrument',
    data: function() {
      return {
        currentMode : 'drop-tip',
        volume : null
      }
    },
    filters: {
    capitalize: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
	    }
	  },
    methods: {
			currentAxis() {
				return this.$route.params.instrument
			},
			toggleMode(mode){
        this.currentMode = mode
      },
    	calibrateInstrument(axis, position) {
    		this.$store.dispatch("calibrate", {axis, position})
    	},
      moveToPlungerPosition(axis, position) {
        this.$store.dispatch("moveToPosition", {axis, position})
      },
			pickUpTip(axis) {
		    this.$store.dispatch("pickUpTip", { axis })
		  },
		  dropTip(axis) {
		    this.$store.dispatch("dropTip", { axis })
		  },
		  aspirate(axis) {
		    this.$store.dispatch("aspirate", { axis })
		  },
		  dispense(axis) {
		    this.$store.dispatch("dispense", { axis })
		  },
		  maxVolume(axis, volume) {
		  	volume = parseFloat(volume)
		    this.$store.dispatch("maxVolume", { axis, volume })
		  },
			calibrated(position) {
				let instrument = this.$store.state.tasks.filter((instrument) => {
					return instrument.axis == this.$route.params.instrument
				})[0]
				return typeof(instrument[position]) == "number" ? true : false
			},
			currentInstrument() {
				return this.$store.state.tasks.filter((instrument) => {
						return instrument.axis == this.$route.params.instrument
					})[0]
				}
	    },
		created: function() {
			if (this.$store.state.tasks) {
				this.$store.dispatch("loadProtocol")
			}
		}
  }
</script>
