//connect sockets
socket = io.connect('//' + document.domain + ':' + location.port);

// connect to serial
var connect_button = document.getElementById('connect_serial');
var connect_input = document.getElementById('connect_port');

socket.on('connect', function() {
    socket.emit('connected', { data: 'Hello!' });
});

connect_button.addEventListener('click', function() {
    port = connect_input.value;
    socket.emit('connect_serial', { port: port });
});
