function FascistUpdate(dt) {

    // control if the bugreiro player shoot against the tribe
    if (Environment.endGame === 0) {

        var player = Environment.player;



        if (AntifaControl.peace === true) {
            if (this.onTribeArea === 0) {
                if (Environment.largeTribeArea.intersects(player.x, player.y, 8, 8)) {
                    this.onTribeArea = 1;
                    player.reachTheTribe = true;
                }
            } else if (this.onTribeArea >= 1) {

                if (this.onTribeArea === 1) {
                    if (Environment.tribeArea.intersects(player.x, player.y, 8, 8)) {
                        this.onTribeArea = 2;
                    }
                } else {
                    this.peacefulTime += dt;

                    if (this.peacefulTime >= 30) {
                        Environment.endGame = 1;
                    }
                }
            }
        } else {
            // verify if the game has ended
            if (Environment.folks.length === 0) {
                Environment.endGame = 2;
            }
            if (IsFolksCulled(this.camera)) {
                if (this.lastCulledCheck === false) {
                    this.lastCulledCheck = true;
                    this.peacefulTime = 0;
                }

                this.peacefulTime += dt;

                if (this.peacefulTime >= 10) {
                    Environment.endGame = 2;
                }

            } else {
                this.lastCulledCheck = false;
            }
        }

        if (player.tile.x <= -1) {
            if (Environment.folks.length === MAX_FOLKS) {
                Environment.endGame = 6;
            } else {
                Environment.endGame = 2;
            }
        }
    } else if (Environment.endGame > 0) {
        // set to game ending
        if (this.gameEnded === false) {


            if (AntifaControl.naziCount === 0) {
                this.toSymbol = 2;
                this.currentSymbol = 2;
                this.fromSymbol = 2;
                this.noSymbols = true;
                AntifaControl.activeSymbolBar = true;
            }


            if (Environment.endGame === 2) {
                this.endingImage = 'fuck_fascist';
            } else if (Environment.endGame === 1) {
                this.endingImage = 'hand_shaking';
                this.symbolFrame = quadSymbolFrame;
            } else if (Environment.endGame === 6) {
                this.endingImage = 'hat';
                this.symbolFrame = quadSymbolFrame;
            }

            this.circleCuts = (360 / (this.toSymbol * 4)) * scintilla.Math.toRadian;
            this.gameEnded = true;
            this.peacefulTime = 0;
            this.endingControl.start();
        }
    }
}

function AntifaUpdate(dt) {
  
    if (this.gameEnded === false) {
        var goToEndGame = false;
        if (Environment.endGame === 0) {


            if (Environment.player.dying === true) {

                /*if (Environment.player.tile.x < FPLAYER_TILE_START) {
                    if (this.toSymbol === 0) {
                        this.toSymbol = 4;
                        this.currentSymbol = this.toSymbol;
                        this.fromSymbol = this.toSymbol;
                        AntifaControl.activeSymbolBar = true;
                        this.symbolFrame = quadSymbolFrame;
                        this.noSymbols = true;
                    }
                } else {*/

                goToEndGame = true;
                this.endingImage = 'cocar';
                Environment.endGame = 4;
            }


        } 
        
        if (Environment.endGame === 5) {
            this.endingImage = 'revolution';
            goToEndGame = true;
        }

        if (goToEndGame === true) {
            this.currentSymbol = this.toSymbol;
            this.symbolFrame = flagSymbolFrame;
            this.noSymbols = false;
            this.circleCuts = (360 / this.toSymbol) * scintilla.Math.toRadian;
            this.gameEnded = true;
            this.peacefulTime = 0;
            this.endingControl.start();
        }
    }


}


function GameUI(drawer) {

    var endingEvent = this.endingControl.currentEvent;

    if (this.currentSymbol > 0) {

        var fx = 2;
        var fy = 5;
        var ended = false;

        if (this.gameEnded === true) {

            if (this.noSymbols) {
                fy = -8;
            }
            ended = (endingEvent < 0) ? false : true;
        }

        var blinky = 0;
        var ang = SYMBOL_START_ANGLE;
        var xx, yy, i = 0;


        for (; i < this.currentSymbol * this.symbolMultiplier; i++) { // 64

            blinky = ((this.blinkSymbolTrigger - (i % 2)) === 0) ? 0 : 1;

            if (ended === false) {
                drawer.spritePart('effects', fx + (10 * i), fy - blinky, this.symbolFrame.x, this.symbolFrame.y + (blinky * 8), 8, 8);
            } else {

                if (endingEvent <= 0) {
                    xx = scintilla.Math.lerp(fx + (10 * i), 160 + Math.cos(ang) * SYMBOL_RADIUS, this.peacefulTime);
                    yy = scintilla.Math.lerp(fy, 120 + Math.sin(ang) * SYMBOL_RADIUS, this.peacefulTime);
                } else {
                    xx = 160 + Math.cos(ang) * SYMBOL_RADIUS;
                    yy = 120 + Math.sin(ang) * SYMBOL_RADIUS;
                }

                if (Environment.endGame === 2) {
                    if (endingEvent <= 0) {
                        drawer.spritePart('effects', xx, yy - blinky, this.symbolFrame.x, this.symbolFrame.y + (blinky * 8), 8, 8);
                    } else {
                        drawer.spritesheet('dol_to_naz_' + blinky.toString(), xx, yy - blinky, this.symbolFrameIndex);
                    }
                } else if (this.noSymbols) {
                    drawer.spritesheet('rot_quad', xx, yy - blinky, blinky);
                } else {
                    drawer.spritePart('effects', xx, yy - blinky, this.symbolFrame.x, this.symbolFrame.y + (blinky * 8), 8, 8);
                }

                ang += this.circleCuts;
            }

        }
    }


    if (this.gameEnded === true) {

        if (endingEvent >= 3) {
            drawer.font('Press Start 2P', 7, 'normal');
            drawer.text(this.endFirstText, 160, 16, 'white', 'center');
            if (endingEvent >= 4) {
                drawer.text(this.endSecText, 160, 26, 'white', 'center');
                if (endingEvent >= 5) {
                    if (this.endThrText !== null) {
                        drawer.text(this.endThrText, 160, 228, 'white', 'center');
                    }
                }
                drawer.alpha = this.tParam3;
                drawer.spritesheet(this.endingImage, 160, 120, this.blinkEndingImageTrigger ? 0 : 1, 0.5, 0.5);
                drawer.alpha = 1;
            }
        }
    }

}


