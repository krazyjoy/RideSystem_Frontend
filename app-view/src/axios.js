import axios from 'axios';

const instance = axios.create({

    baseURL: 'http://192.168.12.218:8089/api/v1/'
});

export default {
    install: function(Vue) {
        Object.defineProperty(Vue.prototype, 'axios', { value: instance });
    }
}
