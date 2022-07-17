var layout = {
    title: 'Gravimetric',
    uirevision: true,
    xaxis: {autorange: true},
    yaxis: {autorange: true},
}

function _on_screen_size_update(evt) {
    var div = document.getElementById('plotly')
    div.style.width = (window.innerWidth - 50) + 'px'
    div.style.height = (window.innerHeight - 50) + 'px'
}

function _random() {
    return Math.floor(Math.random() * 17) + 1
}

function _create_fake_data() {

    function _random_array(len, sort) {
        var ret = []
        var rand_len = _random() + 3
        for (var i=0;i<rand_len;i++) {
            if (sort) {
                ret.push(i * 2)
            }
            else {
                ret.push(_random())
            }
        }
        return ret
    }

    return [
        {
            x: _random_array(4, true),
            y: _random_array(4),
            type: 'scatter'
        }
    ]
}

function _initialize_plot_with_data(data) {
    Plotly.newPlot('plotly', data, layout, {responsive: true});
}

function _update_plot_with_data(data) {
    Plotly.react('plotly', data, layout, {responsive: true});
}

window.addEventListener('load', _on_screen_size_update);
window.addEventListener('resize', _on_screen_size_update);

window.addEventListener('load', function (evt) {
    _initialize_plot_with_data(_create_fake_data())
    // TODO: make server
    setTimeout(function (evt) {
        _update_plot_with_data(_create_fake_data())
    }, 2000)
});
