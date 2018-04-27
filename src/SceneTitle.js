function SceneTitle() {

    this.blinkStartTime = 0;
    this.blinkStart = false;
    var neoRotX = 0;
    var neoRotY = 0;
    var angt = 0;
    var rot = 0;
    var bugPosX = 62 + 114.5;
    var bugPosY = 57 + 24.5
    var it = 1;
    var optionsMenu = false;
    var optionsSelect = false;
    var startGame = 0;
    var bgm = null;
    var waitForFade = false;

    this.start = function () {

        optionsMenu = false;
        optionsSelect = false;
        startGame = 0;
        bgm = null;
        this.blinkStartTime = 0;
        this.blinkStart = false;

        this.transition.out();
        waitForFade = true;

        this.events.subscribeOnce('transition_end',
            function () {
                waitForFade = false;
            }, this);

        bgm = this.audio.get('bgm');

        if (bgm !== null) {
            if (!bgm.isPlaying) {
                bgm.play();
            }
        } else {
            bgm = this.audio.playPersistent('titleMusic', 0.3, true, 'bgm');
        }
    };

    this.update = function (dt) {

        if (startGame === 0) {

            var confirmKey = this.key.pressed(scintilla.KeyCode.Enter) || this.key.pressed(scintilla.KeyCode.Space);

            if (!optionsMenu) {

                this.blinkStartTime += dt;

                if (this.blinkStartTime >= 0.5) {
                    this.blinkStart = !this.blinkStart;
                    this.blinkStartTime = 0;
                }
                if (waitForFade === false) {
                    if (confirmKey) {
                        optionsMenu = true;
                        this.audio.playOnce('ok', 0.5);
                    }
                }
            } else {

                var arrowKey = this.key.pressed(scintilla.KeyCode.Up) || this.key.pressed(scintilla.KeyCode.Down);

                if (arrowKey) {
                    this.audio.playOnce('ok', 0.5);
                    optionsSelect = !optionsSelect;
                }

                if (confirmKey) {
                    this.transition.in();
                    this.audio.playOnce('ok', 0.5);
                    this.blinkStartTime = 0;
                    AntifaControl.fascistMode = optionsSelect;
                    this.events.subscribeOnce('transition_end', function () {
                        startGame = 2;
                    });
                    startGame = 1;
                }
            }


        } else {

            if (startGame === 2) {

                this.blinkStartTime += dt;

                var tVolume = this.blinkStartTime / 1.5;

                if (tVolume >= 1)
                    tVolume = 1;

                bgm.volume = scintilla.Math.lerp(0.3, 0, tVolume);


                if (this.blinkStartTime >= 2) {
                    this.audio.stopAll(true);
                    this.scene.set('game');
                }
            }
        }


        angt += (dt / 6.0);

        if (angt >= 1) {
            angt = 0;
        }
        rot = scintilla.Math.toRadian * (angt * 360);

        neoRotX = Math.cos(rot);
        neoRotY = Math.sin(rot);
    };

    this.gui = function (drawer) {

        drawer.defaultComposite();

        drawer.sprite('titleChroma', bugPosX, bugPosY, 0.5, 0.5);
        //drawer.spriteSkew('titleChroma', bugPosX, bugPosY, -neoRotX * 0.0025, neoRotY * 0.0025, 0.5, 0.5);
        drawer.composite = 'destination-in';
        drawer.spriteSkew('titleBugre', bugPosX, bugPosY, neoRotX * 0.05, -neoRotY * 0.05, 0.5, 0.5);
        drawer.composite = 'destination-over';

        var itX, itY;
        var tanY = Math.atan(neoRotY) * 0.05;
        var tanX = Math.atan(neoRotX) * 0.05;

        for (; it < 4; it++) {
            itX = it * 80; //64; // 4, 8
            itY = it * 64; //64;
            drawer.alpha = scintilla.Math.lerp(1, 0.0, ((it - 1) / 3));
            drawer.spriteSkew('titleBugreBack',
                bugPosX + (itX * tanX),
                bugPosY + (itY * tanY),
                neoRotX * 0.05, -neoRotY * 0.05, 0.5, 0.5);
        }

        drawer.alpha = 1;
        it = 1;

        drawer.sprite('titleBg', 0, 0);

        drawer.defaultComposite();

        drawer.spriteSkew('titleBorder', bugPosX + neoRotX, bugPosY + neoRotY, neoRotX * 0.05, -neoRotY * 0.05, 0.5, 0.5);
        drawer.sprite('titleNeo', 14 + (neoRotX * 4), 12 + (4 - neoRotY * 3));


        drawer.font('Press Start 2P', 8);
        drawer.color = '#fff';

        if (!optionsMenu) {
            drawer.align = 'center';
            if (this.blinkStart) {
                drawer.text('PRESS START', 160, 164);
            }
            drawer.align = 'left';
        } else {
            drawer.align = 'center';
            drawer.text('FAIR TRADE?', 160, 148);
            drawer.align = 'left';
            var xx = 156 - 4; // 148
            //var unicode = eval('"\\u' + 2192 + '"'); //String.fromCharCode("8594");
            //drawer.text(">", 148 - 16, 148 + 16 + (((optionsSelect) ? 1 : 0) * 12));
            drawer.spritePart('effects', xx - 16, 148 + 8 + (((optionsSelect) ? 1 : 0) * 12), 96, 24, 8, 8);
            drawer.text('YES', xx, 148 + 16);
            drawer.text('NO', xx, 148 + 16 + 12);
        }

        drawer.text('TOBIASBU', 8, 232);

        drawer.align = 'right';
        drawer.text('MUSIC BY NILS FESKE', 320 - 8, 232);
        //drawer.text('2018', 320 - 8, 232);
    };
}