function CameraFollowBugreiro(camera, player) {

    var camX = player.x - 144;
    if (camX <= 0) {
        camX = 0;
    } else if (camX >= (MAP_MAX - 176 - 144)) { /// 320 - 144 = 176
        camX = MAP_MAX - 176 - 144;
    }
    camera.x = camX;
}


function OnBugreiroAnimationEnd() {
    if (this.isShooting || this.isAttacking) {
        this.isShooting = false;
        this.isAttacking = false;
        this.waitToChangeState = SHOOT_PERIOD; //200;
    }

    if (Environment.endGame !== 0) {
        ChangeBugreiroState(this, 0);
        this.animMachine.stop();
    }
}

function ChangeBugreiroState(bug, newState, direction) {

    if (direction === undefined) direction = bug.dir;

    var stateName = "bug_";
    var dirName = "";
    var flip = 1;

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

    bug.dir = direction;

    if (direction === 0) {
        flip = -1;
    }

    //if (bug.scale.x !== flip)
    bug.scale.x = flip;

    if (newState === 2) {
        stateName += "shoot_";
    } else if (newState === 3) {
        stateName += "blade_";
    }
    stateName += dirName;

    bug.animMachine.setState(stateName);


    if (bug.state !== newState) {

        bug.state = newState;
    }

    if (bug.animMachine.isPlaying === false) {
        bug.animMachine.play();
    }

};

function ActiveBugreiroMoving(bug) {
    bug.isMoving = true;
    bug.moveTimer = 0;
    bug.oldPos.x = bug.x;
    bug.oldPos.y = bug.y;
}

function BugreiroShoot(bug, dir) {
    bug.isMoving = false;
    bug.moveTimer = 0;
    ChangeBugreiroState(bug, 2, dir);
    bug.isShooting = true;
    bug.timeToCreateBullet = 0;
    bug.bulletCreated = false;
    var exp = bug.scene.pool.pull('bullet_efx');
    if (Environment.endGame === 0) {
        bug.scene.audio.playOnce('shoot');
    }
    exp.setup(bug.position, bug.dir);
}

function BugreiroAttack(bug, folkToKill, dir) {
    bug.isMoving = false;
    bug.moveTimer = 0;
    ChangeBugreiroState(bug, 3, dir);
    bug.isAttacking = true;
    KillFolk(folkToKill, bug.scene);
}

function IsNearAndOnDirectionToFolk(x, y, direction, radius) {

    var i = 0;
    var inXRadius = false;
    var inYRadius = false;
    var inXOldRadius, inYOldRadius;

    var folk = GetNearestFolkByTile(x, y);

    if (folk === null)
        return null;

    inXRadius = x - folk.tile.x;
    inYRadius = y - folk.tile.y;
    inXOldRadius = Math.abs(x - folk.oldTile.x);
    inYOldRadius = Math.abs(y - folk.oldTile.y);

    switch (direction) {
        case 0:
            {

                if ((inXRadius === 1 || inXOldRadius === 1 || x === folk.tile.x) && inYRadius === 0) {
                    return folk;
                }

                break;
            }
        case 1:
            {

                if ((inXRadius === -1 || inXOldRadius === 1 || x === folk.tile.x) && inYRadius === 0) {
                    return folk;
                }
                break;
            }
        case 2:
            {

                if ((inYRadius === 1 || inYOldRadius === 1 || y === folk.tile.y) && inXRadius === 0) {
                    return folk;
                }
                break;
            }
        case 3:
            {

                if ((inYRadius === -1 || inYOldRadius === 1 || y === folk.tile.y) && inXRadius === 0) {
                    return folk;
                }
                break;
            }
    }


    return null;
}

function BugreiroAICollisionTest(x, y, obj) {

    /*var id;
    if (obj !== undefined) {
        if (target !== null) {
            id = obj.target.id;
        }
    }*/

    return CheckMapCollision(x, y);
    //CollidesWithFolk(x, y, true, id) ||
    //CollideWithPlayer(x, y);
}

