/*! neo-bugreiro - v1.0.0 - */

var MAX_FOLKS = 8;

var AntifaController = function () {
    this.deadFolkPlaces = [];
    this.deadCount = 0;
    this.fascistMode = true;
    this.naziChoices = 0;
    this.naziCount = 0;
    this.antifaCount = 0;
    this.killedFirstFolk = false;
    this.firstShoot = false;
    this.peace = true;
};

var GameEnvironment = function() {
    this.map = null;
    this.folks = [];
    this.player = null;
    this.endGame = 0;
    this.tribeArea = null;
    this.largeTribeArea = null;
    this.safePoints = null;

    this.removeFolk = function(folkToKill){
        var index = this.folks.indexOf(folkToKill);
        this.folks.splice(index, 1);
        folkToKill.behavior = null;
    }

    this.clear = function() {
        this.map = null;
        this.folks.length = 0;
        this.player = null;
        this.endGame = 0;
    }
}

var Environment = new GameEnvironment();

var AntifaControl = new AntifaController();;var Heuristic = {
    manhattan: function (source, target) {
        return (Math.abs(target.x - source.x) + Math.abs(target.y - source.y)) * 10;

    },
    euclidean: function (source, target) {
        /// TODO
        return 0;
    },
    octagonal: function (source, target) {
        /// TODO
        return 0;
    },
};

var PathMovementCost = [
    14, 10, 14,
    10, 0, 10,
    14, 10, 14
];

var PathDirections = [{
        x: 0,
        y: 1
    },
    {
        x: 1,
        y: 0
    },
    {
        x: 0,
        y: -1
    },
    {
        x: -1,
        y: 0
    },
    {
        x: -1,
        y: -1
    },
    {
        x: 1,
        y: 1
    },
    {
        x: -1,
        y: 1
    },
    {
        x: 1,
        y: -1
    }
];

var PathNode = function (position, parent) {

    if (position === undefined || position === null) {
        position = {
            x: 0,
            y: 0
        };
    }

    this.position = position;
    this.parent = parent || null;
    this.direction = null;
    // the movement cost from the start point A
    // (cost from A to square):
    this.G = 0;
    // is the estimated movement cost from the current square to the destination point 
    // (estimated cost from square to B):
    this.H = 0;
    // (score for square):
    //this.F = 0;

    this.Score = function () {
        return this.G + this.H;
    };

};

var PathFinding = function (moveDirections, map, collisionPredicate) {

    //var closedNodes = new scintilla.Structure.List(null, false);
    //var openNodes = new scintilla.Structure.List(null, false);
    //var from = new PathNode(null, null);
    this.map = map;
    this.movementDirections = moveDirections || 4;
    this.collisionPredicate = collisionPredicate || null;


    this.FindNode = function (list, position) {

        var content = list.content();

        for (var j = 0; j < content.length; j++) {

            if (content[j].position.x == position.x &&
                content[j].position.y == position.y) {
                return content[j];
            }

        }

        return null;
    };

    this.FindPath = function (start, target, object, maxSteps) {


   var closedNodes = new scintilla.Structure.List(null, false);
    var openNodes = new scintilla.Structure.List(null, false);

        if (this.collisionPredicate === undefined) {
            console.warn("Error");
            return;
        }

        var chain = null;
        var pos = {
            x: 0,
            y: 0
        };
        var gCost;
        var i;
        var from = new PathNode(start, null);
        //from.position = start;
        //from.parent = null;
        openNodes.push(from);
        var steps = 0;
        var first;

        while (!openNodes.empty()) {

            first = openNodes.first();
            var r = openNodes.each(
                function (node) {

                if (node.Score() <= first.Score()) {
                    return node;
                }
            });
            chain = r || first;


            if (chain !== null) {

                if (chain.position.x === target.x &&
                    chain.position.y === target.y) {
                    break;
                }

                /*if (maxSteps !== undefined) {
                    if (steps >= maxSteps) {
                        break;
                    }
                }*/

                closedNodes.push(chain);
                openNodes.erase(chain);

               

                for (i = 0; i < this.movementDirections; i++) {
                    pos.x = chain.position.x + PathDirections[i].x;
                    pos.y = chain.position.y + PathDirections[i].y;

                    
                    if (pos.x < 0 || pos.x >= this.map.width ||
                       pos.y < 0 || pos.y >= this.map.height ||
                       this.FindNode(closedNodes, pos) !== null
                       ) {
                        continue;
                    }

                    /*if (this.FindNode(closedNodes, pos) !== null) {
                        continue;
                    }*/


                    if (this.collisionPredicate(pos, object) === false) {

                        gCost = chain.G + ((i < 4) ? 10 : 14);

                        var nodeToFind = this.FindNode(openNodes, pos);

                        if (nodeToFind === null) {
                            nodeToFind = new PathNode(pos, chain);
                            nodeToFind.direction = PathDirections[i];
                            nodeToFind.G = gCost;
                            nodeToFind.H = Heuristic.manhattan(pos, target);
                            openNodes.push(nodeToFind);

                        } else if (gCost < nodeToFind.G) {

                            nodeToFind.parent = chain;
                            nodeToFind.G = gCost;
                        }
                    }

                }

                steps++;
            } else {
                break;
            }
        }

       // var finalNodes = new scintilla.Structure.List(null, false);

       /* while (chain !== null) {
            finalNodes.push(chain);
            chain = chain.parent;
        }*/

        console.log(steps);

        closedNodes.clear();
        openNodes.clear();

        return chain;

    };
};

