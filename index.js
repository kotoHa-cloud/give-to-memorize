const { Client, GatewayIntentBits, Events } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.once(Events.ClientReady, () => {
    console.log('bot is ready.');
    status();
});

function status() {
    client.user.setActivity({
        name: 'botは正常に起動しています！(ver:0.0.1)',
        status: 'online'
    });
};

client.login(token);