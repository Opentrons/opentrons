(function() {

    function JogController() {
        this.increment = 1; //keep track of currently selected increment
        this.increment_plunger = 1; //separate plunger increment (necessary to avoid moving plunger at larger increments)
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.b = 0;
        this.a = 0;
        this.current_position = { x: 0, y: 0, z: 0, a: 0, b: 0 };
    }

    JogController.prototype = {

        moveRelative: function(axis, direction) {
            //move positive or negative direction
            var dir = 1;
            if (direction == 'neg') {
                dir = -1;
            }
            //check and apply proper increment property based on selected axis
            if (axis == 'a' || axis == 'b') {
                increment = dir * this.increment_plunger;

            } else {
                increment = dir * this.increment;
            }

            //update the current position
            this.current_position[axis] += increment;
            this[axis] += increment;

            //now move to it
            socket.emit("move", this.current_position);           
        },
        setIncrementXYZ: function(n) {
            this.increment = n;
        },
        getIncrementXYZ: function() {
            return this.increment;
        },
        setIncrementAB: function(n) {
            this.increment_plunger = n;
        },
        getIncrementAB: function() {
            return this.increment_plunger;
        },
        moveAbsolute: function(coords) {
            //move to hardcoded coordinates for each deck slot
            //zero out Z first
            this.current_position.z = 0;
            this.z = 0;
            //them move x,y
            for (var axis in coords) {
                this.current_position[axis] = coords[axis];
                this[axis] = coords[axis];
            }
            socket.emit("move", this.current_position); 
        },
        setCurrentPosition: function(coords){
            //called when motor control driver has completed 
            //moving the robot to a set deckslot, or saved container position
        },
        moveToContainer: function(container){
            // called when moveTo buttons are clicked for saved container
            // may be able to bundle this with move to deck slot functionality
            // if we are just sending strings to labsuite
        }



    }

    window.JogController = JogController;

}());
