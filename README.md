##FriendFinder

Sample node.js application to find friends exposes restful API uses a mongodb backend with the default native adapter.

####API Methods

###### user/create/ [POST]
* username
* password
* uuid
```
{ "auth_token": "81a8157ee6ddcee9f783120a1339069d514e4321" }
```

###### user/authenticate/ [POST]
* username
* password
* uuid
```
{ "auth_token": "81a8157ee6ddcee9f783120a1339069d514e4321" }
```

###### user/update/ [POST]
* username
* device_push_token
```
{ "success": true }
```

###### user/update/ [POST]
* username
* device_push_token
```
{ "success": true }
```
user/location/update
Parameters:
auth_token
latitude
longitude
Valid Response:
{ "nearby" : [ "533192384ef38d0000b4d1ed", "5331b0e24ef38d0000b4d1ee" ], "success" : true }
