function SetToTile(entity, tileX, tileY) {
    entity.position.set(
        scintilla.Math.round(tileX * 16) + (entity.origin.x * 16),
        scintilla.Math.round(tileY * 16) + (entity.origin.y * 16));
}

function SetToRoundedTile(entity, tileX, tileY) {

    if (entity.tile !== undefined) {
        entity.tile.x = tileX;
        entity.tile.y = tileY;
    }
    entity.position.set(tileX * 16 + 8, tileY * 16 + 8);
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

function GetFlooredTile(xworld, yworld) {
    return {
        x: Math.floor(xworld / 16),
        y: Math.floor(yworld / 16)
    };
}

function WorldToTile(xworld, yworld, tile) {
    tile.x = Math.round(xworld / 16);
    tile.y = Math.round(yworld / 16);
}

function WorldToFlooredTile(xworld, yworld, tile) {
    tile.x = Math.floor(xworld / 16);
    tile.y = Math.floor(yworld / 16);
}

function RoundToTile(entity) {

    var x = Math.round((entity.x - 8) / 16);
    var y = Math.round((entity.y - 8) / 16);
    entity.position.set(x * 16 + 8, y * 16 + 8);
    if (entity.tile !== undefined) {
        entity.tile.x = x;
        entity.tile.y = y;
    }

}

function CreateTiledEntity(entity, spd) {
    entity.spd = spd || 25;
    entity.spdDuration = (16 / spd);
    entity.moveTimer = 0;
    entity.isMoving = false;
    entity.hspd = 0;
    entity.vspd = 0;
    entity.dir = 0;
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
    entity.oldTile.x = entity.tile.x;
    entity.oldTile.y = entity.tile.y;
    entity.toTile.x = entity.oldTile.x + horizontal;
    entity.toTile.y = entity.oldTile.y + vertical;
    entity.beingSmart = false;
}

function TileMovement(entity, dt, moveDuration) {
    entity.moveTimer += dt / moveDuration;
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

    WorldToFlooredTile(entity.x, entity.y, entity.tile);

    if (entity.moveTimer >= 0.5) {
        entity.oldTile.x = entity.tile.x;
        entity.oldTile.y = entity.tile.y;
    }

    if (!entity.isMoving) {
        entity.x = entity.destPos.x;
        entity.y = entity.destPos.y;
        RoundToTile(entity);
        entity.oldTile.x = entity.tile.x;
        entity.oldTile.y = entity.tile.y;

    }
}



function ActivePathNodeMovement(entity, node) {

    var dir = 0;
    entity.oldTile.x = entity.tile.x;
    entity.oldTile.y = entity.tile.y;
    entity.toTile.x = node.x;
    entity.toTile.y = node.x;
    entity.oldPos.x = entity.x;
    entity.oldPos.y = entity.y;

    entity.hspd = node.x - entity.tile.x;
    entity.vspd = node.y - entity.tile.y;

    if (entity.hspd !== 0) {
        entity.vspd = 0;
        dir = (entity.hspd === -1) ? 1 : 0;
    } else if (entity.vspd !== 0) {
        entity.hspd = 0;
        dir = (entity.vspd === 1) ? 3 : 2;
    }

    entity.destPos.x = Math.round(node.x * 16 + 8);
    entity.destPos.y = Math.round(node.y * 16 + 8);
    entity.isMoving = true;
    entity.beingSmart = true;
    entity.moveTimer = 0;

    return dir;

}

function FolkTileMovementThroughPathNode(node, entity, dt, moveDuration) {

    entity.moveTimer += dt / moveDuration;

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

    WorldToFlooredTile(entity.x - 8, entity.y - 8, entity.tile);

    if (entity.moveTimer >= 0.5) {
        entity.oldTile.x = entity.tile.x;
        entity.oldTile.y = entity.tile.y;
    }

    if (entity.isMoving === false) {


        entity.x = entity.destPos.x;
        entity.y = entity.destPos.y;
        RoundToTile(entity);
        entity.navigation++;

        var len = node.length;

        if (entity.navigation < len) {

            var next = node[entity.navigation];

            entity.tile.x = node[entity.navigation - 1].x;
            entity.tile.y = node[entity.navigation - 1].y;
            var dir;
            // is near to the safe point?
            if (entity.navigation >= len - 2) {


                // if yes, we can avoid to reach to the center of safe point
                if (FolkPathFindCollisionTest(next.x, next.y, this)) {
                    node = null;
                    entity.navigation = 0;
                } else {
                    dir = ActivePathNodeMovement(entity, next);
                    ChangeFolkState(entity, dir);
                }

            } else {

                if (!FolkPathFindCollisionTest(next.x, next.y, this)) {
                    dir = ActivePathNodeMovement(entity, next);
                    ChangeFolkState(entity, dir);
                } else {
                    node = null;
                    entity.navigation = 0;
                }
            }


        } else {
            node = null;
            entity.navigation = 0;
        }
    }
}

function TileTrace(fromTile, move_x, move_y, max) {

    var i = 0;
    var xtest = fromTile.x;
    var ytest = fromTile.y;
    for (; i < max; i++) {

        if (CheckMapCollision(xtest, ytest) === false) {
            break;
        }

        xtest += move_x;
        ytest += move_y;

    }

    return {
        x: xtest,
        y: ytest
    };
}


function TraceToTarget(fromTile, target, move_x, move_y, max) {

    var i = 0;
    var xtest = fromTile.x;
    var ytest = fromTile.y;
    for (; i < max; i++) {

        xtest += move_x;
        ytest += move_y;

        if (CheckMapCollision(xtest, ytest)) {
            return false;
        } else {

            if (xtest === target.tile.x && ytest === target.tile.y) {
                return true;
            } else if (xtest === target.toTile.x && ytest === target.toTile.y) {
                return true;
            }
        }

    }

    return false;

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

    WorldToFlooredTile(entity.x - 8, entity.y - 8, entity.tile);

    if (entity.moveTimer >= 0.5) {
        entity.oldTile.x = entity.tile.x;
        entity.oldTile.y = entity.tile.y;
    }

    if (entity.isMoving === false) {


        entity.x = entity.destPos.x;
        entity.y = entity.destPos.y;
        RoundToTile(entity);
        entity.navigation++;

        var len = node.length;

        if (entity.navigation < len) {

            var next = node[entity.navigation];

            entity.tile.x = node[entity.navigation - 1].x;
            entity.tile.y = node[entity.navigation - 1].y;

            //if (!FolkPlayerCollisionTest(next.x, next.y, this)) {
                var dir = ActivePathNodeMovement(entity, next);
                entity.ChangeState(dir);
                return;
            //}
        }

        node = null;
        //entity.navigation = 0;
    }

   
}