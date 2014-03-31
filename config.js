var config = {}

config.mongo = {};
config.web = {};
config.push = {};

config.mongo.host = 'localhost';
config.mongo.port = 27017;
// config.mongo.username = 'someusername';
// config.mongo.password = 'somepassword';
config.mongo.db = 'friendfinder';

config.push.radius = 300; //in meters
config.push.gcmkey = 'gcmkey';

config.web.port = process.env.PORT || 3000;
module.exports = config;