function BugreiroTileMovementThroughPathNode(node, entity, dt, moveDuration) {

    entity.moveTimer += dt / moveDuration;

    if (entity.moveTimer >= 1) {
        entity.moveTimer = 1;
        entity.isMoving = false;
    }

    if (entity.hspd !== 0) {
        entity.x = scintilla.Math.lerp(entity.oldPos.x, entity.destPos.x, entity.moveTimer);
    }

    if (entity.vspd !== 0) {
        entity.y = scintilla.Math.lerp(entity.oldPos.y, entity.destPos.y, entity.moveTimer);
    }

    WorldToTile(entity.x - 8, entity.y - 8, entity.tile);

    if (entity.moveTimer >= 0.5) {
        entity.oldTile.x = entity.tile.x;
        entity.oldTile.y = entity.tile.y;
    }

    if (entity.isMoving === false) {

        entity.x = entity.destPos.x;
        entity.y = entity.destPos.y;

        RoundToTile(entity);
        entity.navigation++;
        WorldToTile(entity.x - 8, entity.y - 8, entity.tile);


        var canShoot = null;

        if (Environment.reachCity === false) {
            canShoot = BugreiroCanShoot(entity, entity.target);

            if (canShoot === null) {
                var anotherTarget = GetNearestFolkByTile(entity.tile.x, entity.tile.y);
                if (anotherTarget !== null) {
                    canShoot = BugreiroCanShoot(entity, anotherTarget);
                }
            }
        }

        if (canShoot === null) {

            var len = node.length;
            var inRadius = true;

            if (entity.target !== null) {
                inRadius = scintilla.Math.inManhattanRadius(entity.targetTile.x, entity.targetTile.y, entity.target.tile.x, entity.target.tile.y, 4);
            }

            if (inRadius) {

                if (entity.navigation < len) {

                    var current = node[entity.navigation];

                    var continuePath = BugreiroAICollisionTest(current.x, current.y);
                    if (entity.target !== null) {
                        continuePath = continuePath || entity.target.dead === true;
                    }

                    if (!continuePath) {
                        if (Environment.reachCity === false) {
                            var dir = ActivePathNodeMovement(entity, current);
                            ChangeBugreiroState(entity, 1, dir);
                            return;
                        }
                    }
                } 
            }
                
        } else {

            BugreiroAIScheduleAttack(entity, canShoot);
            return;
        }

        // moving end
        node = null;
        entity.navigation = 0;
    }
}

function InAxis(bug, target) {

    if (bug.tile.x === target.tile.x) {
        return 1;
    } else if (bug.tile.y === target.tile.y) {
        return 2;
    } else {
        if (bug.tile.x === target.toTile.x) {
            return 1;
        } else if (bug.tile.y === target.toTile.y) {
            return 2;
        }
    }

    return 0;

}

function IsNear(bug, target) {
    if (target === null)
        return false;

    var xRadius, yRadius;

    xRadius = bug.tile.x - target.tile.x;
    yRadius = bug.tile.y - target.tile.y;

    if (yRadius === 0) {
        if (xRadius === 1) {
            return 1;
        } else if (xRadius === -1) {
            return 0;
        }
    } else if (xRadius === 0) {
        if (yRadius === 1) {
            return 2;
        } else if (yRadius === -1) {
            return 3;
        }
    }

    return null;
}

function BugreiroCanShoot(bug, target) {

    if (target === null)
        return null;

    if (target.dead)
        return null;

    var axis = InAxis(bug, target);

    if (axis !== 0) {

        var isNearDir = IsNear(bug, target);

        if (isNearDir !== null) {
            return {
                shoot: false,
                axis: axis,
                dir: isNearDir,
                target: target
            };
        } else {


            var mvx = 0;
            var mvy = 0;

            if (axis === 2) {
                if (bug.tile.x > target.tile.x) {
                    mvx = -1;
                } else if (bug.tile.x < target.tile.x) {
                    mvx = 1;
                }
            }

            if (mvx === 0) {
                if (bug.tile.y > target.tile.y) {
                    mvy = -1;
                } else if (bug.tile.y < target.tile.y) {
                    mvy = 1;
                }
            }

            if (scintilla.Math.inManhattanRadius(bug.tile.x, bug.tile.y, target.tile.x, target.tile.y, TRACE_LENGTH)) {
                if (TraceToTarget(bug.tile, target, mvx, mvy, TRACE_LENGTH)) {
                    return {
                        shoot: true,
                        axis: axis,
                        v: mvy,
                        h: mvx,
                        target: target
                    };
                }
            }


        }

    }

    return null;
}

function BugreiroAIScheduleAttack(bug, canShoot) {

    if (canShoot.shoot) {
        if (Environment.bullets.length < MAX_BULLETS) {
            bug.chainNode = null;
            bug.navigation = 0;

            var dir;

            if (canShoot.v !== 0) {
                dir = (canShoot.v === -1) ? 2 : 3;
            }

            if (canShoot.h !== 0) {
                dir = (canShoot.h === 1) ? 0 : 1;
            }


            BugreiroShoot(bug, dir);
        } else {
            bug.isMoving = false;
            bug.moveTimer = 0;
            bug.animMachine.stop();
        }
    } else {
        if (canShoot.target.dead === false) {
            BugreiroAttack(bug, canShoot.target, canShoot.dir);
        } else {
            bug.isMoving = false;
            bug.moveTimer = 0;
            bug.animMachine.stop();
        }
    }

}