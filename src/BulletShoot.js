function Bullet() {

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

}