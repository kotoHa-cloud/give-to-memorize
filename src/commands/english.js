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

let EnglishThreads;

module.exports = function English() {
    client.once(Events.ClientReady, () => {
        const targetEmbedChannel = client.channels.cache.get(EnglishChannelID);
        //console.log(targetEmbedChannel);

        // embedを作成
        const EnglishEmbed = new EmbedBuilder()
            .setTitle('英単語学習を始める！')
            .setColor('Purple')
            .addFields(
                {   name: '注意事項',
                    value: '・ボタンを押下するとプライベートチャンネルが作成されます。\n・問題送信後1分以内に回答しなければチャンネルが削除されます。'
                }
            );

        // ボタンを作成
        const EnglishButton = new ButtonBuilder()
                .setCustomId('EnglishButton')
                .setLabel('start!')
                .setStyle(ButtonStyle.Primary)

        // コンポーネントを作成
        const EnglishRow = new ActionRowBuilder()
            .addComponents(EnglishButton);
        
        // embedとコンポーネントを送信
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
                    const EnglishThreads = await channel.threads.create({
                        name: `${nickname}さん`,
                        autoArchiveDuration: 60,
                        type: ChannelType.PrivateThread,
                        parent: interaction.channel.parent
                    });

                    interaction.reply({
                        content: 'プライベートスレッドを作成しました。',
                        ephemeral: true
                    });

                    const userId = interaction.user.id;

                    const ThreadEmbed = new EmbedBuilder()
                        .setTitle(`ようこそ。${nickname}さん。`)
                        .setDescription(`<@${userId}>ステータス: 学習中`)
                        .setColor('Grey')
                        .setFields(
                            {
                                name: '注意事項',
                                value: '問題はボタンを押すと送信されます。\n問題は完全にランダムです。1時間後に自動的に削除されます。'
                            }
                        );
                    
                    await EnglishThreads.send({
                        embeds: [ThreadEmbed]
                    });

                    const db = new sqlite3.Database('./database/questions.db');

                    const randomWordQuery = 'SELECT * FROM English ORDER BY RANDOM() LIMIT 1;';

                    db.get(randomWordQuery, (err, row) => {
                        if (err) {
                            console.error(err.message);
                            return;
                        };

                        if (row) {
                            const selectedWord = row.words;
                            const correctMeaning = row.means;

                            const randomMeaningsQuery = `SELECT means FROM English WHERE means != ? ORDER BY RANDOM() LIMIT 3;`;

                            db.all(randomMeaningsQuery, [correctMeaning], (err, meanings) => {
                                if (err) {
                                    console.error(err.message);
                                    return;
                                };

                                db.close();

                                const allButtons = [
                                        new ButtonBuilder()
                                        .setCustomId('correctButton')
                                        .setLabel(`${correctMeaning}`)
                                        .setStyle(ButtonStyle.Secondary),
                                    ...meanings.map((meaning, index) => {
                                        return new ButtonBuilder()
                                            .setCustomId(`wrongButton-${index + 1}`)
                                            .setLabel(`${meaning.means}`)
                                            .setStyle(ButtonStyle.Secondary);
                                    }),
                                ];

                                const shuffledButtons = shuffleArray(allButtons);

                                const embed = new EmbedBuilder()
                                    .setTitle(selectedWord)
                                    .setDescription('上の単語の正しい意味を押せ')
                                    .setColor('Grey')

                                const buttons = new ActionRowBuilder()
                                    .addComponents(...shuffledButtons);

                                if (EnglishThreads) {
                                    EnglishThreads.send({
                                        embeds: [embed],
                                        components: [buttons]
                                    });
                                };
                            });
                        } else {
                            console.log('No data found.');
                            db.close();
                        };
                        
                        
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

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;
        if (interaction.customId === 'EnglishButton') return;

        const channel = interaction.channel;
        
        // 正解のボタンが押されたか確認
        if (interaction.customId === 'correctButton') {
            channel.send('✅ 正解です！');
            sendNextQuestion(channel);
        } else { 
            channel.send('❌ 不正解です！');
            sendNextQuestion(channel);
        };

        await interaction.deferUpdate();
    });
};

client.login(token);

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    };
    return array;
};

async function sendNextQuestion(channel) {
    // 以下は以前の問題生成コードをそのまま流用

    const db = new sqlite3.Database('./database/questions.db');

    const randomWordQuery = 'SELECT * FROM English ORDER BY RANDOM() LIMIT 1;';

    db.get(randomWordQuery, (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        };

        if (row) {
            const selectedWord = row.words;
            const correctMeaning = row.means;

            const randomMeaningsQuery = `SELECT means FROM English WHERE means != ? ORDER BY RANDOM() LIMIT 3;`;

            db.all(randomMeaningsQuery, [correctMeaning], (err, meanings) => {
                if (err) {
                    console.error(err.message);
                    return;
                };

                db.close();

                const allButtons = [
                    new ButtonBuilder()
                        .setCustomId('correctButton')
                        .setLabel(`${correctMeaning}`)
                        .setStyle(ButtonStyle.Secondary),
                    ...meanings.map((meaning, index) => {
                        return new ButtonBuilder()
                            .setCustomId(`wrongButton-${index + 1}`)
                            .setLabel(`${meaning.means}`)
                            .setStyle(ButtonStyle.Secondary);
                    }),
                ];

                const shuffledButtons = shuffleArray(allButtons);

                const embed = new EmbedBuilder()
                    .setTitle(selectedWord)
                    .setDescription('上の単語の正しい意味を押せ')
                    .setColor('Grey')

                const buttons = new ActionRowBuilder()
                    .addComponents(...shuffledButtons);

                if (channel) {
                    channel.send({
                        embeds: [embed],
                        components: [buttons]
                    });
                };
            });
        } else {
            console.log('No data found.');
            db.close();
        };
    });
};