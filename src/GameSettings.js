function RandomWhile(value) {
    var param;
    while (param !== value) {
        param = scintilla.Random.irange(0, 3);
    }
    return param;
}

function RandomizeFolksParameters(folks) {

    var lowLevel = 0;
    var midLevel = 0;
    var highLevel = 0;
    var folk, param;
    var len = folks.length;
    var i = len;

    while (i--) {

        folk = folks[i];
        param = scintilla.Random.irange(0, 3);

        if (param === 0 && lowLevel < 2) {
            param = RandomWhile(0);
        }
        if (param === 1 && midLevel < 4) {
            param = RandomWhile(1);
        }
        if (param === 2 && highLevel < 2) {
            param = RandomWhile(2);
        }

        switch (param) {
            case 0:
                {
                    if (AntifaControl.fascistMode === true) {
                        folk.smartness = scintilla.Random.irange(10, 15);
                    } else {
                        folk.smartness = scintilla.Random.irange(5, 10);
                    }
                    folk.spd = 35;
                    lowLevel++;

                    //
                    break;
                }
            case 1:
                {
                    folk.smartness = scintilla.Random.irange(15, 25);
                    if (AntifaControl.fascistMode === true) {
                        folk.spd = 50;
                    } else {
                        folk.spd = 45;
                    }
                    midLevel++;
                    //folk.smartness = scintilla.Random.irange(25, 40);
                    break;
                }
            case 2:
                {


                    if (AntifaControl.fascistMode === true) {
                        folk.smartness = scintilla.Random.irange(20, 50);
                        folk.spd = 60;
                    } else {
                        folk.smartness = scintilla.Random.irange(20, 35);
                        folk.spd = 50;
                    }

                    highLevel++;
                    break;
                }
        }

        folk.spdDuration = 16 / folk.spd;
        folk.animMachine.machine.duration = 240;
    }

    if (AntifaControl.fascistMode === true) {
        // select one folk to be 'extremely intelligent': 
        i = scintilla.Random.irange(0, len);

        folks[i].smartness = 100;
        folks[i].spd = 75;
        folks[i].spdDuration = 16 / folk.spd;
    }
}

function RandomizeSpawnPoint(spawnPointsObjects, alreadySpawned) {

    var objPos;
    var allEqual = false;
    var rng;
    var j;
    var size = spawnPointsObjects.length;

    while (true) {
        allEqual = false;
        rng = scintilla.Random.irange(0, size);

        if (alreadySpawned.length !== 0) {
            for (j = 0; j < alreadySpawned.length; j++) {
                if (alreadySpawned[j] === rng) {
                    allEqual = true;
                    break;
                }
            }
        }

        if (allEqual === false) {
            objPos = spawnPointsObjects.get(rng);
            alreadySpawned.push(rng);
            break;
        }

    }

    return objPos;
}

function InstantiateFolks(scene, spawnPointsObjects, alreadySpawnedPoints, playerFolkID, offset) {

    var folk;
    var folks = [];
    var objPos;

    if (playerFolkID === undefined) playerFolkID = -1;

    for (var i = 0; i < MAX_FOLKS; i++) {

        if (playerFolkID === i)
            continue;

        folk = scene.entity.create(Folk);
        folk.animMachine.machine = 'folk_' + i.toString();

        objPos = RandomizeSpawnPoint(spawnPointsObjects, alreadySpawnedPoints);

        folk.Setup(objPos.x + offset, objPos.y, i);
        folks.push(folk);
    }

    RandomizeFolksParameters(folks);

    Environment.folks = folks;

}

function CreateFolkPlayer(scene, spawnPointsObjects, alreadySpawnedPoints, offset) {
    var player = scene.entity.create(FolkPlayer);
    var folkID = scintilla.Random.irange(0, MAX_FOLKS);
    player.animMachine.machine = 'folk_' + folkID.toString();
    player.folkIDName = "_" + folkID.toString();
    player.id = folkID;

    var objPos = RandomizeSpawnPoint(spawnPointsObjects, alreadySpawnedPoints);
    player.Setup(objPos.x + offset, objPos.y);
    player.animMachine.machine.duration = (player.spdDuration / 2) * 1000;
    return player;
}

