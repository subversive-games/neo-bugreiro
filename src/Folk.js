function Folk() {


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

}