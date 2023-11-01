const MQTT_USERNAME='admin'
const MQTT_PASSWORD='public'
export const EMQX_IP = '192.168.12.218:8083/mqtt'
// export const EMQX_IP = '10.157.40.130/mqtt'
export const MQTT_OPTIONS = {
    connectTimeout: 5000,
    clientId: '',
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clean: false
}