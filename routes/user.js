
var UsersCollection = require('../UserHandler').UsersCollection;
var usersCollection = new UsersCollection('localhost', 27017);
var validator = require('validator');
	
/*
db.places.ensureIndex( { "device_info.location": "2d" } )
db.findfriends.ensureIndex( { "device_info.location": "2d" } )

db.findfriends.find( { 'location': {$near : [ 20.6, 70.45] } } ).limit(3)
*/
exports.authenticate = function (req, res) {
	 
	if (!(validator.isEmail(req.param('username'))) || !req.param('password') || !req.param('uuid')) {
		res.statusCode = 400;
		return res.json({
			error: 'Require a valid username(email address), password and device id.'
		});
        
	}else{
		
		var crypto = require('crypto'), shasum = crypto.createHash('sha1');
		shasum.update(req.param('password'));
		
		usersCollection.authenticateUser(req.param('username'),shasum.digest('hex'), function(error_m,user){

			if(user){
				
					
				var resp = generateAuthenticateToken(user,req.param('uuid'));
				var edit_user = resp[0];
				var user_id = edit_user._id;
				delete edit_user['_id'];
				usersCollection.updateUserObject(user_id,edit_user, function(error,result){
					if(!error){
						req.session.authkey = resp[1];
						return res.json({
							auth_token:resp[1]
						});
					}else{
						res.statusCode = 500;
						return res.json({
							error:"An error occured while handling your request."
						});
					}
				});
				
			}else{
				res.statusCode = 401;
				return res.json({
					error: 'Invalid username or password.'
				});
			}
		});	
		
	}
}
    
exports.create = function (req, res) {
    
	
	
	if (!(validator.isEmail(req.param('username'))) || !req.param('password') || !req.param('uuid')) {
		res.statusCode = 400;
		return res.json({
			error: 'Require a valid username, password and device id.'
		});
        
	}else{
		
		usersCollection.getUserForEmail(req.param('username'), function(error,user){
			if(user){
				res.statusCode = 400;
				return res.json({
					error: 'Email already exists, try logging in!'
				});
			}else{
				var crypto = require('crypto'), shasum = crypto.createHash('sha1');
				shasum.update(req.param('password'));
				
				var user = createUser(req.param('username'),shasum.digest('hex'),req.param('uuid'));
				var auth_key = user.device_info[0].auth_token;
				usersCollection.addNewUser(user, function(error,result){
					if(!error){
						return res.json({
							auth_token: auth_key
						});
					}else{
						res.statusCode = 500;
						return res.json({
							error:error+"An error occured while handling your request."
						});
					}
				});
				
			}
		});
	}
}   

exports.update =  function (req, res) {
    
	if (!req.param('auth_token') || !req.param('device_push_token')) {
		
		res.statusCode = 400;
		return res.json({
			error: 'Require a valid token id and auth token.'
		});
        
	}else{
		validateSession(req.param('auth_token'),function(user,error){
			
			if(user){
				var edit_user = updateDeviceToken(user,req.param('device_push_token'),req.param('auth_token'));
				if(edit_user){
					var user_id = edit_user._id;
					delete edit_user['_id'];
					usersCollection.updateUserObject(user_id,edit_user, function(error,result){
					
						if(!error){
							return res.json({
								success: true
							});
						}else{
							res.statusCode = 500;
							return res.json({
								error:"An error occured while handling your request."
							});
						}
					});
					
				}else{
					
					res.statusCode = 401;
					return res.json({
						error:"Request was invalid."
					});
				}
				
			}else{
				res.statusCode = 500;
				return res.json({
					error:"Invalid auth_token."
				});
			}
			
		});
	}
}

