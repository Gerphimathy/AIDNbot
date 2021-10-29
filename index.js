const { Client,  Intents } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
const config = require("./config.json");

client.login(config.token);

client.once('ready', () => {

	console.log('It\'s Alive !');
	console.log(config.prefix);

	});

client.on("messageCreate", (message) => {

	

	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	let command = message.content.split(' ')[0];
	let args = message.content.split(' ').slice(1 , message.content.length-1);

	switch(command){

  		case `${config.prefix}ping`:
	  		message.channel.send("Pong !");
	  		break;

		default:
			break;
	}
});