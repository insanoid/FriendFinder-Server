var config = {}

config.mongo = {};
config.web = {};
config.push = {};

config.mongo.host = 'localhost';
config.mongo.port = 27017;
// config.mongo.username = 'karthikeyaudupa1';
// config.mongo.password = '1123581321';
config.mongo.db = 'friendfinder';

config.push.radius = 300; //in meters
config.push.gcmkey = 'AIzaSyBpog7NZc0AjKVLkJ2wMXNmP6Uu2D1x4Jo';

config.web.port = process.env.PORT || 3000;
module.exports = config;