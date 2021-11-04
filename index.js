//Import Required Files, open discord client and json config

const { Client,  Intents } = require("discord.js");

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

const config = require("./config.json");

client.login(config.token);

//Log when bot is online

var activeReminders = [];

client.once('ready', () => {

	clearReminders();
	loadNextReminder();
	console.log('It\'s Alive !');
	console.log(config.prefix);

	});



var mysql = require('mysql');

var db = mysql.createConnection({
  host: config.mySQLhost,
  user: config.mySQLuser,
  password: config.mySQLpass,
  database: config.mySQLdatabase
});


db.connect(function(err) {
  if (err) throw err;
  else console.log("Connected!");
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

		//Add Reminder to Reminder Database
		case `${config.prefix}reminder`:
			addReminder(args, message);
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
			if (diceParams.length != 2) message.channel.send("Invalid argument, please send in this format: **"+`${config.prefix}`+"throw xdy**");
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

});

//general Utility Functions
	function randomIntInterval(min, max) { // min and max included
		//taken from https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
		return Math.floor(Math.random() * (max - min + 1) + min)
	}

	function neutralizeCharacters(str, characters){
		for(var i = 0; i < characters.length; i++){
			if(str.includes(characters[i])) str = str.split(characters[i]).join("%%"+characters[i].charCodeAt(0)+"%%");
		}
		return str;
	}

	function putbackCharacters (str, characters){
		for (var i =0; i < characters.length; i++){
			if(str.includes("%%"+characters[i].charCodeAt(0)+"%%")) str = str.split("%%"+characters[i].charCodeAt(0)+"%%").join(characters[i]);
		}
		return str;
	}

//Command Related Functions
	function addReminder(args, messageData) {
		let isMeasure = true;
		let i = -1;
		let totalTime = 0;
		const measures = ['d','h','m','s'];
		let setMeasures = [];

		while (isMeasure){
			i++;
			if (i != args.length) {
				let measure = args[i].substr(args[i].length - 1);//get last character of argument
				let inputTime = parseInt(args[i].substr(0, args[i].length - 1));//get inputed time

				if (!measures.includes(measure)) isMeasure = false;//Will consider this the start of the message if not a measure
				else if (setMeasures.includes(measure)) isMeasure = false;//Will consider this the start of the message if measure already exists
				else if (Number.isNaN(inputTime)||inputTime < 0) isMeasure = false; //Will consider this the start of the message if time is invalid
				else {
					setMeasures.push(measure);
					switch (measure) {
						case 'd':
							totalTime += 1000 * 3600 * 24 * inputTime;
							break;

						case 'h':
							totalTime += 1000 * 3600 * inputTime;
							break;

						case 'm':
							totalTime += 1000 * 60 * inputTime;
							break;

						case 's':
							totalTime += 1000 * inputTime;
							break;

						default:
							break;
					}
				}//End of else
			}else isMeasure = false;
		}//End of While
		var message = args.slice(i, args.length).join(' ');//merge to form message

		if(i == 0 || i == args.length) messageData.channel.send(
				"Please send with this format:" +
				"\n" + `${config.prefix}` + "reminder **Have Atleast one of these**: [xd, yh, xm, ws] [message]." +
				"\nExample: " + `${config.prefix}` + "reminder 1d 2h remind me !"
				);
		else if (message.length > 230) messageData.channel.send("Your message is too long !\nTry trimming it down to 230 characters.");
		else if (totalTime > 1000*3600*24*30) messageData.channel.send("You cannoy set a reminder due in more than a month.");
		else if (totalTime == 0) messageData.channel.send("...Really Now ?");
		else{

			let remindTime = new Date(messageData.createdTimestamp + totalTime).toISOString().replace('T',' ').split('.')[0];

			let timeSeconds = totalTime/1000;

			let days = Math.floor(timeSeconds/(3600*24));

			timeSeconds = timeSeconds%(3600*24);

			let hours = Math.floor(timeSeconds/3600);

			timeSeconds = timeSeconds%3600;

			let minutes = Math.floor(timeSeconds/60);
			
			let seconds = timeSeconds%60;

			var query = `INSERT INTO reminders(userID, remindTime, message)`+
			` VALUES('`+messageData.author.id+`','`+remindTime+`','`+neutralizeCharacters(message, ["'", '"'])+`')`;

			db.query(query, function(err, result){

				if (err){
					throw err;
					messageData.channel.send("Error when trying to access the database.\nPlease check the console.");
				}else{
					messageData.channel.send(`Got it, I'll remind you of:\n**${message}**\nIn ${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds.`);
				}
			});
			
			loadNextReminder();
		}
	}//End of addReminder function

	function loadNextReminder(){
		var query = "SELECT id, userID, UNIX_TIMESTAMP(remindTime) as remindTime, message FROM reminders WHERE remindTime > NOW()";
		db.query(query, function(err, result){
			if(err) throw err;
			else{
				activeReminders.forEach(reminder => clearTimeout(reminder));
				activeReminders = [];
				Object.keys(result).forEach(function(key){
					var row = result[key];

					let id = row.id;
					let userID = row.userID;
					let message = putbackCharacters(row.message, ['"', "'"]);
					let stamp = row.remindTime;
					let rem = setTimeout(function(){
						client.users.fetch(userID).then(user =>{user.send(message)});
						var query = `DELETE FROM reminders WHERE id = ${id}`;
						db.query(query, function(err, results) {if (err) throw err;});
						loadNextReminder;
					},
					(stamp*1000 - Date.now()));
					activeReminders.push(rem);
				});
			}
		});
	}


	function clearReminders(){
		var query = "SELECT id, userID, message FROM reminders WHERE remindTime <=  NOW()";
		db.query(query, function(err, result){
			if (err) throw err;
			else{
				Object.keys(result).forEach(function(key) {
					var row = result[key];

					let uID = row.userID;
					let dbid = row.id;
					let msg = putbackCharacters(row.message, ['"',"'"]);

					client.users.fetch(uID).then(user =>{user.send(msg + "\n*This message was delayed due to bot downtime*")});
					var queryDel = `DELETE FROM reminders WHERE id = ${dbid}`;
					db.query(queryDel, function  (err, results) {if (err) throw err;});
				});
			}
		});
	}
