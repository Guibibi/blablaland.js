var bsplit = require('buffer-split');
var net = require('net');
var fs = require('fs');

var GlobalProperties = require("./bbl/GlobalProperties.js");
var variables = require("./maps/variables.js");
var SocketMessage = require("./client/SocketMessage");
var ByteArray = new require("./client/ByteArray.js");

var powerInfo = {
    10000: [2, 1, 99999, 5, 5, new SocketMessage()],
    10001: [2, 2, 99999, 5, 5, new SocketMessage()],
    10002: [2, 3, 99999, 5, 5, new SocketMessage()],
    10003: [2, 4, 0, 5, 5, new SocketMessage()],
    10004: [2, 5, 0, 5, 5, new SocketMessage()]
};

class BblCamera {
    constructor() {
        this.mapId = 9;
        this.cameraId = 1;
        this.serverId = 0;
        this.methodeId = 3;
    }
    userSmileyEvent(param1) {
        for (var i in Array(14).keys()) {
            param1.bitWriteBoolean(true);
            param1.bitWriteUnsignedInt(8, 0);
            param1.bitWriteUnsignedInt(GlobalProperties.BIT_SMILEY_PACK_ID, i);
        }
        param1.bitWriteBoolean(false);
    }
    userObjectEvent(packet, data) {
        packet.bitWriteBoolean(true);
        packet.bitWriteUnsignedInt(8, data.type);
        if(data.type == 0) {
            packet.bitWriteUnsignedInt(32, data.id);
            packet.bitWriteUnsignedInt(GlobalProperties.BIT_FX_ID, data.fxFileId);
            packet.bitWriteUnsignedInt(GlobalProperties.BIT_FX_SID, data.objectId);
            packet.bitWriteUnsignedInt(32, data.count);
            packet.bitWriteUnsignedInt(32, data.expire);
            packet.bitWriteUnsignedInt(3, data.visibility);
            packet.bitWriteUnsignedInt(5, data.genre);
            packet.bitWriteBinaryData(data.data);
        } else if(data.type == 1) {
            packet.bitWriteUnsignedInt(32, data.id);
            packet.bitWriteUnsignedInt(32, data.count);
            packet.bitWriteUnsignedInt(32, data.expire);
            packet.bitWriteBinaryData(data.data);
        }
        return packet;
    }
    teleportToMap(camera_id, map_id, server_id, methode_id) {
        this.methodeId = methode_id;
        this.map.leaveMap(this.mapId, this);
        if(methode_id == 4) {
            this.mainUser.position.x = 95000 / 2;
            this.mainUser.position.y = 7500;
        }
        var packet = new SocketMessage(3, 5);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_CAMERA_ID, camera_id);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_MAP_ID, map_id);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_SERVER_ID, server_id);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_MAP_FILEID, map_id);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_METHODE_ID, methode_id);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_ERROR_ID, 0);
        this.send(packet);
    }
    parsedEventMessage(type, stype, loc5) {
        var packet;
        if (type == 3) {
            if (stype == 3) {
                var token = loc5.bitReadUnsignedInt(32);
                packet = new SocketMessage(3, 2);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_ERROR_ID, 0);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_CAMERA_ID, this.cameraId);
                packet.bitWriteString(this.pseudo);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_MAP_ID, this.mapId);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_MAP_FILEID, this.mapId);
                this.userSmileyEvent(packet);
                packet.bitWriteBoolean(false);
                packet.bitWriteBoolean(false);
                for(var i in powerInfo) {
                    packet = this.userObjectEvent(packet, {
                        type: 0,
                        id: i,
                        fxFileId: powerInfo[i][0],
                        objectId: powerInfo[i][1],
                        count: 999,
                        expire: powerInfo[i][2],
                        visibility: powerInfo[i][3],
                        genre: powerInfo[i][4],
                        data: powerInfo[i][5]
                    });
                }
                packet.bitWriteBoolean(false);
                this.send(packet);
                this.connected = true;
            } else if (stype == 5) {
                var methode_id = loc5.bitReadUnsignedInt(GlobalProperties.BIT_METHODE_ID);
                var camera_id = loc5.bitReadUnsignedInt(GlobalProperties.BIT_CAMERA_ID);
                var map_id = loc5.bitReadUnsignedInt(GlobalProperties.BIT_MAP_ID);
                var server_id = loc5.bitReadUnsignedInt(GlobalProperties.BIT_SERVER_ID);
                this.readPlayerState(loc5);
                this.teleportToMap(camera_id, map_id, server_id, methode_id);
            } else if (stype == 6) {
                var camera_id = loc5.bitReadUnsignedInt(GlobalProperties.BIT_CAMERA_ID);
                var map_id = loc5.bitReadUnsignedInt(GlobalProperties.BIT_MAP_ID);
                this.mapId = map_id;
                this.map.joinMap(map_id, this);
                packet = new SocketMessage(4, 1);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_CAMERA_ID, this.cameraId);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_ERROR_ID, 0);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_METHODE_ID, this.methodeId);
                packet.bitWriteSignedInt(17, 0);
                packet.bitWriteSignedInt(17, 0);
                packet.bitWriteUnsignedInt(5, 0);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_TRANSPORT_ID, 0);
                packet.bitWriteUnsignedInt(16, 0);
                for (var client in this.map.maps[map_id].userList) {
                    client = this.map.maps[map_id].userList[client];
                    packet.bitWriteBoolean(true);
                    packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_ID, client.uid);
                    packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_PID, client.pid);
                    packet.bitWriteString(client.pseudo);
                    packet.bitWriteUnsignedInt(3, client.sex);
                    packet.bitWriteUnsignedInt(32, 0);
                    var p = new SocketMessage();
                    p = client.writePlayerState(p, true, true, true);
                    packet.bitWriteBinaryData(p)
                }
                packet.bitWriteBoolean(false);
                for(var i in this.map.maps[map_id].objectList) {
                    var obj = this.map.maps[map_id].objectList[i];
                    if(Object.keys(obj).length >= 2) {
                        packet.bitWriteBoolean(true);
                        packet.bitWriteUnsignedInt(GlobalProperties.BIT_FX_ID, obj[0]);
                        packet.bitWriteUnsignedInt(GlobalProperties.BIT_FX_SID, obj[1]);
                        packet.bitWriteBinaryData(obj[2]);
                    }
                }
                packet.bitWriteBoolean(false);
                this.send(packet);
                this.methodeId = 0;
                if (this.firstmap) {
                    this.firstmap = false;
                }
            }
        }
    }
}