function CommonGameEndingEventsUpdate(currentEvent, t, dt, endingControl) {

    switch (currentEvent) {
        // -3 is pause
        case -2: // fade out
            {
                this.tParam = scintilla.Ease.in.cut(0, 1, t, 4);
                break;
            }

            // -1 is pause
        case 1000:
            {
                var tVolume = t / 0.85;
                


                if (tVolume >= 1)
                    tVolume = 1;

                this.bgm.volume = scintilla.Math.lerp(0.3, 0.0, tVolume);
                break;
            }
    }
}

function CommonGameEndingEventsEnd(currentEvent, endingControl) {

    switch (currentEvent) {
        case -3:
            {
                endingControl.eventDuration = 1;
                break;
            }

        case 999:
            {
                /*this.events.subscribeOnce('transition_end', function () {
                    endingControl.nextEvent();
                });*/
                this.transition.in();
                endingControl.eventDuration = 2;
                endingControl.waitForEnd = false;
                break;
            }
        case 1000:
            {
                //endingControl.eventDuration = 0.1;
                this.audio.stopAll(true);
                this.scene.set('title');
                break;
            }
        case 1001:
            {
                this.audio.stopAll(true);
                this.scene.set('title');
                break;
            }
    }

}

function GameEnding(context) {
    this.onEventEnd = null;
    this.onEventUpdate = null;
    this.context = context;
    this.currentEvent = 0;
    this.active = false;
    this.eventTimer = 0;
    this.eventDuration = 1;
    this.waitForEnd = false;
    this.t = 0;
    var shouldEnd = false;
    var commonEvents = true;

    this.reset = function () {
        this.onEventEnd = null;
        this.onEventUpdate = null;
        this.currentEvent = -3;
        this.active = false;
        this.eventTimer = 0;
        this.eventDuration = 1;
        shouldEnd = false;
        commonEvents = true;
    };

    this.update = function (dt) {

        if (!this.active)
            return;

        this.eventTimer += dt; // / this.eventDuration;
        this.t = this.eventTimer / this.eventDuration;

        if ( this.eventTimer >= this.eventDuration) {
            this.eventTimer = this.eventDuration;
            this.t = 1;
            shouldEnd = true;
        }

        if (commonEvents === true) {
            CommonGameEndingEventsUpdate.call(this.context, this.currentEvent, this.t, dt, this);
        }
        if (this.onEventUpdate !== null) {
            this.onEventUpdate.call(this.context, this.currentEvent, this.t, dt, this);
        }

        if (shouldEnd === true && this.waitForEnd === false) {
            this.nextEvent();
        }

    };

    this.start = function () {
        this.active = true;
        this.currentEvent = -3;
        this.eventDuration = 1.5;
        this.eventTimer = 0;
        shouldEnd = false;
        commonEvents = true;
        this.waitForEnd = false;
    };

    this.end = function () {
        this.currentEvent = 999;
        this.eventDuration = 10;
        commonEvents = true;
        shouldEnd = false;
        this.eventTimer = 0;
        this.waitForEnd = false;
    };

    this.nextEvent = function (eventIndex) {

        var oldEvent = this.currentEvent;
        var newEvent = oldEvent + 1;

        if (eventIndex !== undefined) {
            newEvent = eventIndex;
        } 

        if (newEvent === oldEvent)
            return;

        this.currentEvent = newEvent;        
        this.waitForEnd = false;

        if (commonEvents === true) { /// common game ending events
            CommonGameEndingEventsEnd.call(this.context, oldEvent, this);

            if (newEvent >= 0 && newEvent < 999) {
                commonEvents = false;
            }

        } else { // user ending events
            if (this.onEventEnd !== null) {
                this.onEventEnd.call(this.context, oldEvent, this);
            }
            //if (commonEvents === false) {
                //oldEvent++;
            //}
        }

        this.t = 0;
        this.eventTimer = 0;
        shouldEnd = false;

    };

}