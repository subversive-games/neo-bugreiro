



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

}