function GameEndingControlEventUpdate(currentStep, stepTimer, dt, endingControl) {
    if (Environment.endGame > 0) {

        switch (currentStep) {
            case 0:
                { // move the symbols to circle
                    this.peacefulTime = stepTimer;
                    break;
                }

            case 1:
                { // change dollar to nazi symbol
                    this.tParam2 += dt / 0.24;
                    if (this.tParam2 >= 1) {
                        this.tParam2 = 0;
                        this.symbolFrameIndex += 1;
                        if (this.symbolFrameIndex >= 4) {
                            this.symbolFrameIndex = 3;
                            endingControl.nextEvent(2);
                        }
                    }
                    break;
                }
        }

        if (currentStep >= 4) {

            if (this.tParam3 !== 1) {
                if (this.tParam2 >= 1) {
                    this.tParam2 = 1;
                    this.tParam3 = 1;
                } else {
                    this.tParam2 += dt;
                    this.tParam3 = scintilla.Ease.in.cut(0, 1, this.tParam2, 5);
                }
            }
        }

        if (currentStep >= 5 && currentStep < 1000) {

            if (this.key.pressed(scintilla.KeyCode.Enter)) {

                endingControl.nextEvent(1000);

            }
        }
    }

}


function GameControlEndingEventEnd(currentStep, endingControl) {
    switch (currentStep) {
        case 0:
            {
                this.tParam2 = 0;
                if (Environment.endGame === 2) {
                    endingControl.waitForEnd = true;
                } else {
                    endingControl.waitForEnd = false;
                    endingControl.nextEvent(2);
                }
                break;
            }
            // 1 dol to naz
        case 2:
            { // set phrase

                this.endThrText = null;

                if (Environment.endGame === 1) {
                    this.endFirstText = "THIS MAY BE AN ANSWER.";
                    // ENSURE... REJECT maybe?
                    this.endSecText = 'WILL IT NOT ENSURE OTHER FASCISM INSTANCES?'; // 43
                } else if (Environment.endGame === 2) {

                    this.endSecText = 'HERE IS A GIFT FOR YOU:';

                    if (AntifaControl.naziCount === 0)
                        this.endFirstText = "TRYING TO KILL PEOPLE?";
                    if (AntifaControl.naziCount > 0 && AntifaControl.naziCount <= 2)
                        this.endFirstText = "KILLING PEOPLE ISN'T COOL!";
                    else if (AntifaControl.naziCount > 2 && AntifaControl.naziCount <= 4)
                        this.endFirstText = "YOU'RE A FASCIST!";
                    else if (AntifaControl.naziCount >= 5)
                        this.endFirstText = "YOU'RE A FUCKING FASCIST!";
                } else if (Environment.endGame === 4) {

                    this.endFirstText = 'TO DIE FIGHTING FOR THE MOST BASIC OF RIGHTS';
                    this.endSecText = 'STILL IS A REALITY.';
                    this.endThrText = 'THE FIGHT CONTINUES...';

                } else if (Environment.endGame === 5) {

                    //The journey was long. 
                    //Your land and your people has been destroyed.
                    // Enough with the unfair trade!
                    // It's time to fight fascism

                    this.endFirstText = "YOUR LAND AND YOUR PEOPLE HAS BEEN DESTROYED.";
                    this.endSecText = 'ENOUGH WITH UNFAIR TRADES!';
                    this.endThrText = 'IT\'S TIME TO FIGHT FASCISM!';
                } else if (Environment.endGame === 6) {

                    this.endFirstText = "YOU ABANDONED THESE DEMANDS";
                    this.endSecText = 'BUT THE PAST TOO?';

                }

                endingControl.duration = 0.5;

                break;
            }
            // 3, 4, 5 is pause
        case 5:
            {
                //endingControl.waitForEnd = true;
                endingControl.end();
                break;
            }
    }
}