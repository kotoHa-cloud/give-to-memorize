const { Client, GatewayIntentBits, Events, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const { token, memorization_channel } = require('../../config.json');
const sqlite3 = require('sqlite3').verbose();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

module.exports = function japanese() {
    /*
    client.once(Events.ClientReady, () => {
        
        const select_List = new StringSelectMenuBuilder()
            .setCustomId('japanese')
            .setPlaceholder('')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('現代文')
                    .setDescription('現代文の暗記を始める')
                    .setValue('ModernJpanese'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('古典')
                    .setDescription('古典の暗記を始める')
                    .setValue('ClassicalJapanese'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('漢文')
                    .setDescription('漢文の暗記を始める')
                    .setValue('LiteraryChinese')
            );

        const row = new ActionRowBuilder()
            .addComponents(select_List);

            const JapaneseChannelID = memorization_channel.japanese;

            const JapaneseChannel = client.channels.cache.get(JapaneseChannelID);

            const JapaneseEmbed = new EmbedBuilder()
                .setTitle('✍｜国語暗記フォーム')
                .setColor('Grey')
                .addFields(
                    {
                        name: '注意事項',
                        value: '問題は完全ランダムで表示されます。\nあなたの回答は、回答者が運営者にはわからない形で保存されます。'
                    },
                );
            
                if(JapaneseChannel) {
                    JapaneseChannel.send({
                        embeds: [JapaneseEmbed],
                        components: [row]
                    });
                };
    });
    */

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isAnySelectMenu()) return;
        const { customId } = interaction;

        if (customId === 'japanese') {
            const modal = new ModalBuilder()
                .setCustomId('inputNumber')
                .setTitle('問題数入力フォーム');

            const numberTimes = new TextInputBuilder()
                .setCustomId('numberTimes')
                .setLabel('問題を何問解きたいですか')
                .setStyle(TextInputStyle.Short);

            const numberTimes_row = new ActionRowBuilder()
                .addComponents(numberTimes);

            modal.addComponents(numberTimes_row);

            await interaction.showModal(modal);
        };
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isModalSubmit()) return;

        if (interaction.customId === 'inputNumber') {
            const numberTimes = interaction.fields.getTextInputValue('numberTimes');

            if (numberTimes && /^\d+$/.test(numberTimes) && numberTimes > 0) {
                interaction.reply({
                    content: `問題数${numberTimes}問で受け付けました！`,
                    ephemeral: true
                });
                CreateQuestions();
            } else {
                interaction.reply({
                    content: '半角数字で入力または、1以上の整数を入力してください',
                    ephemeral: true
                });
                return;
            };
        };
    }); 

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        // 正解のボタンが押されたか確認
        if (interaction.customId === 'correctButton') {
            interaction.reply({
                content: '✅ 正解です！',
                ephemeral: true
            });
            // ここで正解の処理を追加する（例：スコアの増加など）
            await CreateQuestions(interaction);
        } else {
            interaction.reply({
                content: '❌ 不正解です！',
                ephemeral: true
            });
            // ここで不正解の処理を追加する
            await CreateQuestions(interaction);
        };
    
        // ボタンを無効化
        //await interaction.deferUpdate();
    });
    
};

client.login(token);

function CreateQuestions() {
    const db = new sqlite3.Database('./database/questions.db');

    // ランダムに1つの単語とその意味を取得する SQL クエリ
    const randomWordQuery = 'SELECT * FROM ClassicalJapanese ORDER BY RANDOM() LIMIT 1;';

    // ランダムに1つの単語とその意味を取得
    db.get(randomWordQuery, (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        };

        if (row) {
            const selectedWord = row.words;
            const correctMeaning = row.means;

            //console.log(`Selected Word: ${selectedWord}`);
            //console.log(`Correct Meaning: ${correctMeaning}`);

            // 選択された単語の意味以外の3つのランダムな意味を取得する SQL クエリ
            const randomMeaningsQuery = `SELECT means FROM ClassicalJapanese WHERE means != ? ORDER BY RANDOM() LIMIT 3;`;

            // パラメータとして選択された単語の正しい意味を渡してランダムな意味を取得
            db.all(randomMeaningsQuery, [correctMeaning], (err, meanings) => {
                if (err) {
                    console.error(err.message);
                    return;
                };

                /* ランダムに取得した3つの意味を表示
                console.log('Random Meanings:');
                meanings.forEach((meaning, index) => {
                    console.log(`${index + 1}. ${meaning.means}`);
                });
                */

                // データベース接続を閉じる
                db.close();

                // ボタンをランダムに並び替え
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

                // Embedを作成
                const embed = new EmbedBuilder()
                    .setTitle(selectedWord)
                    .setDescription('上の単語の正しい意味を押せ。')
                    .setColor('Grey');

                // ボタンを作成
                const buttons = new ActionRowBuilder()
                    .addComponents(...shuffledButtons);

                const JapaneseChannelID = memorization_channel.japanese;
                const JapaneseChannel = client.channels.cache.get(JapaneseChannelID);

                // メッセージを送信
                if (JapaneseChannel) {
                    JapaneseChannel.send({
                        embeds: [embed],
                        components: [buttons],
                        ephemeral: true
                    });
                };
            });
        } else {
            console.log('No data found.');
            // データベース接続を閉じる
            db.close();
        };
    });
};

// ボタンをランダムに並び替える関数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    };
    return array;
};