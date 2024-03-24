const { token } = require('./config.json');
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        for (const guild of client.guilds.cache.values()) {
            const rescuelog = new SlashCommandBuilder()
                .setName('rescuelog')
                .setDescription('Log your rescue into the SNR Rescue Log')
                .addStringOption(option => option.setName('rescue_number').setDescription('The Rescue # this falls under, into the log'))
                .addStringOption(option => option.setName('client_name').setDescription('Name of the Client'))
                .addStringOption(option => option.setName('location').setDescription('Location of the rescue'))
                .addStringOption(option => option.setName('situation').setDescription('Basic description of the rescue and measures used'));

            const rescuelogCommand = rescuelog.toJSON();
            await guild.commands.create(rescuelogCommand);

            console.log('Slash command registered successfully');
            console.log('Francis is clocked in and ready for duty');
        }
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
});

async function execute(interaction) {
    try {
        const rescueNumber = interaction.options.getString('rescue_number');
        const clientName = interaction.options.getString('client_name');
        const location = interaction.options.getString('location');
        const situation = interaction.options.getString('situation');
        const username = interaction.user.username;

        // Create select menu with options
        const select = new StringSelectMenuBuilder()
            .setCustomId('thumbnail_selection')
            .setPlaceholder('Select Thumbnail')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Transport')
                    .setDescription('Select this if the mission can be classified as "Transport"')
                    .setValue('transport'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Medical')
                    .setDescription('Select this if the mission can be classified as "Medical"')
                    .setValue('medical'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Medical & Transport')
                    .setDescription('Select this if the mission was both Medical and Transport')
                    .setValue('medical_transport'),
            );

        // Add select menu to action row
        const actionRow = new ActionRowBuilder()
            .addComponents(select);

        // Initial embed without thumbnail
        const logEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Rescue # ${rescueNumber} - Reported by ${username}`)
            .addFields(
                { name: 'Client Name', value: clientName, inline: true },
                { name: 'Location', value: location, inline: true },
                { name: 'Situation', value: situation, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Book Keeper Francis', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

        // Send initial interaction reply with select menu
        const reply = await interaction.reply({
            content: 'Please select a thumbnail:',
            embeds: [logEmbed],
            components: [actionRow.toJSON()],
        });

        // Create collector for select menu interaction
        const collector = reply.createMessageComponentCollector({
            componentType: 'SELECT_MENU',
            time: 60000,
        });

        // Handle interaction selection
        collector.on('collect', async (interaction) => {
            const selectedThumbnail = interaction.values[0];

            // Define the image URL for the selected thumbnail
            const thumbnailUrls = {
                'transport': 'https://i.postimg.cc/wMsF30Wb/transport.png',
                'medical': 'https://i.postimg.cc/fRQqSQQ7/medical.png',
                'medical_transport': 'https://i.postimg.cc/d1hgmRHG/medicaltransport.png'
            };

            const thumbnailUrl = thumbnailUrls[selectedThumbnail];

            // Create a new embed with the selected thumbnail
    const newLogEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`Rescue # ${rescueNumber} - Reported by ${username}`)
    .addFields(
        { name: 'Client Name', value: clientName, inline: true },
        { name: 'Location', value: location, inline: true },
        { name: 'Situation', value: situation, inline: true }
    )
    .setThumbnail(thumbnailUrl) // Set the thumbnail
    .setTimestamp()
    .setFooter({ text: 'Book Keeper Francis', iconURL: 'https://i.imgur.com/AfFp7pu.png' });


            // Update the original message with the selected thumbnail
            await interaction.editReply({
                content: 'Please select a thumbnail:',
                embeds: [newLogEmbed.setThumbnail(thumbnailUrl)],
                components: [
                    {
                        type: 1, // Action Row type
                        components: [select.toJSON()]
                    }
                ],
            });

            // Stop collecting interactions
            collector.stop();
        });
    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply('An error occurred while processing your interaction.');
    }
}

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand() && interaction.commandName === 'rescuelog') {
        await execute(interaction);
    } else if (interaction.isSelectMenu() && interaction.customId === 'thumbnail_selection') {
        const selectedThumbnail = interaction.values[0]; // Get the selected value from the select menu

        // Define the image URLs for each thumbnail option
        const thumbnailUrls = {
            'transport': 'https://i.postimg.cc/wMsF30Wb/transport.png',
            'medical': 'https://i.postimg.cc/fRQqSQQ7/medical.png',
            'medical_transport': 'https://i.postimg.cc/d1hgmRHG/medicaltransport.png'
        };

        // Get the selected thumbnail URL
        const thumbnailUrl = thumbnailUrls[selectedThumbnail];

        // Update the original message with the thumbnail attached
        const logEmbed = interaction.message.embeds[0];
        logEmbed.thumbnail = { url: thumbnailUrl };

        // Edit the reply to show the selected thumbnail
        await interaction.update({ embeds: [logEmbed], components: [] });
    }
});

client.login(token);