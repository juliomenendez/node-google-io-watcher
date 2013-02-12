var config = require('./config');

var httpreq = require('httpreq');
var _ = require("underscore");
var Pushover = require('node-pushover');
var push = new Pushover(config.pushover);
var packagejson = require('./package.json');

var previousUrls = {};


loop();

function loop(){
	getLatestPost(function (err, items) {
		if(err) {
			console.log("Error: ", err);
		} else {
			if(_.isEmpty(previousUrls)) {

				// Mark all items as read items
				_.each(items, function (item) {
					previousUrls[item.url] = true;
				});

				// send out a bootup message
				var bootupMsg = "Google I/O Watcher started, v" + packagejson.version;
				console.log(bootupMsg);
				push.send("Googie I/O Watcher", bootupMsg);

			} else {

				// check for new posts:
				_.each(items, function (item) {
					if(!_.has(previousUrls, item.url)) {
						console.log(item.title + ": " + item.url);
						push.send(item.title, item.url);
						previousUrls[item.url] = true;
					}

				});
			}
		}

		setTimeout(function(){
			loop();
		},120000);  // wait 2 minutes
	});
}


function getLatestPost(callback){
	httpreq.get("https://www.googleapis.com/plus/v1/activities",
		{
			parameters: {
				query : "#io13",
				orderBy: "recent", //best or recent
				maxResults: 20, // max = 20
				key: config.google.key
			}
		},
		function (err, res){
			if(err)
				return callback(err);

			var data = JSON.parse(res.body);

			if(data.error)
				return callback(data.error);

			if(data.items && data.items.length)
				callback(null, data.items);
			else
				callback(null, null);

		}
	);
}

