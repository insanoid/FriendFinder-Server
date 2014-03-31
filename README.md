##FriendFinder

Sample node.js application to find friends nearby. Exposes restful API with a mongodb backend for building applications.

####API Methods

###### user/create [POST]
* username
* password
* uuid
```
{ "auth_token": "81a8157ee6ddcee9f783120a1339069d514e4321" }
```

###### user/authenticate [POST]
* username
* password
* uuid
```
{ "auth_token": "81a8157ee6ddcee9f783120a1339069d514e4321" }
```

###### user/update [POST]
* auth_token
* device_push_token
```
{ "success": true }
```

###### location/update [POST]
* auth_token
* latitude
* longitude
```
{ "nearby" : [ "533192384ef38d0000b4d1ed", "5331b0e24ef38d0000b4d1ee" ], "success" : true }
```

###### friends/all [GET]
* auth_token
```
{
    "friends": [
        {
            "_id": 12340,
            "username": "user1@bham.ac.uk"
        },
        {
            "_id": 12342,
            "username": "user2@bham.ac.uk"
        }
    ]
}
```

###### friends/location [GET]
* auth_token
* friend_id
```
{
    "_id": 12340,
    "location": [
        50.232323,
        -1.232323
    ],
    "username": "user1@bham.ac.uk",
    "updated_on": 1395162263
}
```


###### friends/location/all [GET]
* auth_token
```
{
    "friends": [
        {
            "_id": "5332f06e2c19322b5d8153e8",
            "last_updated": "2014-03-26T15:21:34.208Z",
            "username": "sample2@bham.ac.uk",
            "location": [
                54.2323,
                2.232
            ]
        },
        {
            "_id": "53389c713c898b7713697fea",
            "last_updated": null,
            "username": "sample3@bham.ac.uk",
            "location": null
        }
    ]
}
```

#### MongoDb Setup
Index the location field for spatial queries.
```
db.findfriends.ensureIndex( { "device_info.location": "2d" })
```

#### Web
* /map - Shows the map with the users nearby.
* /serverlog - Gives a log for the service.
