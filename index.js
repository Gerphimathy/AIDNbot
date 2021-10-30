//Import Required Files, open discord client and json config

const { Client,  Intents } = require("discord.js");

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

const config = require("./config.json");

client.login(config.token);

//Log when bot is online

client.once('ready', () => {

	console.log('It\'s Alive !');
	console.log(config.prefix);

	});

//Event listener on messages sent

client.on("messageCreate", (message) => {
	//break if message is from bot or doesn't start with prefix
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	//Breaks down the message down into arguments and the command
	let command = message.content.split(' ')[0];
	let args = message.content.split(' ').slice(1 , message.content.length-1);

	//Main switch on commands
	switch(command){
		case `${config.prefix}help`:
			//To do: Help Guide
			break;

		//Ping with latency
		case `${config.prefix}ping`:
			message.channel.send('🏓 Pong ! **' + (Date.now()- message.createdTimestamp) + 'ms **');
			break;

		case `${config.prefix}throw`:
			//Splitting and flooring of the parameters
			let diceParams = args[0].split('d');
			diceParams[0] = Math.floor(diceParams[0]);
			diceParams[1] = Math.floor(diceParams[1]);

			//Checking the arguments
			if (diceParams.length != 2) message.channel.send("Invalid argument, please send in this format: **d!throw xdy**");
			else if (diceParams[0] < 1) message.channel.send('Please Send atleast one dice.');
			else if (diceParams[0] > 10) message.channel.send('10 dies should be more than enough.');
			else if (diceParams[1] < 2) message.channel.send('You can\'t do probability with only one result.');
			else if (diceParams[1] > 100) message.channel.send('Anything over a d100 is a bit much.');
			else{
				//For each dice, generate random number within interval and send it
				for (let i = 0; i < diceParams[0]; i++){
					message.channel.send('🎲 ' + randomIntInterval(1, diceParams[1]));
				}
			}
			break;

		default:
			break;
	}

	//Functions
	function randomIntInterval(min, max) { // min and max included
		//taken from https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
		return Math.floor(Math.random() * (max - min + 1) + min)
	}
});