class BblLogged extends BblCamera {
    constructor() {
        super();
        this.uid = 0;
        this.pid = 1;
        this.sex = 0;
        this.pseudo = "Greg";
        this.grade = 0;
        this.xp = 300;
        this.GPTimer = 0;
        this.firstmap = true;
        this.mainUser = {
            skinId: 7,
            skinColor: [0, 0, 88, 44, 44, 58, 0, 0, 0, 0],
            oldSkinColor: [],
            jump: 0,
            walk: 0,
            shiftKey: false,
            direction: true,
            onFloor: false,
            underWater: false,
            grimpe: false,
            accroche: false,
            dodo: false,
            position: { x: 10000, y: 5000 },
            speed: { x: 0, y: 0 },
            surfaceBody: 0
        };
        this.fxUser = {};
    }
    parsedEventMessage(type, stype, loc5) {
        super.parsedEventMessage(type, stype, loc5);
        var packet;
        if (type == 1) {
            if (stype == 2) {
                var sessionUser = loc5.bitReadString();
                for (var id in this.server.database) {
                    if (this.server.database[id].session == sessionUser) {
                        this.pseudo = this.server.database[id].pseudo;
                        this.mainUser.skinColor = this.server.database[id].skin.color;
                        this.mainUser.skinId = this.server.database[id].skin.id;
                        this.mapId = this.server.database[id].map.id;
                        this.mainUser.position.x = this.server.database[id].skin.posX;
                        this.mainUser.position.y = this.server.database[id].skin.posY;
                        this.mainUser.direction = this.server.database[id].skin.direction;
                        this.xp = this.server.database[id].xp;
                        this.uid = id;
                    }
                }
                packet = new SocketMessage(2, 1);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_ID, this.uid);
                packet.bitWriteString(this.pseudo);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_GRADE, this.grade);
                packet.bitWriteUnsignedInt(32, this.xp);
                this.send(packet);
            } else if (stype == 4) {
                var text = loc5.bitReadString();
                var action = loc5.bitReadUnsignedInt(3);
                packet = new SocketMessage(5, 7, this);
                packet.bitWriteBoolean(true); //html
                packet.bitWriteBoolean(false); //modo
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_PID, this.pid);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_ID, this.uid);
                packet.bitWriteUnsignedInt(3, this.sex);
                packet.bitWriteString(this.pseudo);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_SERVER_ID, this.serverId);
                packet.bitWriteString(text);
                packet.bitWriteUnsignedInt(3, action);
                this.map.maps[this.mapId].sendAll(packet);
            } else if (stype == 8) {
                var packId = loc5.bitReadUnsignedInt(GlobalProperties.BIT_SMILEY_PACK_ID);
                var smileId = loc5.bitReadUnsignedInt(GlobalProperties.BIT_SMILEY_ID);
                var data = loc5.bitReadBinaryData();
                var playcallback = loc5.bitReadBoolean();
                packet = new SocketMessage(5, 8, this);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_PID, this.pid);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_SMILEY_PACK_ID, packId);
                packet.bitWriteUnsignedInt(GlobalProperties.BIT_SMILEY_ID, smileId);
                packet.bitWriteBinaryData(data);
                this.map.maps[this.mapId].sendAll(packet, this);
            }
        } else if (type == 2) {
            if (stype == 2 || stype == 1) {
                var mapId = loc5.bitReadUnsignedInt(GlobalProperties.BIT_MAP_ID);
                var GP_Timer = loc5.bitReadUnsignedInt(32);
                this.GPTimer = GP_Timer;
                this.readPlayerState(loc5);
                if (stype == 2) {
                    packet = new SocketMessage(5, 4, this);
                    packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_PID, this.pid);
                    packet.bitWriteUnsignedInt(32, GP_Timer);
                    packet = this.writePlayerState(packet, true, true, true);
                    packet.bitWriteUnsignedInt(2, loc5.bitReadUnsignedInt(2));
                    packet.bitWriteUnsignedInt(24, loc5.bitReadUnsignedInt(24));
                    packet.bitWriteUnsignedInt(8, loc5.bitReadUnsignedInt(8));
                    packet.bitWriteSignedInt(18, loc5.bitReadSignedInt(18));
                    packet.bitWriteSignedInt(18, loc5.bitReadSignedInt(18));
                } else {
                    packet = new SocketMessage(5, 3, this);
                    packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_PID, this.pid);
                    packet.bitWriteUnsignedInt(32, GP_Timer);
                    packet = this.writePlayerState(packet, true, true, true);
                }
                this.map.maps[this.mapId].sendAll(packet, this);
                this.socketUnlock();
            } else if (stype == 5) {
                this.server.addClient(this);
            }
        }
        else if (type == 6) {
            var skinColor = [];
            if (stype == 1) {
                for(const x of Array(10).keys()) {
                    skinColor.push(loc5.bitReadUnsignedInt(8));
                }
                this.writeUserFXChange(7600, {
                    loc17: true,
                    id: 3,
                    sid: 7600,
                    active: true,
                    data: skinColor,
                    map: true
                });
            } else if (stype == 6 || stype == 7) {
                var activ = (stype == 6) ? 1 : 0;
                var fxSid = loc5.bitReadUnsignedInt(GlobalProperties.BIT_FX_SID);
                var skinByte = loc5.bitReadUnsignedInt(32);
                var delay = loc5.bitReadBoolean();
                var latence = loc5.bitReadBoolean();
                var userActivity = loc5.bitReadBoolean();
                var transmitSelfEvent = loc5.bitReadBoolean();
                if (activ) {
                    var persistant = loc5.bitReadBoolean();
                    var uniq = loc5.bitReadBoolean();
                    var durationBlend = loc5.bitReadUnsignedInt(2);
                    var hasDuration = loc5.bitReadBoolean();
                    if (hasDuration) var duration = loc5.bitReadUnsignedInt(16);
                }
                var hasData = loc5.bitReadBoolean();
                var data = null;
                if (hasData) {
                    data = loc5.bitReadBinaryData();
                }
                var skinAction = loc5.bitReadUnsignedInt(GlobalProperties.BIT_SKIN_ACTION);
                this.fxUser[fxSid] = this.fxManager.writeUserFXChange(this, {
                    loc17: true,
                    id: 5,
                    sid: fxSid,
                    active: activ,
                    data: hasData ? [skinByte, delay, data] : [skinByte, delay],
                    map: true
                });
                if(!activ) this.fxUser[fxSid] = {};
            } else if (stype == 8) {
                var objectId = loc5.bitReadUnsignedInt(32);
                var hasData = loc5.bitReadBoolean();
                var binaryData = null;
                if(hasData) binaryData = loc5.bitReadBinaryData();
                if(objectId == 10000) {
                    var p = new SocketMessage();
                    p.bitWriteUnsignedInt(32, GlobalProperties.getServerTime()[0]);
                    var id = this.writeMapFXChange({
                        id: 5,
                        sid: objectId,
                        active: true,
                        data: [2, 1, p],
                        map: true
                    });
                    var map = this.map.maps[this.mapId];
                    setTimeout(function () {
                        map.delete(id);
                    }, 10000);
                } else if(objectId == 10001) {
                    var p = new SocketMessage();
                    p.bitWriteUnsignedInt(32, GlobalProperties.getServerTime()[0]);
                    this.writeUserFXChange(objectId, {
                        loc17: true,
                        id: 6,
                        sid: objectId,
                        active: true,
                        data: [2, 2, p],
                        map: true
                    });
                    var _this = this;
                    setTimeout(function () {
                        _this.fxUser[objectId] = {};
                    }, 10000);
                } else if(objectId == 10002) {
                    if(hasData) {
                        const tpId = binaryData.bitReadUnsignedInt(GlobalProperties.BIT_MAP_ID);
                        this.teleportToMap(this.cameraId, tpId, this.serverId, 4);
                    }
                } else if(objectId == 10003) {
                    this.writeUserFXChange(7600, {
                        loc17: true,
                        id: 3,
                        sid: 7600,
                        active: false,
                        data: skinColor,
                        map: true
                    });
                    this.fxManager.writeUserFXChange(this, {
                        loc17: true,
                        id: 6,
                        sid: objectId,
                        active: true,
                        data: [2, 4],
                        map: false
                    });
                } else if(objectId == 10004) {
                    if(hasData) {
                        const posX = binaryData.bitReadSignedInt(16);
                        const posY = binaryData.bitReadSignedInt(16);
                        const surface = binaryData.bitReadUnsignedInt(8);
                        const name = binaryData.bitReadString();
                        var p = new SocketMessage();
                        p.bitWriteSignedInt(16, posX);
                        p.bitWriteSignedInt(16, posY);
                        p.bitWriteUnsignedInt(8, surface);
                        p.bitWriteString(name);
                        p.bitWriteUnsignedInt(GlobalProperties.BIT_USER_ID, this.uid);
                        var data = {
                            id: 5,
                            sid: objectId,
                            active: true,
                            data: [2, 5, p],
                            map: true,
                            close: 1
                        };
                        var id = this.writeMapFXChange(data);
                        var map = this.map.maps[this.mapId];
                        var _this = this;
                        setTimeout(function () {
                            data.active = false;
                            _this.fxManager.writeMapFXChange(_this, data);
                            map.delete(id);
                        }, 2000);
                    }
                }
                console.log(objectId);
            }
        }
        else if(type == 9) {
            if(stype == 2) {
                const id = loc5.bitReadUnsignedInt(16);
                if(id == 1) {
                    const camera = loc5.bitReadUnsignedInt(GlobalProperties.BIT_CAMERA_ID)
                    var p = new SocketMessage();
                    p.bitWriteUnsignedInt(32, GlobalProperties.getServerTime()[0]);
                    p.bitWriteUnsignedInt(10, GlobalProperties.getServerTime()[1]);
                    this.writeUserFXChange(this.fxManager.fxsid, {
                        loc17: false,
                        id: 6,
                        sid: this.fxManager.fxsid,
                        active: true,
                        data: [24, 0, p],
                        map: false
                    });
                }
            }
        }
    }
    writeMapFXChange(data) {
        var mapObject = this.fxManager.writeMapFXChange(this, data);
        var map = this.map.maps[this.mapId];
        var id = map.addObject(mapObject);
        return id;
    }
    writeUserFXChange(objectId, data) {
        this.fxUser[objectId] = this.fxManager.writeUserFXChange(this, data);
        if(!data.active) this.fxUser[objectId] = {};
        this.fxManager.fxsid++;
    }
    writePlayerState(param1, position = false, skin = false, power=false) {
        param1.bitWriteSignedInt(2, this.mainUser.jump);
        param1.bitWriteSignedInt(2, this.mainUser.walk);
        param1.bitWriteBoolean(this.mainUser.shiftKey);
        param1.bitWriteBoolean(this.mainUser.direction);
        param1.bitWriteBoolean(this.mainUser.onFloor);
        param1.bitWriteBoolean(this.mainUser.underWater);
        param1.bitWriteBoolean(this.mainUser.grimpe);
        param1.bitWriteBoolean(this.mainUser.accroche);
        param1.bitWriteBoolean(position);
        if (position) {
            param1.bitWriteSignedInt(21, this.mainUser.position.x);
            param1.bitWriteSignedInt(21, this.mainUser.position.y);
            param1.bitWriteUnsignedInt(8, this.mainUser.surfaceBody);
            param1.bitWriteSignedInt(18, this.mainUser.speed.x);
            param1.bitWriteSignedInt(18, this.mainUser.speed.y);
        }
        param1.bitWriteBoolean(skin);
        if (skin) {
            param1.bitWriteUnsignedInt(GlobalProperties.BIT_SKIN_ID, this.mainUser.skinId);
            for (var i in this.mainUser.skinColor) {
                param1.bitWriteUnsignedInt(8, this.mainUser.skinColor[i]);
            }
            param1.bitWriteBoolean(this.mainUser.dodo);
        }
        if(power) {
            for(var i in this.fxUser) {
                if(Object.keys(this.fxUser[i]).length >= 2) {
                    param1.bitWriteBoolean(true);
                    param1.bitWriteUnsignedInt(GlobalProperties.BIT_FX_ID, this.fxUser[i][0])
                    param1.bitWriteUnsignedInt(GlobalProperties.BIT_FX_SID, this.fxUser[i][1])
                    param1.bitWriteBinaryData(this.fxUser[i][2])
                }
            }
        }
        param1.bitWriteBoolean(false);
        return param1;
    }
    readPlayerState(p) {
        this.mainUser.jump = p.bitReadSignedInt(2);
        this.mainUser.walk = p.bitReadSignedInt(2);
        this.mainUser.shiftKey = p.bitReadBoolean();
        this.mainUser.direction = p.bitReadBoolean();
        this.mainUser.onFloor = p.bitReadBoolean();
        this.mainUser.underWater = p.bitReadBoolean();
        this.mainUser.grimpe = p.bitReadBoolean();
        this.mainUser.accroche = p.bitReadBoolean();
        if (p.bitReadBoolean()) {
            this.mainUser.position.x = p.bitReadSignedInt(21);
            this.mainUser.position.y = p.bitReadSignedInt(21);
            this.mainUser.surfaceBody = p.bitReadUnsignedInt(8);
            this.mainUser.speed.x = p.bitReadSignedInt(18);
            this.mainUser.speed.y = p.bitReadSignedInt(18);
        }
        if (p.bitReadBoolean()) {
            this.mainUser.skinColor = {};
            for (var i in Array(10).keys()) {
                this.mainUser.skinColor[i] = p.bitReadUnsignedInt(8);
            }
        }
    }
}

