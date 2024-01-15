const { Client, Events, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { token, memorization_channel, guildreader } = require('../../config.json');
const sqlite3 = require('sqlite3').verbose();
const EnglishChannelID = memorization_channel.english;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

module.exports = function English() {
    client.once(Events.ClientReady, () => {
        const targetEmbedChannel = client.channels.cache.get(EnglishChannelID);
        //console.log(targetEmbedChannel);

        // create Embed
        const EnglishEmbed = new EmbedBuilder()
            .setTitle('英単語学習を始める！')
            .setColor('Purple')
            .addFields(
                {   name: '注意事項',
                    value: '・ボタンを押下するとプライベートチャンネルが作成されます。\n・問題送信後1分以内に回答しなければチャンネルが削除されます。'
                }
            );

        // create Button
        const EnglishButton = new ButtonBuilder()
                .setCustomId('EnglishButton')
                .setLabel('start!')
                .setStyle(ButtonStyle.Primary)

        // create ActionRow
        const EnglishRow = new ActionRowBuilder()
            .addComponents(EnglishButton);
        
        // sending embed and components
        if (targetEmbedChannel) {
            targetEmbedChannel.send({
                embeds: [EnglishEmbed],
                components: [EnglishRow]
            });
        };
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'EnglishButton') {
            const channel = interaction.channel;

            const member = interaction.member;
            const nickname = member.displayName;

            if (channel) {
                try {
                    await channel.threads.create({
                        name: `${nickname}さん`,
                        autoArchiveDuration: 60,
                        type: ChannelType.Guild,
                        reason: 'なにこれ',
                        parent: interaction.channel.parent
                    });

                    interaction.reply({
                        content: 'チャンネルを作成しました。',
                        ephemeral: true
                    });

                } catch (error) {
                    interaction.reply({
                        content: `エラーが発生したようです。\n再度作成してください。何度もエラーが発生する場合<@${guildreader}>に問い合わせてください。`,
                        ephemeral: true
                    });

                    console.log(error);
                };
            };
        };
    });
};

client.login(token);