var PathFinder = new PathFinding(4);;function CheckMapCollision(x, y) {

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
};/// FOLK

var bloodFrame = {
    x: 64,
    y: 64,
    width: 16,
    height: 16
};

var FolkBehavior = {
    Still: 0,
    LeftRight: 1,
    UpDown: 2,
    Random: 3,
    PathFinding: 4
};

function ChangeFolkState(folk, direction) {

    if (direction === undefined) direction = folk.dir;
    var dirName = "";
    var flip = 1;

    switch (direction) {
        case 0:
            {
                dirName = "side";
                break;
            }
        case 1:
            {
                dirName = "side";
                flip = -1;
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

    if (folk.scale.x !== flip)
        folk.scale.x = flip;
        
    folk.dir = direction;
    folk.animMachine.setState("folk_" + dirName + "_" + folk.id.toString());

    if (folk.animMachine.isPlaying === false) {
        folk.animMachine.play();
    }
};

function PreventFolkToGoToEnemy(folk, dir) {

    var xdist = Math.abs(folk.tile.x - Environment.player.tile.x);
    var ydist = Math.abs(folk.tile.y - Environment.player.tile.y);

    if (dir === 0) { // go to right


        if ((folk.tile.x + 1) - Environment.player.tile.x < 0) {
            return false;
        }
    } else if (dir === 1) { // go to left
        if (xdist < 10) {
            if (Environment.player.tile.x - (folk.tile.x - 1) <= 0) {
                return false;
            }
        }
    } else if (dir == 2) { // go to up
        if (ydist < 3) {
            if (Environment.player.tile.y - (folk.tile.y - 1) < 0) {
                return false;
            }
        }
    } else if (dir == 3) { // go to down
        if (ydist < 3) {
            if ((folk.tile.y + 1) - Environment.player.tile.y < 0) {
                return false;
            }
        }
    }

    return true;
}

function RandomizeFolkDirection(folk) {
    var possibleDir = [];
    var i = 0;
    for (i = 0; i < 4; i++) {
        if (folk.tileDirection[i] === true) {
            if (PreventFolkToGoToEnemy(folk, i) === true) {
                possibleDir.push(i);
            }
        }
    }

    if (possibleDir.length > 0) {
        var dirIndex = scintilla.Random.integerRange(0, possibleDir.length);
        dirIndex = possibleDir[dirIndex];

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
};function Folk() {


    this.animMachine = null;
    this.behavior = FolkBehavior.Random;
    this.spr = null;
    this.tile = null;
    this.dead = false;
    this.id = 0;
    this.dir = 0;
    this.tileDirection = [false, false, false, false, false];
    this.smartness = 100;
    var timeToWait = 0;
    var alertAnim = null;
    var panic = false;
    //var beingSmart = false;
    var chainNode = null;


    this.start = function () {

        CreateTiledEntity(this, 25);

        alertAnim = this.scene.create.spritesheet('alert');
        alertAnim.modules.get('render').depth = 12;
        alertAnim.active = false;
        this.animMachine = this.modules.attach.animMachine();
        this.origin.set(0.5, 0.5);
        this.spr = this.modules.get('render');
        this.spr.depth = 2;
    };

    this.update = function (dt) {

        if (this.dead === true)
            return;

        if (AntifaControl.killedFirstFolk === false && AntifaControl.peace === true)
            return;
        else if (panic === false) {
            panic = true;
            alertAnim.active = true;
        }

        if (timeToWait <= 0) {
            if (this.isMoving === false) {

                if (this.behavior === null)
                    return;

                var beSmart = true;

                WorldToTile(this.x - 8, this.y - 8, this.tile);
                this.oldTile.x = this.tile.x;
                this.oldTile.y = this.tile.y;
                var dir = 0;
                var flip = 1;

                if (beSmart === true) {

                    var safePoint = GetNearestSafePoint(this.position);
                    chainNode = PathFinder.FindPath(this.oldTile, safePoint, this);
                    
                    if (chainNode !== null) {
                        dir = ActivePathNodeMovement(this,chainNode);
                        ChangeFolkState(this, dir);
                    } else {
                        beSmart = false;
                    }

                }
                if (beSmart === false) {

                    this.beingSmart = false;
                    CheckDirectionalCollision(this.tile, this.id, this.tileDirection);

                    if (this.tileDirection[4] === true) {
                        timeToWait = 2;
                    } else {
                        dir = RandomizeFolkDirection(this);
                        if (this.hspd != 0)
                            flip = -this.hspd;

                        ChangeFolkState(this, dir);
                        this.destPos.x = Math.round(this.x + 16 * this.hspd);
                        this.destPos.y = Math.round(this.y + 16 * this.vspd);
                        ActiveTileMovement(this, this.vspd, this.hspd);
                    }
                }
            }



            if (this.isMoving) {
                 if (this.beingSmart === false) {
                    TileMovement(this, dt);
                } else {
                    TileMovementThroughPathNode(chainNode, this, dt);
                }
            }

            alertAnim.x = this.x - 8;
            alertAnim.y = this.y - 12;
        } else {
            timeToWait -= dt;
        }
    };


    this.Setup = function (x, y, id, map, brothers, player) {
        this.player = player;
        this.position.set(x + 8, y + 8);
        this.tile = GetTile(this.x, this.y);
        this.id = id;
    };

    this.Die = function () {
        this.dead = true;

        this.animMachine.stop();
        this.scene.entity.destroy(alertAnim);
        var x = (this.id % 2) * 16;
        var y = scintilla.Math.floor(this.id / 2) * 16;
        this.spr.setFrame(96 + x, 48 + y, 16, 16);
        var blood = this.scene.create.sprite('chars', 'blood', bloodFrame);
        blood.position.set(this.x - 8, this.y - 8);
        this.spr.depth = 1;
        blood.modules.get('render').depth = 0;
        alphaTime = 0;
        AntifaControl.naziCount++;
    };

};
/// SHOOT EFFECT
function ShootEffect() {

    this.vspd = 0;
    this.hspd = 1;
    var anim;

    this.start = function () {
        anim = this.modules.attach.spritesheet('shoot_effect_side');
        this.modules.get('render').depth = 7;
        anim.loop = false;
        anim.onAnimationEnd = this.end;
        this.origin.set(0.5, 0.5);
    };

    this.end = function () {
        this.back();
    };

    this.setup = function (pos, direction) {

        switch (direction) {
            case 0:
            case 1:
                {
                    var scale = (direction === 1) ? 1 : -1;
                    anim.animation = 'shoot_effect_side';
                    this.x = pos.x + 15 * scale;
                    this.y = pos.y;
                    this.scale.x = scale;
                    break;
                }

            case 2:
            case 3:
                {
                    anim.animation = 'shoot_effect_updown';
                    var scale = (direction === 2) ? 1 : 0;
                    this.x = pos.x + 4 * scale;
                    this.y = pos.y + 8 * -scale;
                    this.scale.x = 1;
                    break;
                }

        }
        anim.restart();
    };

}

/// BULLET EXPLOSION

function BulletExplosion() {
    this.anim = null;
    this.start = function () {
        this.anim = this.modules.attach.spritesheet('bullet_explosion');
        this.modules.get('render').depth = 8;
        this.anim.loop = false;
        this.anim.onAnimationEnd = this.back;
        this.origin.set(0.5, 0.5);
    };
}

/// BLOOD EFFECT

function BloodEffect() {

    this.folkToDie = null;

    this.start = function () {
        var anim = this.modules.attach.spritesheet('blood_explosion');
        this.modules.get('render').depth = 9;
        anim.onAnimationEnd = function () {
            this.scene.entity.destroy(this);
            this.folkToDie.Die();
        };
        anim.loop = false;
        //this.position.set(folkToKill.x, folkToKill.y);
        this.origin.set(0.5, 0.5);
    };

    this.update = function () {
        this.position.set(this.folkToDie.x, this.folkToDie.y);
    };

}
;
/// BULLET

var BULLET_SPD = 100;

function Bullet() {

    this.vspd = 0;
    this.hspd = 1;
    this.effect = null;
    this.moduleAnim = null;
    this.t = 0;
    var fix = {x:0,y:0};
    var spr;
    this.tile = {
        x: 0,
        y: 0
    }
    this.start = function () {
        spr = this.modules.attach.sprite('chars', 64, 48, 16, 16);
        this.origin.set(0.5, 0.5);
    };

    this.Explode = function (folkToKill) {
        var exp = this.scene.pool.pull('explosion');

        exp.anim.restart();
        exp.position.set(this.x, this.y);
        if (folkToKill !== undefined && !folkToKill.dead) {

            var blood = this.scene.entity.create(BloodEffect);
            blood.folkToDie = folkToKill;
            this.scene.audio.playOnce('dead');
            Environment.removeFolk(folkToKill);
            AntifaControl.killedFirstFolk = true;
        } else {
            this.scene.audio.playOnce('explosion');
        }
        this.back();
    }

    this.update = function (dt) {

        this.x += this.hspd * BULLET_SPD * dt;
        this.y += this.vspd * BULLET_SPD * dt;

        if (AntifaControl.peace === true && Environment.player.reachTheTribe === true) {
            if (Environment.tribeArea.intersects(this.x - 8, this.y - 8, 16, 16)) {
                AntifaControl.peace = false;
            }
        }

        if (this.scene.camera.isCulled(spr)) {
            WorldToTile(this.x - 8, this.y - 8 - fix.y, this.tile);
            var folk = CollidesWithFolk(this.tile.x, this.tile.y, false);
            if (folk === null) {
                if (CheckMapCollision(this.tile.x, this.tile.y)) {
                    this.Explode();
                }
            } else {
                this.Explode(folk);
            }
        } else {
            this.back();
        }



    }

    this.setup = function (pos, direction) {

        var scale = 1;

        switch (direction) {
            case 0:
            case 1:
                {
                    scale = (direction === 1) ? 1 : -1;
                    this.vspd = 0;
                    this.hspd = scale;
                    fix.x = 0;
                    fix.y = 1;
                    this.x = pos.x + 8 * scale;
                    this.y = pos.y + fix.y;
                    this.scale.x = scale;
                    this.angle = 0;
                    break;
                }
            case 2:
            case 3:
                {
                    scale = (direction === 3) ? 1 : -1;
                    this.vspd = scale;
                    this.hspd = 0;
                    fix.y = 4 * scale;
                    this.x = pos.x;
                    this.y = pos.y + fix.y;
                    this.scale.x = 1;
                    if (scale === 1) {
                        this.angle = 90;
                    } else {
                        this.angle = 270;
                    }
                    break;
                }

        }
        spr.depth = 6;

    };

};function SceneLogo() {

    this.waitLogoTime = 0;
    this.done = true;
    this.goToScene = 'title';

    this.preload = function () {
        this.load.setPath('assets/');

        /// TITLE
        this.load.webFont('font', 'google', 'Press Start 2P');
        this.load.image('titleNeo', 'img/n_title_neo.png');
        this.load.image('titleBugre', 'img/n_title_bugre.png');
        this.load.image('titleBugreBack', 'img/n_title_bugre_fill.png');
        this.load.image('titleBorder', 'img/n_title_bugre_border.png');
        this.load.image('titleChroma', 'img/n_title_chrome.bmp');

        this.load.image('titleBg', 'img/n_title_bg.bmp');
        this.load.image('antifaJamLogo', 'img/antifagamejamlogo.png');

        /// AUDIO
        this.load.audio('titleMusic', 'sfx/505-loop3.ogg');
        this.load.audio('gameMusic', 'sfx/505-myth.ogg');
        this.load.audio('ok', 'sfx/n_confirm.wav');
        this.load.audio('shoot', 'sfx/n_shot.wav');
        this.load.audio('explosion', 'sfx/n_explosion.wav');
        this.load.audio('dead', 'sfx/n_dead.wav');

        /// GAME
        this.load.tilemapJSON('tilemap', 'map/n_tilemap.json');
        this.load.image('chars', 'img/n_chars.png');

        // Bugreiro
        this.load.spritesheet('bug_down', 'chars', [0, 0, 16, 16, 2], 123);
        this.load.spritesheet('bug_side', 'chars', [0, 16, 16, 16, 2], 123);
        this.load.spritesheet('bug_up', 'chars', [0, 32, 16, 16, 2], 123);
        this.load.spritesheet('bug_shoot_down', 'chars', [32, 0, 16, 16, 4], 120);
        this.load.spritesheet('bug_shoot_side', 'chars', [32, 16, 16, 16, 4], 120);
        this.load.spritesheet('bug_shoot_up', 'chars', [32, 32, 16, 16, 4], 120);
        this.load.animMachine('bugreiro', ['bug_down', 'bug_side', 'bug_up', 'bug_shoot_down', 'bug_shoot_side', 'bug_shoot_up']);

        // Effects
        this.load.spritesheet('shoot_effect_side', 'chars', [96, 0, 16, 16, 3, 1], 120);
        this.load.spritesheet('shoot_effect_updown', 'chars', [112, 0, 16, 16, 3, 1], 120);
        this.load.spritesheet('bullet_explosion', 'chars', [128, 0, 16, 16, 4, 1], 120);
        this.load.spritesheet('blood_explosion', 'chars', [80, 48, 16, 16, 5, 1], 160);
        this.load.spritesheet('alert', 'chars', [64, 80, 16, 16, 4, 1], 123);

        /// FOLKS
        var x = 0;
        var y = 48;
        var row = 0;
        var folkDown, folkUp, folkSide;
        var dur = 240;

        for (var i = 0; i < MAX_FOLKS; i++) {

            folkDown = 'folk_down_' + i.toString();
            folkSide = 'folk_side_' + i.toString();
            folkUp = 'folk_up_' + i.toString();
            this.load.spritesheet(folkDown, 'chars', [x, y, 16, 16, 2], dur);
            this.load.spritesheet(folkSide, 'chars', [x, y + 16, 16, 16, 2], dur);
            this.load.spritesheet(folkUp, 'chars', [x, y + 32, 16, 16, 2], dur);
            this.load.animMachine('folk_' + i.toString(), [folkDown, folkSide, folkUp]);

            row++;
            if (row >= 2) {
                row = 0;
                x = 0;
                y += 48;
            } else {
                x += 32;
            }
        }

        this.events.subscribe("asset_complete", function (asset, type) {

            if (type === scintilla.AssetType.spritesheet) {
                var dur = (16 / 50) / 2;
                if (/^bug_shoot_/.test(asset.name)) {
                    asset.loop = false;
                    asset.duration = 120;
                    asset.duplicate(0);
                } else if (/^bug_/.test(asset.name)) {
                    asset.loop = true;
                    asset.duration = dur * 1000;
                }
            }

        });

    };

    this.start = function () {
        this.transition.settings.setOutDuration(1);
        this.transition.settings.setEaseOutMethod(scintilla.Ease.Type.CUT, 3);
        this.transition.settings.setEaseInMethod(scintilla.Ease.Type.CUT, 3);
        this.transition.out();

        if (this.goToScene === 'title')
        this.audio.playPersistent('titleMusic', 0.3, true);
    };

    this.update = function (dt) {
        if (!this.done) {
            this.waitLogoTime += dt / 2.5;

            if (this.waitLogoTime >= 1) {
                this.transition.settings.setInDuration(1);
                this.done = true;
            }
        } else {

            /*this.transition.in();

            var next = function () {
                this.scene.set(this.goToScene);
            };*/
            this.scene.set(this.goToScene);
            //this.events.subscribeOnce('transition_end', next, this);
        }
    };

    this.gui = function (drawer) {
        drawer.sprite('antifaJamLogo', 320 / 2, 240 / 2, 0.5, 0.5);
    };
};function SceneTitle() {

    this.blinkStartTime = 0;
    this.blinkStart = false;
    var neoRotX = 0;
    var neoRotY = 0;
    var angt = 0;
    var rot = 0;
    var bugPosX = 62 + 114.5;
    var bugPosY = 57 + 24.5
    var it = 1;
    var optionsMenu = false;
    var optionsSelect = 0;
    var startGame = 0;
    var bgm = null;

    this.start = function () {
        this.transition.out();
    };

    this.update = function (dt) {

        if (startGame === 0) {

            var confirmKey = this.key.pressed(scintilla.KeyCode.Enter) || this.key.pressed(scintilla.KeyCode.Space);

            if (!optionsMenu) {
                this.blinkStartTime += dt;

                if (this.blinkStartTime >= 0.5) {
                    this.blinkStart = !this.blinkStart;
                    this.blinkStartTime = 0;
                }
                if (confirmKey) {
                    optionsMenu = true;
                    this.audio.playOnce('ok', 0.5);
                }
            } else {

                var arrowKey = this.key.pressed(scintilla.KeyCode.Up) || this.key.pressed(scintilla.KeyCode.Down);

                if (arrowKey) {
                    this.audio.playOnce('ok', 0.5);
                    optionsSelect = !optionsSelect;
                }

                if (confirmKey) {
                    this.transition.in();
                    this.audio.playOnce('ok', 0.5);
                    this.blinkStartTime = 0;
                    bgm = this.audio.at(0);
                    this.events.subscribeOnce('transition_end', function () {
                        startGame = 2;
                    });
                    startGame = 1;
                }
            }

        } else {

            if (startGame === 2) {

                this.blinkStartTime += dt;

                var tVolume = this.blinkStartTime / 1.5;

                if (tVolume >= 1)
                    tVolume = 1;

                bgm.volume = scintilla.Math.lerp(0.3, 0, tVolume);

                if (this.blinkStartTime >= 2) {
                    this.audio.stopAll(true);
                    this.scene.set('game');
                }
            }
        }

        angt += (dt / 6.0);

        if (angt >= 1) {
            angt = 0;
        }
        rot = scintilla.Math.toRadian * (angt * 360);

        neoRotX = Math.cos(rot);
        neoRotY = Math.sin(rot);
    };

    this.gui = function (drawer) {

        drawer.defaultComposite();

        drawer.sprite('titleChroma', bugPosX, bugPosY, 0.5, 0.5);
        //drawer.spriteSkew('titleChroma', bugPosX, bugPosY, -neoRotX * 0.0025, neoRotY * 0.0025, 0.5, 0.5);
        drawer.composite = 'destination-in';
        drawer.spriteSkew('titleBugre', bugPosX, bugPosY, neoRotX * 0.05, -neoRotY * 0.05, 0.5, 0.5);
        drawer.composite = 'destination-over';

        var itX, itY;
        var tanY = Math.atan(neoRotY) * 0.05;
        var tanX = Math.atan(neoRotX) * 0.05;

        for (; it < 4; it++) {
            itX = it * 80; //64; // 4, 8
            itY = it * 64; //64;
            drawer.alpha = scintilla.Math.lerp(1, 0.0, ((it - 1) / 3));
            drawer.spriteSkew('titleBugreBack',
                bugPosX + (itX * tanX),
                bugPosY + (itY * tanY),
                neoRotX * 0.05, -neoRotY * 0.05, 0.5, 0.5);
        }

        drawer.alpha = 1;
        it = 1;

        drawer.sprite('titleBg', 0, 0);

        drawer.defaultComposite();

        drawer.spriteSkew('titleBorder', bugPosX + neoRotX, bugPosY + neoRotY, neoRotX * 0.05, -neoRotY * 0.05, 0.5, 0.5);
        drawer.sprite('titleNeo', 14 + (neoRotX * 4), 12 + (4 - neoRotY * 3));


        drawer.font('Press Start 2P', 8);
        drawer.color = '#fff';

        if (!optionsMenu) {
            drawer.align = 'center';
            if (this.blinkStart) {
                drawer.text('PRESS START', 160, 164);
            }
            drawer.align = 'left';
        } else {
            drawer.align = 'center';
            drawer.text('FAIR EXCHANGE?', 160, 148);
            drawer.align = 'left';
            //var unicode = eval('"\\u' + 2192 + '"'); //String.fromCharCode("8594");
            drawer.text(">", 148 - 16, 148 + 16 + (optionsSelect * 12));
            drawer.text('YES', 148, 148 + 16);
            drawer.text('NO', 148, 148 + 16 + 12);
        }

        drawer.text('TOBIASBU', 8, 232);
        drawer.text('MUSIC BY 505', 8, 232 - 10);
        drawer.align = 'right';
        drawer.text('2018', 320 - 8, 232);
    };
};function InitializeFascistMode() {

}

function RandomizeFolksParameters(folks) {

    var badCount = 0;

    for (var i = 0; i < folks.length; i++) {

        var folk = folks[i];

        if (scintilla.Random.integerRange(0,100) < 30 && badCount < 2) {
            folk.spd = 25;
            badCount++;
        } else {
            folk.spd = 50;
           
        }
        folk.spdDuration = 16 / folk.spd;
        folk.animMachine.machine.duration = folk.spdDuration / 2 * 1000;
    }
}

function InstantiateFolks(scene, tilemap) {

    // Folks
    var objlayer = tilemap.getObjectsLayer('FolkSpawn');
    var objs = objlayer.objects;
    var size = objs.length;

    var alreadySpawned = [];
    var folk;
    var folks = [];
    for (var i = 0; i < MAX_FOLKS; i++) {

        folk = scene.entity.create(Folk);
        folk.animMachine.machine = 'folk_' + i.toString();

        var objPos;

        while (true) {
            var allEqual = false;
            var rng = scintilla.Random.integerRange(0, size);

            if (alreadySpawned.length !== 0) {
                for (var j = 0; j < alreadySpawned.length; j++) {
                    if (alreadySpawned[j] === rng) {
                        allEqual = true;
                        break;
                    }
                }
            }

            if (allEqual === false) {
                objPos = objs[rng];
                alreadySpawned.push(rng);
                break;
            }

        }

        folk.Setup(objPos.x, objPos.y, i);
        folks.push(folk);
    }

    RandomizeFolksParameters(folks);
    
    Environment.folks = folks;

};function SceneGame() {

    var camSpeed = 100;
    var player;
    var tilemap;

    var peacefulTime = 0;

    // fascist stuff
    var blinkDollarTime = 0;
    var blinkTrigger = false;
    var currentSymbol = 0;
    var fromSymbol = 0;
    var toSymbol = 0;
    var symbolTime = 0;
    var tribeArea = null;
    var onTribeArea = 0;



    this.start = function () {
        this.transition.out();
        this.audio.play('gameMusic', 0.3, true);

        // pool
        this.pool.create("bullet", Bullet, 10);
        this.pool.create("bullet_efx", ShootEffect, 10);
        this.pool.create('explosion', BulletExplosion, 10);

        // tilemap
        var map = this.create.tilemap('tilemap');
        tilemap = map.modules.get('render');
        Environment.map = tilemap;
        Environment.largeTribeArea = tilemap.getObjectsLayer('FolkTribe').objects[0];
        Environment.tribeArea = tilemap.getObjectsLayer('FolkTribe').objects[1];
        Environment.safePoints = tilemap.getObjectsLayer('SafePoints').objects;

        PathFinder.map = tilemap;
        PathFinder.collisionPredicate = PathFindCollisionTest;

        // Player
        player = this.entity.create(Player);
        Environment.player = player;

        InstantiateFolks(this, tilemap);


    };

    this.update = function (dt) {
        CameraFollowPlayer(this.camera, player);


        this.naziUpdate(dt);

    };

    this.naziUpdate = function (dt) {

        if (AntifaControl.killedFirstFolk === true) {

            blinkDollarTime += dt;
            symbolTime += dt / 0.25;

            if (symbolTime > 1.0) {
                symbolTime = 1.0;
            }

            if (blinkDollarTime >= 0.2) {
                blinkDollarTime = 0;
                blinkTrigger = !blinkTrigger;


                if (AntifaControl.naziCount > currentSymbol) {
                    fromSymbol = currentSymbol;
                    toSymbol = AntifaControl.naziCount;
                    symbolTime = 0;
                }

            }

            currentSymbol = scintilla.Math.lerp(fromSymbol, toSymbol, symbolTime);
        } else {
            if (onTribeArea === 0) {
                if (Environment.largeTribeArea.intersects(player.x, player.y, 8, 8)) {
                    onTribeArea = 1;
                    player.reachTheTribe = true;
                }
            } else if (onTribeArea >= 1 && AntifaControl.peace === true) {

                if (onTribeArea == 1) {
                    if (Environment.tribeArea.intersects(player.x, player.y, 8, 8)) {
                        onTribeArea = 2;
                    }
                } else {
                    peacefulTime += dt;

                    if (peacefulTime >= 30) {
                        Environment.endGame = 1;
                    }
                }
            }
        }
    }

    this.naziUI = function (drawer) {

        if (currentSymbol > 0) {

            var fy = 0;
            var j;

            for (var i = 0; i < currentSymbol * 4; i++) { // 64

                j = i % 2;

                fy = (blinkTrigger - j === 0) ? 0 : 1;

                drawer.spritePart('chars', 2 + (10 * i), 5 - fy, 128, 176 + (fy * 8), 8, 8);
            }
        }

    };

    this.gui = function (drawer) {
        drawer.color = '#000';
        drawer.rect(0, 0, 320, 16);

        this.naziUI(drawer);
        //draw.font('Press Start 2P', 7, 'normal');
        //drawer.text('SCORE: 999', 8, 12, 'white', 'left');

    };
};/// PLAYER


function Player() {

    var anim;
    var spd = 50;
    this.state = 0;
    this.tile = {x:0, y:0};
    this.toTile = {x:0,y:0};
    this.oldTile = {x:0, y:0};

    var isMoving = false;
    var isShooting = false;
    var moveTimer = 0;
    var hspd = 0;
    var vspd = 0;
    var spdDuration = (16 / spd);
    var old = {
        x: 9,
        y: 7
    };
    var destination = {
        x: 0,
        y: 0
    };
    this.dir = 3;
    this.reachTheTribe = false;

    this.start = function () {
        anim = this.modules.attach.animMachine('bugreiro');
        anim.onAnimationEnd = this.animationEnd;
        this.modules.get('render').depth = 5;
        //anim.setDuration((dur / 2) * 1000);
        this.origin.set(0.5, 0.5);
        this.tile.x = 10;//25;
        this.tile.y = 7;//7;
        SetToTile(this, this.tile.x, this.tile.y); // 9, 7
        
        anim.stop();
    };
    

    this.ChangeState = function (newState, direction) {

        if (direction === undefined) direction = this.dir;

        this.dir = direction;

        var stateName = "bug_";
        var dirName = "";

        switch (direction) {
            case 0:
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

        if (newState === 2) {
            stateName += "shoot_";
        }
        stateName += dirName;

        anim.setState(stateName);


        if (this.state !== newState) {

            this.state = newState;
        }

        if (anim.isPlaying === false) {
            anim.play();
        }

    };

    this.ActiveMoving = function (flip) {
        this.scale.x = flip;
        isMoving = true;
        moveTimer = 0;
        old.x = this.x;
        old.y = this.y;
    };




    this.animationEnd = function () {
        if (isShooting) {
            isShooting = false;
            this.waitToChangeState = 250;//200;
        }
    };

    this.scheduleShoot = false;
    this.timeToCreateBullet = 0;
    this.bulletCreated = false;
    this.waitToChangeState = 0;

    this.Shoot = function () {
        this.ChangeState(2);
        isShooting = true;
        this.timeToCreateBullet = 0;
        this.bulletCreated = false;
        var exp = this.scene.pool.pull('bullet_efx');
        this.scene.audio.playOnce('shoot');
        exp.setup(this.position, this.dir);

    }

    this.update = function (dt) {

        if (isShooting === false && Environment.endGame === 0) {

            var shoot = this.scene.key.pressed(scintilla.KeyCode.Space);
            var horizontal = -this.scene.key.press(scintilla.KeyCode.Left) + this.scene.key.press(scintilla.KeyCode.Right);
            var vertical = -this.scene.key.press(scintilla.KeyCode.Up) + this.scene.key.press(scintilla.KeyCode.Down);

            if (shoot) {

                if (isMoving) {
                    this.scheduleShoot = true;
                } else {
                    this.Shoot();
                }
            }
            if (isMoving === false) {

                if (isShooting === false) {
                    if (horizontal !== 0) {
                        hspd = horizontal; // * spd;
                        vspd = 0;
                        this.ChangeState(1, (horizontal === -1) ? 0 : 1);
                        this.ActiveMoving(-horizontal);
                    } else if (vertical !== 0) {
                        vspd = vertical; // * spd;
                        hspd = 0;

                        this.ChangeState(1, (vertical == -1) ? 2 : 3);
                        this.ActiveMoving(1);
                    } else {
                        anim.stop();
                        isMoving = false;
                    }

                    if (isMoving) {
                        destination.x = Math.round(this.x + 16 * hspd);
                        destination.y = Math.round(this.y + 16 * vspd);
                        this.oldTile.x = this.tile.x;
                        this.oldTile.y = this.tile.y;
                        
                        WorldToTile(destination.x - 8, destination.y - 8,  this.toTile);
                        if (CheckMapCollision(this.toTile.x, this.toTile.y) || CollidesWithFolk(this.toTile.x, this.toTile.y, true)) {
                            anim.stop();
                            isMoving = false;
                            this.toTile.x = -99;
                            this.toTile.y = -99;
                        } 

                    } else if (isShooting === false && this.waitToChangeState > 0) {

                        this.waitToChangeState -= dt * 1000;

                        if (this.waitToChangeState <= 0) {
                            this.ChangeState(1);
                            this.waitToChangeState = 0;
                        }
                    }
                } 
            } 
 

        }

        if (isMoving) {
            moveTimer += dt / spdDuration;
            if (moveTimer >= 1) {

                isMoving = false;
                moveTimer = 1;

                if (this.scheduleShoot == true) {
                    this.Shoot();
                    this.scheduleShoot = false;
                    
                }

            }

            if (hspd !== 0)
                this.x = scintilla.Math.lerp(old.x, destination.x, moveTimer);

            if (vspd !== 0)
                this.y = scintilla.Math.lerp(old.y, destination.y, moveTimer);
            
            WorldToTile(this.x - 8, this.y - 8, this.tile);
            
            if (!isMoving) {
                this.x = destination.x;
                this.y = destination.y;
                RoundToTile(this);
                WorldToTile(this.x - 8, this.y - 8, this.tile);
                this.oldTile.x = this.tile.x;
                this.oldTile.y = this.tile.y;
            }
        }

        if (isShooting === true && this.bulletCreated === false && Environment.endGame === 0) {
            this.timeToCreateBullet += dt * 1000;

            if (this.timeToCreateBullet >= 120) {

                /*if (this.reachTheTribe === true) {
                    AntifaControl.firstShoot = true;
                }*/

                var bullet = this.scene.pool.pull('bullet');
                bullet.setup(this.position, this.dir);
                this.bulletCreated = true;

            }


        }

    }
};var VIEW = {
    w: 640,
    h: 480,
};

var config = {
    width: VIEW.w,
    height: VIEW.h,
    camera: {
        width: 320,
        height: 240
    },
    parent: "canvas-container",
    debug: false,
    fps: 60,
    pixelated: true,
    roundPixels: false,
    floorTiles: true
};

var game = new scintilla.Game(config);
game.render.layer.add('game');


game.scene.add('logo', SceneLogo);
game.scene.add('title', SceneTitle);
game.scene.add('game', SceneGame);
game.scene.set('logo');