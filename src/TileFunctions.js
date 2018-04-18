function CheckMapCollision(x, y) {

    if (y < 0)
        return true;

    if (x < 0)
        return false;

    if (x >= Environment.map.width || y >= Environment.map.height)
        return true;

    var tile = Environment.map.layers[1].getTile(x, y);

    if (tile === null)
        return true;

    return tile.data.properties.colliadable;
}

function CollidesWithFolk(x, y, considerMovement) {

    if (considerMovement === undefined) considerMovement = true;
    var folk;
    var i = 0;
    for (; i < Environment.folks.length; i++) {
       // var test = true;
        folk = Environment.folks[i];
       /* if (id !== undefined) {
            test = folk.dead === tru;
        }*/
        if (folk.dead === true)
            continue;

        if (folk.tile.x === x && folk.tile.y === y) {
            return folk;
        } else if (considerMovement === true && folk.isMoving === true) {
            if (folk.toTile.x === x && folk.toTile.y === y) {
                return folk;
            } else if (folk.oldTile.x === x && folk.oldTile.y === y) {
                return folk;
            }
        }
    }

    return null;
}

function CheckFolkCollision(x, y, id) {
    var test = true;
    var folk;
    var i = 0;
    for (; i < Environment.folks.length; i++) {
        test = true;
        folk = Environment.folks[i];
        if (id !== undefined) {
            test = !(folk.id === id || folk.dead === true); // !(folk.id === id || folk.dead === true);
        }
        if (test === false)
            continue;

        if (folk.tile.x === x && folk.tile.y === y) {
            return folk;
        } else if (folk.oldTile.x === x && folk.oldTile.y === y) {
            return folk;
        } else { // else if (folk.isMoving === true) {
            if (folk.toTile.x === x && folk.toTile.y === y) {
                return folk;
            }
            /*} else if (folk.tile.x === from.x && folk.tile.y === from.y) {
                return folk;
            }*/
        }
    }

    return null;
}


function CheckDirectionalCollision(tile, folkID, tileDir) {



    // right
    tileDir[0] = !CheckMapCollision(tile.x + 1, tile.y) &&
        !CheckFolkCollision(tile.x + 1, tile.y, folkID) &&
        !CollideWithPlayer(tile.x + 1, tile.y);

    // left
    tileDir[1] = !CheckMapCollision(tile.x - 1, tile.y) &&
        !CheckFolkCollision(tile.x - 1, tile.y, folkID) &&
        !CollideWithPlayer(tile.x - 1, tile.y);
    // up
    tileDir[2] = !CheckMapCollision(tile.x, tile.y - 1) &&
        !CheckFolkCollision(tile.x, tile.y - 1, folkID) &&
        !CollideWithPlayer(tile.x, tile.y - 1);
    // down
    tileDir[3] = !CheckMapCollision(tile.x, tile.y + 1) &&
        !CheckFolkCollision(tile.x, tile.y + 1, folkID) &&
        !CollideWithPlayer(tile.x, tile.y + 1);

    // can move in all directions?
    //tileDir[4] = (tileDir[0] && tileDir[1] && tileDir[2] && tileDir[3]);
    // can move?
    tileDir[4] = !(tileDir[0] || tileDir[1] || tileDir[2] || tileDir[3]);
}

function CollideWithPlayer(x, y) {

    if (Environment.player.tile.x == x && Environment.player.tile.y == y)
        return true;
    else if (Environment.player.oldTile.x == x && Environment.player.oldTile.y == y) {
        return true;
    } else// if (Environment.player.isMoving) {
        if (Environment.player.toTile.x == x && Environment.player.toTile.y == y) {
            return true;
        }
    //}

    return false;
}

function CollideWith(a, b) {

    if (a.tile.x == b.tile.x && a.tile.y == b.tile.y)
        return true;
    else if (a.toTile.x == b.toTile.x && a.toTile.y == b.toTile.y)
        return true;
    else if (a.toTile.x == b.tile.x && a.toTile.y == b.tile.y)
        return true;
    else if (b.toTile.x == a.tile.x && b.toTile.y == a.tile.y)
        return true;

    return false;
}

function SetToTile(entity, tileX, tileY) {
    entity.position.set(
        scintilla.Math.round(tileX * 16) + (entity.origin.x * 16),
        scintilla.Math.round(tileY * 16) + (entity.origin.y * 16));
}

function GetEntityTile(entity) {
    return {
        x: Math.round((entity.x + (entity.origin.x * 16)) / 16),
        y: Math.round((entity.y + (entity.origin.y * 16)) / 16)
    };
}

function GetTile(xworld, yworld) {
    return {
        x: Math.round(xworld / 16),
        y: Math.round(yworld / 16)
    };
}

function WorldToTile(xworld, yworld, tile) {
    tile.x = Math.round(xworld / 16);
    tile.y = Math.round(yworld / 16);
}

