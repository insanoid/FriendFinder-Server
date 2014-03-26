var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var config = require('./config');

//Create a new database connection.
UsersCollection = function (host, port) {
    this.db = new Db(config.mongo.db, new Server(host, port, {
        auto_reconnect: true
    }, {}), {
        safe: true
    });
    this.db.open(function (err, data) {
        if (data) {
            if (config.mongo.username && config.mongo.password) {
                data.authenticate(config.mongo.username, config.mongo.password, function (err2, data2) {
                    if (data2) {
                        console.log("Database connection opened.");
                    } else {
                        console.log("Error in connecting to database: " + err2);
                    }
                });
            } else {

            }


        } else {
            console.log(err);
        }
    });
};

//Fetches the provided collection.
UsersCollection.prototype.getCollection = function (callback) {
    this.db.collection(config.mongo.db, function (error, usercollection) {
        if (error) callback(error);
        else callback(null, usercollection);
    });
};

//Gets all objects.
UsersCollection.prototype.findAll = function (callback) {
    this.getCollection(function (error, usercollection) {
        if (error) callback(error)
        else {
            usercollection.find().toArray(function (error, results) {
                if (error) callback(error)
                else callback(null, results)
            });
        }
    });
};

//Authenticates user's information.
UsersCollection.prototype.authenticateUser = function (_username, _password, callback) {
    this.getCollection(function (error, usercollection) {
        if (error) callback(error)
        else {

            usercollection.findOne({
                username: _username,
                password: _password
            }, function (error, result) {
                if (error) callback(error)
                else callback(null, result)
            });
        }
    });
};

//Fetches the user based on the email entered.
UsersCollection.prototype.getUserForEmail = function (_username, callback) {
    this.getCollection(function (error, usercollection) {
        if (error) callback(error)
        else {
            usercollection.findOne({
                username: _username
            }, function (error, result) {
                if (error) callback(error)
                else callback(null, result)
            });
        }
    });
};

//List of all active users.
UsersCollection.prototype.getUsersList = function (_user_id, required_user_id, callback) {


    this.getCollection(function (error, usercollection) {
        if (error)
            callback(error)
        else {
            try {
                var match_string;
                if (required_user_id != null) {
                    match_string = {
                        $and: [{
                            _id: {
                                $ne: _user_id
                            }
                        }, {
                            _id: usercollection.db.bson_serializer.ObjectID.createFromHexString(required_user_id)
                        }]
                    };
                } else {
                    match_string = {
                        _id: {
                            $ne: _user_id
                        }
                    };
                }
                usercollection.aggregate({
                        $match: match_string
                    }, {
                        $unwind: "$device_info"
                    }, {
                        $project: {
                            username: "$username",
                            _id: "$_id",
                            location: "$device_info.location",
                            last_updated: "$device_info.last_updated"
                        }
                    }, {
                        $sort: {
                            last_updated: 1
                        }
                    }, {
                        $group: {
                            _id: "$_id",
                            last_updated: {
                                $last: "$last_updated"
                            },
                            username: {
                                $last: "$username"
                            },
                            location: {
                                $last: "$location"
                            }
                        }
                    },
                    function (err, qresult) {
                        if (err) {
                            callback(err)
                        } else {
                            callback(null, qresult)
                        }
                    });
            } catch (err) {
                callback("invalid friend id.")
            }
        }

    });
};

//Creates a new user record from user object.
UsersCollection.prototype.addNewUser = function (_user, callback) {
    this.getCollection(function (error, usercollection) {
        if (error) callback(error)
        else {
            usercollection.insert(_user, function (error, result) {
                if (error) callback(error)
                else callback(null, result)
            });
        }
    });
};

//Updates the userobject at the given object id.
UsersCollection.prototype.updateUserObject = function (_user_id, _user, callback) {
    this.getCollection(function (error, usercollection) {
        if (error) callback(error)
        else {
            usercollection.update({
                _id: _user_id
            }, _user, function (error, result) {
                if (error) callback(error)
                else callback(null, result)
            });
        }
    });

};

//Fetch user object for the authentication token.
UsersCollection.prototype.getUserForAuthToken = function (_auth_token, callback) {
    this.getCollection(function (error, usercollection) {
        if (error) callback(error)
        else {
            usercollection.findOne({
                "device_info.auth_token": _auth_token
            }, function (error, result) {
                if (error) callback(error)
                else callback(null, result)
            });
        }
    });
};

//List of all nearby users to the present latitude and longitude users.
UsersCollection.prototype.getUsersForNotification = function (_latitude,_longitude, callback) {


    this.getCollection(function (error, usercollection) {
        if (error)
            callback(error)
        else {
            try {
				usercollection.find(
					{ "device_info.location" :{ $geoWithin : { $centerSphere :[[_latitude, _longitude]  , 100/3959]} }}).
				toArray(function(err, documents) {
                    if (err) {
                        callback(err)
                    } else {
                        callback(null, documents)
                    }
				});
				
            } catch (err) {
                callback("invalid id.")
            }
        }

    });
};

exports.UsersCollection = UsersCollection;