/*! neo-bugreiro - v1.0.0 - */

var MAX_FOLKS = 8;
var MAP_MAX = 120 * 16;
var LONG_MAP_MAX = 200 * 16;
/// UI
var SYMBOL_START_ANGLE = Math.PI - (Math.PI / 2);
var SYMBOL_RADIUS = 84;
/// BUGREIRO
var MAX_BULLETS = 3;
var SHOOT_PERIOD = 160;
var SHOOT_TIMER = 120;
var TRACE_LENGTH = 11;
/// FOLK PLAYER
var FPLAYER_TILE_START = 32;
var FPLAYER_TILE_END = 173;
var FPLAYER_TILE_MAX = FPLAYER_TILE_END - FPLAYER_TILE_START;
// 20 tiles is size of screen
//var FPLAYER_SYMBOL_SET = 7;//FPLAYER_TILE_MAX / (20 - 7);
/// BULLET
var BULLET_SPD = 100;
/// FOLK FUNCTIONS
var AVOIDANCE_LEVEL = 40;
var FOLK_MAX_PATH_FINDING_STEPS = 15;
var DURATION_BETWEEN_AI = 0.24;
var DURATION_BETWEEN_PEACE_WALK = 0.8;


var AntifaController = function () {
    this.deadFolkPlaces = [];
    this.fascistMode = false;
    this.naziCount = 0;
    this.antifaCount = 0;
    this.activeSymbolBar = false;
    this.peace = true;

    this.reset = function() {
        this.deadFolkPlaces.length = 0;
        this.naziChoices = 0;
        this.naziCount = 0;
        this.antifaCount = 0;
        this.activeSymbolBar = false;
        this.peace = true;
    };
};

var GameEnvironment = function() {
    this.map = null;
    this.mapColliderLayer = null;
    this.mapColliderUpperLayer = null;

    this.folks = [];
    this.bullets = [];
    this.player = null;
    this.ai = null;

    this.endGame = -1;
    this.tribeArea = null;
    this.largeTribeArea = null;
    this.safePoints = null;
    this.blockingPaths = null;
    this.reachCity = false;

    this.removeFolk = function(folkToKill){
        var index = this.folks.indexOf(folkToKill);
        this.folks.splice(index, 1);
    };

    this.reset = function() {
        this.map = null;
        this.mapColliderLayer = null;
        this.mapColliderUpperLayer = null;

        this.player = null;
        this.endGame = -1;
        this.bullets.length = 0;
        this.folks.length = 0;

        this.reachCity = false;
        this.tribeArea = null;
        this.largeTribeArea = null;
        this.ai = null;
        this.blockingPaths = null;
    };

    this.playerReachedToCity = function() {
        this.reachCity = true;
        if (this.bullets.length !== 0) {
            var bullet;
            for (var i = 0; i < this.bullets.length; i++) {
                bullet = this.bullets[i];
                bullet.Explode(undefined, false);
            }
            this.bullets.length = 0;
        }
    };
};

var dollarSymbolFrame = {
    x: 128,
    y: 64
};

var quadSymbolFrame = {
    x: 112,
    y: 32,
};

var flagSymbolFrame = {
    x: 96,
    y: 48,
};

var bloodFrame = {
    x: 48,
    y: 0,
    width: 16,
    height: 16
};

var folkLimit = {
    xMin: 26,
    xMax: 35
};


var Environment = new GameEnvironment();

var AntifaControl = new AntifaController();;var Heuristic = {

    ISQRT: Math.SQRT2 - 1,

    manhattan: function (from_x, from_y, to_x, to_y) {
        return (Math.abs(to_x - from_x) + Math.abs(to_y - from_y)) * 10;

    },
    euclidean: function (source, target) {
        var dx = target.x - source.x;
        var dy = target.y - source.y;
        return Math.sqrt(dx * dx + dy * dy);
    },
    octagonal: function (dx, dy) {
        return (dx < dy) ? this.ISQRT * dx + dy : this.ISQRT * dy + dx;
    },

    chebyshev: function (source, target) {
        var dx = Math.abs(target.x - source.x);
        var dy = Math.abs(target.y - source.y);
        return Math.max(dx, dy);
    }
};

var PathMovementCost = [
    14, 10, 14,
    10, 0, 10,
    14, 10, 14
];

