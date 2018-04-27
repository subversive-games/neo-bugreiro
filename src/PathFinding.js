var Heuristic = {

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

var PathFinder = new PathFinding(4);