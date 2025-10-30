const express = require("express");
const mqtt = require("mqtt");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Arquivos de frontend na pasta public
app.use(express.static("public"));

// Conexão com broker
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// Variável para armazenar o status atual
let mqttStatus = "Desconectado";

// Quando conectar ao broker
client.on("connect", () => {
    console.log("Conectado ao broker MQTT");
    mqttStatus = "Conectado";
    client.subscribe("casadoheitor/lampada/status");
    io.emit("mqtt_status", mqttStatus);
});

client.on("offline", () => {
    console.warn("Cliente MQTT Offline");
    mqttStatus = "Desconectado";
    io.emit("mqtt_status", mqttStatus);
});

client.on("error", (err) => {
    console.error("Erro MQTT:", err.message);
    mqttStatus = "Reconectando";
    io.emit("mqtt_status", mqttStatus);
});

// Receber mensagem do MQTT
client.on("message", (topic, message) => {
    console.log(`[${topic}] ${message.toString()}`);
    io.emit("lampada_status", message.toString());
});

// Comunicar com o navegador via socket.io
io.on("connection", (socket) => {
    console.log("Novo cliente conectado");

    // Envia status MQTT atual para o cliente novo
    socket.emit("mqtt_status", mqttStatus);

    socket.on("ligar_lampada", () => {
        client.publish("casadoheitor/lampada/controle", "ON");
    });

    socket.on("desligar_lampada", () => {
        client.publish("casadoheitor/lampada/controle", "OFF");
    });
});

// Subir o servidor na porta 3000
server.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});