class Client extends BblLogged {
    constructor(socket, map, server, fxManager) {
        super();
        this.connected = false;
        this.map = map;
        this.mapPid = 0;
        this.socket = socket;
        this.server = server;
        this.fxManager = fxManager;
        this.inCmpt = 12;
        this.outCmpt = 12;
        socket.on('data', this.socketData.bind(this));
        socket.on('error', this.errorClient.bind(this));
        socket.on('close', this.connectionLost.bind(this));
    }
    errorClient(err) {
        console.log("error");
        this.socket.destroy();
        this.connectionLost();
    }
    connectionLost() {
        if (this.connected) {
            this.methodeId = 3;
            if(this.uid) {
                this.server.database[this.uid].map.id = this.mapId;
                this.server.database[this.uid].skin.posX = this.mainUser.position.x;
                this.server.database[this.uid].skin.posY = this.mainUser.position.y;
                this.server.database[this.uid].skin.direction = this.mainUser.direction;
                fs.writeFileSync("database.json", JSON.stringify(this.server.database, null, 4), "utf8");
            }
            if (this.mapId in this.map.maps) this.map.leaveMap(this.mapId, this);
            this.server.delClient(this);
        }
    }
    socketData(data) {
        var str_data = data.toString();
        if (str_data == "<policy-file-request/>\x00") {
            this.socket.write("<?xml version=\"1.0\"?><cross-domain-policy><allow-access-from domain=\"*\" to-ports=\"*\" /></cross-domain-policy>\x00");
            return;
        }
        var data_split = bsplit(data, new Buffer("\x00"));
        data_split.pop();
        for (var i in data_split) {
            this.inCmpt++;
            if (this.inCmpt >= 65530) this.inCmpt = 12;
            var loc5 = new SocketMessage();
            loc5.readMessage(data_split[i]);
            var loc4 = loc5.bitReadUnsignedInt(16);
            var type = loc5.bitReadUnsignedInt(GlobalProperties.BIT_TYPE),
                stype = loc5.bitReadUnsignedInt(GlobalProperties.BIT_STYPE);
            this.parsedEventMessage(type, stype, loc5);
        }
    }
    parsedEventMessage(type, stype, loc5) {
        var packet;
        console.log(type, stype);
        super.parsedEventMessage(type, stype, loc5);
        if (type == 1) {
            if (stype == 1) {
                packet = new SocketMessage(1, 1);
                packet.bitWriteUnsignedInt(32, GlobalProperties.getServerTime()[0]);
                packet.bitWriteUnsignedInt(10, GlobalProperties.getServerTime()[1]);
                this.send(packet);
            } else if (stype == 3) {
                this.pid = this.server.pid;
                packet = new SocketMessage(1, 3);
                packet.bitWriteUnsignedInt(24, this.pid);
                this.pseudo = "Touriste_" + this.pid;
                this.send(packet);
            } else if (stype == 6) {
                packet = new SocketMessage();
                this.send(this.server.variable.variables);
            } else if (stype == 19) {
                packet = new SocketMessage();
                packet.readMessage(loc5.bitReadString(), this);
                this.send(packet);
            } else if (stype == 13) {
                packet = new SocketMessage(1, 8);
                const serverid = loc5.bitReadUnsignedInt(GlobalProperties.BIT_SERVER_ID);
                while (loc5.bitReadBoolean()) {
                    const mapid = loc5.bitReadUnsignedInt(GlobalProperties.BIT_MAP_ID);
                    packet.bitWriteBoolean(true);
                    packet.bitWriteUnsignedInt(GlobalProperties.BIT_MAP_ID, mapid);
                    if(mapid in this.server.map.maps) packet.bitWriteUnsignedInt(10, Object.keys(this.server.map.maps[mapid].userList).length);
                    else packet.bitWriteUnsignedInt(10, 0);
                }
                packet.bitWriteBoolean(false);
                this.send(packet);
            }
        }
    }
    socketUnlock() {
        this.send(new SocketMessage(1, 11));
    }
    send(param1, param2 = false) {
        this.outCmpt++;
        if (this.outCmpt >= 65530) this.outCmpt = 12;
        var loc3 = new SocketMessage();
        loc3.bitWriteUnsignedInt(16, this.outCmpt);
        var loc4 = loc3.exportMessage();
        var socket = new ByteArray();
        socket.writeByte(loc4);
        loc4 = param1.exportMessage();
        socket.writeByte(loc4);
        socket.writeByte(0);
        this.socket.write(socket.getBuffer());
    }
}

