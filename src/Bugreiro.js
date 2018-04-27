function Bugreiro() {

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
}