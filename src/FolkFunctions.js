function ChangeFolkState(folk, direction) {

    if (direction === undefined) direction = folk.dir;
    var dirName = "";
    var flip = 1;

    switch (direction) {
        case 0:
            {
                dirName = "side";
                flip = -1;
                break;
            }
        case 1:
            {
                dirName = "side";

                break;
            }
        case 2:
            {
                dirName = "up";
                break;
            }
        case 3:
            {
                dirName = "down";
                break;
            }
    }

    //if (folk.scale.x !== flip)
    folk.scale.x = flip;

    //if (folk.dir !== direction) {
    folk.dir = direction;
    folk.animMachine.setState("folk_" + dirName + "_" + folk.id.toString());

    if (folk.animMachine.isPlaying === false) {
        folk.animMachine.play();
    }
    //}
}

function PreventFolkToGoToEnemy(folk, dir) {

    var enemy = Environment.player;

    if (Environment.fascistMode === false) {
        enemy = Environment.ai;
    }

    var xdist = Math.abs(folk.tile.x - enemy.tile.x);
    var ydist = Math.abs(folk.tile.y - enemy.tile.y);
    var chanceToNotAvoid = scintilla.Random.irange(0, 100);


    if (dir === 0) { // go to right

        if (xdist < 3) {
            if (folk.tile.x - enemy.tile.x < 0) {
                return false;
            }
        } else if (xdist !== 0 && chanceToNotAvoid < AVOIDANCE_LEVEL) {
            return false;
        }
    } else if (dir === 1) { // go to left
        if (xdist < 13) {
            if (enemy.tile.x - folk.tile.x < 0) {
                return false;
            }
        } else if (xdist !== 0 && chanceToNotAvoid < AVOIDANCE_LEVEL) {
            return false;
        }
    } else if (dir === 2) { // go to up
        if (ydist < 2) {
            if (enemy.tile.y - folk.tile.y < 0) {
                return false;
            } else if (ydist !== 0 && chanceToNotAvoid < AVOIDANCE_LEVEL) {
                return false;
            }
        }
    } else if (dir === 3) { // go to down
        if (ydist < 2) {
            if (folk.tile.y - enemy.tile.y < 0) {
                return false;
            }
        } else if (ydist !== 0 && chanceToNotAvoid < AVOIDANCE_LEVEL) {
            return false;
        }
    }

    return true;
}

function RandomizeFolkDirection(folk) {
    var possibleDir = [];
    var i = 0;
    var size = 0;
    var oneAtLast = null;
    for (i = 0; i < 4; i++) {
        if (folk.tileDirection[i] === true) {

            if (i === 1) {
                // avoid go to 'far-right' x (this is a leftist game)
                if (folk.tile.x <= folkLimit.xMin)
                    continue;

            } else if (i === 0 && AntifaControl.fascistMode === false) {
                if (folk.tile.x >= folkLimit.xMax)
                    continue;
            }

            if (PreventFolkToGoToEnemy(folk, i) === true) {
                possibleDir.push(i);
            } else {
                oneAtLast = i;
            }
        }
    }

    size = possibleDir.length;

    var dirIndex = 0;
    if (size > 0 || oneAtLast !== null) {

        if (size > 0) {
            dirIndex = scintilla.Random.irange(0, size);
            dirIndex = possibleDir[dirIndex];
        } else if (oneAtLast !== null)
            dirIndex = oneAtLast;

        if (dirIndex <= 1) {
            //dirIndex -= 1;             
            folk.hspd = (dirIndex === 1) ? -1 : 1;
            folk.vspd = 0;
        } else {
            //dirIndex -= 3;   
            folk.vspd = (dirIndex === 3) ? 1 : -1;
            folk.hspd = 0;
        }
    } else {
        folk.vspd = 0;
        folk.hspd = 0;
    }

    return dirIndex;
}

function PeacefulRandomizeFolkDirection(folk) {

    var possibleDir = [];
    var i = 0;
    var size = 0;
    var dirIndex = 0;
    for (; i < 4; i++) {
        if (folk.tileDirection[i] === true) {

            if (i === 1) {
                // avoid go to 'far-right' x (this is a leftist game)
                if (folk.tile.x <= folkLimit.xMin)
                    continue;
            } else if (i === 0) {
                if (folk.tile.x >= folkLimit.xMax)
                    continue;
            }

            possibleDir.push(i);
        }
    }

    size = possibleDir.length;
    if (size > 0) {
        dirIndex = scintilla.Random.irange(0, size);
        dirIndex = possibleDir[dirIndex];
        if (dirIndex <= 1) {
            folk.hspd = (dirIndex === 1) ? -1 : 1;
            folk.vspd = 0;
        } else {
            folk.vspd = (dirIndex === 3) ? 1 : -1;
            folk.hspd = 0;
        }
    } else {
        folk.vspd = 0;
        folk.hspd = 0;
    }

    return dirIndex;
}

function PeacefulFolk() {
    var dir = 0;
    if (this.isMoving === false) {

        WorldToTile(this.x - 8, this.y - 8, this.tile);
        this.oldTile.x = this.tile.x;
        this.oldTile.y = this.tile.y;

        CheckDirectionalCollision(this.tile, this.id, this.tileDirection);

        if (this.tileDirection[4] === true) {
            timeToWait = DURATION_BETWEEN_AI;
        } else {
            dir = PeacefulRandomizeFolkDirection(this);

            ChangeFolkState(this, dir);
            this.destPos.x = Math.round(this.x + 16 * this.hspd);
            this.destPos.y = Math.round(this.y + 16 * this.vspd);
            ActiveTileMovement(this, this.vspd, this.hspd);
        }
    }

}