class Map {
    constructor() {
        this.userList = {};
        this.objectList = {};
        this.objectPid = 140;
        this.pid = 0;
    }
    addObject(mapObject) {
        this.objectList[this.objectPid] = mapObject;
        this.objectPid++;
        return this.objectPid - 1;
    }
    delete(id) {
        this.objectList[id] = {};
    }
    addUser(user) {
        this.userList[this.pid] = user;
        user.mapPid = this.pid;
        this.pid++;
        var packet = new SocketMessage(5, 1, user);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_ID, user.uid);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_PID, user.pid);
        packet.bitWriteString(user.pseudo);
        packet.bitWriteUnsignedInt(3, user.sex);
        packet.bitWriteUnsignedInt(32, 0);
        packet = user.writePlayerState(packet, true, true, true);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_METHODE_ID, user.methodeId);
        this.sendAll(packet, user);
    }
    deleteUser(user) {
        delete this.userList[user.mapPid];
        var packet = new SocketMessage(5, 2, user);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_PID, user.pid);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_METHODE_ID, user.methodeId);
        this.sendAll(packet);
    }
    sendAll(packet, me = false) {
        for (var i in this.userList) {
            if (this.userList[i] != me) this.userList[i].send(packet);
        }
    }
}

class MapManager {
    constructor() {
        this.maps = {};
    }
    createMap(id) {
        if (!(id in this.maps)) this.maps[id] = new Map();
    }
    joinMap(id, user) {
        this.createMap(id);
        this.maps[id].addUser(user);
    }
    leaveMap(id, user) {
        this.maps[id].deleteUser(user);
    }
}

