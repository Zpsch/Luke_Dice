require('dotenv').config();
const keep_alive = require('./keep_alive.js');
const { Client, IntentsBitField, InteractionCollector, ApplicationCommandOptionWithChoicesAndAutocompleteMixin } = require('discord.js');

let rest, reply;
let neg = false;

process.on('unhandled Rejection', async (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.log('Uncaught Expection: ', err);
});

process.on("uncaughtException Monitor", (err, origin) => {
    console.log('Uncaught Expection Monitor', err, origin);
});

const client = new Client({
    intents:[
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online`);
});

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function isneg(neg){
    while(rest.indexOf("-") == 0 || rest.indexOf("+") == 0){
        if (rest.indexOf("-") == 0) neg = !neg;
        rest = rest.slice(1);
        return neg;
    } //define se e positivo ou negativo
}

function roll(){
    let sum = 0;

    let ammount = rest.slice(0,rest.indexOf("d"));
    if(ammount == 0) ammount = 1;

    rest = rest.slice(rest.indexOf("d")+1);
    let signal = findFirstNonNumeric(rest);
    let faces;
    if(signal == -1){
        faces = rest;
        rest = ' ';
    }
    else{
        faces = rest.slice(0,signal);
        rest = rest.slice(signal);
    }
    if(faces == 0) faces = 1;

    let results = [];
    for(let i = 0; i < ammount; i++){
        results[i] = getRandomInt(faces)+1;
    }

    results.sort((a, b) => a - b).reverse();
    reply += "[ "
    for(let i = 0; i < results.length; i++){
        if(results[i] == faces || results[i] == 1){
            reply += `**${results[i]}**, `;
        }
        else{
            reply += `${results[i]}, `;
        }
    } //colocar as rolagens da resposta
    reply = reply.slice(0,-2);
    reply += ` ] ${ammount}d${faces} `;
    for(let i = 0; i < results.length; i++){
        sum += results[i];
    }
    return sum;
} //P rolar dado

function addition(){
    let mod;
    let signal = findFirstNonNumeric(rest);
    if(signal !== -1){
        mod = Number(rest.slice(0,signal));
        rest = rest.slice(signal);
    }
    else{
        mod = Number(rest);
        if (signal == -1) rest = ' ';
    }
    return mod;
} // P somar ou subtrair

function multiply(n, neg){
    let a;
    let signal = findFirstNonNumeric(rest);
    while (signal == 0){
        if (rest.indexOf("d") == 0) break;
        if(rest.indexOf("-") == 0) neg = !neg;
        rest = rest.slice(1);
        signal = findFirstNonNumeric(rest);
    }
    signal = findFirstNonNumeric(rest);
    if(rest.indexOf("d") == signal && rest.indexOf("d") !== -1){
        let temp = reply.length;
        a = roll();
        if(neg){
            reply = reply.slice(0,temp) + "* ( - " + reply.slice(temp) + " )";
        }
        else reply = reply.slice(0,temp) + "* " + reply.slice(temp);
    } //Rola dado
    else{
        a = addition();
        if(neg){
            reply = reply + "* ( - " + `${a}` + " ) ";
        }
        else reply = reply + "* " + `${a} `;
    }
    if(neg) a = -a;

    let b = n * a;
    return b;
}

function divide(n, neg){
    let a;
    let signal = findFirstNonNumeric(rest);
    while (signal == 0){
        if (rest.indexOf("d") == 0) break;
        if(rest.indexOf("-") == 0) neg = !neg;
        rest = rest.slice(1);
        signal = findFirstNonNumeric(rest);
    }
    signal = findFirstNonNumeric(rest);
    if(rest.indexOf("d") == signal && rest.indexOf("d") !== -1){
        let temp = reply.length;
        a = roll();
        if(neg){
            reply = reply.slice(0,temp) + "/ ( - " + reply.slice(temp+1) + " )";
        }
        else reply = reply.slice(0,temp) + "/" + reply.slice(temp+1);
    } //Rola dado
    else{
        a = addition();
        if(neg){
            reply = reply + "/ ( - " + `${a}` + " ) ";
        }
        else reply = reply + "/ " + `${a} `;
    }
    if(neg) a = -a;

    let b = n / a;
    return b;
}

function findFirstNonNumeric(str) {
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (isNaN(parseInt(char)) || char === " ") { // Check if it's not a number or a space
            return i; // Return the index of the first non-numeric character
        }
    }
    return -1; // Return -1 if no non-numeric character is found
}

client.on('messageCreate', (message) => {

    if(message.content.indexOf('!r') == 0){
        if(message.author.bot){
            return;
        }
        let msg = message.content;
        msg = msg.slice(msg.indexOf("r")+1);
        dice(msg,message);
    }
    eastereggs(message);
});

client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand())  return;

    if(interaction.commandName === 'r'){
        let msg = interaction.options.get('mensagem').value;
        dice(msg,interaction);
    }

});

function dice(msg, message){
    reply = "";
    let endreply = "";
    let sum = 0, mod = 0, bigsum = 0;
    let values = [];
    rest = msg.toLowerCase(); //so trabalhar usando minusculo
    rest = rest.replace(/[^0-9d*/+\-#]/g, '');

    let times = 1;
    if(rest.indexOf("#") != -1){
        times = Number(rest.slice(0, rest.indexOf("#")));
        rest = rest.slice(rest.indexOf("#")+1);
    } //define a quantidade de "vantagens"
    msg = rest;
    for(let i = 0; i < times; i++){
        sum = 0;
        mod = 0;
        rest = msg;
        reply = "";
        let numbers = [];
        let wasconst = false;

        while(rest !== ' '){
            let ismultiply = false;
            let isdivide = false;
            neg = false;
            neg = isneg(neg);

            if(rest.indexOf("*") !== -1){
                let segment = rest.slice(0,rest.indexOf("*"));
                ismultiply= !/[a-zA-Z0-9]/.test(segment);
            }
            if(rest.indexOf("/") !== -1){
                let segment = rest.slice(0,rest.indexOf("/"));
                isdivide= !/[a-zA-Z0-9]/.test(segment);
            }
            if(ismultiply && isdivide){
                if(rest.indexOf("*") > rest.indexOf("/")) ismultiply = false;
                else isdivide = false;
            }

            signal = findFirstNonNumeric(rest);

            if(ismultiply){
                let temp = multiply(numbers[numbers.length-1], neg);
                if (wasconst){
                    reply = reply + "* " + temp / numbers[numbers.length-1];
                    mod -= numbers[numbers.length-1];
                }
                numbers[numbers.length-1] = temp;

            } // Multiplica
            else if(isdivide){
                let temp = divide(numbers[numbers.length-1], neg);
                if (wasconst){
                    reply = reply + "/ " + temp / numbers[numbers.length-1];
                    mod -= numbers[numbers.length-1];
                }
                numbers[numbers.length-1] = temp;

            } // Divide
            else if(rest.indexOf("d") == signal && rest.indexOf("d") !== -1){
                if(neg) reply += "- ";
                else if(reply !== "") reply += "+ ";
                let n = roll();
                if(neg) numbers.push(-n);
                else numbers.push(n);
                wasconst = false;
            } //Rola dado
            else{
            let n = addition();
            if(neg) n = -n;
            numbers.push(n);

            mod += numbers[numbers.length-1];
            wasconst = true;
            } //Soma ou subtracao

        }
        if(mod > 0) reply += `+ ${mod}`;
        else if (mod < 0) reply += `- ${-mod}`;
        for(let i = 0; i < numbers.length; i++){
            sum += numbers[i];
        }
        values[i] = sum;

        reply = "` " + `${sum}` + " ` ⟵ " + reply + "\n";
        endreply += reply;
    }
    values.sort((a, b) => a - b).reverse();
    let temp = 0;
    bigsum = values[0];
    for (let i = 0; i < values.length; i++){
        temp += values[i];
    }
    let avg = temp / times;
    if(isNaN(sum)) return;
    if(endreply.length > 2000){
        if(times == 1) message.reply(`A mensagem passaria do limite de caracteres do discord, mas a soma deu ${bigsum}`);
        else message.reply(`A mensagem passaria do limite de caracteres do discord, mas a maior soma deu ${bigsum} e a média deu ${avg}`);
        return;
    }
    message.reply(endreply);
}

function eastereggs(message){
    if(message.guild.id === '985848231260999734') return; //Remove eastereggs no Death Despair

    if (message.content.toLowerCase().indexOf('lunee') != -1){
        message.reply('Smt negão 🍔👍');
    }
    if (message.content.toLowerCase().indexOf('bolsonaro') != -1 || message.content.toLowerCase().indexOf('bonoro') != -1){
        message.reply('Based');
        if(message.guild.id === '1034555657736687687') message.reply('https://cdn.discordapp.com/attachments/1228038607428911144/1230939030128951336/0f4cac92-07c6-4335-a510-eeb36cc3a888.png?ex=6635244e&is=6622af4e&hm=a6443325170f22771df138ab95e190528fa466f5e5bf254abc2c69b2e0d8678b&');
    }
    if (message.content.toLowerCase().indexOf('bee') != -1 || message.content.toLowerCase().indexOf('abelha') != -1){
        message.reply('https://open.spotify.com/playlist/6O8wFpsgfGV6yBBur1tbOz?si=bea67af1705445ce');
    }
    if (message.content.toLowerCase().indexOf('faz o l') != -1 || message.content.toLowerCase().indexOf('faiz o eli') != -1 || message.content.toLowerCase().indexOf('faça o l') != -1){
        message.reply('https://cdn.discordapp.com/attachments/1145846578922389536/1224054657622609920/image.png?ex=6625533c&is=6612de3c&hm=1abf8b06934c1ede81cb4ed1eb7ea239561f4e4d63673ef1b50f5a223594a17f&');
    }
    if (message.content.toLowerCase().indexOf('rubens') != -1 || message.content.toLowerCase().indexOf('bolas') != -1 || message.content.toLowerCase().indexOf('balls') != -1){
        message.reply('https://cdn.discordapp.com/attachments/1228038607428911144/1423386290195534007/7dwL5Wa.jpg?ex=68e01f48&is=68decdc8&hm=16700a2785682ea4029d923d1896f89ec727ef6adaaa82b1132f5cfb23ef029c&');
    }
    if (message.content.toLowerCase().indexOf('rapha') != -1){
        message.reply('https://cdn.discordapp.com/attachments/1145846578922389536/1228367471212367944/20240412_123330.gif?ex=662bc95b&is=6619545b&hm=db47424a7f8f6d70fe7d9a4ca46182c7ba6e20d1147b013699d23e61b24bbdb4&');
    }
    if (message.content.toLowerCase().indexOf('call') != -1){
        message.reply('https://tenor.com/view/baki-prison-oliva-piss-baki-son-of-ogre-gif-3428302401975626397');
    }
    if (message.content.toLowerCase() == 'kg' || message.content.toLowerCase().indexOf('danoni') != -1 || message.content.toLowerCase().indexOf('xuxu') != -1){
        message.reply('https://cdn.discordapp.com/attachments/838474017236582440/1241559950396751964/image.png?ex=664aa44f&is=664952cf&hm=5e7a4e06aff3fca4041fe2f9b7d382b9750a3b88ff4cf98766908d39a6471c24&');
    }
    if (message.content.toLowerCase().indexOf('gustavo') != -1 || message.content.toLowerCase().indexOf('guilherme') != -1){
        message.reply('https://cdn.discordapp.com/attachments/1228164941819936809/1228174270547496990/images_-_2024-04-11T234548.358.jpg?ex=662b156c&is=6618a06c&hm=0ade1dc7301b18e9f88cb8553d47c3d1f798bf8c97a99213203f0f8643335f49&');
    }
    if (message.content.toLowerCase().indexOf('vampetada') != -1){
        message.reply('https://cdn.discordapp.com/attachments/1170949826385543178/1301031499155509339/image.png?ex=67264b41&is=6724f9c1&hm=80eeddcfa21132ec5bf00f190634935f5bce41debe10c186f2e397fa25e42ed7&');
    }
    if (message.content.toLowerCase().indexOf('foi de vater') != -1 || message.content.toLowerCase().indexOf('foi de väter') != -1){
        message.reply('https://cdn.discordapp.com/attachments/838474017236582440/1301926239870779515/VaterMarikaAdamus.png?ex=672640cc&is=6724ef4c&hm=06d90d5ed0d2a0b6d901fa59adbd5311bd314360eae7a11b57d2a3feb7003760&');
    }
    if (message.content.toLowerCase().indexOf('rape') != -1){
        message.reply('https://cdn.discordapp.com/attachments/1228038607428911144/1407105232281931776/eOw5pW8.png?ex=68a4e45e&is=68a392de&hm=1dd42facd1430823504a1fd0c31739d1e962dda94fae4b00d8416a67844d0766&');
    }
    if (message.content.toLowerCase().indexOf('espada') != -1 || message.content.toLowerCase().indexOf('sword') != -1){
        message.reply('https://cdn.discordapp.com/attachments/1319127704007610458/1407074972379385917/mihawks-upscaling-gets-more-terrifying-as-each-chapter-goes-v0-t3dw8lil335f1.png?ex=68a4c82f&is=68a376af&hm=c550c96fe983355de63284428fe0286822d03cc0058b0536933a6ff9820f3159&');
    }
}
client.login(process.env.TOKEN);