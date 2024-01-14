const { Client, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
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

const commandsDirectory = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsDirectory).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsDirectory, file));
    command(client);
}
client.login(token);