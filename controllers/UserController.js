var config = require('../local.config');
var GCM = require('./GCMController');
var validator = require('validator');
var UsersCollection = require('../UserHandler').UsersCollection;
var usersCollection = new UsersCollection(config.mongo.host, config.mongo.port);

//Authenticate the user. (username password and the device id.)
exports.authenticate = function (req, res) {

console.log((validator.isEmail(req.param('username'))) +" "+ req.param('password') +" "+ req.param('uuid') +" "+ req.param('username'));
    if (!(validator.isEmail(req.param('username'))) || !req.param('password') || !req.param('uuid')) {
        res.statusCode = 400;
        return res.json({
            error: 'Require a valid username(email address), password and a device id.'
        });

    } else {

        usersCollection.authenticateUser(req.param('username'), encryptPassword(req.param('password')), function (error_m, user) {

            if (user) {
				
                var resp = generateAuthenticateToken(user, req.param('uuid'));
                var edit_user = resp[0];
                var user_id = edit_user._id;
                delete edit_user['_id'];
                usersCollection.updateUserObject(user_id, edit_user, function (error, result) {
                    if (!error) {
                        req.session.authkey = resp[1];
                        return res.json({
                            auth_token: resp[1]
                        });
                    } else {
                        res.statusCode = 500;
                        return res.json({
                            error: "An error occured while handling your request."
                        });
                    }
                });

            } else {
                res.statusCode = 401;
                return res.json({
                    error: 'Invalid username or password.'
                });
            }
        });

    }
}

//Creates anew user.  (username password and the device id.)
exports.create = function (req, res) {

console.log((validator.isEmail(req.param('username'))) +" "+ req.param('password') +" "+ req.param('uuid') +" "+ req.param('username'));

    if (!(validator.isEmail(req.param('username'))) || !req.param('password') || !req.param('uuid')) {
        res.statusCode = 400;
        return res.json({
            error: 'Require a valid username (valid email address`), password and device id.'
        });

    } else {

        usersCollection.getUserForEmail(req.param('username'), function (error, user) {
            if (user) {
                res.statusCode = 400;
                return res.json({
                    error: 'Email already exists, try logging in!'
                });
            } else {
                var user = createUser(req.param('username'), encryptPassword(req.param('password')), req.param('uuid'));
                var auth_key = user.device_info[0].auth_token;
                usersCollection.addNewUser(user, function (error, result) {
                    if (!error) {
                        return res.json({
                            auth_token: auth_key
                        });
                    } else {
                        res.statusCode = 500;
                        return res.json({
                            error: error + "An error occured while handling your request."
                        });
                    }
                });

            }
        });
    }
}

//Update the user's information (auth token, device push token)
exports.update = function (req, res) {
console.log(req.param('device_push_token')+" - "+ req.param('auth_token'));
    if (!req.param('auth_token') || !req.param('device_push_token')) {

        res.statusCode = 400;
        return res.json({
            error: 'Require a valid token id and auth token.'
        });

    } else {
        validateSession(req.param('auth_token'), function (user, error) {

            if (user) {
                var edit_user = updateDeviceToken(user, req.param('device_push_token'), req.param('auth_token'));
                if (edit_user) {
                    var user_id = edit_user._id;
                    delete edit_user['_id'];
                    usersCollection.updateUserObject(user_id, edit_user, function (error, result) {

                        if (!error) {
                            return res.json({
                                success: true
                            });
                        } else {
                            res.statusCode = 500;
                            return res.json({
                                error: "An error occured while handling your request."
                            });
                        }
                    });

                } else {

                    res.statusCode = 401;
                    return res.json({
                        error: "Request was invalid."
                    });
                }

            } else {
                res.statusCode = 500;
                return res.json({
                    error: "Invalid auth_token."
                });
            }

        });
    }
}

//Update user's location.
exports.location_update = function (req, res) {
	console.log(req.param('latitude')+" - "+req.param('longitude')+" - "+ req.param('auth_token'));
	
    if (!(90 > parseFloat(req.param('longitude')) && parseFloat(req.param('longitude')) > -90) ||
	 !(180 > parseFloat(req.param('latitude')) && parseFloat(req.param('latitude')) > -180) ||
	  !req.param('auth_token')) {
        res.statusCode = 400;
        return res.json({
            error: 'Require a valid latitude, longitude and auth_token.'
        });

    } else {
        validateSession(req.param('auth_token'), function (user, error) {

            if (user) {
                var edit_user = updateLocationInfo(user, req.param('latitude'), req.param('longitude'), req.param('auth_token'));
                if (edit_user) {
					
					
                   
					var results = noftifyNearbyUsers(edit_user,req.param('latitude'), req.param('longitude'), function(nearby_added_user){
						
						var user_id = nearby_added_user._id;
	                    delete nearby_added_user['_id'];
	                    usersCollection.updateUserObject(user_id, nearby_added_user, function (error, result) {
	                        if (!error) {
	                            return res.json({
									nearby:nearby_added_user.nearby,
	                                success: true,
									push: results
	                            });
	                        } else {
	                            res.statusCode = 500;
	                            return res.json({
	                                error: "An error occured while handling your request1."
	                            });
	                        }
	                    });
						
					} );
					

                } else {

                    res.statusCode = 401;
                    return res.json({
                        error: "Request was invalid."
                    });
                }

            } else {
                res.statusCode = 500;
                return res.json({
                    error: "Invalid auth_token."
                });
            }

        });

    }
}

//Get all friends. (Auth token)
exports.all = function (req, res) {

    getUsersLocationInfo(false, null, req, res);
}

//Get all locations with friends. (Auth token)
exports.all_location = function (req, res) {

    getUsersLocationInfo(true, null, req, res);
}

