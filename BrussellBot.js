var reload			= require('require-reload')(require),
	discord			= require('discord.js'),
	bot				= new discord.Client({autoReconnect: true, forceFetchUsers: true, maxCachedMessages: 100, disableEveryone: true}),
	_chalk			= require('chalk'),
	chalk			= new _chalk.constructor({enabled: true}),
	config			= reload('./config.json'),
	validateConfig	= reload('./utils/validateConfig.js'),
	CommandManager	= reload('./utils/CommandManager.js');

var events = {
	ready: reload(`${__dirname}/events/ready.js`),
	message: reload(`${__dirname}/events/message.js`)
};

//console colors
cWarn	= chalk.bgYellow.black;
cError	= chalk.bgRed.black;
cDebug	= chalk.bgWhite.black;
cGreen	= chalk.bold.green;
cRed	= chalk.bold.red;
cServer	= chalk.bold.magenta;
cYellow	= chalk.bold.yellow;

commandsProcessed = 0;
cleverbotTimesUsed = 0;


validateConfig(config);

var CommandManagers = [];
for (let prefix in config.commandSets) { //Add command sets
	CommandManagers.push(new CommandManager(prefix, config.commandSets[prefix]));
}


function init(index = 0) {
	return new Promise((resolve, reject) => {
		CommandManagers[index].initialize() //Load CommandManager at {index}
			.then(() => {
				console.log(`${cDebug(' INIT ')} Loaded CommandManager ${index}`);
				index++;
				if (CommandManagers.length > index) { //If there are more to load
					init(index) //Loop through again
						.then(resolve)
						.catch(reject);
				} else //If that was the last one resolve
					resolve();
			}).catch(reject);
	});
}

function login() {
	console.log(cGreen('Logging in...'));
	bot.loginWithToken(config.token).catch(err => console.error(err));
}

//Load commands and log in
init()
	.then(login)
	.catch(error => {
		console.error(`${cError(' ERROR IN INIT ')} ${error}`);
	});


bot.on('ready', () => {
	events.ready(bot, config);
});

bot.on('disconnected', () => {
	console.log(cRed('Disconnected from Discord'));
});

bot.on('message', msg => {
	if (msg.content.startsWith(config.reloadCommand) && config.adminIds.includes(msg.author.id))
		reloadModule(msg);
	else if (msg.content.startsWith(config.evalCommand) && config.adminIds.includes(msg.author.id))
		evaluate(msg);
	else
		events.message.handler(bot, msg, CommandManagers, config);
});

function reloadModule(msg) {
	console.log(`${cDebug(' RELOAD MODULE ')} ${msg.author.username}: ${msg.content}`);
}

function evaluate(msg) {
	console.log(`${cDebug(' EVAL ')} ${msg.author.username}: ${msg.content}`);
}
