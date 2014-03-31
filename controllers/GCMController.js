var gcm = require('node-gcm');
var config = require('../local.config');

var push = function(_username, _user_id,tokenArray){
	
	var message = new gcm.Message({
	    collapseKey: _username+" is near you!",
	    delayWhileIdle: true,
	    timeToLive: 4,
	    data: {
	        user_id: _user_id,
	    }
	});

	console.log('Packet : %j \nTO %j',message,tokenArray);
	
	var sender = new gcm.Sender(config.push.gcmkey);
	var registrationIds = [];

	for(var i=0;i<tokenArray.length;i++){
		registrationIds.push(tokenArray[i]);
	}
	
	sender.send(message, registrationIds, 4, function (err, result) {
	    console.log("GCM Result: %j ",result);
	    console.log("Error Result: "+err);
	});
	
	
}

module.exports = {
	push:push
}