class FxManager {
    constructor() {
        this.fxsid = 4000;
    }
    writeUserFXChange(user, data) {
        var packet = new SocketMessage(5, 6, user);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_USER_PID, user.pid);
        packet.bitWriteBoolean(data.loc17);
        packet.bitWriteBoolean(data.active);
        if (!data.active) {
            if(!data.close) data.close = 0;
            packet.bitWriteUnsignedInt(2, data.close);
        }
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_FX_ID, data.id);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_FX_SID, data.sid);
        var p = this.executeFXUserMessage(data);
        packet.bitWriteBinaryData(p);
        if(data.map) user.map.maps[user.mapId].sendAll(packet);
        else user.send(packet);
        return [data.id, data.sid, p];
    }
    executeFXUserMessage(data) {
        var p = new SocketMessage();
        if (data.id == 1) {
            p.bitWriteUnsignedInt(24, data.lightEffectColor);
        } else if (data.id == 2) {
            p.bitWriteBoolean(data.active);
        } else if (data.id == 3) {
            for(var i in data.data) {
                p.bitWriteUnsignedInt(8, data.data[i]);
             }
        } else if (data.id == 5) {
            p.bitWriteUnsignedInt(32, data.data[0]);
            p.bitWriteBoolean(data.data[1]);
            if (data.data.length > 2) {
                p.bitWriteBoolean(true);
                p.bitWriteBinaryData(data.data[2]);
            } else {
                p.bitWriteBoolean(false);
            }
        } else if (data.id == 6) {
            p.bitWriteUnsignedInt(GlobalProperties.BIT_FX_ID, data.data[0]);
            p.bitWriteUnsignedInt(GlobalProperties.BIT_FX_SID, data.data[1]);
            if (data.data.length > 2) {
                p.bitWriteBoolean(true);
                p.bitWriteBinaryData(data.data[2]);
            } else {
                p.bitWriteBoolean(false);
            }
        }
        return p;
    }
    writeMapFXChange(user, data) {
        var packet = new SocketMessage(5, 10, user);
        packet.bitWriteBoolean(data.active);
        if (!data.active) {
            if(!data.close) data.close = 0;
            packet.bitWriteUnsignedInt(2, data.close);
        }
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_FX_ID, data.id);
        packet.bitWriteUnsignedInt(GlobalProperties.BIT_FX_SID, data.sid);
        var p = this.executeFXMapMessage(data);
        packet.bitWriteBinaryData(p);
        if(data.map) user.map.maps[user.mapId].sendAll(packet);
        else user.send(packet);
        return [data.id, data.sid, p];
    }
    executeFXMapMessage(data) {
        var p = new SocketMessage();
        if(data.id == 5) {
            p.bitWriteUnsignedInt(GlobalProperties.BIT_FX_ID, data.data[0]);
            p.bitWriteUnsignedInt(GlobalProperties.BIT_FX_SID, data.data[1]);
            if (data.data.length > 2) {
                p.bitWriteBoolean(true);
                p.bitWriteBinaryData(data.data[2]);
            } else {
                p.bitWriteBoolean(false);
            }
        }
        return p;
    }
}

var fxManager = new FxManager();

class ServerBBL {
    constructor(port) {
        this.map = new MapManager();
        var server = net.createServer(this.getNewUser.bind(this));
        server.listen(port);
        this.variable = new variables(port - 12301);
        this.userList = {};
        this.database = null;
        this.pid = 1;
    }
    addClient(user) {
        this.userList[user.pid] = user;
        var packet = new SocketMessage(1, 7);
        packet.bitWriteUnsignedInt(16, Object.keys(this.userList).length); //origine
        packet.bitWriteUnsignedInt(16, Object.keys(this.userList).length); //total
        packet.bitWriteUnsignedInt(16, 0); //legende
        packet.bitWriteUnsignedInt(16, 0); //fury
        this.sendAll(packet);
    }
    delClient(user) {
        delete this.userList[user.pid];
    }
    sendAll(packet, me = false) {
        for (var i in this.userList) {
            if (this.userList[i] != me) this.userList[i].send(packet);
        }
    }
    getNewUser(socket) {
        new Client(socket, this.map, this, fxManager);
        this.pid++;
    }
}

module.exports = ServerBBL;