function FolkRun() {

    if (this.isMoving === true)
        return;

    WorldToTile(this.x - 8, this.y - 8, this.tile);
    this.oldTile.x = this.tile.x;
    this.oldTile.y = this.tile.y;
    var beSmart = true;

    if (this.smartness < 100) {
        if (scintilla.Random.irange(0, 100) <= this.smartness) {
            beSmart = true;
        } else {
            beSmart = false;
        }
    }

    var dir = 0;

    if (this.tile.x > 104) {
        beSmart = false;
    }

    if (beSmart === true) {

        var depth = (this.smartness === 100) ? undefined : FOLK_MAX_PATH_FINDING_STEPS;
        var safePoint = GetNearestSafePoint(this.position);
        beSmart = false;

        if (safePoint !== null) {
            safePoint = GetTile(safePoint.x, safePoint.y);
            this.chainNode = PathFinder.FindPath(this.tile, safePoint, -1, FolkPathFindCollisionTest, this);

            if (this.chainNode !== null) {

                if (this.chainNode.length > 1) {

                    this.navigation = 1;
                    dir = ActivePathNodeMovement(this, this.chainNode[1]);
                    ChangeFolkState(this, dir);
                    beSmart = true;
                }
            }
        }
    }
    if (beSmart === false) {

        this.beingSmart = false;
        CheckDirectionalCollision(this.tile, this.id, this.tileDirection);

        if (this.tileDirection[4] === true) {
            timeToWait = DURATION_BETWEEN_AI;
        } else {
            dir = RandomizeFolkDirection(this);

            ChangeFolkState(this, dir);
            this.destPos.x = Math.round(this.x + 16 * this.hspd);
            this.destPos.y = Math.round(this.y + 16 * this.vspd);
            ActiveTileMovement(this, this.vspd, this.hspd);
        }
    }

}

function KillFolk(folkToKill, scene, culled) {
    var blood = scene.entity.create(BloodEffect);
    blood.folkToDie = folkToKill;
    if (Environment.endGame === 0) {
        if (culled === true || culled === undefined) {
            scene.audio.playOnce('dead');
        }
    }

    folkToKill.dead = true;

    if (!folkToKill.isPlayer) {
        Environment.removeFolk(folkToKill);
    }

    AntifaControl.activeSymbolBar = true;
    AntifaControl.peace = false;
}

function KillAllFolks() {
    var folk;
    for (var i = 0; i < Environment.folks.length; i++) {
        folk = Environment.folks[i];
        if (folk.dead === false)
            folk.Die();
    }

    Environment.folks.length = 0;
}


function IsFolksCulled(camera) {

    var folk;
    var result = 0;
    var i = 0;
    for (; i < Environment.folks.length; i++) {

        folk = Environment.folks[i];
        if (folk.dead === true)
            continue;

        if (camera.isCulled(folk)) {
            result++;
        }

    }

    return (result === 0);

}

function GetNearestFolkByTile(x, y) {
    var closeDistx = Infinity,
        closeDisty = Infinity;
    var dist, dist2;
    var closestFolk = null;
    var i = 0;
    var folk;
    for (; i < Environment.folks.length; i++) {

        folk = Environment.folks[i];
        if (folk.dead === true)
            continue;

        dist = scintilla.Math.manhattan(x, y, folk.tile.x, folk.tile.y);
        if (dist.x <= closeDistx && dist.y <= closeDisty) {
            closeDistx = dist.x;
            closeDisty = dist.y;
            dist = closeDistx;
            closestFolk = folk;
        }
        /*else {
                   dist2 = scintilla.Math.manhattan(x, y, folk.oldTile.x, folk.oldTile.y);
                   if (dist2.x < closeDistx && dist2.y < closeDisty) {
                       closeDistx = dist2.x;
                       closeDisty = dist2.y;
                       closestFolk = folk;
                   }

               }*/
    }
    return closestFolk;

}

function GetNearestFolk(x, y, ignoreID) {
    var closeDist = Infinity;
    var dist;
    var closestFolk = null;
    var i = 0;
    var folk;
    for (; i < Environment.folks.length; i++) {

        folk = Environment.folks[i];
        if (folk.dead === true)
            continue;

        dist = scintilla.Math.distance(x, y, folk.x, folk.y);
        if (dist <= closeDist /*&& dist.y <= closeDisty*/ ) {
            dist = closeDist;
            closestFolk = folk;
        }
    }
    return closestFolk;

}

function GetNearestSafePoint(from) {

    var firstFarthest = null;
    for (var i = 0; i < Environment.safePoints.length; i++) {

        point = Environment.safePoints.get(i);
        //dist = scintilla.Math.manhattan(from.x, from.y, point.x, point.y);
        if (point.x > from.x) {
            firstFarthest = point; //  GetTile(point.x, point.y);
            break;
        }
    }

    if (firstFarthest === null) {
        var last = Environment.safePoints.length - 1;
        firstFarthest = Environment.safePoints.get(last);
    }


    return firstFarthest;

}