function RoundToTile(entity) {

    SetToTile(entity,
        (entity.x - (entity.origin.x * 16)) / 16,
        (entity.y - (entity.origin.y * 16)) / 16
    );
}

function CameraFollowPlayer(camera, player) {

    var camX = player.x - 144;
    if (camX <= 0) {
        camX = 0;
    }
    camera.x = camX;
}



function CreateTiledEntity(entity, spd) {
    entity.spd = spd || 25;
    entity.spdDuration = 16 / spd;
    entity.moveTimer = 0;
    entity.isMoving = false;
    entity.hspd = 0;
    entity.vspd = 0;
    entity.oldPos = {
        x: 0,
        y: 0
    };
    entity.destPos = {
        x: 0,
        y: 0
    };
    entity.oldTile = {
        x: 0,
        y: 0
    };
    entity.toTile = {
        x: 0,
        y: 0
    };
    entity.tile = GetTile(entity.x - 8, entity.y - 8);
    //entity.movementType = 0;
    entity.beingSmart = false;
}

function ActiveTileMovement(entity, horizontal, vertical) {
    entity.isMoving = true;
    entity.moveTimer = 0;
    entity.oldPos.x = entity.x;
    entity.oldPos.y = entity.y;
    entity.toTile.x = entity.oldTile.x + horizontal;
    entity.toTile.y = entity.oldTile.y + vertical;
}

function TileMovement(entity, dt) {
    entity.moveTimer += dt / entity.spdDuration;
    if (entity.moveTimer >= 1) {
        entity.isMoving = false;
        entity.moveTimer = 1;
    }

    if (entity.hspd !== 0) {
        entity.x = scintilla.Math.lerp(entity.oldPos.x, entity.destPos.x, entity.moveTimer);
    }

    if (entity.vspd !== 0) {
        entity.y = scintilla.Math.lerp(entity.oldPos.y, entity.destPos.y, entity.moveTimer);
    }

    WorldToTile(entity.x - 8, entity.y - 8, entity.tile);

    if (!entity.isMoving) {
        entity.x = entity.destPos.x;
        entity.y = entity.destPos.y;
        RoundToTile(entity);
    }
}

function GetNearestSafePoint(from) {
    return {x:0,y:0};
    /*var closeDistx = Infinity, closeDisty = Infinity;
    var dist;
    var point;
    var closestPoint = null;
    for (var i = 0; i < Environment.safePoints.length; i++) {

        point = Environment.safePoints[i];
        dist = scintilla.Math.manhattan(from.x, from.y, point.x, point.y);
        if (dist.x < closeDistx && dist.y < closeDisty) {
            closeDistx = dist.x;
            closeDisty = dist.y;
            closestPoint = point;
        }
    }
    return (closestPoint !== null) ? GetTile(closestPoint.x, closestPoint.y) : null;
    */
}

function PathFindCollisionTest(pos, obj) {

    return !CheckMapCollision(pos.x, pos.y); // ||
        //CheckFolkCollision(pos.x, pos.y, obj.id) ||
        //CollideWithPlayer(pos.x, pos.y);

}

function ActivePathNodeMovement(entity, node) {

    var dir = 0;
    entity.toTile.x = node.position.x;
    entity.toTile.y = node.position.x;
    entity.oldPos.x = entity.x;
    entity.oldPos.y = entity.y;

    entity.hspd = node.position.x - entity.tile.x;
    entity.vspd = node.position.y - entity.tile.y;

    if (entity.hspd !== 0) {
        entity.vspd = 0;
        dir = entity.hspd;
    } else if (entity.vspd !== 0) {
        entity.hspd = 0;
        dir = (entity.vspd === 1) ? 2 : 3;
    }

    entity.destPos.x = Math.round(node.position.x * 16 + 8);
    entity.destPos.y = Math.round(node.position.y * 16 + 8);
    entity.isMoving = true;
    entity.beingSmart = true;
    entity.moveTimer = 0;
    return dir;

}

function ValidatePathNode() {

}

function TileMovementThroughPathNode(node, entity, dt) {

    entity.moveTimer += dt / entity.spdDuration;

    if (entity.moveTimer >= 1) {
        entity.moveTimer = 1;
        entity.isMoving = false;
    }


    if (entity.hspd !== 0) {
        entity.x = scintilla.Math.lerp(entity.oldPos.x, entity.destPos.x, entity.moveTimer);
    }

    if (entity.vspd !== 0) {
        entity.y = scintilla.Math.lerp(entity.oldPos.y, entity.destPos.y, entity.moveTimer);
    }

    WorldToTile(entity.x - 8, entity.y - 8, entity.tile);

    if (entity.isMoving === false) {
        var parent = node.parent;
        if (parent !== null) {
            var dir = ActivePathNodeMovement(entity, parent);
            node = node.parent;
            ChangeFolkState(entity, dir);
        } else {
            node = null;
            entity.x = entity.destPos.x;
            entity.y = entity.destPos.y;
            RoundToTile(entity);
        }
    }
}