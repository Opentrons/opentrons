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

            console.log(this.current_position);          
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
            console.log(this.current_position);
            socket.emit("move", this.current_position); 
        }

    }

    window.JogController = JogController;

}());