exports.location_update = function (req, res) {
	if (!(90>parseFloat(req.param('longitude')) && parseFloat(req.param('longitude'))>-90) ||
	!(180>parseFloat(req.param('latitude')) && parseFloat(req.param('latitude'))>-180) ||
	!req.param('auth_token')) {
		res.statusCode = 400;
		return res.json({
			error: 'Require a valid latitude, longitude and auth_token.'
		});
        
	}else{
		validateSession(req.param('auth_token'),function(user,error){
			
			if(user){
				var edit_user = updateLocationInfo(user,req.param('latitude'),req.param('longitude'),req.param('auth_token'));
				if(edit_user){
					var user_id = edit_user._id;
					delete edit_user['_id'];
					usersCollection.updateUserObject(user_id,edit_user, function(error,result){
					
						if(!error){
							return res.json({
								success: true
							});
						}else{
							res.statusCode = 500;
							return res.json({
								error:"An error occured while handling your request1."
							});
						}
					});
					
				}else{
					
					res.statusCode = 401;
					return res.json({
						error:"Request was invalid."
					});
				}
				
			}else{
				res.statusCode = 500;
				return res.json({
					error:"Invalid auth_token."
				});
			}
			
		});
        
	}
}
 
exports.all = function(req,res){
 	
	getUsersLocationInfo(false,null,req,res);
}
	
exports.all_location = function(req,res){
 	
	getUsersLocationInfo(true,null,req,res);
}

exports.friend_location = function(req,res){
	if (!req.param('auth_token') && !req.param('friend_id')) {
		res.statusCode = 400;
		return res.json({
			error: 'Require a valid auth_token and friend_id.'
		});
        
	}else{
	getUsersLocationInfo(true,req.param('friend_id'),req,res);
	}
}

function updateLocationInfo(_user, _latitude,_longitude, _auth_token){
	
	var deviceExists = false;
	if(_user.device_info){
		for (var i=0; i<_user.device_info.length; i++){
			if(_user.device_info[i].auth_token==_auth_token){		
				_user.device_info[i].last_updated = new Date();
				_user.device_info[i].location = [_latitude, _longitude];
				newDevice = true;
				return _user;
			}
		}
	}
	return null;
}
    
function updateDeviceToken(_user, _device_token, _auth_token){
	
	var deviceExists = false;
	if(_user.device_info){
		for (var i=0; i<_user.device_info.length; i++){
			if(_user.device_info[i].auth_token==_auth_token){		
				_user.device_info[i].device_token = _device_token;
				newDevice = true;
				return _user;
			}
		}
	}
	return null;
}

function createUser(_username, _password, _uuid){
	var user = {username : _username,
		password : _password,
		device_info : [createNewDevice(_uuid)]
	};
	return user;
}

function generateAuthenticateToken(userObject,deviceId){

	var newToken = "";
	var newDevice = true;
	if(userObject.device_info){
		for (var i=0; i<userObject.device_info.length; i++){
			if(userObject.device_info[i].uuid==deviceId){		
				newToken = userObject.device_info[i].auth_token = getNewToken();
				newDevice = false;
			}
		}
		if(newDevice){
			var device = createNewDevice(deviceId);
			newToken = device.auth_token;
			userObject.device_info.push(device);
			
		}
	}else{
		
		var device = createNewDevice(deviceId);
		newToken = device.auth_token;
		userObject.device_info = [device];
	}
	
	return [userObject, newToken];
	
	
}

function createNewDevice(deviceId){
	
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

function validateSession(_auth_key,callback){
	usersCollection.getUserForAuthToken(_auth_key, function(error,user){
		callback(user);
	});
}

function getUsersLocationInfo(location_needed,required_user_id,req,res){
	
	if (!req.param('auth_token')) {
		res.statusCode = 400;
		return res.json({
			error: 'Require a valid auth_token.'
		});
        
	}else{
		validateSession(req.param('auth_token'),function(user,err){
		
			if(user){
				usersCollection.getUsersList(user._id,required_user_id,function(error,result){
		
					if(!error){
						
						if(location_needed==false){
							for (var i=0; i<result.length; i++){
								delete result[i].location;
								
							}
						}
						
						return res.json({
							friends:result
						});
					}else{
						res.statusCode = 500;
						return res.json({
							error:"invalid friend id."
						});
					}
				});
			}else{
				res.statusCode = 401;
				return res.json({
					error:"Request was invalid."
				});
		
			}
		});	
	}
}
