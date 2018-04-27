
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
