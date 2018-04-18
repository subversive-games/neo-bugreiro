/// PLAYER


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
}