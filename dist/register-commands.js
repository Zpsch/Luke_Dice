require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: "r",
        description: "Rola dados",
        options: [
            {
                name: 'mensagem',
                description: "Os dados que vc quer rolar, n tem mt oq dizer",
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ]}   
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () =>{
    try{
        console.log('Registering slash comands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        )

        console.log('Slash commands were registered sucessfully');
    }catch (error){
        console.log(`Error: ${error}`)
    }
})();