//Get friend's location (Auth token) and friend_id
exports.friend_location = function (req, res) {
    if (!req.param('auth_token') && !req.param('friend_id')) {
        res.statusCode = 400;
        return res.json({
            error: 'Require a valid auth_token and friend_id.'
        });

    } else {
        getUsersLocationInfo(true, req.param('friend_id'), req, res);
    }
}


//Helper methods
function updateLocationInfo(_user, _latitude, _longitude, _auth_token) {

    var deviceExists = false;
    if (_user.device_info) {
        for (var i = 0; i < _user.device_info.length; i++) {
            if (_user.device_info[i].auth_token == _auth_token) {
                _user.device_info[i].last_updated = new Date();
                _user.device_info[i].location = [parseFloat(_latitude), parseFloat(_longitude)];
                newDevice = true;
                return _user;
            }
        }
    }
    return null;
}

function updateDeviceToken(_user, _device_token, _auth_token) {


    var deviceExists = false;
    if (_user.device_info) {
        for (var i = 0; i < _user.device_info.length; i++) {
            if (_user.device_info[i].auth_token == _auth_token) {
                _user.device_info[i].device_token = _device_token;
                newDevice = true;
                return _user;
            }
        }
    }
    return null;
}

function createUser(_username, _password, _uuid) {
    var user = {
        username: _username,
        password: _password,
        device_info: [createNewDevice(_uuid)]
    };
    return user;

}

function generateAuthenticateToken(userObject, deviceId) {

    var newToken = "";
    var newDevice = true;
    if (userObject.device_info) {
        for (var i = 0; i < userObject.device_info.length; i++) {
            if (userObject.device_info[i].uuid == deviceId) {
                newToken = userObject.device_info[i].auth_token = getNewToken();
                newDevice = false;
            }
        }
        if (newDevice) {
            var device = createNewDevice(deviceId);
            newToken = device.auth_token;
            userObject.device_info.push(device);

        }
    } else {

        var device = createNewDevice(deviceId);
        newToken = device.auth_token;
        userObject.device_info = [device];
    }

    return [userObject, newToken];


}

function createNewDevice(deviceId) {

    var device = {
        auth_token: getNewToken(),
        uuid: deviceId,
        last_logged_at: new Date()
    }
    return device;
}

function getNewToken() {
    var hat = require('hat');
    var id = hat();
    return id;
}

function validateSession(_auth_key, callback) {
    usersCollection.getUserForAuthToken(_auth_key, function (error, user) {
        callback(user);
    });
}

function encryptPassword(password){
    var crypto = require('crypto'),shasum = crypto.createHash('sha1');
    shasum.update(password);
	return shasum.digest('hex');
}

function getUsersLocationInfo(location_needed, required_user_id, req, res) {
	console.log(" - "+ req.param('auth_token'));
    if (!req.param('auth_token')) {
        res.statusCode = 400;
        return res.json({
            error: 'Require a valid auth_token.'
        });

    } else {
        validateSession(req.param('auth_token'), function (user, err) {

            if (user) {
                usersCollection.getUsersList(user._id, required_user_id, function (error, result) {

                    if (!error) {

                        if (location_needed == false) {
                            for (var i = 0; i < result.length; i++) {
                                delete result[i].location;

                            }
                        }

                        return res.json({
                            friends: result
                        });
                    } else {
                        res.statusCode = 500;
                        return res.json({
                            error: "invalid friend id."
                        });
                    }
                });
            } else {
                res.statusCode = 401;
                return res.json({
                    error: "Request was invalid."
                });

            }
        });
    }
}

function noftifyNearbyUsers(user, _lat, _lng, callback){


	usersCollection.getUsersForNotification(parseFloat(_lat), parseFloat(_lng), function (error, result) {
		
		var userid = user._id;
		nearbyfriends = result;
		var senderList = [];
		var nearbyList = [];
		var newPeopleNearby = false;
		for(var i=0;i<nearbyfriends.length;i++){
			
			
			var friend = nearbyfriends[i];
			
			var friendid = String();
			var userid = String(user._id);
			
			if(friend._id.equals(user._id)){
			}else{
				
				if(user.nearby){
					if(arrayContains(friend._id,user.nearby)>0){
						nearbyList.push(friend._id);
					}else{
						senderList.push(friend._id);
						nearbyList.push(friend._id);
						newPeopleNearby = true;
					}
				}else{
					senderList.push(friend._id);
					nearbyList.push(friend._id);
					newPeopleNearby = true;
				}
			}
		}
		
		
		if(nearbyList.length)
		user.nearby = nearbyList;
		else
		delete user['nearby'];
		callback(user);	
		
		if(senderList.length){
			var finaltokenlist = [];
			if(error==null){
				for(i in result){
					if(result[i]._id.equals(userid)){
					}else{
						var currentdevicelist = result[i].device_info;						
						for(n in currentdevicelist){
							var currentdevice = currentdevicelist[n];
							if(currentdevice.device_token){
								console.log("-> Notification Required "+result[i].username);
								finaltokenlist.push(currentdevice.device_token);
							}
						}
					}
				}
			}
			if(finaltokenlist)
			GCM.push(user.username,userid,finaltokenlist);
				
		}else{
			console.log(" -> No one to notify."+user.username);
		}
		
	});
}

function getUserTokenList(user){
	var tokenList = [];
	for(k in user.device_info){
		if(user.device_info[k].device_token!=null){
			tokenList.push(user.device_info[k].device_token);
		}
	}
	return tokenList;
	
}

function arrayContains(needle, arrhaystack){
	for(k in arrhaystack){
			
		if(arrhaystack[k].equals(needle)){
			return 1;
		}
	}
	return  -1;
}

function strcmp(a, b)
{   
    return (a<b?-1:(a>b?1:0));  
}

