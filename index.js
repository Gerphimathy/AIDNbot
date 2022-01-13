/*
 	°#######################################°
	|										|
	|		AIDNBot - Main file				|
	|		Created: Oct 29 2021			|
	|		Contributors: Gerphimathy		|
 	|										|
 	°#######################################°
 */


/** Import Required Files, open discord client, json config and SQL database **/

let activeReminders = [];
//Declare list of active reminders

/** Connect to discord client **/

const { Client,  Intents } = require("discord.js");

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

client.login(process.env.TOKEN);

client.once('ready', () => {

	clearReminders();
	loadNextReminder();
	console.log('It\'s Alive !');
	console.log(process.env.PREFIX);

	});

/** Database connection **/
const { Pool } = require('pg');
const db = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false
	}
});

/* Outdated
const mysql = require('mysql');

const db = mysql.createConnection({
  host: config.mySQLhost,
  user: config.mySQLuser,
  password: config.mySQLpass,
  database: config.mySQLdatabase
});


db.connect(function(err) {
  if (err) throw err;
  else console.log("Connected!");
});

 */


/** Event Listener on messages sent, analyzing for commands **/

client.on("messageCreate", (message) => {
	//break if message is from bot or doesn't start with prefix
	if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;

	//Breaks down the message down into arguments and the command
	let command = message.content.split(' ')[0];
	let args = message.content.split(' ').slice(1 , message.content.length-1);

	//Main switch on commands
	switch(command){
		case `${process.env.PREFIX}help`:
			//To do: Help Guide
			break;

		//Add Reminder to Reminder Database
		case `${process.env.PREFIX}reminder`:
			addReminder(args, message);
			break;

		//Ping with latency
		case `${process.env.PREFIX}ping`:
			message.channel.send('🏓 Pong ! **' + (Date.now()- message.createdTimestamp) + 'ms **');
			break;

		case `${process.env.PREFIX}throw`:
			//Splitting and flooring of the parameters
			let diceParams = args[0].split('d');
			diceParams[0] = Math.floor(diceParams[0]);
			diceParams[1] = Math.floor(diceParams[1]);

			//Checking the arguments
			if (diceParams.length !== 2) message.channel.send("Invalid argument, please send in this format: **"+`${process.env.PREFIX}`+"throw xdy**");
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

	function neutralizeCharacters(str, characters){ //sanitize certain characters from user inputs
		for(let i = 0; i < characters.length; i++){
			if(str.includes(characters[i])) str = str.split(characters[i]).join("%%"+characters[i].charCodeAt(0)+"%%");
		}
		return str;
	}

	function putbackCharacters (str, characters){ //puts back sanitized characters when outputing
		for (let i =0; i < characters.length; i++){
			if(str.includes("%%"+characters[i].charCodeAt(0)+"%%")) str = str.split("%%"+characters[i].charCodeAt(0)+"%%").join(characters[i]);
		}
		return str;
	}

//Command Related Functions

	/** Add reminder into database **/
	function addReminder(args, messageData) {

		/** Arguments handling **/

		/** Time measures handling **/
		let isMeasure = true;
		let i = -1;
		let totalTime = 0;
		const measures = ['d','h','m','s']; //list of valid measures
		let setMeasures = [];//tracks measures that have already been set

		//we loop while the argument is a time measure.
		while (isMeasure){
			i++;
			if (i !== args.length) {
				let measure = args[i].substr(args[i].length - 1);//get last character of argument
				let inputTime = parseInt(args[i].substr(0, args[i].length - 1));//get input time

				if (!measures.includes(measure)) isMeasure = false;//Will consider this the start of the message if not a measure
				else if (setMeasures.includes(measure)) isMeasure = false;//Will consider this the start of the message if measure already exists
				else if (Number.isNaN(inputTime)||inputTime < 0) isMeasure = false; //Will consider this the start of the message if time is invalid
				else {
					setMeasures.push(measure);
					switch (measure) {
						case 'd': //1d = 1000ms * 3600s (1h) * 24h (1d)
							totalTime += 1000 * 3600 * 24 * inputTime;
							break;

						case 'h': //1h = 1000ms * 3600s (1h)
							totalTime += 1000 * 3600 * inputTime;
							break;

						case 'm': //1m = 1000ms * 60 (1m)
							totalTime += 1000 * 60 * inputTime;
							break;

						case 's': //1s = 1000ms
							totalTime += 1000 * inputTime;
							break;

						default:
							break;
					}
				}
			}else isMeasure = false;
		}
		let message = args.slice(i, args.length).join(' ');//merge to form message

		/** Handling incorrect time measures **/
		if(i === 0 || i === args.length) messageData.channel.send(
				"Please send with this format:" +
				"\n" + `${process.env.PREFIX}` + "reminder **Have at least one of these**: [xd, yh, xm, ws] [message]." +
				"\nExample: " + `${process.env.PREFIX}` + "reminder 1d 2h remind me !"
				);
		else if (message.length > 230) messageData.channel.send("Your message is too long !\nTry trimming it down to 230 characters.");
		//Database limit is 250 characters, putting a 230 hard limit to have a margin for sanitizing
		else if (totalTime > 1000*3600*24*30) messageData.channel.send("You cannot set a reminder due in more than a month.");
		//Setting a hard limit to avoid issues
		else if (totalTime === 0) messageData.channel.send("...Really Now ?");
		else{
			/** Handling correct input **/

			let remindTime = new Date(messageData.createdTimestamp + totalTime).toISOString();

			/** Parsing input time to duration **/

			let timeSeconds = totalTime/1000;

			let days = Math.floor(timeSeconds/(3600*24));

			timeSeconds = timeSeconds%(3600*24);

			let hours = Math.floor(timeSeconds/3600);

			timeSeconds = timeSeconds%3600;

			let minutes = Math.floor(timeSeconds/60);
			
			let seconds = timeSeconds%60;

			/** Neutralize input arguments to input into database **/

			let neutralizedMessage = neutralizeCharacters(message, ["'", '"']);

			let query = `INSERT INTO reminders(userID, remindTime, message)`+
			` VALUES('`+messageData.author.id+`','`+remindTime+`','`+
				(neutralizedMessage.length > 250 ? neutralizedMessage.substr(0,250) : neutralizedMessage)+`')`;

			//Trimming down the characters if sanitized string exceeds 250 characters.

			/** Input into reminders **/

			db.query(query).then(
				res => loadNextReminder()
			).catch(
				err => messageData.channel.send("Error when trying to access the database.\nPlease check the console.")
			)
			messageData.channel.send(`Got it, I'll remind you of:\n**${message}**\nIn ${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds.`)
		}
	}

	/** Loads the newest reminder into memory **/
	function loadNextReminder(){
		/** Select all upcoming reminders with the lowest time **/
		let query = "SELECT id, userID, remindTime, message FROM reminders WHERE remindTime = (SELECT MIN(remindTime) FROM reminders WHERE remindTime >= NOW())";
		db.query(query, (err, result) => {
			if(err) throw err;
			else{

				/** Remove all currently active reminders to avoid overloading reminders into active memory **/
				activeReminders.forEach(reminder => clearTimeout(reminder));
				activeReminders = [];

				/** For each of the loaded reminders **/
				for (let i = 0; i < result.rows.length; i++){
					let row = result.rows[i];

					let id = row.id;
					let userid = row.userid;
					let message = putbackCharacters(row.message, ['"', "'"]); //de sanitize message


					let stamp = new Date(row.remindtime);

					/** Reminder Function **/
					let rem = setTimeout(function(){
						/** Delete reminder from the database **/
						client.users.fetch(userid).then(user => user.send(message));
						let query = "DELETE FROM reminders WHERE id = $1";
						db.query(query, [id] ,(err, results) => {if (err) throw err;});

						/** Check the next reminder **/
						loadNextReminder();
					},
					(stamp - Date.now()));
					activeReminders.push(rem);
				}
			}
		});
	}


	function clearReminders(){
		/** Load all reminders in the database that have not been sent due to bot downtime **/
		let query = "SELECT id, userID, message FROM reminders WHERE remindTime <=  NOW()";
		db.query(query, (err, result) =>{
			if (err) throw err;
			else{
				/** For each loaded reminder **/
				for (let i = 0; i < result.rows.length; i++) {
					let row = result.rows[i];

					let uID = row.userid;
					let dbid = row.id;
					let msg = putbackCharacters(row.message, ['"',"'"]);

					client.users.fetch(uID).then((user => user.send(msg + "\n*This message was delayed due to bot downtime*")));

					/** Delete from database **/
					let queryDel = "DELETE FROM reminders WHERE id = $1";
					db.query(queryDel, [dbid],(err, results) => {if (err) throw err;});
				}
			}
		});
	}
