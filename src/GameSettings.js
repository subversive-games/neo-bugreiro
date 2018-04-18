function InitializeFascistMode() {

}

function RandomizeFolksParameters(folks) {

    var badCount = 0;

    for (var i = 0; i < folks.length; i++) {

        var folk = folks[i];

        if (scintilla.Random.integerRange(0,100) < 30 && badCount < 2) {
            folk.spd = 25;
            badCount++;
        } else {
            folk.spd = 50;
           
        }
        folk.spdDuration = 16 / folk.spd;
        folk.animMachine.machine.duration = folk.spdDuration / 2 * 1000;
    }
}

function InstantiateFolks(scene, tilemap) {

    // Folks
    var objlayer = tilemap.getObjectsLayer('FolkSpawn');
    var objs = objlayer.objects;
    var size = objs.length;

    var alreadySpawned = [];
    var folk;
    var folks = [];
    for (var i = 0; i < MAX_FOLKS; i++) {

        folk = scene.entity.create(Folk);
        folk.animMachine.machine = 'folk_' + i.toString();

        var objPos;

        while (true) {
            var allEqual = false;
            var rng = scintilla.Random.integerRange(0, size);

            if (alreadySpawned.length !== 0) {
                for (var j = 0; j < alreadySpawned.length; j++) {
                    if (alreadySpawned[j] === rng) {
                        allEqual = true;
                        break;
                    }
                }
            }

            if (allEqual === false) {
                objPos = objs[rng];
                alreadySpawned.push(rng);
                break;
            }

        }

        folk.Setup(objPos.x, objPos.y, i);
        folks.push(folk);
    }

    RandomizeFolksParameters(folks);
    
    Environment.folks = folks;

}