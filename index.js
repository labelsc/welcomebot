const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config.json');
const Canvas = require('@napi-rs/canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],
    partials: ['CHANNEL'] // DM mesajları için gerekli
});

// Bot durumu
client.once('playing', () => {
    console.log(`${client.user.tag} botu aktif!`);
    client.user.setActivity('kélesh | Hoşgeldin Botu');
});

// Karşılama görseli
async function createWelcomeImage(user) {
    const canvas = Canvas.createCanvas(700, 250);
    const ctx = canvas.getContext('2d');

    const background = await Canvas.loadImage('https://i.imgur.com/3eB4Z3f.png');
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(350, 100, 75, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: 'jpg', size: 512 }));
    ctx.drawImage(avatar, 275, 25, 150, 150);
    ctx.restore();

    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#5bc0de';
    ctx.shadowColor = '#5bc0de';
    ctx.shadowBlur = 15;
    ctx.arc(350, 100, 78, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.closePath();

    ctx.font = 'bold 28px "Arial Black", Gadget, sans-serif';
    ctx.fillStyle = '#ffffffcc';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 10;
    ctx.fillText('Hoşgeldin!', 350, 210);

    ctx.font = '18px "Arial", sans-serif';
    ctx.fillStyle = '#ffffffcc';
    ctx.shadowBlur = 8;
    ctx.fillText('Sunucumuza hoşgeldin, kuralları okumayı unutma!', 350, 240);

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'welcome.png' });
}

// Yeni üye gelince tetiklenir
client.on('guildMemberAdd', async member => {
    if (member.guild.id !== config.guildId) return;

    // Güvenlik kontrolü
    const now = new Date();
    const accountAge = now - member.user.createdAt;
    const sevenDays = 1000 * 60 * 60 * 24 * 7;
    const isSecure = accountAge >= sevenDays;
    const securityStatus = isSecure ? 'Güvenli ✓' : 'Yeni Hesap ⚠️';

    const welcomeImage = await createWelcomeImage(member.user);

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `${member.guild.name} 🎉 Hoş Geldin!`,
            iconURL: member.guild.iconURL()
        })
        .setColor("#5bc0de")
        .setDescription(`
<:kullanici:123456789012345678>  **Kullanıcı:**        <@${member.id}> - ${member.user.username}
<:kimlik:123456789012345678>     **Kullanıcı ID:**      ${member.id}
<:takvim:123456789012345678>     **Hesap Tarihi:**      ${new Date(member.user.createdAt).toLocaleString('tr-TR')}
<:giris:123456789012345678>      **Giriş Sırası:**      ${member.guild.memberCount}/${member.guild.memberCount}
<:guvenli:123456789012345678>    **Hesap Güvenliği:**   ${securityStatus}

**🎉 Merhabalar, sunucumuza hoşgeldiniz!**  
Katıldığın için üzerine **Kayıtsız Üye** rolünü verdim!
        `)
        .setImage('attachment://welcome.png')
        .setFooter({
            text: "kélesh Bot's | kélesh.org",
            iconURL: 'https://cdn.discordapp.com/emojis/1308800776327659550.webp?size=96'
        });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('kélesh')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('dummy1')
            .setDisabled(true),
        new ButtonBuilder()
            .setLabel('kélesh.net')
            .setURL('https://kélesh.net')
            .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
            .setLabel('Oyuna Bağlan')
            .setURL('https://kélesh.net/oyunabaglan')
            .setStyle(ButtonStyle.Link)
    );

    try {
        await member.send({
            embeds: [embed],
            components: [row],
            files: [welcomeImage]
        });
        console.log(`[+] ${member.user.username} adlı kullanıcıya DM gönderildi.`);
    } catch (err) {
        console.log(`[-] ${member.user.username} adlı kullanıcıya DM gönderilemedi: ${err.message}`);
    }
});

client.login(config.token);