var PathDirections = [{
        x: 1,
        y: 0
    },
    {
        x: -1,
        y: 0
    },
    {
        x: 0,
        y: 1
    },
    {
        x: 0,
        y: -1
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

var PathNode = function (x, y, parent) {

    this.score = function () {
        return this.G + this.H;
    };

    this.update = function (cost) {
        if (cost === undefined) cost = this.G;
        this.G = cost;
        this.F = this.G + this.H;
    };

    this.setParent = function (parent) {

        if (parent !== null && parent !== undefined) {
            this.depth = parent.depth + 1;
        }
        this.parent = parent;
        return this.depth;
    };


    this.x = x || 0;
    this.y = y || 0;
    this.depth = 0;
    this.parent = parent || null;
    this.setParent(this.parent);


    //this.direction = null;
    // the movement cost from the start point A
    // (cost from A to square):
    this.G = 0;
    // is the estimated movement cost from the current square to the destination point 
    // (estimated cost from square to B):
    this.H = 0;
    // (score for square):
    this.F = 0;



};

var PathFinding = function (moveDirections, map, poolSize, collisionPredicate) {

    var closedNodes = new scintilla.Structure.Set();
    var openNodes = new scintilla.Structure.Set();
    var poolNodes = new scintilla.Structure.List(undefined, false);

    if (poolSize === undefined) pooSize = 300;

    for (var i = 0; i < poolSize; i++) {
        poolNodes.push(new PathNode(null, null, null));
    }

    this.map = map;
    this.movementDirections = 4; //moveDirections || 4;
    this.collisionPredicate = collisionPredicate || null;

    this.PullNodePooling = function (x, y, parent) {
        var node;
        if (poolNodes.length > 0) {
            node = poolNodes.pop();
        } else {
            node = new PathNode();
        }
        node.x = x;
        node.y = y;
        node.setParent(parent);
        node.depth = 0;
        return node;

    };

    this.ResetNodes = function () {
        //openNodes.clear();
        //pathFinder.closedNodes.clear();
        closedNodes.each(function (a) {
            a.parent = null;
            a.depth = 0;
            poolNodes.push(a);
        });
        openNodes.each(function (a) {
            a.parent = null;
            a.depth = 0;
            poolNodes.push(a);
        });
        openNodes.clear();
        closedNodes.clear();

    };

    BuildPath = function (chain) {
        var finalNodes = []; //new scintilla.Structure.List();

        while (chain !== null) {
            finalNodes.push({
                x: chain.x,
                y: chain.y
            });
            chain = chain.parent;
        }

        finalNodes.reverse();

        return finalNodes;
    };

    FindNode = function (list, x, y) {

        var content = list.content();
        var len = content.length;

        for (var j = 0; j < len; j++) {

            if (content[j].x === x &&
                content[j].y === y) {
                return content[j];
            }

        }

        return null;
    };

    RemoveNode = function (list, x, y) {
        var content = list.content();
        var len = content.length;

        for (var j = 0; j < len; j++) {

            //if (content[j].id === id) {
            if (content[j].x === x &&
                content[j].y === y
            ) {
                content.splice(j, 1);
                return;
            }

        }
    };

    FindBestNode = function (list) {

        var content = list.content();
        var len = content.length;

        if (len === 0)
            return null;

        var node = content[0];

        for (var j = 1; j < len; j++) {

            if (content[j].F <= node.F) {
                node = content[j];
            }

        }

        return node;
    };

    this.FindPath = function (start, target, maxSearchDepth, collisionPredicate, object) {

        if (collisionPredicate === undefined) collisionPredicate = this.collisionPredicate;

        if (collisionPredicate === undefined || collisionPredicate === null) {
            console.warn("Error: Could not find path.");
            return null;
        }

        this.ResetNodes();

        if (maxSearchDepth !== undefined) {
            if (maxSearchDepth < 0) maxSearchDepth = undefined;
        }

        var stepCost, i, sx, sy;
        var nodePlaceHolder, nodeToFind;
        var chain = null;
        var depth = 0;

        openNodes.insert(this.PullNodePooling(start.x, start.y, null));


        while (openNodes.length !== 0) {

            chain = FindBestNode(openNodes);

            if (chain === null) {
                return null;
            }

            if (chain.x === target.x && chain.y === target.y) {
                return BuildPath(chain);
            } else if (maxSearchDepth !== undefined) {
                if (depth >= maxSearchDepth) {
                    return BuildPath(chain);
                }
            }

            openNodes.erase(chain);
            closedNodes.insert(chain);

            for (i = 0; i < this.movementDirections; i++) {
                sx = chain.x + PathDirections[i].x;
                sy = chain.y + PathDirections[i].y;

                stepCost = chain.G + ((i < 4) ? 10 : 14);

                if (sx < 0 || sx >= this.map.width ||
                    sy < 0 || sy >= this.map.height) {
                    continue;
                }
                nodePlaceHolder = FindNode(closedNodes, sx, sy);

                if (nodePlaceHolder !== null)
                    continue;

                if (!collisionPredicate(sx, sy, object)) {
                    nodeToFind = FindNode(openNodes, sx, sy);


                    if (!nodeToFind) {
                        //nodeToFind = new PathNode(sx, sy, chain);
                        nodeToFind = this.PullNodePooling(sx, sy, chain);

                        //nodeToFind.H = Heuristic.chebyshev(sx, sy, target.x, target.y)
                        nodeToFind.G = stepCost;
                        nodeToFind.H = Heuristic.manhattan(sx, sy, target.x, target.y);
                        nodeToFind.update(stepCost);
                        openNodes.insert(nodeToFind);
                        depth = Math.max(depth, nodeToFind.depth);


                        //nodeToFind.setParent(chain);


                    } else if (stepCost < nodeToFind.G) {
                        nodeToFind.parent = chain;
                        nodeToFind.update(stepCost);
                    }
                }
            }
        }

        return null;

    };
};

var PathFinder = new PathFinding(4);;function SetToTile(entity, tileX, tileY) {
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

   
};function TileIsColliadable(tile) {

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

};function CameraFollowBugreiro(camera, player) {

    var camX = player.x - 144;
    if (camX <= 0) {
        camX = 0;
    } else if (camX >= (MAP_MAX - 176 - 144)) { /// 320 - 144 = 176
        camX = MAP_MAX - 176 - 144;
    }
    camera.x = camX;
}


function OnBugreiroAnimationEnd() {
    if (this.isShooting || this.isAttacking) {
        this.isShooting = false;
        this.isAttacking = false;
        this.waitToChangeState = SHOOT_PERIOD; //200;
    }

    if (Environment.endGame !== 0) {
        ChangeBugreiroState(this, 0);
        this.animMachine.stop();
    }
}

function ChangeBugreiroState(bug, newState, direction) {

    if (direction === undefined) direction = bug.dir;

    var stateName = "bug_";
    var dirName = "";
    var flip = 1;

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

    bug.dir = direction;

    if (direction === 0) {
        flip = -1;
    }

    //if (bug.scale.x !== flip)
    bug.scale.x = flip;

    if (newState === 2) {
        stateName += "shoot_";
    } else if (newState === 3) {
        stateName += "blade_";
    }
    stateName += dirName;

    bug.animMachine.setState(stateName);


    if (bug.state !== newState) {

        bug.state = newState;
    }

    if (bug.animMachine.isPlaying === false) {
        bug.animMachine.play();
    }

};

function ActiveBugreiroMoving(bug) {
    bug.isMoving = true;
    bug.moveTimer = 0;
    bug.oldPos.x = bug.x;
    bug.oldPos.y = bug.y;
}

function BugreiroShoot(bug, dir) {
    bug.isMoving = false;
    bug.moveTimer = 0;
    ChangeBugreiroState(bug, 2, dir);
    bug.isShooting = true;
    bug.timeToCreateBullet = 0;
    bug.bulletCreated = false;
    var exp = bug.scene.pool.pull('bullet_efx');
    if (Environment.endGame === 0) {
        bug.scene.audio.playOnce('shoot');
    }
    exp.setup(bug.position, bug.dir);
}

function BugreiroAttack(bug, folkToKill, dir) {
    bug.isMoving = false;
    bug.moveTimer = 0;
    ChangeBugreiroState(bug, 3, dir);
    bug.isAttacking = true;
    KillFolk(folkToKill, bug.scene);
}

function IsNearAndOnDirectionToFolk(x, y, direction, radius) {

    var i = 0;
    var inXRadius = false;
    var inYRadius = false;
    var inXOldRadius, inYOldRadius;

    var folk = GetNearestFolkByTile(x, y);

    if (folk === null)
        return null;

    inXRadius = x - folk.tile.x;
    inYRadius = y - folk.tile.y;
    inXOldRadius = Math.abs(x - folk.oldTile.x);
    inYOldRadius = Math.abs(y - folk.oldTile.y);

    switch (direction) {
        case 0:
            {

                if ((inXRadius === 1 || inXOldRadius === 1 || x === folk.tile.x) && inYRadius === 0) {
                    return folk;
                }

                break;
            }
        case 1:
            {

                if ((inXRadius === -1 || inXOldRadius === 1 || x === folk.tile.x) && inYRadius === 0) {
                    return folk;
                }
                break;
            }
        case 2:
            {

                if ((inYRadius === 1 || inYOldRadius === 1 || y === folk.tile.y) && inXRadius === 0) {
                    return folk;
                }
                break;
            }
        case 3:
            {

                if ((inYRadius === -1 || inYOldRadius === 1 || y === folk.tile.y) && inXRadius === 0) {
                    return folk;
                }
                break;
            }
    }


    return null;
}

function BugreiroAICollisionTest(x, y, obj) {

    /*var id;
    if (obj !== undefined) {
        if (target !== null) {
            id = obj.target.id;
        }
    }*/

    return CheckMapCollision(x, y);
    //CollidesWithFolk(x, y, true, id) ||
    //CollideWithPlayer(x, y);
}

function BugreiroTileMovementThroughPathNode(node, entity, dt, moveDuration) {

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

    WorldToTile(entity.x - 8, entity.y - 8, entity.tile);

    if (entity.moveTimer >= 0.5) {
        entity.oldTile.x = entity.tile.x;
        entity.oldTile.y = entity.tile.y;
    }

    if (entity.isMoving === false) {

        entity.x = entity.destPos.x;
        entity.y = entity.destPos.y;

        RoundToTile(entity);
        entity.navigation++;
        WorldToTile(entity.x - 8, entity.y - 8, entity.tile);


        var canShoot = null;

        if (Environment.reachCity === false) {
            canShoot = BugreiroCanShoot(entity, entity.target);

            if (canShoot === null) {
                var anotherTarget = GetNearestFolkByTile(entity.tile.x, entity.tile.y);
                if (anotherTarget !== null) {
                    canShoot = BugreiroCanShoot(entity, anotherTarget);
                }
            }
        }

        if (canShoot === null) {

            var len = node.length;
            var inRadius = true;

            if (entity.target !== null) {
                inRadius = scintilla.Math.inManhattanRadius(entity.targetTile.x, entity.targetTile.y, entity.target.tile.x, entity.target.tile.y, 4);
            }

            if (inRadius) {

                if (entity.navigation < len) {

                    var current = node[entity.navigation];

                    var continuePath = BugreiroAICollisionTest(current.x, current.y);
                    if (entity.target !== null) {
                        continuePath = continuePath || entity.target.dead === true;
                    }

                    if (!continuePath) {
                        if (Environment.reachCity === false) {
                            var dir = ActivePathNodeMovement(entity, current);
                            ChangeBugreiroState(entity, 1, dir);
                            return;
                        }
                    }
                } 
            }
                
        } else {

            BugreiroAIScheduleAttack(entity, canShoot);
            return;
        }

        // moving end
        node = null;
        entity.navigation = 0;
    }
}

function InAxis(bug, target) {

    if (bug.tile.x === target.tile.x) {
        return 1;
    } else if (bug.tile.y === target.tile.y) {
        return 2;
    } else {
        if (bug.tile.x === target.toTile.x) {
            return 1;
        } else if (bug.tile.y === target.toTile.y) {
            return 2;
        }
    }

    return 0;

}

function IsNear(bug, target) {
    if (target === null)
        return false;

    var xRadius, yRadius;

    xRadius = bug.tile.x - target.tile.x;
    yRadius = bug.tile.y - target.tile.y;

    if (yRadius === 0) {
        if (xRadius === 1) {
            return 1;
        } else if (xRadius === -1) {
            return 0;
        }
    } else if (xRadius === 0) {
        if (yRadius === 1) {
            return 2;
        } else if (yRadius === -1) {
            return 3;
        }
    }

    return null;
}

function BugreiroCanShoot(bug, target) {

    if (target === null)
        return null;

    if (target.dead)
        return null;

    var axis = InAxis(bug, target);

    if (axis !== 0) {

        var isNearDir = IsNear(bug, target);

        if (isNearDir !== null) {
            return {
                shoot: false,
                axis: axis,
                dir: isNearDir,
                target: target
            };
        } else {


            var mvx = 0;
            var mvy = 0;

            if (axis === 2) {
                if (bug.tile.x > target.tile.x) {
                    mvx = -1;
                } else if (bug.tile.x < target.tile.x) {
                    mvx = 1;
                }
            }

            if (mvx === 0) {
                if (bug.tile.y > target.tile.y) {
                    mvy = -1;
                } else if (bug.tile.y < target.tile.y) {
                    mvy = 1;
                }
            }

            if (scintilla.Math.inManhattanRadius(bug.tile.x, bug.tile.y, target.tile.x, target.tile.y, TRACE_LENGTH)) {
                if (TraceToTarget(bug.tile, target, mvx, mvy, TRACE_LENGTH)) {
                    return {
                        shoot: true,
                        axis: axis,
                        v: mvy,
                        h: mvx,
                        target: target
                    };
                }
            }


        }

    }

    return null;
}

function BugreiroAIScheduleAttack(bug, canShoot) {

    if (canShoot.shoot) {
        if (Environment.bullets.length < MAX_BULLETS) {
            bug.chainNode = null;
            bug.navigation = 0;

            var dir;

            if (canShoot.v !== 0) {
                dir = (canShoot.v === -1) ? 2 : 3;
            }

            if (canShoot.h !== 0) {
                dir = (canShoot.h === 1) ? 0 : 1;
            }


            BugreiroShoot(bug, dir);
        } else {
            bug.isMoving = false;
            bug.moveTimer = 0;
            bug.animMachine.stop();
        }
    } else {
        if (canShoot.target.dead === false) {
            BugreiroAttack(bug, canShoot.target, canShoot.dir);
        } else {
            bug.isMoving = false;
            bug.moveTimer = 0;
            bug.animMachine.stop();
        }
    }

};function Bugreiro() {

    var spd = 50;
    this.state = 0;
    this.tile = {
        x: 0,
        y: 0
    };
    this.toTile = {
        x: 0,
        y: 0
    };
    this.oldTile = {
        x: 0,
        y: 0
    };

    this.isMoving = false;
    this.isShooting = false;
    this.isAttacking = false;
    this.moveTimer = 0;
    var hspd = 0;
    var vspd = 0;
    var spdDuration = (16 / spd);
    this.oldPos = {
        x: 9,
        y: 7
    };
    this.destPos = {
        x: 0,
        y: 0
    };
    this.dir = 3;
    this.reachTheTribe = false;
    this.animMachine = null;
    this.scheduleShoot = false;
    this.timeToCreateBullet = 0;
    this.bulletCreated = false;
    this.waitToChangeState = 0;

    this.start = function () {
        this.animMachine = this.modules.attach.animMachine('bugreiro');
        this.animMachine.onAnimationEnd = OnBugreiroAnimationEnd;
        this.modules.get('render').depth = 5;
        //this.animMachine.setDuration((dur / 2) * 1000);
        this.origin.set(0.5, 0.5);
        this.tile.x = 9;
        this.tile.y = 7;
        SetToTile(this, this.tile.x, this.tile.y); // 9, 7

        this.animMachine.stop();
    };


    this.update = function (dt) {

        if (Environment.endGame === 0) {
            if (this.isAttacking === false && this.isShooting === false) {

                var shoot = this.scene.key.pressed(scintilla.KeyCode.Space);
                var horizontal = -this.scene.key.press(scintilla.KeyCode.Left) + this.scene.key.press(scintilla.KeyCode.Right);
                var vertical = -this.scene.key.press(scintilla.KeyCode.Up) + this.scene.key.press(scintilla.KeyCode.Down);

                if (shoot) {

                    var nearFolk = IsNearAndOnDirectionToFolk(this.tile.x, this.tile.y, this.dir, 1);

                    if (nearFolk) {
                        BugreiroAttack(this, nearFolk);
                    } else {
                        if (Environment.bullets.length < MAX_BULLETS) {
                            if (this.isMoving) {
                                this.scheduleShoot = true;
                            } else {
                                BugreiroShoot(this);
                            }
                        }
                    }
                }
                if (this.isMoving === false) {

                    if (this.isShooting === false && this.isAttacking === false) {
                        if (horizontal !== 0) {
                            hspd = horizontal; // * spd;
                            vspd = 0;
                            ChangeBugreiroState(this, 1, (horizontal === 1) ? 0 : 1);
                            ActiveBugreiroMoving(this);
                        } else if (vertical !== 0) {
                            vspd = vertical; // * spd;
                            hspd = 0;

                            ChangeBugreiroState(this, 1, (vertical === -1) ? 2 : 3);
                            ActiveBugreiroMoving(this);
                        } else {
                            this.animMachine.stop();
                            this.isMoving = false;
                        }

                        if (this.isMoving) {
                            this.destPos.x = Math.round(this.x + 16 * hspd);
                            this.destPos.y = Math.round(this.y + 16 * vspd);
                            this.oldTile.x = this.tile.x;
                            this.oldTile.y = this.tile.y;

                            WorldToTile(this.destPos.x - 8, this.destPos.y - 8, this.toTile);
                            if (CheckExtrapolatedMapCollision(this.toTile.x, this.toTile.y) || CollidesWithFolk(this.toTile.x, this.toTile.y, true)) {
                                this.animMachine.stop();
                                this.isMoving = false;
                                this.toTile.x = -99;
                                this.toTile.y = -99;
                            }

                        } else if (this.isShooting === false && this.waitToChangeState > 0) {

                            this.waitToChangeState -= dt * 1000;

                            if (this.waitToChangeState <= 0) {
                                ChangeBugreiroState(this, 1);
                                this.waitToChangeState = 0;
                            }
                        }
                    }
                }
            }
        }

        if (this.isMoving) {
            this.moveTimer += dt / spdDuration;
            if (this.moveTimer >= 1) {

                this.isMoving = false;
                this.moveTimer = 1;

                if (this.scheduleShoot == true) {
                    BugreiroShoot(this);
                    this.scheduleShoot = false;
                }
            }

            if (hspd !== 0)
                this.x = scintilla.Math.lerp(this.oldPos.x, this.destPos.x, this.moveTimer);

            if (vspd !== 0)
                this.y = scintilla.Math.lerp(this.oldPos.y, this.destPos.y, this.moveTimer);

            WorldToTile(this.x - 8, this.y - 8, this.tile);

            if (!this.isMoving) {
                this.x = this.destPos.x;
                this.y = this.destPos.y;
                RoundToTile(this);
                WorldToTile(this.x - 8, this.y - 8, this.tile);
                this.oldTile.x = this.tile.x;
                this.oldTile.y = this.tile.y;
            }
        }

        if (this.isShooting === true && this.bulletCreated === false && Environment.endGame === 0) {
            this.timeToCreateBullet += dt * 1000;

            if (this.timeToCreateBullet >= SHOOT_TIMER) {

                if (Environment.bullets.length < MAX_BULLETS) {
                    var bullet = this.scene.pool.pull('bullet');
                    bullet.setup(this.position, this.dir);
                    this.bulletCreated = true;
                    Environment.bullets.push(bullet);
                }

            }


        }
    
};
};function BugreiroAI() {

    this.spr = null;
    this.isMoving = false;
    this.isShooting = false;
    this.isAttacking = false;

    this.scheduleShoot = false;
    this.timeToCreateBullet = 0;
    this.bulletCreated = false;
    this.animMachine = null;

    this.pursuingPlayer = false;
    this.chainNode = null;
    this.target = null;
    this.targetTile = {
        x: 0,
        y: 0
    };
    this.speedUp = false;
    this.navigation = 0;

    this.start = function () {

        CreateTiledEntity(this, 50);
        this.animMachine = this.modules.attach.animMachine('bugreiro');
        this.animMachine.onAnimationEnd = OnBugreiroAnimationEnd;
        this.origin.set(0.5, 0.5);
        this.spr = this.modules.get('render');
        this.spr.depth = 4;
        this.animMachine.stop();

        this.tile.x = 0;
        this.tile.y = 5;
        SetToTile(this, this.tile.x, this.tile.y);

    };

    this.speedUpBug = function () {
        if (this.speedUp === false) {
            // speed up bugreiro
            this.spd = 58.5; // maybe 57, 57.5, 58, 59
            this.spdDuration = (16 / this.spd);
            this.speedUp = true;
        }
    };

    this.pursuitPlayer = function () {

        // is not on screen
        if (!this.scene.camera.isCulled(this.spr) && Environment.player.tile.x >= FPLAYER_TILE_START) {
            // move bugreiro to left screen
            var cameraTile = GetFlooredTile(this.scene.camera.x, this.scene.camera.y);
            cameraTile.x -= 2;
            var transportTile = TileTrace(cameraTile, 0, 1, 20);
            SetToRoundedTile(this, transportTile.x, transportTile.y);
            this.speedUpBug();
        }



        // hack to bugreiro go direct to the player
        KillAllFolks();
        this.pursuingPlayer = true;
        this.isMoving = false;
        this.isAttacking = false;
        this.isShooting = false;
        this.bulletCreated = false;
        this.bulletCreated = false;
    };


    this.update = function (dt) {


        if (this.isAttacking === false && this.isShooting === false) {
            if (this.isMoving === false) {


                if (Environment.reachCity === false) {
                    if (this.pursuingPlayer === false) {
                        this.target = GetNearestFolkByTile(this.tile.x, this.tile.y);
                    } else {
                        this.target = null;
                        if (this.speedUp === false && this.tile.x > 32) {
                            this.speedUpBug();
                        }
                    }

                    if (this.target === null) {
                        if (Environment.player.dead === false) {
                            if (this.pursuingPlayer === false) {
                                this.pursuitPlayer();
                            }
                            this.target = Environment.player;
                        }
                    } else {

                        // check if player reach the third flag
                        if (Environment.player.tile.x > 43) {
                            if (Environment.player.dead === false) {
                                if (this.pursuingPlayer === false) {
                                    this.pursuitPlayer();
                                }
                                this.target = Environment.player;
                            }
                        } else {

                            if (Environment.player.dead === false) {
                                // check if player is near
                                var distToPlayer = scintilla.Math.manhattan(this.tile.x, this.tile.y, Environment.player.tile.x, Environment.player.tile.y);
                                var distToFolk = scintilla.Math.manhattan(this.tile.x, this.tile.y, this.target.tile.x, this.target.tile.y);

                                if (distToPlayer.x < distToFolk.x && distToPlayer.y < distToFolk.y) {
                                    this.target = Environment.player;
                                }
                            }

                        }

                    }
                } else {
                    this.target = null;
                }

                var canShoot = null;
                if (this.target !== null) {
                    this.targetTile.x = this.target.tile.x;
                    this.targetTile.y = this.target.tile.y;
                    if (Environment.reachCity === false) {
                        canShoot = BugreiroCanShoot(this, this.target);
                    }
                } else { /// killed everyone
                    this.targetTile.x = 2;
                    this.targetTile.y = 5;
                }
                if (canShoot === null) {

                    this.chainNode = PathFinder.FindPath(this.tile, this.targetTile, undefined, BugreiroAICollisionTest, this);

                    if (this.chainNode !== null) {
                        if (this.chainNode.length > 1) {
                            this.navigation = 1;
                            var dir = ActivePathNodeMovement(this, this.chainNode[1]);
                            ChangeBugreiroState(this, 1, dir);
                        }
                    }
                } else {
                    BugreiroAIScheduleAttack(this, canShoot);
                }

            }
        }

        if (this.isMoving === true) {
            BugreiroTileMovementThroughPathNode(this.chainNode, this, dt, this.spdDuration);
        }

        // Environment.endGame === 0
        if (Environment.reachCity === false) {
            if (this.isShooting === true && this.bulletCreated === false) {

                this.timeToCreateBullet += dt * 1000;

                if (this.timeToCreateBullet >= SHOOT_TIMER) {

                    this.bulletCreated = true;
                    if (Environment.bullets.length < MAX_BULLETS) {
                        var bullet = this.scene.pool.pull('bullet');
                        bullet.setup(this.position, this.dir);

                        Environment.bullets.push(bullet);
                    } else {
                        this.isShooting = false;
                    }
                }

            }
        }

    };



};function ChangeFolkState(folk, direction) {

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

    var enemy;

    if (Environment.fascistMode === true) {
        enemy = Environment.player;
    } else {
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

};



function Folk() {


    this.animMachine = null;
    this.spr = null;
    this.tile = null;
    this.dead = false;
    this.dying = false;
    this.id = 0;
    this.tileDirection = [false, false, false, false, false];
    this.smartness = 0;
    var timeToWait = 0;
    var alertAnim = null;
    var panic = false;
    //var beingSmart = false;
    this.chainNode = null;
    var movementDur = 0.8;
    this.navigation = 0;
    //this.safePointIndex = 0;


    this.start = function () {

        CreateTiledEntity(this, 25);

        panic = false;
        movementDur = 0.8;
        alertAnim = this.scene.create.spritesheet('alert');
        alertAnim.modules.get('render').depth = 12;
        alertAnim.active = false;
        this.animMachine = this.modules.attach.animMachine();
       
        this.origin.set(0.5, 0.5);
        this.spr = this.modules.get('render');
        this.spr.depth = 2;
    };

    this.update = function (dt) {

        if (this.dying === true)
            return;

        if (AntifaControl.peace === true) {
            if (timeToWait <= 0) {
                PeacefulFolk.call(this);
            }
        } else if (panic === false) {
            panic = true;
            this.animMachine.machine.duration = (this.spdDuration / 2) * 1000;
            alertAnim.active = true;
            movementDur = this.spdDuration;
            timeToWait = 0;
        } else {
            if (timeToWait <= 0) {
                FolkRun.call(this);
            }
        }
        if (timeToWait <= 0) {
            if (this.isMoving) {
                if (this.beingSmart === false) {
                    TileMovement(this, dt, movementDur);
                } else {
                    FolkTileMovementThroughPathNode(this.chainNode, this, dt, movementDur);
                }

                if (this.isMoving === false) {
                    if (panic === false) {

                        if (scintilla.Random.irange(0, 100) > 50) {
                            timeToWait = DURATION_BETWEEN_PEACE_WALK;
                        }
                    }
                }
            }

            alertAnim.x = this.x - 8;
            alertAnim.y = this.y - 12;
        } else {
            timeToWait -= dt;
        }
    };


    this.Setup = function (x, y, id, player) {
        this.player = player;
        this.position.set(x + 8, y + 8);
        this.tile = GetTile(this.x - 8, this.y - 8);
        this.oldTile.x = this.tile.x;
        this.oldTile.y = this.tile.y;
        this.id = id;
    };

    this.Die = function () {
        this.dead = true;
        this.dying = true;

        this.animMachine.stop();
        this.scene.entity.destroy(alertAnim);
        var x = (this.id % 2) * 16;
        var y = scintilla.Math.floor(this.id / 2) * 16;
        this.spr.setFrame(64 + x, 0 + y, 16, 16);
        var blood = this.scene.create.sprite('effects', 'blood', bloodFrame);
        blood.position.set(this.x - 8, this.y - 8);
        this.spr.depth = 1;
        blood.modules.get('render').depth = 0;
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

        var scale;
        switch (direction) {
            case 0:
            case 1:
                {
                    scale = (direction === 1) ? -1 : 1;
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
                    scale = (direction === 2) ? 1 : 0;
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
;function Bullet() {

    this.vspd = 0;
    this.hspd = 1;
    this.effect = null;
    this.moduleAnim = null;
    this.t = 0;
    this.setups = false;
    var fix = {
        x: 0,
        y: 0
    };
    var spr;
    this.tile = {
        x: 0,
        y: 0
    };
    this.start = function () {
        spr = this.modules.attach.sprite('effects', 80, 0, 16, 16);
        this.origin.set(0.5, 0.5);
    };

    this.Explode = function (folkToKill, culled) {
        var exp = this.scene.pool.pull('explosion');

        exp.anim.restart();
        exp.position.set(this.x, this.y);

        if (folkToKill !== undefined && !folkToKill.dead) {
            KillFolk(folkToKill, this.scene, culled);
        } else {
            if (Environment.endGame === 0) {
                if (culled) {
                    this.scene.audio.playOnce('explosion');
                }
            }
        }

        this.removeBullet();

    };

    this.removeBullet = function () {
        var index = Environment.bullets.indexOf(this);
        if (index !== -1) {
            Environment.bullets.splice(index, 1);
        }
        this.setups = false;
        this.back();
    };

    this.update = function (dt) {

        if (this.setups === true) {
            this.x += this.hspd * BULLET_SPD * dt;
            this.y += this.vspd * BULLET_SPD * dt;

            var shouldNotDisappear = true;
            var culled = this.scene.camera.isCulled(spr);

            if (AntifaControl.fascistMode === true) {
                shouldNotDisappear = culled;

                if (AntifaControl.peace === true && Environment.player.reachTheTribe === true) {
                    if (Environment.tribeArea.intersects(this.x - 8, this.y - 8, 16, 16)) {
                        AntifaControl.peace = false;
                    }
                }
            } else {
                if (AntifaControl.peace === true) {
                    AntifaControl.peace = false;
                }
            }

            if (shouldNotDisappear) {
                WorldToTile(this.x - 8, this.y - 8 - fix.y, this.tile);


                var folk = CollidesWithFolk(this.tile.x, this.tile.y, false);

                if (AntifaControl.fascistMode === false && folk === null) {
                
                    if (Environment.player.dead === false) {
                        folk = (CollideWith(Environment.player, this.tile.x, this.tile.y)) ? Environment.player : null;
                        
                    }
                }

                if (folk === null) {
                    if (CheckMapCollision(this.tile.x, this.tile.y)) {
                        this.Explode(undefined, culled);
                    }
                } else {
                    this.Explode(folk, culled);
                }
            } else {
                this.removeBullet();
            }
        }

    };

    this.setup = function (pos, direction) {

        if (this.setups === false) {
            var scale = 1;

            switch (direction) {
                case 0:
                case 1:
                    {
                        scale = (direction === 1) ? -1 : 1;
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
            this.setups = true;
        }

    };

};function SceneLogo() {

    this.waitLogoTime = 0;
    this.done = false;
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
        this.load.tilemapJSON('tilemap_long', 'map/n_tilemap_long.json');
        this.load.image('bugreiro', 'img/n_bugreiro.png');
        this.load.image('npcs', 'img/n_npcs.png');
        this.load.image('effects', 'img/n_effects.png');
        this.load.image('fucku', 'img/n_fuck_fascist.png');
        this.load.image('shaking', 'img/n_shaking.png');
        this.load.image('cocar', 'img/n_cocar.png');
        this.load.image('revolution', 'img/n_revolution.png');
        this.load.image('hat', 'img/n_hat.png');

        // Bugreiro
        this.load.spritesheet('bug_down', 'bugreiro', [0, 0, 16, 16, 2], 123);
        this.load.spritesheet('bug_side', 'bugreiro', [0, 16, 16, 16, 2], 123);
        this.load.spritesheet('bug_up', 'bugreiro', [0, 32, 16, 16, 2], 123);
        this.load.spritesheet('bug_shoot_down', 'bugreiro', [32, 0, 16, 16, 4], 120);
        this.load.spritesheet('bug_shoot_side', 'bugreiro', [32, 16, 16, 16, 4], 120);
        this.load.spritesheet('bug_shoot_up', 'bugreiro', [32, 32, 16, 16, 4], 120);
        this.load.spritesheet('bug_blade_up', 'bugreiro', [32, 48, 16, 16, 4], 60);
        this.load.spritesheet('bug_blade_side', 'bugreiro', [32, 64, 16, 16, 4], 60);
        this.load.spritesheet('bug_blade_down', 'bugreiro', [32, 80, 16, 16, 4], 60);
        this.load.animMachine('bugreiro', [
            'bug_down', 'bug_side', 'bug_up',
            'bug_shoot_down', 'bug_shoot_side', 'bug_shoot_up',
            'bug_blade_down', 'bug_blade_side', 'bug_blade_up'
        ]);

        // Ending images
        this.load.spritesheet('fuck_fascist', 'fucku', [0, 0, 55, 77, 2], 200);
        this.load.spritesheet('hand_shaking', 'shaking', [0, 0, 96, 77, 2], 200);
        this.load.spritesheet('cocar', 'cocar', [0, 0, 77, 70, 2], 200);
        this.load.spritesheet('revolution', 'revolution', [0, 0, 53, 80, 2], 200);
        this.load.spritesheet('hat', 'hat', [0, 0, 85, 48, 2], 200);

        // Effects
        this.load.spritesheet('shoot_effect_side', 'effects', [0, 0, 16, 16, 3, 1], 120);
        this.load.spritesheet('shoot_effect_updown', 'effects', [16, 0, 16, 16, 3, 1], 120);
        this.load.spritesheet('bullet_explosion', 'effects', [32, 0, 16, 16, 4, 1], 120);
        this.load.spritesheet('blood_explosion', 'effects', [64, 0, 16, 16, 5, 1], 160);
        this.load.spritesheet('alert', 'effects', [48, 16, 16, 16, 4, 1], 160);
        this.load.spritesheet('dol_to_naz_0', 'effects', [96, 64, 8, 8, 4, 2]);
        this.load.spritesheet('dol_to_naz_1', 'effects', [112, 64, 8, 8, 4, 2]);
        this.load.spritesheet('rot_quad', 'effects', [128, 32, 8, 8, 2, 1]);
        //this.load.spritesheet('rot_quad_1', 'effects', [112, 40, 8, 8, 2]);

        /// FOLKS
        var x = 0;
        var y = 0;
        var row = 0;
        var folkDown, folkUp, folkSide;
        var dur = 240;

        for (var i = 0; i < MAX_FOLKS; i++) {

            folkDown = 'folk_down_' + i.toString();
            folkSide = 'folk_side_' + i.toString();
            folkUp = 'folk_up_' + i.toString();
            this.load.spritesheet(folkDown, 'npcs', [x, y, 16, 16, 2], dur);
            this.load.spritesheet(folkSide, 'npcs', [x, y + 16, 16, 16, 2], dur);
            this.load.spritesheet(folkUp, 'npcs', [x, y + 32, 16, 16, 2], dur);
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
                } else if (/^bug_blade_/.test(asset.name)) {
                    asset.loop = false;
                    asset.duration = (dur * 1000) / 1.5;
                    asset.duplicate(3);
                    asset.duplicate(3);
                    asset.duplicate(3);
                    //frame.duration = 120;
                } else if (/^bug_/.test(asset.name)) {
                    asset.loop = true;
                    asset.duration = dur * 1000;
                }
            } else if (type === scintilla.AssetType.tilemap) {
                if (asset.name === 'tilemap_long') {
                    var objs = asset.getObjectsLayer("BlockedPaths");
                    objs.sort(function (a, b) {
                        return a.x - b.x;
                    });
                }
            }

        });

    };

    this.start = function () {
        this.transition.settings.setOutDuration(1);
        this.transition.settings.setEaseOutMethod(scintilla.Ease.Type.CUT, 3);
        this.transition.settings.setEaseInMethod(scintilla.Ease.Type.CUT, 3);
        this.transition.out();

        if (this.goToScene === 'title') {
            this.audio.playPersistent('titleMusic', 0.3, true, 'bgm');
        }
    };

    this.update = function (dt) {
        if (!this.done) {
            this.waitLogoTime += dt / 2.5;

            if (this.waitLogoTime >= 1) {
                this.transition.settings.setInDuration(1);
                this.done = true;
            }
        } else {

            this.transition.in();

            var next = function () {
                this.scene.set(this.goToScene);
            };
            this.events.subscribeOnce('transition_end', next, this);
            //this.scene.set(this.goToScene);
            
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
    var optionsSelect = false;
    var startGame = 0;
    var bgm = null;
    var waitForFade = false;

    this.start = function () {

        optionsMenu = false;
        optionsSelect = false;
        startGame = 0;
        bgm = null;
        this.blinkStartTime = 0;
        this.blinkStart = false;

        this.transition.out();
        waitForFade = true;

        this.events.subscribeOnce('transition_end',
            function () {
                waitForFade = false;
            }, this);

        bgm = this.audio.get('bgm');

        if (bgm !== null) {
            if (!bgm.isPlaying) {
                bgm.play();
            }
        } else {
            bgm = this.audio.playPersistent('titleMusic', 0.3, true, 'bgm');
        }
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
                if (waitForFade === false) {
                    if (confirmKey) {
                        optionsMenu = true;
                        this.audio.playOnce('ok', 0.5);
                    }
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
                    AntifaControl.fascistMode = optionsSelect;
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
            drawer.text('FAIR TRADE?', 160, 148);
            drawer.align = 'left';
            var xx = 156 - 4; // 148
            //var unicode = eval('"\\u' + 2192 + '"'); //String.fromCharCode("8594");
            //drawer.text(">", 148 - 16, 148 + 16 + (((optionsSelect) ? 1 : 0) * 12));
            drawer.spritePart('effects', xx - 16, 148 + 8 + (((optionsSelect) ? 1 : 0) * 12), 96, 24, 8, 8);
            drawer.text('YES', xx, 148 + 16);
            drawer.text('NO', xx, 148 + 16 + 12);
        }

        drawer.text('TOBIASBU', 8, 232);

        drawer.align = 'right';
        drawer.text('MUSIC BY NILS FESKE', 320 - 8, 232);
        //drawer.text('2018', 320 - 8, 232);
    };
};function RandomWhile(value) {
    var param;
    while (param !== value) {
        param = scintilla.Random.irange(0, 3);
    }
    return param;
}

function RandomizeFolksParameters(folks) {

    var lowLevel = 0;
    var midLevel = 0;
    var highLevel = 0;
    var folk, param;
    var len = folks.length;
    var i = len;

    while (i--) {

        folk = folks[i];
        param = scintilla.Random.irange(0, 3);

        if (param === 0 && lowLevel < 2) {
            param = RandomWhile(0);
        }
        if (param === 1 && midLevel < 4) {
            param = RandomWhile(1);
        }
        if (param === 2 && highLevel < 2) {
            param = RandomWhile(2);
        }

        switch (param) {
            case 0:
                {
                    if (AntifaControl.fascistMode === true) {
                        folk.smartness = scintilla.Random.irange(10, 15);
                    } else {
                        folk.smartness = scintilla.Random.irange(5, 10);
                    }
                    folk.spd = 35;
                    lowLevel++;

                    //
                    break;
                }
            case 1:
                {
                    folk.smartness = scintilla.Random.irange(15, 25);
                    if (AntifaControl.fascistMode === true) {
                        folk.spd = 50;
                    } else {
                        folk.spd = 45;
                    }
                    midLevel++;
                    //folk.smartness = scintilla.Random.irange(25, 40);
                    break;
                }
            case 2:
                {


                    if (AntifaControl.fascistMode === true) {
                        folk.smartness = scintilla.Random.irange(20, 50);
                        folk.spd = 60;
                    } else {
                        folk.smartness = scintilla.Random.irange(20, 35);
                        folk.spd = 50;
                    }

                    highLevel++;
                    break;
                }
        }

        folk.spdDuration = 16 / folk.spd;
        folk.animMachine.machine.duration = 240;
    }

    if (AntifaControl.fascistMode === true) {
        // select one folk to be 'extremely intelligent': 
        i = scintilla.Random.irange(0, len);

        folks[i].smartness = 100;
        folks[i].spd = 75;
        folks[i].spdDuration = 16 / folk.spd;
    }
}

function RandomizeSpawnPoint(spawnPointsObjects, alreadySpawned) {

    var objPos;
    var allEqual = false;
    var rng;
    var j;
    var size = spawnPointsObjects.length;

    while (true) {
        allEqual = false;
        rng = scintilla.Random.irange(0, size);

        if (alreadySpawned.length !== 0) {
            for (j = 0; j < alreadySpawned.length; j++) {
                if (alreadySpawned[j] === rng) {
                    allEqual = true;
                    break;
                }
            }
        }

        if (allEqual === false) {
            objPos = spawnPointsObjects.get(rng);
            alreadySpawned.push(rng);
            break;
        }

    }

    return objPos;
}

function InstantiateFolks(scene, spawnPointsObjects, alreadySpawnedPoints, playerFolkID, offset) {

    var folk;
    var folks = [];
    var objPos;

    if (playerFolkID === undefined) playerFolkID = -1;

    for (var i = 0; i < MAX_FOLKS; i++) {

        if (playerFolkID === i)
            continue;

        folk = scene.entity.create(Folk);
        folk.animMachine.machine = 'folk_' + i.toString();

        objPos = RandomizeSpawnPoint(spawnPointsObjects, alreadySpawnedPoints);

        folk.Setup(objPos.x + offset, objPos.y, i);
        folks.push(folk);
    }

    RandomizeFolksParameters(folks);

    Environment.folks = folks;

}

function CreateFolkPlayer(scene, spawnPointsObjects, alreadySpawnedPoints, offset) {
    var player = scene.entity.create(FolkPlayer);
    var folkID = scintilla.Random.irange(0, MAX_FOLKS);
    player.animMachine.machine = 'folk_' + folkID.toString();
    player.folkIDName = "_" + folkID.toString();
    player.id = folkID;

    var objPos = RandomizeSpawnPoint(spawnPointsObjects, alreadySpawnedPoints);
    player.Setup(objPos.x + offset, objPos.y);
    player.animMachine.machine.duration = (player.spdDuration / 2) * 1000;
    return player;
}

function CommonGameEndingEventsUpdate(currentEvent, t, dt, endingControl) {

    switch (currentEvent) {
        // -3 is pause
        case -2: // fade out
            {
                this.tParam = scintilla.Ease.in.cut(0, 1, t, 4);
                break;
            }

            // -1 is pause
        case 1000:
            {
                var tVolume = t / 0.85;
                


                if (tVolume >= 1)
                    tVolume = 1;

                this.bgm.volume = scintilla.Math.lerp(0.3, 0.0, tVolume);
                break;
            }
    }
}

function CommonGameEndingEventsEnd(currentEvent, endingControl) {

    switch (currentEvent) {
        case -3:
            {
                endingControl.eventDuration = 1;
                break;
            }

        case 999:
            {
                /*this.events.subscribeOnce('transition_end', function () {
                    endingControl.nextEvent();
                });*/
                this.transition.in();
                endingControl.eventDuration = 2;
                endingControl.waitForEnd = false;
                break;
            }
        case 1000:
            {
                //endingControl.eventDuration = 0.1;
                this.audio.stopAll(true);
                this.scene.set('title');
                break;
            }
        case 1001:
            {
                this.audio.stopAll(true);
                this.scene.set('title');
                break;
            }
    }

}

function GameEnding(context) {
    this.onEventEnd = null;
    this.onEventUpdate = null;
    this.context = context;
    this.currentEvent = 0;
    this.active = false;
    this.eventTimer = 0;
    this.eventDuration = 1;
    this.waitForEnd = false;
    this.t = 0;
    var shouldEnd = false;
    var commonEvents = true;

    this.reset = function () {
        this.onEventEnd = null;
        this.onEventUpdate = null;
        this.currentEvent = -3;
        this.active = false;
        this.eventTimer = 0;
        this.eventDuration = 1;
        shouldEnd = false;
        commonEvents = true;
    };

    this.update = function (dt) {

        if (!this.active)
            return;

        this.eventTimer += dt; // / this.eventDuration;
        this.t = this.eventTimer / this.eventDuration;

        if ( this.eventTimer >= this.eventDuration) {
            this.eventTimer = this.eventDuration;
            this.t = 1;
            shouldEnd = true;
        }

        if (commonEvents === true) {
            CommonGameEndingEventsUpdate.call(this.context, this.currentEvent, this.t, dt, this);
        }
        if (this.onEventUpdate !== null) {
            this.onEventUpdate.call(this.context, this.currentEvent, this.t, dt, this);
        }

        if (shouldEnd === true && this.waitForEnd === false) {
            this.nextEvent();
        }

    };

    this.start = function () {
        this.active = true;
        this.currentEvent = -3;
        this.eventDuration = 1.5;
        this.eventTimer = 0;
        shouldEnd = false;
        commonEvents = true;
        this.waitForEnd = false;
    };

    this.end = function () {
        this.currentEvent = 999;
        this.eventDuration = 10;
        commonEvents = true;
        shouldEnd = false;
        this.eventTimer = 0;
        this.waitForEnd = false;
    };

    this.nextEvent = function (eventIndex) {

        var oldEvent = this.currentEvent;
        var newEvent = oldEvent + 1;

        if (eventIndex !== undefined) {
            newEvent = eventIndex;
        } 

        if (newEvent === oldEvent)
            return;

        this.currentEvent = newEvent;        
        this.waitForEnd = false;

        if (commonEvents === true) { /// common game ending events
            CommonGameEndingEventsEnd.call(this.context, oldEvent, this);

            if (newEvent >= 0 && newEvent < 999) {
                commonEvents = false;
            }

        } else { // user ending events
            if (this.onEventEnd !== null) {
                this.onEventEnd.call(this.context, oldEvent, this);
            }
            //if (commonEvents === false) {
                //oldEvent++;
            //}
        }

        this.t = 0;
        this.eventTimer = 0;
        shouldEnd = false;

    };

};function FascistUpdate(dt) {

    // control if the bugreiro player shoot against the tribe
    if (Environment.endGame === 0) {

        var player = Environment.player;



        if (AntifaControl.peace === true) {
            if (this.onTribeArea === 0) {
                if (Environment.largeTribeArea.intersects(player.x, player.y, 8, 8)) {
                    this.onTribeArea = 1;
                    player.reachTheTribe = true;
                }
            } else if (this.onTribeArea >= 1) {

                if (this.onTribeArea === 1) {
                    if (Environment.tribeArea.intersects(player.x, player.y, 8, 8)) {
                        this.onTribeArea = 2;
                    }
                } else {
                    this.peacefulTime += dt;

                    if (this.peacefulTime >= 30) {
                        Environment.endGame = 1;
                    }
                }
            }
        } else {
            // verify if the game has ended
            if (Environment.folks.length === 0) {
                Environment.endGame = 2;
            }
            if (IsFolksCulled(this.camera)) {
                if (this.lastCulledCheck === false) {
                    this.lastCulledCheck = true;
                    this.peacefulTime = 0;
                }

                this.peacefulTime += dt;

                if (this.peacefulTime >= 10) {
                    Environment.endGame = 2;
                }

            } else {
                this.lastCulledCheck = false;
            }
        }

        if (player.tile.x <= -1) {
            if (Environment.folks.length === MAX_FOLKS) {
                Environment.endGame = 6;
            } else {
                Environment.endGame = 2;
            }
        }
    } else if (Environment.endGame > 0) {
        // set to game ending
        if (this.gameEnded === false) {


            if (AntifaControl.naziCount === 0) {
                this.toSymbol = 2;
                this.currentSymbol = 2;
                this.fromSymbol = 2;
                this.noSymbols = true;
                AntifaControl.activeSymbolBar = true;
            }


            if (Environment.endGame === 2) {
                this.endingImage = 'fuck_fascist';
            } else if (Environment.endGame === 1) {
                this.endingImage = 'hand_shaking';
                this.symbolFrame = quadSymbolFrame;
            } else if (Environment.endGame === 6) {
                this.endingImage = 'hat';
                this.symbolFrame = quadSymbolFrame;
            }

            this.circleCuts = (360 / (this.toSymbol * 4)) * scintilla.Math.toRadian;
            this.gameEnded = true;
            this.peacefulTime = 0;
            this.endingControl.start();
        }
    }
}

function AntifaUpdate(dt) {
  
    if (this.gameEnded === false) {
        var goToEndGame = false;
        if (Environment.endGame === 0) {


            if (Environment.player.dying === true) {

                /*if (Environment.player.tile.x < FPLAYER_TILE_START) {
                    if (this.toSymbol === 0) {
                        this.toSymbol = 4;
                        this.currentSymbol = this.toSymbol;
                        this.fromSymbol = this.toSymbol;
                        AntifaControl.activeSymbolBar = true;
                        this.symbolFrame = quadSymbolFrame;
                        this.noSymbols = true;
                    }
                } else {*/

                goToEndGame = true;
                this.endingImage = 'cocar';
                Environment.endGame = 4;
            }


        } 
        
        if (Environment.endGame === 5) {
            this.endingImage = 'revolution';
            goToEndGame = true;
        }

        if (goToEndGame === true) {
            this.currentSymbol = this.toSymbol;
            this.symbolFrame = flagSymbolFrame;
            this.noSymbols = false;
            this.circleCuts = (360 / this.toSymbol) * scintilla.Math.toRadian;
            this.gameEnded = true;
            this.peacefulTime = 0;
            this.endingControl.start();
        }
    }


}


function GameUI(drawer) {

    var endingEvent = this.endingControl.currentEvent;

    if (this.currentSymbol > 0) {

        var fx = 2;
        var fy = 5;
        var ended = false;

        if (this.gameEnded === true) {

            if (this.noSymbols) {
                fy = -8;
            }
            ended = (endingEvent < 0) ? false : true;
        }

        var blinky = 0;
        var ang = SYMBOL_START_ANGLE;
        var xx, yy, i = 0;


        for (; i < this.currentSymbol * this.symbolMultiplier; i++) { // 64

            blinky = ((this.blinkSymbolTrigger - (i % 2)) === 0) ? 0 : 1;

            if (ended === false) {
                drawer.spritePart('effects', fx + (10 * i), fy - blinky, this.symbolFrame.x, this.symbolFrame.y + (blinky * 8), 8, 8);
            } else {

                if (endingEvent <= 0) {
                    xx = scintilla.Math.lerp(fx + (10 * i), 160 + Math.cos(ang) * SYMBOL_RADIUS, this.peacefulTime);
                    yy = scintilla.Math.lerp(fy, 120 + Math.sin(ang) * SYMBOL_RADIUS, this.peacefulTime);
                } else {
                    xx = 160 + Math.cos(ang) * SYMBOL_RADIUS;
                    yy = 120 + Math.sin(ang) * SYMBOL_RADIUS;
                }

                if (Environment.endGame === 2) {
                    if (endingEvent <= 0) {
                        drawer.spritePart('effects', xx, yy - blinky, this.symbolFrame.x, this.symbolFrame.y + (blinky * 8), 8, 8);
                    } else {
                        drawer.spritesheet('dol_to_naz_' + blinky.toString(), xx, yy - blinky, this.symbolFrameIndex);
                    }
                } else if (this.noSymbols) {
                    drawer.spritesheet('rot_quad', xx, yy - blinky, blinky);
                } else {
                    drawer.spritePart('effects', xx, yy - blinky, this.symbolFrame.x, this.symbolFrame.y + (blinky * 8), 8, 8);
                }

                ang += this.circleCuts;
            }

        }
    }


    if (this.gameEnded === true) {

        if (endingEvent >= 3) {
            drawer.font('Press Start 2P', 7, 'normal');
            drawer.text(this.endFirstText, 160, 16, 'white', 'center');
            if (endingEvent >= 4) {
                drawer.text(this.endSecText, 160, 26, 'white', 'center');
                if (endingEvent >= 5) {
                    if (this.endThrText !== null) {
                        drawer.text(this.endThrText, 160, 228, 'white', 'center');
                    }
                }
                drawer.alpha = this.tParam3;
                drawer.spritesheet(this.endingImage, 160, 120, this.blinkEndingImageTrigger ? 0 : 1, 0.5, 0.5);
                drawer.alpha = 1;
            }
        }
    }

}


function GameEndingControlEventUpdate(currentStep, stepTimer, dt, endingControl) {
    if (Environment.endGame > 0) {

        switch (currentStep) {
            case 0:
                { // move the symbols to circle
                    this.peacefulTime = stepTimer;
                    break;
                }

            case 1:
                { // change dollar to nazi symbol
                    this.tParam2 += dt / 0.24;
                    if (this.tParam2 >= 1) {
                        this.tParam2 = 0;
                        this.symbolFrameIndex += 1;
                        if (this.symbolFrameIndex >= 4) {
                            this.symbolFrameIndex = 3;
                            endingControl.nextEvent(2);
                        }
                    }
                    break;
                }
        }

        if (currentStep >= 4) {

            if (this.tParam3 !== 1) {
                if (this.tParam2 >= 1) {
                    this.tParam2 = 1;
                    this.tParam3 = 1;
                } else {
                    this.tParam2 += dt;
                    this.tParam3 = scintilla.Ease.in.cut(0, 1, this.tParam2, 5);
                }
            }
        }

        if (currentStep >= 5 && currentStep < 1000) {

            if (this.key.pressed(scintilla.KeyCode.Enter)) {

                endingControl.nextEvent(1000);

            }
        }
    }

}


function GameControlEndingEventEnd(currentStep, endingControl) {
    switch (currentStep) {
        case 0:
            {
                this.tParam2 = 0;
                if (Environment.endGame === 2) {
                    endingControl.waitForEnd = true;
                } else {
                    endingControl.waitForEnd = false;
                    endingControl.nextEvent(2);
                }
                break;
            }
            // 1 dol to naz
        case 2:
            { // set phrase

                this.endThrText = null;

                if (Environment.endGame === 1) {
                    this.endFirstText = "THIS MAY BE AN ANSWER.";
                    // ENSURE... REJECT maybe?
                    this.endSecText = 'WILL IT NOT ENSURE OTHER FASCISM INSTANCES?'; // 43
                } else if (Environment.endGame === 2) {

                    this.endSecText = 'HERE IS A GIFT FOR YOU:';

                    if (AntifaControl.naziCount === 0)
                        this.endFirstText = "TRYING TO KILL PEOPLE?";
                    if (AntifaControl.naziCount > 0 && AntifaControl.naziCount <= 2)
                        this.endFirstText = "KILLING PEOPLE ISN'T COOL!";
                    else if (AntifaControl.naziCount > 2 && AntifaControl.naziCount <= 4)
                        this.endFirstText = "YOU'RE A FASCIST!";
                    else if (AntifaControl.naziCount >= 5)
                        this.endFirstText = "YOU'RE A FUCKING FASCIST!";
                } else if (Environment.endGame === 4) {

                    this.endFirstText = 'TO DIE FIGHTING FOR THE MOST BASIC OF RIGHTS';
                    this.endSecText = 'STILL IS A REALITY.';
                    this.endThrText = 'THE FIGHT CONTINUES...';

                } else if (Environment.endGame === 5) {

                    //The journey was long. 
                    //Your land and your people has been destroyed.
                    // Enough with the unfair trade!
                    // It's time to fight fascism

                    this.endFirstText = "YOUR LAND AND YOUR PEOPLE HAS BEEN DESTROYED.";
                    this.endSecText = 'ENOUGH WITH UNFAIR TRADES!';
                    this.endThrText = 'IT\'S TIME TO FIGHT FASCISM!';
                } else if (Environment.endGame === 6) {

                    this.endFirstText = "YOU ABANDONED THESE DEMANDS";
                    this.endSecText = 'BUT THE PAST TOO?';

                }

                endingControl.duration = 0.5;

                break;
            }
            // 3, 4, 5 is pause
        case 5:
            {
                //endingControl.waitForEnd = true;
                endingControl.end();
                break;
            }
    }
};function SceneGame() {

    this.bgm = null;

    // common stuff
    this.blinkSymbolTrigger = false;
    this.blinkSymbolTime = 0;
    this.symbolFrame = null;
    this.symbolFrameIndex = 0;
    this.symbolBarTime = 0;
    this.currentSymbol = 0;
    this.fromSymbol = 0;
    this.toSymbol = 0;
    this.circleCuts = 0;
    this.symbolMultiplier = 0;
    this.noSymbols = false;

    // ending
    this.peacefulTime = 0;
    this.tParam = 0;
    this.tParam2 = 0;
    this.tParam3 = 0;
    this.endFirstText = '';
    this.endSecText = '';
    this.endThrText = null;
    this.endingControl = new GameEnding(this);

    this.endingImage = null;
    this.blinkEndingImageTimer = 0;
    this.blinkEndingImageTrigger = false;

    this.onTribeArea = 0;
    this.lastCulledCheck = false;
    this.gameEnded = false;


    this.start = function () {

        this.reset();

        // starting 
        this.transition.out();
        this.events.subscribeOnce('transition_end', function () {
            Environment.endGame = 0;
        });
        this.bgm = this.audio.play('gameMusic', 0.3, true);

        // tilemap
        var map;

        if (AntifaControl.fascistMode === true) {
            map = this.create.tilemap('tilemap');
        } else {
            map = this.create.tilemap('tilemap_long');
        }
        var tilemap = map.modules.get('render');
        Environment.map = tilemap;
        Environment.mapColliderLayer = tilemap.getTileLayer('GameLayer');
        Environment.mapColliderUpperLayer = tilemap.getTileLayer('UpperLayer');

        // get auxillary objects from tilemap
        var tilemapResource = this.cache.tilemap.get('tilemap');
        var offset = 0;
        var objlayer = tilemapResource.getObjectsLayer('FolkSpawn');
        Environment.safePoints = tilemapResource.getObjectsLayer('SafePoints').objects;

        if (AntifaControl.fascistMode === true) {
            Environment.largeTribeArea = tilemapResource.getObjectsLayer('FolkTribe').objects.at(0);
            Environment.tribeArea = tilemapResource.getObjectsLayer('FolkTribe').objects.at(1);
        } else {
            Environment.blockingPaths = tilemap.getObjectsLayer('BlockedPaths').objects;
            offset = -224;
        }

        PathFinder.map = tilemap;
        PathFinder.collisionPredicate = FolkPathFindCollisionTest;

        var player = null;
        var objs = objlayer.objects;
        var pID = -1;
        var occupiedSpawnPoints = [];

        this.endingControl.onEventEnd = GameControlEndingEventEnd;
        this.endingControl.onEventUpdate = GameEndingControlEventUpdate;

        if (AntifaControl.fascistMode === true) {
            // Fascist Player
            player = this.entity.create(Bugreiro);
            // game control
            this.symbolMultiplier = 4;
            this.symbolFrame = dollarSymbolFrame;
            // folk movement limit
            folkLimit.xMin = 26;
            folkLimit.xMax = 35;

        } else {

            // game control
            this.symbolFrame = flagSymbolFrame;
            this.symbolMultiplier = 1;

            // folk movement limit
            folkLimit.xMin = 10;
            folkLimit.xMax = 31;

            // Antifa player
            player = CreateFolkPlayer(this, objs, occupiedSpawnPoints, offset);
            pID = player.id;
            // create bugreiro ai
            Environment.ai = this.entity.create(BugreiroAI);

        }

        Environment.player = player;

        // Folks
        InstantiateFolks(this, objs, occupiedSpawnPoints, pID, offset);

    };

    this.reset = function () {
        Environment.reset();
        AntifaControl.reset();
        this.endingControl.reset();

        if (!this.pool.has("bullet"))
            this.pool.create("bullet", Bullet, 10);
        if (!this.pool.has("bullet_efx"))
            this.pool.create("bullet_efx", ShootEffect, 10);
        if (!this.pool.has("explosion"))
            this.pool.create('explosion', BulletExplosion, 10);


        this.gameEnded = false;
        this.tParam = 0;
        this.tParam2 = 0;
        this.tParam3 = 0;

        this.noSymbols = false;
        this.currentSymbol = 0;
        this.fromSymbol = 0;
        this.toSymbol = 0;
        this.symbolBarTime = 0;
        this.symbolFrameIndex = 0;
        this.blinkEndingImageTimer = 0;
        this.blinkEndingImageTrigger = false;

        this.peacefulTime = 0;
        this.onTribeArea = 0;
        this.lastCulledCheck = false;
    };

    this.update = function (dt) {

        // common update
        if (AntifaControl.activeSymbolBar === true) {

            /// blinking symbol bar
            this.blinkSymbolTime += dt;
            this.symbolBarTime += dt / 0.25;

            if (this.symbolBarTime > 1.0) {
                this.symbolBarTime = 1.0;
            }

            if (this.blinkSymbolTime >= 0.2) {
                this.blinkSymbolTime = 0;
                this.blinkSymbolTrigger = !this.blinkSymbolTrigger;


                if (AntifaControl.fascistMode === true) { // fascist symbol
                    if (AntifaControl.naziCount > this.currentSymbol) {
                        this.fromSymbol = this.currentSymbol;
                        this.toSymbol = AntifaControl.naziCount;
                        this.symbolBarTime = 0;
                    }
                } else {
                    if (Environment.player.tile.x >= FPLAYER_TILE_START) {
                        this.fromSymbol = this.currentSymbol;
                        // Math.round((Environment.player.tile.x - FPLAYER_TILE_START) / FPLAYER_SYMBOL_SET);
                        this.toSymbol = Math.round(scintilla.Math.lerp(0, 32, (Environment.player.tile.x - FPLAYER_TILE_START) / FPLAYER_TILE_MAX));
                        if (this.toSymbol > 32) {
                            this.toSymbol = 32;
                        }

                        this.symbolBarTime = 0;
                    }
                }

            }

            // animation of symbols bar
            this.currentSymbol = scintilla.Math.lerp(this.fromSymbol, this.toSymbol, this.symbolBarTime);
            if (AntifaControl.fascistMode === false) {
                this.currentSymbol = Math.round(this.currentSymbol);
            }
        }

        // ending update
        if (this.gameEnded === true) {

            if (this.endingControl.currentEvent >= 4) {

                // blinking symbol
                this.blinkEndingImageTimer += dt;

                if (this.blinkEndingImageTimer > 0.48) {
                    this.blinkEndingImageTimer = 0;
                    this.blinkEndingImageTrigger = !this.blinkEndingImageTrigger;
                }

            }

            this.endingControl.update(dt);
        }

        // selective update
        if (AntifaControl.fascistMode === true) {
            CameraFollowBugreiro(this.camera, Environment.player);
            FascistUpdate.call(this, dt);

        } else {
            CameraFollowFolkPlayer(this.camera, Environment.player);
            AntifaUpdate.call(this,dt);
        }


    };

    this.gui = function (drawer) {
        // universal rect
        drawer.color = '#000';
        drawer.rect(0, 0, 320, 16);

        // fade out rect
        if (this.gameEnded === true) {
            //drawer.color = '#000';
            drawer.alpha = this.tParam;
            drawer.rect(0, 0, 320, 240);
            drawer.alpha = 1;
        }

        //if (AntifaControl.fascistMode) {
        GameUI.call(this, drawer);
        //}

    };
};function ScenePathFindTest() {

	var start = {
		x: 0,
		y: 0
	};
	var target = {
		x: 0,
		y: 1
	};
	var mapConfig = {
		width: 30,
		height: 30
	};
	this.chain = null;
	this.depth = 40;

	this.map = [
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
		1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
		1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1,
		1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1,
		1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1,
		1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1,
		1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1,
		1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 1,
		1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1,
		1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 2, 1, 1, 2, 2, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 1,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
		1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	];

	this.getTile = function (x, y) {
		var index = x + y * mapConfig.width;
		return this.map[index];
	};


	this.start = function () {

		this.randomize();

		var self = this;
		PathFinder.map = mapConfig;
		PathFinder.collisionPredicate = function (x, y) {
			var t = self.getTile(x, y);
			return t === 2;
		};
		this.chain = PathFinder.FindPath(start, target, this.depth);

	};

	var tileSize = 8;

	this.randomize = function () {
		var xx, yy;
		var run = true;
		while (run) {
			xx = scintilla.Random.irange(0, 30);
			yy = scintilla.Random.irange(0, 30);
			if (this.getTile(xx, yy) !== 2) {
				target.x = xx;
				target.y = yy;
				run = false;
				/*target.x = tileIndex % 30;
				target.y = Math.ceil(tileIndex / 30);*/
				break;
			}
		}
	}

	this.update = function () {

		if (this.key.pressed(scintilla.KeyCode.Enter)) {
			this.randomize();
			console.log(target.x + " " + target.y);
			this.chain = null;
			this.chain = PathFinder.FindPath(start, target, this.depth);
		}

	}

	this.gui = function (drawer) {

		drawer.color = '#824f39';
		var x = 0,
			y = 0,
			i = 0;

		for (; i < 900; i++) {

			if (this.map[i] === 2) {
				drawer.rect(x * tileSize, y * tileSize, tileSize, tileSize);
			}

			x++;
			if (x >= 30) {
				x = 0;
				y++;
			}
		}

		drawer.color = '#eee';

		if (this.chain !== null) {

			for (i = 1; i < this.chain.length; i++) {
				var p = this.chain[i];
				drawer.rect(p.x * tileSize, p.y * tileSize, tileSize, tileSize);

			}
		}

		drawer.color = '#3dcc60';
		drawer.rect(start.x * tileSize, start.y * tileSize, tileSize, tileSize);
		drawer.color = '#598de0';
		drawer.rect(target.x * tileSize, target.y * tileSize, tileSize, tileSize);

	};

};function CameraFollowFolkPlayer(camera, player) {

    var camX = player.x - 176;
    if (camX <= 0) {
        camX = 0;
    } else if (camX >= LONG_MAP_MAX - 144 - 176) {
        camX = LONG_MAP_MAX - 144 - 176;
    }
    camera.x = camX;

}

function FolkPlayerCollisionTest(x, y, player, finder) {

    var intersectsWithBlockedPath = false;

    if (finder !== undefined) {
        if (finder === true) {
            if (player.blockedPath !== null) {

                intersectsWithBlockedPath = player.blockedPath.contains(player.destPos.x, player.destPos.y);
            }
        }
    }


    if (CheckMapCollision(x, y) ||
        CollidesWithFolk(x, y, true) ||
        CollideWith(Environment.ai, x, y) ||
        intersectsWithBlockedPath) {
        return true;
    }

    return false;

}

function FolkPlayer() {

    this.animMachine = null;
    this.folkIDName = '_';
    this.blockedPathIndex = 0;
    this.blockedPath = null;
    this.nextBlockedPath = null;
    this.isMoving = false;
    this.isPlayer = true;
    this.dead = false;
    this.dying = false;
    this.reachCity = false;
    this.goToCity = false;
    this.chainNode = null;
    this.navigation = 0;


    this.ChangeState = function (direction) {

        if (direction === undefined) direction = this.dir;

        this.dir = direction;

        var stateName = 'folk_';
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


        stateName += dirName + this.folkIDName;

        this.animMachine.setState(stateName);

        if (this.animMachine.isPlaying === false) {
            this.animMachine.play();
        }

    };

    this.ActiveMoving = function (flip) {
        this.scale.x = flip;
        this.isMoving = true;
        this.moveTimer = 0;
        this.oldPos.x = this.x;
        this.oldPos.y = this.y;
    };

    this.animationEnd = function () {
        if (Environment.endGame !== 0) {
            this.ChangeState();
            this.animMachine.stop();
        }
    };


    this.start = function () {
        CreateTiledEntity(this, 50);
        this.animMachine = this.modules.attach.animMachine();
        this.blockedPathIndex = -1;
        this.nextBlockedPath = Environment.blockingPaths.at(0);
        this.isPlayer = true;
        this.dead = false;
        this.dying = false;
        this.origin.set(0.5, 0.5);
        this.spr = this.modules.get('render');
        this.spr.depth = 3;
        this.animMachine.stop();
    };

    this.update = function (dt) {
        if (Environment.endGame === 0 && this.dying === false) {

            if (Environment.reachCity === false) {

                var horizontal = -this.scene.key.press(scintilla.KeyCode.Left) + this.scene.key.press(scintilla.KeyCode.Right);
                var vertical = -this.scene.key.press(scintilla.KeyCode.Up) + this.scene.key.press(scintilla.KeyCode.Down);

                if (this.isMoving === false) {


                    if (horizontal !== 0) {
                        this.hspd = horizontal; // * spd;
                        this.vspd = 0;
                        this.ChangeState((horizontal === -1) ? 0 : 1);
                        this.ActiveMoving(-horizontal);
                    } else if (vertical !== 0) {
                        this.vspd = vertical; // * spd;
                        this.hspd = 0;
                        this.ChangeState((vertical == -1) ? 2 : 3);
                        this.ActiveMoving(1);
                    } else {
                        this.animMachine.stop();
                        this.isMoving = false;
                    }

                    if (this.isMoving) {
                        this.oldTile.x = this.tile.x;
                        this.oldTile.y = this.tile.y;
                        this.toTile.x = this.tile.x + this.hspd;
                        this.toTile.y = this.tile.y + this.vspd;
                        this.destPos.x = Math.round(this.toTile.x * 16 + 8);
                        this.destPos.y = Math.round(this.toTile.y * 16 + 8);


                        WorldToTile(this.destPos.x - 8, this.destPos.y - 8, this.toTile);
                        if (FolkPlayerCollisionTest(this.toTile.x, this.toTile.y, this, false)) {
                            this.animMachine.stop();
                            this.isMoving = false;
                            this.toTile.x = -99;
                            this.toTile.y = -99;
                        }
                    }
                }
            } else {
                if (this.goToCity === false) {
                    if (this.isMoving === false) {
                        this.goToCity = true;
                        var dir;
                        if (this.chainNode !== null) {

                            if (this.chainNode.length > 1) {

                                this.navigation = 1;
                                dir = ActivePathNodeMovement(this, this.chainNode[1]);
                                this.ChangeState(dir);
                            }
                        }
                    }
                } else {
                    // if (this.chainNode !== null) {
                    TileMovementThroughPathNode(this.chainNode, this, dt);
                    if (this.navigation >= this.chainNode.length) {
                        this.EndingGame();
                    }
                    //}
                }
            }

            if (this.isMoving && this.goToCity === false) {
                this.moveTimer += dt / this.spdDuration;
                if (this.moveTimer >= 1) {

                    this.isMoving = false;
                    this.moveTimer = 1;
                }
                if (this.hspd !== 0)
                    this.x = scintilla.Math.lerp(this.oldPos.x, this.destPos.x, this.moveTimer);

                if (this.vspd !== 0)
                    this.y = scintilla.Math.lerp(this.oldPos.y, this.destPos.y, this.moveTimer);

                WorldToTile(this.x - 8, this.y - 8, this.tile);

                if (!this.isMoving) {
                    this.x = this.destPos.x;
                    this.y = this.destPos.y;
                    RoundToTile(this);
                    //WorldToTile(this.x - 8, this.y - 8, this.tile);
                    this.oldTile.x = this.tile.x;
                    this.oldTile.y = this.tile.y;
                    if (this.x > this.nextBlockedPath.x + this.nextBlockedPath.width) {
                        this.blockedPathIndex++;
                        if (this.blockedPathIndex < Environment.blockingPaths.size) {

                            this.blockedPath = this.nextBlockedPath;
                            this.nextBlockedPath = Environment.blockingPaths.at(this.blockedPathIndex);

                        } else {
                            this.blockedPath = this.nextBlockedPath;
                        }
                    }
                }
            }

            // 'good' ending
            if (Environment.reachCity === false) {
                if (this.tile.x >= 173) {
                    Environment.playerReachedToCity();
                    this.chainNode = PathFinder.FindPath(
                        this.tile,
                        {
                            x: 192,
                            y: 6
                        },
                        undefined,
                        FolkPlayerCollisionTest,
                        this);
                }
            }


        }
    };

    this.Setup = function (x, y) {
        this.position.set(x + 8, y + 8);
        this.tile = GetTile(this.x - 8, this.y - 8);
        this.oldTile.x = this.tile.x;
        this.oldTile.y = this.tile.y;
        this.animMachine.stop();
        this.dying = false;
        this.dead = false;
    };

    this.Die = function () {

        if (this.dying === true)
            return;

        this.dying = true;
        this.dead = true;

        this.animMachine.stop();
        var x = (this.id % 2) * 16;
        var y = scintilla.Math.floor(this.id / 2) * 16;
        this.spr.setFrame(64 + x, 0 + y, 16, 16);
        var blood = this.scene.create.sprite('effects', 'blood', bloodFrame);
        blood.position.set(this.x - 8, this.y - 8);
        this.spr.depth = 1;
        blood.modules.get('render').depth = 0;
        //AntifaControl.naziCount++;
    };

    this.EndingGame = function () {
        this.animMachine.stop();
        var x = (this.id % 2) * 16;
        var y = scintilla.Math.floor(this.id / 2) * 16;
        this.spr.setFrame(64 + x, 64 + y, 16, 16);
        Environment.endGame = 5;
    };

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
    parent: "body",
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
game.scene.add('test', ScenePathFindTest);
//game.scene.set('test');
game.scene.set('logo');