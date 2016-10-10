import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const state = {
    is_connected: false,
    connection_port: null,
}



const mutations = {
    UPDATE_ROBOT_CONNECTION (state, payload) {
        state.is_connected = payload.is_connected()
        state.connection_port = payload.connection_port
    },

    // IS_CONNECTED (state) {
    //     state.is_connected = true
    //     state.connection_port = port
    // },
}

const actions = {
    connect_robot ({ commit }, port) {
        const payload = {
            is_connected: true,
            'port': port
        }
        commit('UPDATE_ROBOT_CONNECTION', payload)
    },

    is_connected ({ commit }) {
        this.$http
            .get('http://localhost:5000/robot/serial/is_connected')
            .then((response) => {
                console.log(response)
                if (response.data.is_connected === true){
                    commit(
                        'UPDATE_ROBOT_CONNECTION',
                        {'is_connected': response.data.is_connected, 'port': response.data.port}
                    )
                    console.log('successfully connected...')
                } else {
                    console.log('Failed to connect', response.data)
                    commit('DISCONNECT_ROBOT', port)
                }
            }, (response) => {
                console.log('Failed to communicate to backend server. Failed to connect', response)
                commit('DISCONNECT_ROBOT', port)
            })

    },
    disconnect_robot () {
        // TODO: Implement
    }
}

export default new Vuex.Store({
    state,
    actions,
    mutations
})