var Heuristic = {
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

    var closedNodes = new scintilla.Structure.List(null, false);
    var openNodes = new scintilla.Structure.List(null, false);
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

var PathFinder = new PathFinding(4);