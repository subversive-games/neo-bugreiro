/// FOLK

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
}