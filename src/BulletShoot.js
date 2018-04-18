
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

}