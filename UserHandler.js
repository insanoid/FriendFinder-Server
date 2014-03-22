var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

UsersCollection = function(host, port) {
	this.db= new Db('friendfinder', new Server(host, port, {auto_reconnect: true}, {}),{safe:true});
	this.db.open(function(){});
};

UsersCollection.prototype.getCollection= function(callback) {
	this.db.collection('friendfinder', function(error, usercollection) {
		if( error ) callback(error);
		else callback(null, usercollection);
	});
};

UsersCollection.prototype.findAll = function(callback) {
	this.getCollection(function(error, usercollection) {
		if( error ) callback(error)
		else {
			usercollection.find().toArray(function(error, results) {
				if( error ) callback(error)
				else callback(null, results)
			});
		}
	});
};

UsersCollection.prototype.authenticateUser = function(_username,_password, callback) {
	this.getCollection(function(error, usercollection) {
		if( error ) callback(error)
		else {
			usercollection.findOne({username: _username,password: _password}, function(error, result) {
				if( error ) callback(error)
				else callback(null, result)
			});
		}
	});
};

UsersCollection.prototype.getUserForEmail = function(_username, callback) {
	this.getCollection(function(error, usercollection) {
		if( error ) callback(error)
		else {
			usercollection.findOne({username: _username}, function(error, result) {
				if( error ) callback(error)
				else callback(null, result)
			});
		}
	});
};

UsersCollection.prototype.getUsersList = function(_user_id,required_user_id, callback) {
	

	this.getCollection(function(error, usercollection) {
		if(error)
			callback(error)
		else {
			try{
				var match_string;
				if(required_user_id!=null){
					match_string = {$and:[{_id:{ $ne:_user_id}},
					{_id:usercollection.db.bson_serializer.ObjectID.createFromHexString(required_user_id)}]};
				} else{
					match_string ={_id:{$ne:_user_id}};
				}
				usercollection.aggregate(
					{$match:match_string},
					{$unwind: "$device_info"},
					{$project:{
						username:"$username",
						_id:"$_id",
						location:"$device_info.location",
						last_updated:"$device_info.last_updated"}
					},
					{$sort:{last_updated:1}},
					{$group: {
						_id:"$_id",
						last_updated:{$last: "$last_updated"},
						username:{$last: "$username"},
						location:{$last: "$location"}
					}},
					function(err, qresult){ 
						if( err ){
							callback(err)
						}else{
							callback(null,qresult)
						}
					});
				}catch(err){
					callback("invalid friend id.")
				}
			}
			
		});
	};


	UsersCollection.prototype.addNewUser = function(_user, callback) {
		this.getCollection(function(error, usercollection) {
			if( error ) callback(error)
			else {
				usercollection.insert(_user, function(error, result) {
					if( error ) callback(error)
					else callback(null, result)
				});
			}
		});
	};

	UsersCollection.prototype.updateUserObject = function(_user_id,_user, callback) {
		this.getCollection(function(error, usercollection) {
			if( error ) callback(error)
			else {
				usercollection.update({_id:_user_id},_user, function(error, result) {
					if( error ) callback(error)
					else callback(null, result)
				});
			}
		});
		
	};

	UsersCollection.prototype.getUserForAuthToken = function(_auth_token, callback) {
		this.getCollection(function(error, usercollection) {
			if( error ) callback(error)
			else {
				usercollection.findOne({"device_info.auth_token": _auth_token}, function(error, result) {
					if( error ) callback(error)
					else callback(null, result)
				});
			}
		});
	};




	exports.UsersCollection = UsersCollection;

