AIDNbot

IMPORTANT (For collaborator's eyes):
	Do NOT in any ways change the gitignore to avoid having the bot token made public.
	DO NOT download a local copy of the config file and push it.

About:

	This is a personal project that me and some ofmy friends are working on. 
	This is a discordjs bot that I am using to store information relative to a homebrew dnd campaign with some friends of mine, as well as some general utilitiy functions.


	This bot is not meant to be able to help moderate a server or play music.

Setup: 

	This bot requires a mysql database to be able to run. You can find the script to create the database in: "createDB.sql".


Config:

	If you want to use the bot for yourself, you will need to create a .json config file 'config.json' containing the following information:

	'prefix': Prefix to call the bot
	'token': Discord bot token
	'mySQLhost', 'mySQLuser', 'mySQLpass', 'mySQLdatabase': Required to connect to the SQL database. SQL user shouldhave write, delete and read access on all tables but not on the whole database necessarilly.