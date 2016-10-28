<template>
	<div class="calibration-modal" v-bind:class="currentMode">
		<div class="pipette-img">
		  <img src="../assets/img/pipette_top.png" class="top" />
		  <img src="../assets/img/pipette_bottom.png" class="bottom" />
		  <img src="../assets/img/pipette_blowout.png" class="blowout" />
		  <img src="../assets/img/pipette_droptip.png" class="droptip" />
		</div>
		<div class="update">
		  <a @click="toggleMode('top')"class="position top">Top</a>
		  <button class="btn-update save top" @click="calibrateInstrument(instrument, 'top')">Save</button>
		  <button @click="moveToPlungerPosition(instrument, 'top')" :class="[{'disabled': disabled(instrument, 'top')}, 'btn-update', 'moveto', 'top']">Move</button>
		  <div class="spacer"></div>
		  <a @click="toggleMode('bottom')" class="position bottom">Bottom</a>
		  <button class="btn-update save bottom" @click="calibrateInstrument(instrument, 'bottom')">Save</button>
		  <button @click="moveToPlungerPosition(instrument, 'bottom')" :class="[{'disabled': disabled(instrument, 'bottom')}, 'btn-update', 'moveto', 'bottom']">Move</button>
		  <a @click="toggleMode('blowout')" class="position blowout">Blowout</a>
		  <button class="btn-update save blowout" @click="calibrateInstrument(instrument, 'blow_out')">Save</button>
		  <button @click="moveToPlungerPosition(instrument, 'blow_out')" :class="[{'disabled': disabled(instrument, 'blow_out')}, 'btn-update', 'moveto', 'blowout']">Move</button>
		  <a @click="toggleMode('droptip')" class="position droptip">Drop Tip</a>
		  <button class="btn-update save droptip" @click="calibrateInstrument(instrument, 'drop_tip')">Save</button>
		  <button @click="moveToPlungerPosition(instrument, 'drop_tip')" :class="[{'disabled': disabled(instrument, 'drop_tip')}, 'btn-update', 'moveto', 'droptip']">Move</button>
		  <button class="btn-update test pick-liquid">Pick Up</button>
		  <button class="btn-update test eject-liquid">Eject</button>
		</div>
	</div>
</template>

<script>
  export default {
    name: 'CalibrateInstrument',
    props: ['instrument'],
    data: function() {
      return {
        currentMode : 'droptip'
      }
    },
    methods: {
    	calibrateInstrument(instrument, position) {
    		let axis = instrument.axis
    		this.$store.dispatch("calibrate", {axis, position})
    	},
      moveToPlungerPosition(instrument, position) {
				// TODO - test if this moves the robot if the class disabled is on the given position
        let axis = instrument.axis
        this.$store.dispatch("moveToPosition", {axis, position})
      },
			disabled(instrument, position) {
				if (instrument[position] == undefined) { return true }
			},
      toggleMode(mode){
        this.currentMode = mode
      }
    }
  }
</script>
