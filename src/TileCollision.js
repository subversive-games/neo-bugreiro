function TileIsColliadable(tile) {

    if (tile === null)
        return false;

    if (tile === undefined)
        return false;

    return (tile.data.properties.colliadable === true);
}


function CheckMapCollision(x, y) {

    if (y < 0 || x < 0)
        return true;

    if (x >= Environment.map.width || y >= Environment.map.height)
        return true;

    var tile = Environment.mapColliderLayer.getTile(x, y);

    if (TileIsColliadable(tile) === false) {
        tile = Environment.mapColliderUpperLayer.getTile(x, y);
        return TileIsColliadable(tile);
    } 

    return true;
    
}

function CheckExtrapolatedMapCollision(x, y) {

    if (x < 0)
        return false;

    if (y < 0)
        return true;

    if (x >= Environment.map.width || y >= Environment.map.height)
        return true;

    var tile = Environment.mapColliderLayer.getTile(x, y);

    if (TileIsColliadable(tile) === false) {
        tile = Environment.mapColliderUpperLayer.getTile(x, y);
        return TileIsColliadable(tile);
    } 

    return true;
    
}

function CollidesWithFolk(x, y, considerMovement, ignoreId) {

    if (considerMovement === undefined) considerMovement = true;
    var folk;
    var i = 0;
    for (; i < Environment.folks.length; i++) {
        folk = Environment.folks[i];

        if (ignoreId !== undefined) {
            if (ignoreId === i) {
                continue;
            }
        }

        if (folk.dead === true) {
            continue;
        }

        if (folk.tile.x === x && folk.tile.y === y) {
            return folk;
        } else if (considerMovement === true && folk.isMoving === true) {
            if (folk.toTile.x === x && folk.toTile.y === y) {
                return folk;
            }
        }
    }

    return null;
}

function CheckFolkCollision(x, y, id) {
    var folk;
    var i = 0;
    for (; i < Environment.folks.length; i++) {

        folk = Environment.folks[i];

        if (folk.dead === true) {
            continue;
        }

        if (id !== undefined) {
            if (folk.id === id) {
                continue;
            }
        }


        if (folk.tile.x === x && folk.tile.y === y) {
            return folk;
        } else if (folk.isMoving === true) {
            if (folk.toTile.x === x && folk.toTile.y === y) {
                return folk;
            }
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

    if (Environment.player.tile.x === x && Environment.player.tile.y === y)
        return true;
    else if (Environment.player.oldTile.x === x && Environment.player.oldTile.y === y) {
        return true;
    } else if (Environment.player.isMoving) {
        if (Environment.player.toTile.x === x && Environment.player.toTile.y === y) {
            return true;
        }
    }

    return false;
}

function CollideWith(entity, x, y) {

    if (entity.tile.x === x && entity.tile.y === y) {
        return true;
    } else if (entity.isMoving) {
        if (entity.toTile.x === x && entity.toTile.y === y) {
            return true;
        }
    }
    return false;
}

function FullCollideWith(a, b) {

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

function AvoidBugreiro(x, y) {
    if (AntifaControl.fascistMode === true) {
        return scintilla.Math.inManhattanRadius(Environment.player.tile.x, Environment.player.tile.y, x, y, 3) || CollideWithPlayer(x, y);
    } else {
        return scintilla.Math.inManhattanRadius(Environment.ai.tile.x, Environment.ai.tile.y, x, y, 3) || CollideWith(Environment.ai, x, y) || CollideWithPlayer(x, y);
    }
}


function FolkPathFindCollisionTest(x, y, obj) {


    if (x <= folkLimit.xMin) {
        return true;
    }

    if (AntifaControl.fascistMode === false) {
        if (x >= folkLimit.xMax) {
            return true;
        }
    }

    var id
    if (obj !== undefined)
        id = obj.id;

    return CheckMapCollision(x, y) ||
        CheckFolkCollision(x, y, id) ||
        AvoidBugreiro(x, y);

}


function CollideWithBlockedPath(tileX, tileY, blockedPathMax) {

    var i = 0;
    var xx = tileX * 16;
    var yy = tileY * 16;
    for (; i < Environment.blockingPaths.length; i++) {

        if (i === blockedPathMax)
            break;

        if (Environment.blockingPaths.at(i).intersects(xx, yy, 16, 16)) {
            return true;
        }
    }

    return false;

}