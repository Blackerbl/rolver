const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();
const express = require('express'); // İsteğe bağlı olarak Express.js ile port açılabilir

// Bot istemcisi oluşturuluyor
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// Express.js sunucusunu başlatıyoruz
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Discord bot çalışıyor!');
});

app.listen(port, () => {
    console.log(`Sunucu port ${port} üzerinden çalışıyor.`);
});

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!rolver')) {
        if (!message.member.permissions.has('ManageRoles')) {
            return message.reply('Bu komutu kullanmak için yeterli yetkiniz yok.');
        }

        const role = message.mentions.roles.first();
        if (!role) {
            return message.reply('Lütfen geçerli bir rol etiketleyin.');
        }

        const members = await message.guild.members.fetch();
        const totalMembers = members.filter(member => !member.user.bot).size;
        let processedCount = 0;

        let statusMessage = await message.channel.send(`0/${totalMembers} kişiye rol verildi...`);
        
        const startTime = Date.now();

        const promises = members.map(async (member) => {
            if (!member.user.bot && !member.roles.cache.has(role.id)) {
                try {
                    await member.roles.add(role);
                    processedCount++;
                    await message.channel.send(`${member.user.tag} görev başarılı!`); // Başarı mesajı
                } catch (error) {
                    console.error(`Rol verilemedi: ${member.user.tag}`, error);
                }
            }

            if (processedCount % 5 === 0 || processedCount === totalMembers) {
                const elapsedTime = (Date.now() - startTime) / 1000;
                const avgTimePerMember = elapsedTime / processedCount;
                const remainingMembers = totalMembers - processedCount;
                const estimatedTimeLeft = Math.round(avgTimePerMember * remainingMembers);

                await statusMessage.edit(
                    `${processedCount}/${totalMembers} kişiye rol verildi... Tahmini kalan süre: ${estimatedTimeLeft} saniye`
                );
            }
        });

        await Promise.all(promises);

        await statusMessage.edit(`${processedCount}/${totalMembers} kişiye rol verme işlemi tamamlandı.`);
    }
});

client.login(process.env.TOKEN);
