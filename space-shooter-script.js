
// Space shooter script

// Using strict to maintain quality

'use strict';

// Start script after load

window.addEventListener( 'load', function startScript() {

	// *** Initial Setup

	// Creating canvas on the fly to adjust it's size relative to viewport

	const canvas = document.createElement( 'canvas' );

	// Setting global variables for later development

	const ctx = canvas.getContext( '2d' ),
		audioCtx = new ( window.AudioContext || window.webkitAudioContext )();
	let canvasWidth,
		canvasHeight;

	// Function to set canvas width and height based on viewport

	function setCanvas() {
		canvas.height = canvasHeight = window.innerHeight;
		canvas.width = canvasWidth = window.innerWidth;
		if ( window.innerWidth > 768 ) {
			canvas.width = canvasWidth = 768;
		}
	}

	// Setting canvas initially and also on resize

	setCanvas();
	window.addEventListener( 'resize', setCanvas );

	// Finally appending it to the page

	document.querySelector( 'body' ).insertBefore(
		// Yeah, I'm lazy
		canvas, document.querySelector( 'script' )
	);


	// *** Game development section (oh god)

	// As most appropriate for a game, we'll be developing in a OOP style

	/* This will be a game manager object responsible for starting, updating
	 * and changing states of the game
	 */

	const gameManager = {

		startGame() {
			gameObject.id = requestAnimationFrame( this.updateGame );
		},

		/* This method will game status by handling game object 
		 * methods and properties
		 */

		updateGame(time) {
			
			if ( gameObject.state.wasPaused ) {
				gameObject.state.wasPaused = false;
				gameObject.time.currentTime = time;
			}

			// Updating time values


			gameObject.time.pastTime = gameObject.time.currentTime;
			gameObject.time.currentTime = time;
			gameObject.time.delta =
			gameObject.time.currentTime - gameObject.time.pastTime;
			gameObject.time.deltaRate = gameObject.time.delta / 16;

			// Checking screens to behave accordingly

			// Switch hack better than 1000's of if-else-if, don't you think ?

			switch( true ) {

				case gameObject.screen.onLoadingScreen:

					if ( gameObject.loader.loaded ) {
						gameObject.audio.playSound(
							gameObject.media.gameTracks[3], true, true
						);
						gameObject.screen.changeScreen( 'onIntroScreen' );
					}
					else if ( !gameObject.loader.loading ) {
						gameObject.loader.loading = true;
						gameObject.loader.load();
					}
					else {

						// Draw loading screen

						gameObject.graphics.clear();
						gameObject.graphics.drawBackground();
						gameObject.graphics.drawLoadingScreen();

					}

					break;

				case gameObject.screen.onIntroScreen:

					gameObject.interface.scrollText.move();
					gameObject.interface.scrollText.update();

					// Drawing scrolling text

					gameObject.graphics.clear();
					gameObject.graphics.drawBackground();
					gameObject.graphics.drawScrollText();

					if ( gameObject.interface.scrollText.finished ) {

						// Reseting properties for ending

						gameObject.interface.scrollText.reset();
						gameObject.screen.changeScreen( 'onTitleScreen' );

					}

					break;

				case gameObject.screen.onTitleScreen:

					gameObject.interface.title.update();
					gameObject.graphics.clear();
					gameObject.graphics.drawBackground();
					gameObject.graphics.drawTitle();

					break;

				case gameObject.screen.onCreditScreen ||
						 gameObject.screen.onHowToScreen ||
						 gameObject.screen.onOptionScreen:

				  gameObject.interface.backBtn.update();
					gameObject.graphics.clear();
					gameObject.graphics.drawBackground();

					if ( gameObject.screen.onCreditScreen ) {
						gameObject.graphics.drawCredits();
					}
					else if ( gameObject.screen.onHowToScreen ) {
						gameObject.graphics.drawHowTo();
					}
					else {
						gameObject.interface.options.update();
						gameObject.graphics.drawOptions();
					}

					gameObject.graphics.drawBackBtn();

					break;

				case gameObject.screen.onPlayingScreen:

					/* We won't handle everything about the game here for code
					 * readability and maintenance purposes. Instead for most tasks 
					 * we'll call specific components' methods if some condition is met.
					 */

					if ( !gameObject.state.started &&
					     !gameObject.state.inTransition ) {
						gameObject.state.inTransition = true;
						gameObject.audio.changeTrack(
							gameObject.media.gameTracks[4],
							true,	true, false
						);
						showSmallController();	// For small viewports
					}
					else if ( gameObject.state.inTransition ) {

						if ( gameObject.audio.transitionFinished &&
						     gameObject.screen.transitionReady ) {
							gameObject.audio.transitionFinished = false;
							gameObject.state.inTransition = false;
							gameObject.state.started = true;
						}

						gameObject.screen.transitionScreen();

					}

					// Game Started

					else if ( gameObject.state.started &&
										!gameObject.state.gameOver.started ) {

						// Changing states based on game progression

						if ( !gameObject.state.level1.started ) {
							gameObject.state.level1.started = true;
						}
						// Registering victory in level 1
						else if ( gameObject.state.level1.bossFinished &&
											!gameObject.state.level1.inVictory &&
											gameObject.audio.transitionFinished )
						{
							gameObject.state.level1.inVictory = true;
							gameObject.state.victory.intervalReferenceTime =
							gameObject.time.currentTime;
						}
						// Registering victory in level 2
						else if ( gameObject.state.level2.bossFinished &&
											!gameObject.state.level2.inVictory &&
											gameObject.audio.transitionFinished )
						{
							gameObject.state.level2.inVictory = true;
							gameObject.state.victory.intervalReferenceTime =
							gameObject.time.currentTime;
						}

						// Performing actions

						gameObject.components.update();
						gameObject.components.moveAll();
						gameObject.components.checkAll();

						// Drawing

						gameObject.graphics.clear();
						gameObject.graphics.drawBackground();
						gameObject.graphics.drawPowerUps();
						gameObject.graphics.drawShots();
						gameObject.graphics.drawPlayer();
						gameObject.graphics.drawEnemies();
						gameObject.graphics.drawInfo();

						/* These will be level transitions that will mainly provide
						 * a room for the background or screen to change
						 */

						// Level 1 transition

						if (	gameObject.state.level1.inVictory &&
									!gameObject.state.level2.started &&
									gameObject.time.currentTime -
									gameObject.state.victory.intervalReferenceTime >
									gameObject.state.victory.intervalTime )
						{

							gameObject.screen.transitionScreen();

							if ( gameObject.screen.transitionReady &&
									 !gameObject.state.level1.finished ) {

								gameObject.state.level1.finished = true;
								gameObject.audio.changeTrack(
									gameObject.media.gameTracks[5],
									true, true, false
								);

							}
							else if ( gameObject.screen.transitionFinished ) {

								gameObject.state.level2.started = true;

								// Reseting transition properties

								gameObject.screen.transitionScreen();

							}

						}

						/* Level 2 transition. If there were more levels, this would
						 * be almost the same as level 1 conditionals. We could even
						 * write a general check for all of these, but the goal here
						 * is just to provide a base structure
						 */


						else if ( gameObject.state.level2.inVictory &&
									    !gameObject.state.level2.finished &&
									    gameObject.time.currentTime -
											gameObject.state.victory.intervalReferenceTime >
											gameObject.state.victory.intervalTime )
						{

							gameObject.screen.transitionScreen();

							if ( gameObject.screen.transitionReady ) {

								gameObject.state.level2.finished = true;
								gameObject.audio.changeTrack(
									gameObject.media.gameTracks[5],
									true, true, false
								);
								gameObject.screen.changeScreen( 'onEndingScreen' );
								hideSmallController();

							}

						}

						// Handling end of start and eventual game over transitions

						// This will be at last as it needs to be drawn over everything

						if ( gameObject.screen.transitionStarted &&
						     !gameObject.screen.transitionFinished &&
						     !gameObject.state.gameOver.inTransition &&
						     !gameObject.state.gameOver.started ) {

							gameObject.screen.transitionScreen();

							// To restart properties, in case we need more transitions

							if ( gameObject.screen.transitionFinished ) {
								gameObject.screen.transitionScreen();
							}

						}
						else if ( gameObject.state.gameOver.inTransition &&
											!gameObject.screen.transitionReady ) {

							gameObject.screen.transitionScreen();

							if ( gameObject.screen.transitionReady ) {
								gameObject.audio.changeTrack(
									gameObject.media.gameTracks[0],
									false,
									true,
									false
								);
								gameObject.state.gameOver.inTransition = false;
								gameObject.state.gameOver.started = true;
								gameObject.state.resetGame();
								gameObject.screen.changeScreen( 'onGameOverScreen' );
								hideSmallController();
							}

						}

					}


					break;

				case gameObject.screen.onGameOverScreen:

					/* Audio will be loaded from the last conditional of playing
					 * screen, so we can use it to activate the timer for game over
					 * animation
					 */

					if ( gameObject.audio.transitionFinished &&
					     !gameObject.state.gameOver.audioLoaded ) {
						gameObject.audio.transitionFinished = false;
						gameObject.state.gameOver.audioLoaded = true;
						gameObject.state.gameOver.intervalReferenceTime =
						gameObject.time.currentTime;
						gameObject.graphics.clear();
						gameObject.graphics.drawGameOver(); // Else we get a flicker
					}
					else if ( gameObject.state.gameOver.audioLoaded &&
										gameObject.time.currentTime -
										gameObject.state.gameOver.intervalReferenceTime >=
										gameObject.state.gameOver.intervalTime) {

						// Changing to initial track

						if ( !gameObject.state.gameOver.finished ) {
							gameObject.state.gameOver.finished = true;
							gameObject.audio.changeTrack(
								gameObject.media.gameTracks[3],
								true, true, false
							);
						}
						else if ( gameObject.audio.transitionFinished ) {
							// Reseting audio state for future transitions
							gameObject.audio.transitionFinished = false;
						}

						// Title background, not actually there yet

						gameObject.graphics.clear();
						gameObject.graphics.drawTitle();
						gameObject.screen.transitionScreen();

						/* If transitionScreen method has already reseted properties,
						 * it's over
						 */

						if ( !gameObject.screen.transitionStarted ) {

							// Reseting game over properties

							gameObject.state.gameOver.inTransition = false;
							gameObject.state.gameOver.started = false;
							gameObject.state.gameOver.finished = false;
							gameObject.state.gameOver.audioLoaded = false;

							// Back to title

							gameObject.screen.changeScreen( 'onTitleScreen' );

						}

					}
					else {
						gameObject.graphics.clear();
						gameObject.graphics.drawGameOver();	
					}

					break;

				// Ending screen will show ending text and reset game

				case gameObject.screen.onEndingScreen:

					gameObject.interface.scrollText.move();
					gameObject.interface.scrollText.update();

					gameObject.graphics.clear();
					gameObject.graphics.drawBackground();
					gameObject.graphics.drawScrollText();

					if ( gameObject.interface.scrollText.finished ) {

						// Transitioning screen back to title

						gameObject.graphics.drawTitle();
						gameObject.screen.transitionScreen();

						if ( gameObject.screen.transitionFinished ) {

							// Reseting screen states

							gameObject.screen.transitionScreen();

							// Reseting game and scrollText properties

							gameObject.state.resetGame();
							gameObject.interface.scrollText.reset();

							// Actually changing to title screen

							gameObject.screen.changeScreen( 'onTitleScreen' );

						}

					}

					break;

				default:
					gameObject.graphics.drawBackground();

			}

			gameObject.id = requestAnimationFrame( gameManager.updateGame );

		},

		// Just in case we want to add a play/pause game command later

		stopGame() {
			window.cancelAnimationFrame( gameObject.id );
		}

	}

	/* The game object will hold all (or most) methods for game flow and some 
	 * data, such as game level, player score, lives, etc.
	 */

	const gameObject = {

		/* Game initial properties and methods. They will be organized in
		 * containers related to a task, e.g loading related, time related,
		 * graphics related, etc.
		 */

		id: null,       // To stop game on cancelAnim...

		// Time object for time based animations and features

		time: {
			currentTime: 0,
			pastTime: 0,
			delta: 0,
			deltaRate: 0
		},

		// Media resources

		media: {
			gameTracks: [], // game-over | victory | boss | title | level-1 | level-2

			gameSE: [],     // power-up | p-shot-2 | enemy-shot | p-shot-3 -->
											// p-shot-1

			gameImages: [], // bg-1 | boss-1 | enemy-1 | enemy-2 | player | bg-2 -->
										  // boss-2 | enemy-3 | enemy-4
		},

		// State object to keep track of game steps

		state: {

			// These will be used to control game states in game over, levels, etc.

			inTransition: false,
			started: false,
			finished: false,
			running: true,		 // If the game is running or paused
			wasPaused: false,  // A check needed to stop time animation on pause

			// Levels states

			level1: {
				started: false,
				bossScore: 10000,					
				bossStarted: false,
				bossFinished: false,
				inVictory: false,		// For victory track and level transition
				finished: false
			},

			level2: {
				started: false,
				bossScore: 60000,
				bossStarted: false,
				bossFinished: false,
				inVictory: false,
				finished: false
			},

			// This will take care of game over animation when player dies

			gameOver: {
				inTransition: false,
				started: false,
				finished: false,
				audioLoaded: false,
				intervalReferenceTime: 0,
				intervalTime: 12000		// Interval to show gameOver message
			},

			// This will keep track of victory animation time, and when to move on

			victory: {
				intervalTime: 15000,
				intervalReferenceTime: 0,
			},

			// Method to reset game properties

			resetGame() {

				// Background

				gameObject.components.background.x = 0;
				gameObject.components.background.y1 = 0;
				gameObject.components.background.y2 = -canvasHeight;
				gameObject.components.background.started = false;

				// Player

				gameObject.components.player.x = canvasWidth * .5 - 30;
				gameObject.components.player.y = canvasHeight * 1.1;
				gameObject.components.player.allowPlayer = false;
				gameObject.components.player.movingUp = false;
				gameObject.components.player.movingDown = false;
				gameObject.components.player.movingRight = false;
				gameObject.components.player.movingLeft = false;
				gameObject.components.player.shooting = false;
				gameObject.components.player.speed = 1 / 2;
				gameObject.components.player.lives = 3;
				gameObject.components.player.invincible = false;
				gameObject.components.player.hitPoints = 1;
				gameObject.components.player.score = 0;
				gameObject.components.player.deathAnimationCanDraw = true;
				gameObject.components.player.shots = [];
				gameObject.components.player.shotType = 1;
				gameObject.components.player.collisionCircle.x = canvasWidth * .5;
				gameObject.components.player.collisionCircle.y =
				canvasHeight * 1.1	+ 30;

				// Power ups

				gameObject.components.powerUps.list = [];
				gameObject.components.powerUps.spawnInterval = 35000;

				// Enemies

				gameObject.components.enemies.list = [];
				gameObject.components.enemies.bosses = [];
				gameObject.components.enemies.shots = [];
				gameObject.components.enemies.spawnInterval = 10000;

				// States

				gameObject.state.inTransition = false;
				gameObject.state.started = false;
				gameObject.state.finished = false;

				gameObject.state.level1.started = false;
				gameObject.state.level1.bossStarted = false;
				gameObject.state.level1.bossFinished = false;
				gameObject.state.level1.inVictory = false;
				gameObject.state.level1.finished = false;
				
				gameObject.state.level2.started = false;
				gameObject.state.level2.bossStarted = false;
				gameObject.state.level2.bossFinished = false;
				gameObject.state.level2.inVictory = false;
				gameObject.state.level2.finished = false;

				gameObject.state.victory.intervalReferenceTime = 0;

				// Audio reset

				gameObject.audio.currentStereo.pan.value = 0;
				gameObject.audio.currentStereoValue = 0

			}

		},

		/* New components object (yeah, there was an old one, actually interface)
		 * to contain player, enemies, etc.
		 */

		components: {

			// Game components and methods

			background: {

				/* There will be Ys positions as we need two backgrounds
				 * for infinite scroll effect
				 */

				x: 0,
				y1: 0,
				y2: -canvasHeight,
				width: canvasWidth,
				height: canvasHeight,
				started: false,

				move() {

					if ( !this.started ) {

						// Reset in case of resize

						this.started = true;
						this.y1 = -canvasHeight;
						this.y2 = -canvasHeight;

					}

					this.y1 += gameObject.time.deltaRate * ( 1 / 3 );
					this.y2 += gameObject.time.deltaRate * ( 1 / 3 );

					if ( this.y1 >= canvasHeight ) {
						this.y1 = -canvasHeight;
					}

					if ( this.y2 >= canvasHeight ) {
						this.y2 = -canvasHeight;
					}


					
				}

			},

			// Player object will hold player data, methods, states, etc.

			player: {

				x: canvasWidth * .5 - 30,			// Initial X
				y: canvasHeight * 1.1,        // Initial Y
				width: 60,
				height: 60,
				speed: 1 / 2,
				allowPlayer: false,           // Useful for simple animations
				lives: 3,
				hitPoints: 1,
				invincible: false,
				score: 0,

				// Properties for player death animation

				deathAnimationStep: 0,
				deathAnimationMaxStep: 10,
				deathAnimationInterval: 200,
				deathAnimationReferenceTime: 0,
				// If gameObject.graphics can draw player
				deathAnimationCanDraw: true,				

				// Control properties

				movingRight: false,
				movingLeft: false,
				movingUp: false,
				movingDown: false,
				shooting: false,

				// Player shot data

				shotInterval: 700,
				shotReferenceTime: 0,
				shots: [],			// Array with player shots
				shotType: 1,		// 1 || 2 || 3 depending on power ups

				// Collision circle

				collisionCircle: {
					x: canvasWidth * .5,
					y: canvasHeight * 1.1	+ 30,
					radius: 24
				},

				// Move method

				move() {

					// Intro animation

					if ( !this.allowPlayer ) {

						this.y -= gameObject.time.deltaRate * this.speed;
						this.x = canvasWidth * .5 - this.width / 2;  // If resize

						if ( this.y + this.height / 2 <= canvasHeight * .7 ) { 
							this.allowPlayer = true;  // Animation finished
						}

					} else {
						
						if ( this.movingUp ) {
							this.y -= gameObject.time.deltaRate * this.speed;
						}

						if ( this.movingDown ) {
							this.y += gameObject.time.deltaRate * this.speed;
						}

						if ( this.movingLeft ) {
							this.x -= gameObject.time.deltaRate * this.speed;
						}

						if ( this.movingRight ) {
							this.x += gameObject.time.deltaRate * this.speed;
						}

					}

					// Updating collision circle

					this.collisionCircle.x = this.x + this.width / 2;
					this.collisionCircle.y = this.y + this.height / 2;

				},

				// Shoot method to push shots in array

				shoot() {

					// Angles, radius and endurance

					let angles = [],
						radius,
						endurance,
						speed;

					
					if ( this.shotType === 1 || this.shotType === 2 ) {

						radius = 10;
						endurance = 1;
						speed = 2;

						if ( this.shotType === 1 ) {
							angles.push( -Math.PI / 2 );
						}
						else {
							angles.push( -3 * Math.PI / 4 );
							angles.push( -Math.PI / 2 );
							angles.push( -Math.PI / 4 );	
						}

					}
					else {
						radius = 20;
						endurance = 4;
						speed = 1;
						angles.push( -Math.PI / 2 );
					}

						
					angles.forEach( function pushShot(angle) {

						gameObject.components.player.shots.push( {

							// Player's center

							x: gameObject.components.player.x +
								 gameObject.components.player.width / 2,
							y: gameObject.components.player.y +
							   gameObject.components.player.height / 2,
							radius: radius,
							speed: speed,
							angle: angle,
							endurance: endurance,
							type: gameObject.components.player.shotType,
							move() {
								this.y += gameObject.time.deltaRate *
													this.speed * Math.sin( this.angle );
							  this.x += gameObject.time.deltaRate *
							  					this.speed * Math.cos( this.angle );

							}

						} );


					} );

					// Shoot effect is different for each type

					let shotAudio;

					if ( this.shotType === 1 ) {
						shotAudio = gameObject.media.gameSE[4];
					}
					else if ( this.shotType === 2 ) {
						shotAudio = gameObject.media.gameSE[1];
					}
					else {
						shotAudio = gameObject.media.gameSE[3];	
					}

					gameObject.audio.playSound( shotAudio, false, false, true );

				},

				// Animation for when player dies

				deathAnimate() {

					let result = true;  // To determine if we make a recursion call
					const player = gameObject.components.player;

					if ( gameObject.time.currentTime -
							 player.deathAnimationReferenceTime >
							 player.deathAnimationInterval ) {

						player.deathAnimationReferenceTime = gameObject.time.currentTime;
						player.deathAnimationCanDraw = !player.deathAnimationCanDraw;
						player.deathAnimationStep++;

						if ( player.deathAnimationStep === player.deathAnimationMaxStep ) {

							player.deathAnimationStep = 0;
							player.deathAnimationReferenceTime = 0;
							player.invincible = false;
							player.hitPoints = 1;
							result = false;

							if ( player.lives > 0 ) {
								player.deathAnimationCanDraw = true;
							}
							else {

								player.deathAnimationCanDraw = false;

								/* This is necessary in case the player dies in a level 
								 * transition, or else it may get broken, as it uses
								 * the same properties as keys to change screen, music, etc.
								 */

								gameObject.screen.transitionStarted = false;
								gameObject.screen.transitionReady = false;
								gameObject.screen.transitionFinished = false;
								gameObject.screen.transitionAlphaColor = 0;

								// Calling game over transitions and reseting audio

								gameObject.audio.transitionFinished = false;
								gameObject.state.gameOver.inTransition = true;

							}

						}

					}

					if ( result ) {
						window.requestAnimationFrame(
								gameObject.components.player.deathAnimate
							);
					}

				}

			},

			// Enemies object with enemy arrays, properties, etc.

			enemies: {
				
				list: [],      //  List with enemies to perform actions and checks
				bosses: [],    // Level bosses
				shots: [],
				spawnInterval: 10000,  		// This will vary slightly
				spawnReferenceTime: 0,		// Reference to check if we can spawn

				spawnEnemy() {

					/* Enemies will have different types and spawn interval will
					 * change slighty
					 */

					let type;

					if ( !gameObject.state.level1.finished ) {
						type = Math.round( Math.random() + 1 ); // 1 - 2
					}
					else if ( gameObject.state.level2.started ) {
						type = Math.round( Math.random() + 3 ); // 3 - 4
					}

					// Enemy data (vary with type)

					let hitPoints,
						scorePoints,
						deathAnimationInterval,
						deathAnimationMaxStep,
						width,
						height,
						speedX,
						speedY,
						shotOffsetX,
						shotOffsetY,
						shotWidth,
						shotHeight,
						shotRadius,
						shotEndurance,
						shotSpeed,
						shotInterval,
						shotSequenceInterval,
						shotSequenceMaxStep,
						canShoot;

					if ( type === 1 ) {

						width = 70;
						height = 70;
						speedX = .6 + ( ( Math.random() * 2 ) / 2 );
						speedY = ( .5 + Math.random() ) / 3;
						hitPoints = 1;
						scorePoints = 300;
						shotWidth = null;    	 // Not a rectangular shot
						shotHeight = null;
						shotOffsetX = width / 2;
						shotOffsetY = height / 2;
						shotRadius = 10;
						shotEndurance = 1;
						shotSpeed = 2;
						shotInterval = Math.round( Math.random() * 1500 + 2000 );
						shotSequenceInterval = 0;
						shotSequenceMaxStep = 1;
						deathAnimationInterval = 100;
						deathAnimationMaxStep = 12;
						canShoot = true;

					}
					else if ( type === 2 ) {

						width = 80;
						height = 80;
						speedX = .6 + ( ( Math.random() * 2 ) / 2 );
						speedY = ( .5 + Math.random() ) / 3;
						hitPoints = 2;
						scorePoints = 400;
						shotWidth = 4;    	 
						shotHeight = 10;
						shotOffsetX = ( width - shotWidth ) / 2;
						shotOffsetY = height / 2;
						shotRadius = null;		// Not a circular shot
						shotEndurance = 2;
						shotSpeed = 2;
						shotInterval = Math.round( Math.random() * 1500 + 2000 );
						shotSequenceInterval = 0;
						shotSequenceMaxStep = 1;
						deathAnimationInterval = 150;
						deathAnimationMaxStep = 10;
						canShoot = true;

					}
					else if ( type === 3 ) {

						width = 60;
						height = 80;
						speedX = 1.5 + Math.random();
						speedY = 2 + Math.random();
						hitPoints = 3;
						scorePoints = 4000;
						shotWidth = null;    	 
						shotHeight = null;
						shotOffsetX = width / 2;
						shotOffsetY = height / 2;
						shotRadius = 15;
						shotEndurance = 2;
						shotSpeed = 3;
						shotInterval = null;
						shotSequenceInterval = null;
						shotSequenceMaxStep = null;
						deathAnimationInterval = 100;
						deathAnimationMaxStep = 10;
						canShoot = false;

					}
					else if ( type === 4 ) {

						width = 80;
						height = 120;
						speedX = 2.5 + Math.random();
						speedY = 2 + Math.random();
						hitPoints = 4;
						scorePoints = 2500;
						shotWidth = 3;    	 
						shotHeight = 30;
						shotOffsetX = ( width - shotWidth ) / 2;
						shotOffsetY = height / 2;
						shotRadius = null;
						shotEndurance = 4;
						shotSpeed = 3;
						shotInterval = 1000;
						shotSequenceInterval = 300;
						shotSequenceMaxStep = 5;
						deathAnimationInterval = 100;
						deathAnimationMaxStep = 10;
						canShoot = false;						

					}

					this.spawnInterval -= Math.floor( Math.random() * 300 + 300 );

					if ( this.spawnInterval < 7000 ) {
						this.spawnInterval = 7000;
					}

					/* We'll put random xs and ys in variables because we need to
					 * reference them in the collision circle object
					 */

					const x = Math.random() * canvasWidth * .9 + 50,
						y = -30 - Math.random() * 30;

					// Hit points will vary depending on enemy type

					// Pushing enemy to enemies list

					this.list.push( {

						x: x,
						y: y,
						width: width,
						height: height,
						hitPoints: hitPoints,
						scorePoints: scorePoints,
						angle: Math.PI / 2,
						speedX: speedX,
						speedY: speedY,
						angleSpeed: Math.PI / 90,

						// Shot interval properties

						shotInterval: shotInterval,
						shotIntervalReferenceTime: 0,
						shotSequenceInterval: shotSequenceInterval,
						shotSequenceReferenceTime: 0,
						shotSequenceStep: 0,
						shotSequenceMaxStep: shotSequenceMaxStep,

						// If enemy can shoot

						canShoot: canShoot,

						// Death animation properties

						deathAnimationStep: 0,
						deathAnimationMaxStep: deathAnimationMaxStep,
						deathAnimationInterval: deathAnimationInterval,
						deathAnimationReferenceTime: 0,
						deathAnimationCanDraw: true,

						// If dead enemy will stop shooting and moving in the X axis

						dead: false, 
						type: type,

						/* Mainly for deathAnimate() to differentiate between bosses
						 * and common enemies
						 */

						isBoss: false,		

						// Collision circle for... well... collisions..

						collisionCircle: {
							x: x + width / 2,
							y: y + height / 2,
							radius: width * ( 2 / 5 )
						},

						// Move and shoot methods

						move() {

							/* For the first behavior, if the enemy is within a range,
							 * it will move around a certain area near the player, else
							 * it will move towards the player. The second will rotate
							 * in the player direction but will not move
							 */

							// Alias

							const player = gameObject.components.player;

							if ( this.type === 1 ) {


								if ( this.x <
										 player.x + ( player.width / 2 ) - canvasWidth * .3 )
								{
									this.speedX = Math.abs( this.speedX );
								}
								else if ( this.x + this.width > 
									player.x + ( player.width / 2 ) + canvasWidth * .3 )
								{
									this.speedX = -Math.abs( this.speedX );
								}

								// Position and collision circle updates
								
								if ( !this.dead ) {
									this.x +=	gameObject.time.deltaRate * this.speedX;	
									this.collisionCircle.x = this.x + this.width / 2;
								}
								
								this.y +=	gameObject.time.deltaRate * this.speedY;
								this.collisionCircle.y = this.y + this.height / 2;

							}
							else if ( this.type === 2 ) {

								/* We'll use some trigonometry here. We'll increase or
								 * decrease the angle based on the player's position.
								 * We'll get the actual angle and compare with the current
								 * one
								 */

								const	currentAngle =
								Math.atan2(
									player.y + player.height / 2 - this.y,
									player.x + player.width / 2  - this.x
								);


								/* If difference between angles is greater than
								 * angle speed to prevent bugs
								 */

								if ( Math.abs( this.angle - currentAngle ) >=
										 this.angleSpeed && !this.dead )
								{

									// Turn left or right

									if ( this.angle < currentAngle ) {
										this.angle += this.angleSpeed;
									}
									else if ( this.angle > currentAngle ) {										
										this.angle -= this.angleSpeed;
									}

								}

							  this.y += gameObject.time.deltaRate * this.speedY;
							  this.collisionCircle.y = this.y + this.height / 2;

							}
							else if ( this.type === 3 ) {

								/* This is a kamikaze enemy that will move towards
 								 * the player and then explode, generating 8 shots in
 								 * various angles. We could have done the following 
 								 * conditional with the type one, but this is better for
 								 * organization purposes
 								 */

 								// Player alias

 								const player = gameObject.components.player;

								if ( this.x + this.width <= player.x ) {
									this.speedX = Math.abs( this.speedX );
								}
								else if ( this.x >= player.x + player.width ) {
									this.speedX = -Math.abs( this.speedX );
								}

								this.x += gameObject.time.deltaRate * this.speedX;
								this.y += gameObject.time.deltaRate * this.speedY;
								this.collisionCircle.x = this.x + this.width / 2;
 								this.collisionCircle.y = this.y + this.height / 2;

							}
							else if ( this.type === 4 ) {

								if ( this.y < canvasHeight * .1 ) {

									this.y += gameObject.time.deltaRate * this.speedY;
									this.collisionCircle.y = this.y + this.height / 2;

								}

								if ( !this.canShoot && !this.dead ) {

									if ( this.x < player.x ) {
										this.speedX = Math.abs( this.speedX );
									}
									else {
										this.speedX = -Math.abs( this.speedX );	
									}

									this.x += gameObject.time.deltaRate * this.speedX;
									this.collisionCircle.x = this.x + this.width / 2;

								}

								if ( Math.abs( this.x - player.x + 
														   ( this.width - player.width ) / 2 ) <=
									   player.width / 4 )
								{
									this.canShoot = true;
								}

							}

						},

						shoot() {

							this.shotSequenceStep++;

							if ( this.shotSequenceStep >= this.shotSequenceMaxStep ) {

								// Sequence ended

								this.shotSequenceStep = 0;

								// Updating interval reference

								this.shotIntervalReferenceTime = gameObject.time.currentTime;

								if ( this.type === 4 ) {
									this.canShoot = false;
								}

							}

							// For types 1, 2 and 4

							if ( this.type === 1 || this.type === 2 || this.type === 4 ) {

								gameObject.components.enemies.shots.push( {

									x: this.x + shotOffsetX,
									y: this.y + shotOffsetY,
									width: shotWidth,
									height: shotHeight,
									radius: shotRadius,
									endurance: shotEndurance,
									angle: this.angle,
									speed: shotSpeed,
									type: this.type,

									move() {
										this.y += gameObject.time.deltaRate *
												this.speed * Math.sin( this.angle );
						  			this.x += gameObject.time.deltaRate *
						  					this.speed * Math.cos( this.angle );
									}

								} );

							}
							else if ( this.type === 3 ) {

								for ( let i = 0; i < 8; i++ ) {

									gameObject.components.enemies.shots.push( {

										x: this.x + shotOffsetX,
										y: this.y + shotOffsetY,
										width: shotWidth,
										height: shotHeight,
										radius: shotRadius,
										endurance: shotEndurance,
										angle: this.angle + i * ( Math.PI / 4 ),
										speed: shotSpeed,
										type: this.type,

										move() {
											this.y += gameObject.time.deltaRate *
													this.speed * Math.sin( this.angle );
							  			this.x += gameObject.time.deltaRate *
							  					this.speed * Math.cos( this.angle );
										}

									} );

								}

							}

							// Playing shot sound

							gameObject.audio.playSound(
								gameObject.media.gameSE[2], false, false, true
							);

						}

					} );

				},

				deathAnimate(enemy, index) {

					let result = true;  // To determine if we make a recursion call

					if ( gameObject.time.currentTime -
							 enemy.deathAnimationReferenceTime >
							 enemy.deathAnimationInterval ) {

						enemy.deathAnimationReferenceTime = gameObject.time.currentTime;
						enemy.deathAnimationCanDraw = !enemy.deathAnimationCanDraw;
						enemy.deathAnimationStep++;

						// For boss to slowly fade away

						if ( enemy.isBoss ) {

							enemy.deathAnimationInterval -= 50;

							if ( enemy.deathAnimationInterval <= 50 ) {
								enemy.deathAnimationInterval = 50;
							}

						}

						if ( enemy.deathAnimationStep === enemy.deathAnimationMaxStep ) {

							if ( enemy.isBoss ) {

								gameObject.components.enemies.bosses.splice( index, 1 );

								if ( gameObject.state.level1.started &&
										 !gameObject.state.level1.finished )
								{
									gameObject.state.level1.bossFinished = true;
								}
								else if ( gameObject.state.level2.started &&
										 			!gameObject.state.level2.finished )
								{
									gameObject.state.level2.bossFinished = true;
								}

								// This reset is needed to keep track of music transitions

								gameObject.audio.transitionFinished = false;

								// Changing track

								gameObject.audio.changeTrack(
									gameObject.media.gameTracks[1],
									false, true, false
								);

								// Reseting stereo

								gameObject.audio.currentStereo.pan.value = 0;
								gameObject.audio.currentStereoValue = 0;

							}
							else {

								if ( enemy.type === 3 ) {
									enemy.shoot();   // Will explode in shots
								}

								gameObject.components.enemies.list.splice( index, 1 );	

							}

							gameObject.components.player.score += enemy.scorePoints;
							enemy.deathAnimationCanDraw = false;
							result = false;

							if ( gameObject.components.player.lives > 0 ) {

								if ( gameObject.components.player.score >=
									 gameObject.state.level1.bossScore &&
									 !gameObject.state.level1.bossStarted )
								{
									gameObject.components.callBoss( 1 );
								}
								else if ( gameObject.components.player.score >
										 			gameObject.state.level2.bossScore &&
										 			!gameObject.state.level2.bossStarted &&
										 			gameObject.state.level2.started )
								{
									gameObject.components.callBoss( 2 );
								}

							}

						}

					}

					if ( result ) {
						window.requestAnimationFrame( function callDeathAnim() {
							gameObject.components.enemies.deathAnimate( enemy, index );
						}	);
					}

				}

			},

			powerUps: {

				list: [],
				spawnInterval: 35000,
				spawnReferenceTime: 0,

				spawnPowerUp() {

					this.spawnInterval -= Math.random() * 600;

					if ( this.spawnInterval < 10000 ) {
						this.spawnInterval = 10000;
					}

					this.list.push( {

						x: Math.random() * canvasWidth * .9 + 50,
						y: -30 - Math.random() * 30,
						width: 30,
						height: 30,
						speedY: ( .5 + Math.random() ) / 3,
						active: false,

						/* Generating random types. They will be, in order:
						 * shot 1 | shot 2 | shot 3 | lives +1 | speed +.25
						 */

						type: Math.round( Math.random() * 4 + 1 ),

						move() {
							this.y += gameObject.time.deltaRate * this.speedY;
						}

					} );

				}

			},

			// Method to call bosses into game

			callBoss(level) {

				// Variables to create boss

				let bossType,
					width,
					height,
					hitPoints,
					scorePoints,
					speedX,
					speedY,
					angle,
					angleSpeed,
					shotOffsetX,
					shotOffsetY,
					shotWidth,
					shotHeight,
					shotRadius,
					shotEndurance,
					shotSpeed,
					shotInterval,
					shotSequenceInterval,
					shotSequenceMaxStep,
					canShoot,
					canMove;

				// This will generate a random initial direction to each boss

				let randomDir;

				if ( Math.random() > .5 ) {
					randomDir = 1;
				}
				else {
					randomDir = -1;
				}

				if ( level === 1 ) {

					gameObject.state.level1.bossStarted = true;

					/* First boss, but enemy type 5. If we wanted to restart from 1
					 * we would have to write a method to draw bosses that is exactly
					 * the same as the one that draw enemies. So it's better to just
					 * consider any boss as a enemy
					 */

					bossType = 5;		
					width = 100;
					height = 100;	
					hitPoints = 50;
					scorePoints = 10000;
					speedX = 4 * randomDir;
					speedY = 0;
					angle = 0;
					angleSpeed = 0;
					canMove = true;

					// Shot related data

					shotOffsetX = width / 2;
					shotOffsetY = height / 2;
					canShoot = true;

					// Making shot width adequate for viewport

					if ( window.innerWidth >= 576 ) {
						shotRadius = 30;
					}
					else {
						shotRadius = 20;
					}
					
					shotWidth = null;
					shotHeight = null;
					shotEndurance = 10;
					shotSpeed = 3;
					shotInterval = 2000;
					shotSequenceInterval = 300;
					shotSequenceMaxStep = 4;

				}

				// In case we want to add more levels in the future

				else if ( level === 2 ) {

					gameObject.state.level2.bossStarted = true;
					bossType = 6;		
					width = 140;
					height = 180;	
					hitPoints = 100;
					scorePoints = 50000;

					if ( window.innerWidth >= 576 ) {
						speedX = 6;
					}
					else {
						speedX = 3;
					}

					speedX *= randomDir;
					speedY = 0;
					angle = 0;
					angleSpeed = 0;
					canMove = false;

					// Shot related data

					shotOffsetX = width / 2;
					shotOffsetY = height / 2;
					canShoot = true;
					shotRadius = 20;
					shotWidth = null;
					shotHeight = null;
					shotEndurance = Number.POSITIVE_INFINITY;
					shotSpeed = 3.5;
					shotInterval = 0;   // Will be based on movement instead of time
					shotSequenceInterval = 250;
					shotSequenceMaxStep = 6;

				}

				// Creating boss

				gameObject.components.enemies.bosses.push( {

					x: canvasWidth * .5 - width / 2,
					y: -200,
					width: width,
					height: height,
					isAnimating: true,

					hitPoints: hitPoints,
					scorePoints: scorePoints,
					angle: angle,
					angleSpeed: angleSpeed,
					speedX: speedX,
					speedY: speedY,
					canMove: canMove,

					// Shot properties, such as interval, sequenceInterval, times, etc.

					canShoot: canShoot,
					shotInterval: shotInterval,
					shotIntervalReferenceTime: 0,
					shotSequenceInterval: shotSequenceInterval,
					shotSequenceReferenceTime: 0,

					/* Number of shots to shoot in sequence and the step in
					 * shooting them
					 */

					shotSequenceStep: 0,
					shotSequenceMaxStep: shotSequenceMaxStep,

					// Death animation properties

					deathAnimationStep: 0,
					deathAnimationMaxStep: 50,
					deathAnimationInterval: 600,
					deathAnimationReferenceTime: 0,
					deathAnimationCanDraw: true,

					dead: false, 
					type: bossType,
					isBoss: true,

					collisionCircle: {
						x: canvasWidth * .5,
						y: -200 + height / 2,
						radius: width / 2
					},

					move() {

						if ( this.isAnimating ) {

							this.x = canvasWidth * .5 - 50;  		// For resize
							this.y += gameObject.time.deltaRate * ( 3 / 4 );
							
							this.collisionCircle.x = this.x + this.width / 2;
							this.collisionCircle.y = this.y + this.height / 2;
							
							if ( this.y >= canvasHeight * .1 ) {
								this.isAnimating = false;
							}

						}

						/* moveAll doesn't check canMove, as it's specific for bosses,
						 * so we gotta do it here
						 */

						else if ( !this.dead && this.canMove ) {

							let boundaryX;		// The boundary to toggle speedX

							if ( this.type === 5 ) {
								boundaryX = 0;
							}
							else if ( this.type === 6 ) {

								boundaryX = canvasWidth * .1

								// Boss level 2 move'n'shoot behavior check

								if ( this.x <= boundaryX ||
									   this.x + this.width >= canvasWidth - boundaryX ||
									   Math.abs( ( canvasWidth - this.width ) / 2 - this.x ) <
									   Math.abs( this.speedX / 2 ) ) {

									this.canMove = false;
									this.canShoot = true;

								}

							}

							// Moving

							if ( this.x <= boundaryX ) {

								this.x = boundaryX;
								this.speedX = Math.abs( this.speedX );

							}
							else if ( this.x + this.width >= canvasWidth - boundaryX ) {

								this.x = canvasWidth - this.width - boundaryX;
								this.speedX = -Math.abs( this.speedX );

							}

							this.x += gameObject.time.deltaRate * this.speedX;
							this.collisionCircle.x = this.x + this.width / 2;

							// Toggling stereo sound based on boss position

							const stereoValue = ( 2 * ( this.x + ( this.width / 2 ) ) ) /
																	canvasWidth - 1;

							gameObject.audio.currentStereo.pan.value = stereoValue;
							gameObject.audio.currentStereoValue = stereoValue;

						}

					},

					shoot() {


						/* There will be two intervals checked by checkAll. One will
						 * be the interval between shoot actions and another 
						 * between shots sequences (shotInterval and
						 * shotSequenceInterval, respectively). This method will only
						 * handle steps in the sequence, not the checks
						 */

						this.shotSequenceStep++;

						if ( this.shotSequenceStep >= this.shotSequenceMaxStep ) {

							// Sequence ended

							this.shotSequenceStep = 0;

							// Updating interval reference

							this.shotIntervalReferenceTime = gameObject.time.currentTime;

							// For level 2 boss

							if ( this.type === 6 ) {
								this.canShoot = false;
								this.canMove = true;
							}

						}

						// The shot itself

						if ( this.type === 5 || this.type === 6 ) {

							gameObject.components.enemies.shots.push( {

								x: this.x + shotOffsetX,
								y: this.y + shotOffsetY,
								width: shotWidth,
								height: shotHeight,
								radius: shotRadius,
								endurance: shotEndurance,

								/* Angle is relative to canvas. As the boss angle is 0,
								 * because the image is already adjusted by default, we
								 * need to add Math.PI / 2 to make the shot go down
								 */

								angle: this.angle + Math.PI / 2,
								speed: shotSpeed,
								type: this.type,

								move() {

									this.y += gameObject.time.deltaRate *
											this.speed * Math.sin( this.angle );
					  			this.x += gameObject.time.deltaRate *
					  					this.speed * Math.cos( this.angle );

								}

							} );

							// Playing shot sound

							gameObject.audio.playSound(
								gameObject.media.gameSE[2], false, false, true
							);

						}

					}

				} );

				// Changing to boss track

				gameObject.audio.changeTrack(
					gameObject.media.gameTracks[2],
					true, true, false
				);

			},

			/* This method will be responsible to move all components
			 * by calling their 'move' method
			 */

			moveAll() {

				/* We'll use a forEach in a array of lists, and them move the
				 * objects inside them
				 */

				[
					[ this.background, this.player ],
					this.enemies.list,
					this.enemies.bosses,
					this.powerUps.list,
					this.player.shots,
					this.enemies.shots
				].forEach( function moveList(list) {

					list.forEach( function moveComponent(component) {
						component.move();
					} );

				} );

			},

			/* This method will do or call all necessary checks 
			 * (collisions, key updates) to maintain game flow and react to changes
			 */

			checkAll() {

				// Maintain player on screen

				if ( this.player.x <= 0 ) {
					this.player.x = 0;
				} else if ( this.player.x + this.player.width >= canvasWidth ) {
					this.player.x = canvasWidth - this.player.width;
				}

				if ( this.player.y <= 0 ) {
					this.player.y = 0;
				} else if ( this.player.y + this.player.height >= canvasHeight ) {
					this.player.y = canvasHeight - this.player.height;
				}

				if ( this.player.shooting && 
				     gameObject.time.currentTime - this.player.shotReferenceTime >
				     this.player.shotInterval )
				{

					this.player.shotReferenceTime = gameObject.time.currentTime;
					this.player.shoot();

				}

				if ( this.player.hitPoints <= 0 &&
						 !this.player.invincible &&
						 this.player.lives > 0 )
				{
					this.player.lives--;
					this.player.invincible = true;
					window.requestAnimationFrame( this.player.deathAnimate );
				}

				// Checking power up spawn

				if ( gameObject.time.currentTime - this.powerUps.spawnReferenceTime > 
					   this.powerUps.spawnInterval &&
					   gameObject.components.player.allowPlayer )
				{
					this.powerUps.spawnReferenceTime =	gameObject.time.currentTime;
					this.powerUps.spawnPowerUp();
				}

				// Checking for active power ups

				this.powerUps.list.forEach( function checkActivity(powerUp, index) {

					if ( powerUp.active && gameObject.components.player.lives > 0 ) {

						switch ( powerUp.type ) {

							case 1:
								gameObject.components.player.shotType = 1;
								break;
							case 2:
								gameObject.components.player.shotType = 2;
								break;
							case 3:
								gameObject.components.player.shotType = 3;
								break;
							case 4:
								gameObject.components.player.lives += 1;
								break;
							case 5:
								gameObject.components.player.speed += .25;
								break;
							default:
								console.log( 'Unknown power up!' );

						}

						gameObject.components.powerUps.list.splice( index, 1 );
						gameObject.audio.playSound(
							gameObject.media.gameSE[0], false, false, false
						);

					}

				} );

				// Checking for enemy spawn ( not when fighting bosses )

				if ( gameObject.time.currentTime - this.enemies.spawnReferenceTime > 
					   this.enemies.spawnInterval &&
					   gameObject.components.player.allowPlayer &&
					   !( gameObject.state.level1.bossStarted &&
					   		!gameObject.state.level2.started ) &&
					   !gameObject.state.level2.bossStarted )
				{
					this.enemies.spawnReferenceTime =	gameObject.time.currentTime;
					this.enemies.spawnEnemy();
				}

				// Checking enemy and enemy shoot action

				this.enemies.list.forEach(

					function checkEnemy(enemy, index) {

						// If enemy is offscreen (Y axis) or dead, get him out

						if ( enemy.y > canvasHeight + 30 ) {
							gameObject.components.enemies.list.splice( index, 1 );
						}

						if ( enemy.hitPoints <= 0 && !enemy.dead ) {
							enemy.dead = true;
							gameObject.components.enemies.deathAnimate( enemy, index );
						}

						// Shoot action

						if ( gameObject.time.currentTime -
								 enemy.shotIntervalReferenceTime >
						  	 enemy.shotInterval && !enemy.dead && enemy.canShoot )
						{

							if ( gameObject.time.currentTime -
									 enemy.shotSequenceReferenceTime >=
									 enemy.shotSequenceInterval )
							{
								enemy.shotSequenceReferenceTime =	gameObject.time.currentTime;
								enemy.shoot();
							}

						}

					}

				);

				// Checking for bosses death and shoot action

				this.enemies.bosses.forEach( function checkBossShot(boss, index) {

					if ( !boss.dead ) {

						if ( !boss.isAnimating ) {

							if ( gameObject.time.currentTime -
										 boss.shotIntervalReferenceTime >=
										 boss.shotInterval )
							{
								
								if ( gameObject.time.currentTime -
										 boss.shotSequenceReferenceTime >=
									 	 boss.shotSequenceInterval &&
									 	 !boss.dead && boss.canShoot )
								{
									boss.shotSequenceReferenceTime =
									gameObject.time.currentTime;
									boss.shoot();
								}

							}

						}

						if ( boss.hitPoints <= 0 ) {
							boss.dead = true;
							gameObject.components.enemies.deathAnimate( boss, index );
						}

					}

				} );

				// Removing useless shots out of screen and dead shots

				[
					this.player.shots,
					this.enemies.shots
				].forEach( function accessShotList(list) {

					list.forEach( function removeShots(shot, index) {

						if ( shot.x > canvasWidth + 50 ||
				     shot.x < -50 ||
				     shot.y > canvasHeight + 50 ||
				     shot.y < -50 ||
				     shot.endurance <= 0 )
						{
							// Removing shot from list (array if you wish)
							list.splice( index, 1 );
						}	

					} );

				} );

				/* Checking for special shot explosion when fighting boss 2.
				 * This won't be added to small screens or else will make the game
				 * extremely difficult and non-suitable for small viewports
				 */

				if ( gameObject.state.level2.bossStarted &&
				     !gameObject.state.level2.bossFinished &&
				     canvasWidth >= 576 ){

					gameObject.components.enemies.shots.forEach(
						function checkTypeSix(shot, index) {

							if ( shot.type === 6 && shot.y >= canvasHeight / 2 &&

									/* Current boss is the only one, when they die they're
		  					   * removed. However an array allow numerous
		  					   * possibilities, that's why we use them ( e.g we could 
		  					   * create a level with with two bosses )
		  					   */

							     gameObject.components.enemies.bosses[0].hitPoints < 50 )
							{

								gameObject.components.enemies.shots.splice( index, 1 );

								// Creating explosion shots

								for ( let i = 0; i < 8; i++ ) {

			  					gameObject.components.enemies.shots.push( {

										x: shot.x,
										y: shot.y,
										width: null,
										height: null,
										radius: shot.radius / 2,
										endurance: 5,
										angle: shot.angle + i * ( Math.PI / 4 ),
										speed: shot.speed * 2,
										type: 7,

										move() {
											this.y += gameObject.time.deltaRate *
													this.speed * Math.sin( this.angle );
							  			this.x += gameObject.time.deltaRate *
							  					this.speed * Math.cos( this.angle );
										}

			  					} );

			  				}

							}

						}
					);

				}

				// Checking collisions

				this.checkAllCollisions();

			},

			/* Checking all game collisions. We do it here instead of checkAll
			 * to keep things organized (well, a little), but this will only be
			 * called inside checkAll
			 */

			checkAllCollisions() {

				/* We will check collisions on enemy shots and enemies instead of
				 * the player or player shots. This is because enemies vary in
				 * different levels, and their properties might affect how we
				 * evaluate these collisions.
				 */

				[
					this.enemies.list,
					this.enemies.bosses
				].forEach( function accessEnemyList(list) {

					list.forEach(	function checkEnemyCollisions(enemy) {

						// Checking enemy/player

						if ( gameObject.components.checkCollisionTwoCircles(
								   enemy.collisionCircle,
								   gameObject.components.player.collisionCircle
					    	 ) &&
					    	 !gameObject.components.player.invincible &&
					    	 !enemy.dead )
						{
							gameObject.components.player.hitPoints--;
							enemy.hitPoints--;
						}

						// Checking enemy/player-shots

						gameObject.components.player.shots.forEach(

							function checkPlayerShotCollision(playerShot) {

								if ( gameObject.components.checkCollisionTwoCircles(
										   enemy.collisionCircle,
										   playerShot
										 ) &&
									   !enemy.dead )
								{
									playerShot.endurance--;
									enemy.hitPoints--;
								}

							}

						);

					});

				} );

				// Checking enemy-shots/player and enemy-shots/player-shots

				this.enemies.shots.forEach(

					function checkEnemyShotCollision(enemyShot) {

						// Circular shot

						if ( ( enemyShot.type === 1 || enemyShot.type === 5 ||
						       enemyShot.type === 3 || enemyShot.type === 6 ||
						       enemyShot.type === 7 ) &&
							   gameObject.components.checkCollisionTwoCircles(
							     gameObject.components.player.collisionCircle,
							     enemyShot
							   )
							   && !gameObject.components.player.invincible )
						{
							gameObject.components.player.hitPoints--;
							enemyShot.endurance--;
						}
						else if (
								( enemyShot.type === 2 || enemyShot.type === 4 ) &&
								gameObject.components.checkCollisionCircleRect(
									gameObject.components.player.collisionCircle,
									enemyShot
								) &&
								!gameObject.components.player.invincible )
						{
							gameObject.components.player.hitPoints--;
							enemyShot.endurance--;
						}

						gameObject.components.player.shots.forEach(

							function checkShotsCollision(playerShot) {

								if ( ( enemyShot.type === 1 || enemyShot.type === 3 ||
											 enemyShot.type === 5 || enemyShot.type === 6 ||
											 enemyShot.type === 7 ) &&
								   		 gameObject.components.checkCollisionTwoCircles(
								     	   playerShot, enemyShot
								   		 ) )
								{
									playerShot.endurance--;
									enemyShot.endurance--;
								}
								else if (	( enemyShot.type === 2 || enemyShot.type === 4 ) &&
									   		 		gameObject.components.checkCollisionCircleRect(
									     	    	playerShot, enemyShot
									   		 		)	)
								{
									playerShot.endurance--;
									enemyShot.endurance--;
								}

							}

						);

					}

				);

				// Checking power-ups/player

				this.powerUps.list.forEach(

					function checkPowerUpCollision(powerUp) {

						if ( gameObject.components.checkCollisionCircleRect(
								   gameObject.components.player.collisionCircle,
								   powerUp
								 ) )
						{
							powerUp.active = true;
						}

					}

				);

			},

			// These methods will check if there is a collision between objects

			checkCollisionTwoCircles(circle1, circle2) {

				// Simple geometry here

				const distance = Math.sqrt(
						Math.pow( circle1.x - circle2.x, 2 ) +
						Math.pow( circle1.y - circle2.y, 2 )
				);

				return distance <= circle1.radius + circle2.radius ;

			},

			checkCollisionCircleRect(circle, rect) {

				/* We'll place a point on an edge of the rectangle, and check
				 * if it's distance is less than the circle radius. Note we're
				 * not checking if the circle is inside the rect or vice-versa,
				 * because it may be unnecessary
				 */
				 

				let testPointX = circle.x,
					testPointY = circle.y;

				if ( testPointX < rect.x ) {
					testPointX = rect.x;
				}
				else if ( testPointX > rect.x + rect.width ) {
					testPointX = rect.x + rect.width;
				}

				if ( testPointY < rect.y ) {
					testPointY = rect.y;
				}
				else if ( testPointY > rect.y + rect.height ) {
					testPointY = rect.y + rect.height;
				}

				return Math.pow( circle.x - testPointX, 2 ) +
							 Math.pow( circle.y - testPointY, 2 ) <=
							 Math.pow( circle.radius, 2 );

			},

			// This will be a general update to some components in case of resize

			update() {

					// Background

					this.background.width = canvasWidth;
					this.background.height = canvasHeight;

					// In case of resize

					if ( this.background.y1 > this.background.y2 ) {
						this.background.y1 = this.background.y2 + canvasHeight;
					}
					else {
						this.background.y2 = this.background.y1 + canvasHeight;
					}

			}

		},

		// Audio related

		audio: {
			currentTrack: null,
			currentGain: null,
			currentStereo: null,
			currentTrackGainValue: .5,
			currentSEGainValue: .5,
			currentStereoValue: 0,
			userTrackGainValue: .5,
			userSEGainValue: .5,
			transitionFinished: false,

			// Method to start playing a track or effect

			playSound(buffer, loop, isTrack, isShot = false) {

				// Yes, I'm using the WebAudio API in case you haven't noticed

				// Building audio graph

				const audioSource = audioCtx.createBufferSource();
				audioSource.buffer = buffer;
				audioSource.loop = loop;

				// Effect for shots

				if ( isShot ) {
					audioSource.playbackRate.value = .5 + Math.random();
				}

				// Creating gain, stereo and compressor

				const audioGain = audioCtx.createGain(),
					stereoPan = audioCtx.createStereoPanner(),
					compressor = audioCtx.createDynamicsCompressor();

				// Settings

				if ( isTrack ) {

					// References to change audio

					gameObject.audio.currentTrack = audioSource;
					gameObject.audio.currentGain = audioGain;
					gameObject.audio.currentStereo = stereoPan;
					audioGain.gain.value = gameObject.audio.currentTrackGainValue;
				}
				else {
					audioGain.gain.value = gameObject.audio.currentSEGainValue;
				}

				stereoPan.pan.value = gameObject.audio.currentStereoValue;

				// Connecting things up

				audioSource.connect( stereoPan );
				stereoPan.connect( audioGain );
				audioGain.connect( compressor );
				compressor.connect( audioCtx.destination );

				audioSource.start();		// Finally -.-

			},

			// This method will change tracks on transitions

			changeTrack(buffer, loop, turnDown, canChange) {

				if ( turnDown && this.currentTrackGainValue > 0 ) {

					gameObject.audio.currentTrackGainValue -= .01;
					gameObject.audio.updateGain();

					if ( gameObject.audio.currentTrackGainValue <= 0 ) {
						window.requestAnimationFrame( function callChange() {
							gameObject.audio.changeTrack( buffer, loop, false, true );
						} );
					}
					else {
						window.requestAnimationFrame( function callChange() {
							gameObject.audio.changeTrack( buffer, loop, true, false );
						} );
					}

				}
				else if ( canChange ) {

					gameObject.audio.playSound( buffer, loop, true );

					// To turn up volume

					window.requestAnimationFrame( function turnUpVolume() {
						gameObject.audio.changeTrack( null, null, false, false );
					} );

				}
				else if ( gameObject.audio.currentTrackGainValue <
									gameObject.audio.userTrackGainValue      ) {

					gameObject.audio.currentTrackGainValue += .01;
					gameObject.audio.updateGain();

					window.requestAnimationFrame( function turnUpVolume() {
						gameObject.audio.changeTrack( null, null, false, false );
					} );

				}
				else {
					gameObject.audio.transitionFinished = true;
				}

			},

			// Method to update gain values

			updateGain(isUser = false) {

				// If we will assign the value of the user gain or current ones

				if ( isUser ) {

					// Rounding values because of JS float accuracy problems

					this.userTrackGainValue =
					Math.round( this.userTrackGainValue * 100 ) / 100;
					this.userSEGainValue = 
					Math.round( this.userSEGainValue * 100 ) / 100;
					this.currentTrackGainValue = this.userTrackGainValue;
					this.currentSEGainValue = this.userSEGainValue;

				}
				else {

					this.currentTrackGainValue =
					Math.round( this.currentTrackGainValue * 100 ) / 100;

				}

				// Music only, as effects are too quick for we to reference them

				this.currentGain.gain.value = this.currentTrackGainValue;

			}

		},

		// Screen object to handle screen transitions and conditions

		screen: {
			onLoadingScreen: true,
			onIntroScreen: false,
			onTitleScreen: false,
			onPlayingScreen: false,
			onOptionScreen: false,
			onHowToScreen: false,
			onCreditScreen: false,
			onGameOverScreen: false,
			onEndingScreen: false,

			// Transitions properties for screen fade effect

			transitionStarted: false,
			transitionReady: false,
			transitionFinished: false,
			transitionAlphaColor: 0,			// For rgba values


			// Method to change screen booleans easily

			changeScreen(newScreen) {

				for ( let i in gameObject.screen ) {

					if ( typeof gameObject.screen[i] === 'boolean' ) {
						gameObject.screen[i] = false;
					}

				}

				gameObject.screen[newScreen] = true;

			},

			// Method for screen transitions

			transitionScreen() {

				if ( !gameObject.screen.transitionStarted ) {
					gameObject.screen.transitionStarted = true;
				}
				else if ( !gameObject.screen.transitionReady )  {

					gameObject.screen.transitionAlphaColor += .01;
					this.transitionAlphaColor =
					Math.round( this.transitionAlphaColor * 100 ) / 100;

					if ( gameObject.screen.transitionAlphaColor >= 1 ) {
						gameObject.screen.transitionReady = true;
					}

				}
				else if ( !gameObject.screen.transitionFinished ) {

					gameObject.screen.transitionAlphaColor -= .01;
					this.transitionAlphaColor =
					Math.round( this.transitionAlphaColor * 100 ) / 100;

					if ( gameObject.screen.transitionAlphaColor <= 0 ) {
						gameObject.screen.transitionFinished = true;
					}

				}
				else { // Restarting for next transition if any

					gameObject.screen.transitionStarted = false;
					gameObject.screen.transitionReady = false;
					gameObject.screen.transitionFinished = false;

				}

				// Drawing it

				gameObject.graphics.drawTransition();

			}

		},

		// Loader object to handle media loading ( images, sounds, tracks, etc. )

		loader: {
			loading: false,		// If was asked to load initial resources
			loaded: false,
			loadProgress: 0,
			load() {

				/* This method will load all resources, however only level 1 are
				 * enough to let the user play, as the others will eventually load.
				 * Level 1 doesn't necessarily mean 'first game level', but they 
				 * are high priority to let user have a good experience
				 * (e.g level 2 boss sprite)
				 */

				// Level 1 images to load

				const imgsLevel1 = [
					'./media/images/background-level-1.png',
					'./media/images/boss-level-1.png',
					'./media/images/enemy-ship-1.png',
					'./media/images/enemy-ship-2.png',
					'./media/images/player-ship.png'
				];

				// Level 2 images

				const imgsLevel2 = [
					'./media/images/background-level-2.gif',
					'./media/images/boss-level-2.png',
					'./media/images/enemy-ship-3.png',
					'./media/images/enemy-ship-4.png'
				];

				// Audio won't be loaded in levels as decoding is fairly fast

				const audio = [
					'soundtrack/title-screen.mp3',
					'soundtrack/level-1.mp3',
					'soundtrack/game-over.mp3',
					'sound-effects/enemy-shot.mp3',
					'sound-effects/player-shot-1.mp3',
					'sound-effects/player-shot-2.mp3',
					'sound-effects/player-shot-3.mp3',
					'sound-effects/power-up.mp3',
					'soundtrack/boss-fight.mp3',
					'soundtrack/level-2.mp3',
					'soundtrack/victory.mp3'
				];

				// Number of resources to load and loaded

				const resourcesToLoad = audio.length + imgsLevel1.length;
				let resourcesLoaded = 0;

				// Function to calculate and return load progress

				function calculateLoad() {
					resourcesLoaded++;  // We wouldn't call it if something wasn't loaded
					if ( resourcesLoaded / resourcesToLoad == 1 ) {
						gameObject.loader.loading = false;
						gameObject.loader.loaded = true;
					}
					return resourcesLoaded / resourcesToLoad;
				}

				// Function to load images

				function loadImgs(level, imgsArray) {

					// Array to keep track of images promises

					const imgsPromises = [];

					imgsArray.forEach( function createPromisedImg(url) {

						// Pushing promises to resolve when image is loaded

						imgsPromises.push(
							new Promise(
								function handlePromise(resolve, reject) {

									// Image element to force browser to load

									const img = document.createElement( 'img' );
									img.src = url;
									img.addEventListener( 'load', function resolveImg() {
										if ( level === 1 ) {
											gameObject.loader.loadProgress = calculateLoad();
										}
										resolve( url );
									} );
								}
							)
						);

					} );

					// This will sort the array to make it easy to know their indexes

					Promise.all( imgsPromises )
					.then(
						function fulfilled(imgs) {
							imgs.sort();
							imgs.forEach( function pushToGame( img ) {

								/* NOTE: if we did gameObject.media.gameImages = imgs, would 
								 * be a reference, not what we want. We'll also sort imgs 
								 * level 2, so even tough it will be appended later, order 
								 * is still predictable
								 */

								gameObject.media.gameImages.push( img );
							} );

							// Calling second fetch if first was done (to maintain order)

							if ( level == 1 ) {
								loadImgs( 2, imgsLevel2 );
							}
						},
						function rejected(error) {
							console.log(error);
						}
					);

				}

				

				// Must be fetched then decoded as they will be stored in buffer

				audio.forEach(
					function fetchAudio (url) {

						// Change to a simple relative path if tested with a server

						fetch( 'https://raw.githubusercontent.com/TheColucciExperience/space-shooter/master/media/audio/' + url )
						.then(
							function fulfilled(response) {

								if ( response.ok ) {
									return response.arrayBuffer();
								}
								else {
									throw new Error( 'Request Failed!' );
								}

							},
							function rejected(error) {
								console.log( error.message );
							}
						)
						.then(
							function handleAudioData(audioData) {

								// Decoding audio to serve as buffer source

								audioCtx.decodeAudioData(
									audioData,
									function fulfilled(buffer) {

										// Function to sort buffer arrays

										function sortBuffer (a, b) {
											return a.duration > b.duration;
										}

										// Inserting in soundtracks or SE based on path
										if ( url.match( /soundtrack/ ) ) {
											gameObject.media.gameTracks.push( buffer );
											gameObject.media.gameTracks.sort( sortBuffer );
										}
										else {
											gameObject.media.gameSE.push( buffer );
											gameObject.media.gameSE.sort( sortBuffer );
										}

										gameObject.loader.loadProgress = calculateLoad();
									},
									function rejected(error) {
										console.log( error.message );
									}
								);

							}
						);

					}
				);

				// Loading images

				loadImgs( 1, imgsLevel1 );

			}
		},

		// Interface components, such as loading screen, options, etc.

		interface: {

			// ScrollText object to hold intro and ending...scrolling texts -.-

			scrollText: {

				x: canvasWidth * .1,
				y: canvasHeight + 22,
				textSize: 22,
				speedY: - 1 / 3,
				width: canvasWidth * .8,
				height: 22,								// Will be updated with method, see later
				introText: [
					'In a long distant galaxy, a lonely warrior was born to ' +
					'be a hero. He trained hard every day to protect his people and ' +
					'became one of the greatest warriors of the galaxy. Everything ' +
					'was peaceful. However, a mad scientist named Jorhan made secret ' +
					'experiments with the army, transforming them into crazy pilots ' +
					'that went shooting everything they saw. Chaos, destruction and ' +
					'madness are ruining the galaxy. Now it\'s up to you, ' +
					'space shooter, to save the universe. Good luck !!'
				],
				endingText: [
					'When Jorhan saw that his greatest minion, Bouncing Skull, had ' +
					'been defeated by our hero, he made a desperate attempt to become ' +
					'more powerful. He made experiments with himself, that ' +
					'eventually turned him in a demonic creature. After losing his ' +
					'mind, he initiated a showdown with the space shooter. A long ' +
					'battle had taken place, and after a lot of effort, Jorhan was ' +
					'defeated and the universe saw peace again. There\'s only one ' +
					'thing the galaxies want to say: thank you space shooter !!!'
				],
				finished: false,

				move() {
					
					// Updating y position to scroll

					this.y += gameObject.time.deltaRate * this.speedY;

					// Moving to title screen

					if ( this.y + this.height - this.textSize < 0 ) {
						this.finished = true;
					}

				},

				arrangeText() {
					
					/* Arranging text in canvas responsively is pain, but the idea here
					 * is to split text recursively until it fits onscreen
					 */

					let baseText;

					if ( gameObject.screen.onIntroScreen ) {
						baseText = this.introText;
					}
					else if ( gameObject.screen.onEndingScreen ) {
						baseText = this.endingText;
					}

					// This array will hold all lines of text

					const arrayOfLines = [

						/* First element is all the text words. We do this to join all
						 * lines to a single text, then retrieve each word of it
						 */
						
						baseText.join( ' ' ).split( ' ' )

					];

					// Function to arrange lines

					function arrangeLines(index) {

						while(
							ctx.measureText( arrayOfLines[index].join( ' ' ) ).width >
							canvasWidth * .8
						) {

							// Creating a new line

							if ( !arrayOfLines[ index + 1 ] ) {
								arrayOfLines[ index + 1 ] = [];
							}

							arrayOfLines[ index + 1 ].unshift( arrayOfLines[ index ].pop() );

						}

						// If there's a new line we need to arrange that too

						if ( arrayOfLines[ index + 1 ] ) {
							arrangeLines( index + 1 );
						}

					}

					// Arranging lines

					arrangeLines( 0 );

					/* Now we have multiple arrays of words. We'll join each 
					 * and then copy the whole thing to intro text
					 */

					arrayOfLines.forEach( function joinLines(line, index) {
						arrayOfLines[ index ] = line.join( ' ' );
					} );

					if ( gameObject.screen.onIntroScreen ) {
						this.introText = Array.from( arrayOfLines );
					}
					else if ( gameObject.screen.onEndingScreen ) {
						this.endingText = Array.from( arrayOfLines );
					}

				},

				// Update for resizes, new lines set on rearrange, etc

				update() {
					
					if ( gameObject.screen.onIntroScreen ) {
						this.height = this.textSize * this.introText.length;
					}
					else if ( gameObject.screen.onEndingScreen ) {
						this.height = this.textSize * this.endingText.length;
					}

					this.x = canvasWidth * .1;
					
				},

				// Reset when scroll has finished

				reset() {

					this.y = canvasHeight + 22;
					this.finished = false;

				}

			},

			// Title object will hold title screen related properties and methods

			title: {

				x: canvasWidth / 2,							// Will be centered
				y: canvasHeight * .2,
				titleSize: canvasWidth * .2,
				optionsSize: canvasWidth * .1,
				containersWidth: canvasWidth * .7,
				containersHeight: canvasHeight * .08,
				containersOffsetY: canvasHeight * .05,

				// Individual Y's are not possible as they're based on texts' Ys

				containersX: canvasWidth * .15,

				containers: [
					{
						isOnHover: false,
						textX: canvasWidth / 2,
						textY: canvasHeight * .6,
						text: 'Start',
						path: 'onPlayingScreen'
					}, {
						isOnHover: false,
						textX: canvasWidth / 2,
						textY: canvasHeight * .7,
						text: 'Options',
						path: 'onOptionScreen'
					}, {
						isOnHover: false,
						textX: canvasWidth / 2,
						textY: canvasHeight * .8,
						text: 'How to play',
						path: 'onHowToScreen'
					}, {
						isOnCredit: false,
						textX: canvasWidth / 2,
						textY: canvasHeight * .9,
						text: 'Credits',
						path: 'onCreditScreen'
					}
				],

				// Method to determine if a certain option is active

				isOptionActive(option, e) {

					// Getting mouse position and creating alias

					const mousePos = gameObject.interface.mouse.getMousePosition( e ),
						box = gameObject.interface.title;

					return mousePos.x >= box.containersX &&
								 mousePos.x <= box.containersX + box.containersWidth &&
								 mousePos.y >= option.textY - box.containersOffsetY &&
								 mousePos.y <=
								 option.textY - box.containersOffsetY + box.containersHeight;

				},

				// Method to handle hover on options

				handleHover(e) {

					let result;  // Result to change canvas pointer

					this.containers.forEach( function highlightOption(option) {
						
						if ( gameObject.interface.title.isOptionActive( option, e ) &&
							   window.innerWidth > 768 ) // Only for large viewports
							{
								option.isOnHover = true;
								result = true;
							}
						else {
							option.isOnHover = false;
						}

					} );

					if ( result ) {
						gameObject.interface.mouse.toPointer();
					}
					else {
						gameObject.interface.mouse.toDefault();
					}

				},

				// Handling click navigation on title screen

				handleTitleClick(e) {

					this.containers.forEach( function changeToScreen(option) {

						if ( gameObject.interface.title.isOptionActive( option, e ) ) {
							gameObject.screen.changeScreen( option.path );
							gameObject.interface.mouse.toDefault();
							option.isOnHover = false;
						}

					} );

				},

				// In case of resize

				update() {
					this.x = canvasWidth / 2;
					this.y = canvasHeight * .2;
					this.textX = canvasWidth / 2;
					this.textY = canvasHeight * .2;
					this.titleSize = canvasWidth * .2;
					this.optionsSize = canvasWidth * .1;
					this.containersX = canvasWidth * .15;
					this.containersWidth = canvasWidth * .7;
					this.containersHeight = canvasHeight * .08;
					this.containersOffsetY = canvasHeight * .05;
					this.containers.forEach(
						function updateOptions(option, index) {
							option.textX = canvasWidth / 2;
							option.textY = canvasHeight * ( ( 6 + index ) / 10 );
						}
					);
				}

			},

			// Options object will hold properties and methods for buttons

			options: {

				// Track and SE buttons model

				generalBtn: {
					x: canvasWidth * .9 - 60,
					width: 60,
					height: canvasHeight * .06,
					textSize: 50,
					textColor: '#fff',
					textHoverColor: '#111',
					bgColor: '#a00',
					bgHoverColor: '#fff'
				},

				// Array to hold button properties

				buttons: [
					{
						y: canvasHeight * .18,
						isActive: false,
						canDraw: true,
						action: function turnUpTrack() {

							if ( gameObject.audio.currentTrackGainValue < 1 ) {

								gameObject.audio.userTrackGainValue += .1;
								gameObject.audio.updateGain( true );
								gameObject.interface.options.buttons[1].canDraw = true;

								if ( gameObject.audio.currentTrackGainValue >= 1 ) {
									this.canDraw = false;
								}

							}

						}
					}, {
						y: canvasHeight * .35,
						isActive: false,
						canDraw: true,
						action: function turnDownTrack() {

							if ( gameObject.audio.currentTrackGainValue > 0 ) {

								gameObject.audio.userTrackGainValue -= .1;
								gameObject.audio.updateGain( true );
								gameObject.interface.options.buttons[0].canDraw = true;

								if ( gameObject.audio.currentTrackGainValue <= 0 ) {
									this.canDraw = false;
								}

							}

						}
					}, {
						y: canvasHeight * .48,
						isActive: false,
						canDraw: true,
						action: function turnUpSE() {

							if ( gameObject.audio.currentSEGainValue < 1 ) {

								gameObject.audio.userSEGainValue += .1;
								gameObject.audio.updateGain( true );
								gameObject.interface.options.buttons[3].canDraw = true;

								if ( gameObject.audio.currentSEGainValue >= 1 ) {
									this.canDraw = false;
								}

								// Playing example sound

								gameObject.audio.playSound(
									gameObject.media.gameSE[0],
									false, false, false
								);

							}

						}
					}, {
						y: canvasHeight * .65,
						isActive: false,
						canDraw: true,
						action: function turnDownSE() {

							if ( gameObject.audio.currentSEGainValue > 0 ) {

								gameObject.audio.userSEGainValue -= .1;
								gameObject.audio.updateGain( true );
								gameObject.interface.options.buttons[2].canDraw = true;

								if ( gameObject.audio.currentSEGainValue <= 0 ) {
									this.canDraw = false;
								}

								// Playing example sound

								gameObject.audio.playSound(
									gameObject.media.gameSE[0],
									false, false, false
								);

							}

						}
					}
				],

				// Checking if button is on hover area

				isButtonActive(button, e) {

					/* This is mostly the same check as the options one, we can't
					 * create a method for both tough, because we use a general button
					 * as well as a specific one. If you want to try and implement a
					 * general method, good luck. DRY doesn't suit my code 
					 * if it means create extra work with little to no benefit
					 */

					const mousePos = gameObject.interface.mouse.getMousePosition( e );

					if ( mousePos.x >= this.generalBtn.x &&
							 mousePos.x <= this.generalBtn.x + this.generalBtn.width &&
							 mousePos.y >= button.y &&
							 mousePos.y <= button.y + this.generalBtn.height )
					{
						return true;
					}

				},

				// Checking hover state

				handleHover(e) {
					
					let result;

					this.buttons.forEach( function checkButtonState(button) {

						if ( gameObject.interface.options.isButtonActive( button, e ) &&
								 window.innerWidth > 768 ) {
							button.isActive = true;
							result = true;
						}
						else {
							button.isActive = false;
						}

					} );

					// Handling back btn here to avoid mouse pointer issues

					if ( !result ) {
						gameObject.interface.backBtn.handleHover( e );
						result = gameObject.interface.backBtn.isActive;
					}

					if ( result ) {
						gameObject.interface.mouse.toPointer();
					}
					else {
						gameObject.interface.mouse.toDefault();	
					}

				},

				// Handling click events

				handleOptionsClick(e) {

					/* This will execute actions in each button, such as
					 * turning up the volume of music or sound effects
					 */

					this.buttons.forEach( function checkButtonState(button) {

						if ( gameObject.interface.options.isButtonActive( button, e ) ) {
							button.action();
						}

					} );					

				},

				update() {

					this.generalBtn.x = canvasWidth * .9 - 60;
					this.generalBtn.height = canvasHeight * .06;

					// Array with individual y's to update with canvas height

					const arrayOfYs = [ .18, .35, .48, .65 ];

					this.buttons.forEach( function updateButtons(button, index) {
						button.y = arrayOfYs[index] * canvasHeight;
					} );

				}


			},

			/* This will primarily just get the mouse position, but we create a
			 * mouse component just to keep things organized ;)
			 */

			mouse: {

				// There's a single target canvas, don't need a variable for that

				getMousePosition(event) {

					const canvasRect = canvas.getBoundingClientRect();

					return {
						x: event.clientX - canvasRect.x,
						y: event.clientY - canvasRect.y
					}

				},

				toPointer() {
					canvas.style.cursor = 'pointer';
				},

				toDefault() {
					canvas.style.cursor = 'default';
				}

			},

			// Back button to be used on various game screens

			backBtn: {
				x: canvasWidth * .1,
				y: canvasHeight * .9,
				width: 100,
				height: canvasHeight * .1,
				textColor: '#fff',
				textHoverColor: '#111',
				textSize: 20,
				bgColor: '#a00',
				bgHoverColor: '#fff',
				text: 'BACK',
				isActive: false,

				// This will check if click was on back button

				isOnBackBtn(e) {	// e is always what I use for event parameters
					const mousePos = gameObject.interface.mouse.getMousePosition( e );

					return mousePos.x >= this.x && 
								 mousePos.x <= this.x + this.width &&
								 mousePos.y >= this.y &&
								 mousePos.y <= this.y + this.height;

				},

				handleHover(e) {

					if ( this.isOnBackBtn( e ) && window.innerWidth > 768 ) {
						this.isActive = true;
						gameObject.interface.mouse.toPointer();
					}
					else {
						this.isActive = false;
						gameObject.interface.mouse.toDefault();
					}

				},

				// This will get users back to title screen

				toTitle() {

					this.isActive = false;
					gameObject.interface.mouse.toDefault();
					gameObject.screen.changeScreen( 'onTitleScreen' );

				},

				update() {
					this.x = canvasWidth * .1;
					this.y = canvasHeight * .9;
					this.height = canvasHeight * .1;
				}

			}

		},

		// Graphics object to handle all types of drawing

		graphics: {

			clear() {
				ctx.clearRect( 0, 0, canvasWidth, canvasHeight );
			},

			drawLoadingScreen() {

				ctx.save();

				// Loading text

				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.font = `30px Sedgwick Ave Display`;
				ctx.fillStyle = 'white';

				let text,         // Will change with time
					currentTime =  Math.round( ( gameObject.time.currentTime / 1000 ) );

				switch ( true ) {

					case currentTime % 4 == 0:
						text = 'loading';
						break;
					case currentTime % 4 == 1:
						text = 'loading.';
						break;
					case currentTime % 4 == 2:
						text = 'loading..';
						break;
					case currentTime % 4 == 3:
						text = 'loading...';
						break;
					default:
						text = 'loading';

				}

				ctx.fillText( text, canvasWidth / 2, canvasHeight * .45 );

				// Loading bar

				const loadingBarGrad =
				ctx.createLinearGradient( 0, 0, canvasWidth * .8, canvasHeight );
				loadingBarGrad.addColorStop( '0', '#d00' );
				loadingBarGrad.addColorStop( '.3', '#a00' );
				loadingBarGrad.addColorStop( '.6', '#800' );
				loadingBarGrad.addColorStop( '1', '#400' );

				ctx.fillStyle = loadingBarGrad;
				ctx.fillRect(
					canvasWidth * .1,
					canvasHeight * .52,
					gameObject.loader.loadProgress * canvasWidth * .8,
					canvasHeight * .05
				);

				ctx.restore();

			},

			drawBackground() {

				// Change later according to necessities

				ctx.save();

				if ( !gameObject.screen.onPlayingScreen ) {
					ctx.fillStyle = '#111';
					ctx.fillRect( 0, 0, canvasWidth, canvasHeight );
				}
				else {

					// Drawing backgrounds

					const img = document.createElement( 'img' );

					if ( !gameObject.state.level1.finished ) {
						img.src = gameObject.media.gameImages[0];
					}
					else if ( !gameObject.state.level2.finished ) {
						img.src = gameObject.media.gameImages[5];
					}
					
					[
						gameObject.components.background.y1,
						gameObject.components.background.y2
					].forEach( function drawBackground(y) {

						ctx.drawImage(
							img, 
							gameObject.components.background.x, y,
							gameObject.components.background.width, 
							gameObject.components.background.height
						);

					} )

				}

				ctx.restore();

			},

			// Drawing sliding scroll intro and ending texts

			drawScrollText() {

				ctx.save();

				ctx.font =
				`${ gameObject.interface.scrollText.textSize }px Sedgwick Ave Display`;
				ctx.fillStyle = '#fff';

				/* This will rearrange the text on screen if any of them overflow.
				 * It must be called here because it's here that the font is set,
				 * else it won't get the right adjustment on screen
				 */

				gameObject.interface.scrollText.arrangeText();

				let currentText;	// To differentiate between intro and ending texts

				if ( gameObject.screen.onIntroScreen ) {
					currentText =	gameObject.interface.scrollText.introText;
				}
				else if ( gameObject.screen.onEndingScreen ) {
					currentText = gameObject.interface.scrollText.endingText;
				}

				currentText.forEach( function fillText(txt, index) {

					ctx.fillText(
						txt,
						gameObject.interface.scrollText.x,
						gameObject.interface.scrollText.y +
						gameObject.interface.scrollText.textSize * index
					);

				} );

				ctx.restore();

			},

			// Drawing title screen

			drawTitle() {

				// We'll draw the title and then the options

				ctx.save();

				ctx.textAlign = 'center';
				ctx.font =
				`${ gameObject.interface.title.titleSize }px Sedgwick Ave Display`;
				ctx.fillStyle = '#fff';
				ctx.fillText(
					'SPACE',
					gameObject.interface.title.x,
					gameObject.interface.title.y
				);
				ctx.fillStyle = '#a00';
				ctx.fillText(
					'SHOOTER',
					gameObject.interface.title.x,
					gameObject.interface.title.y * 2
				);


				// Drawing containers

				gameObject.interface.title.containers.forEach(
					function drawContainers(container, index) {

						// Variables for box and text colors

						let boxColor,
							textColor;

						if ( container.isOnHover ) {
							boxColor = '#fff';
							textColor = '#111';
						}
						else {
							boxColor = '#333';
							textColor = '#ddd';	
						}

						ctx.textBaseline = 'middle';

						ctx.fillStyle = boxColor;

						ctx.fillRect(
							gameObject.interface.title.containersX,
							container.textY - gameObject.interface.title.containersOffsetY,
							gameObject.interface.title.containersWidth,
							gameObject.interface.title.containersHeight
						);

						ctx.fillStyle = textColor;
						ctx.font =
						`${ gameObject.interface.title.optionsSize }px Joti One`;

						ctx.fillText(
							container.text,
							container.textX,
							container.textY
						);

					}
				);

				ctx.restore();

			},

			drawCredits() {

				ctx.save();

				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = '#fff';
				ctx.font = `${ canvasWidth * .15 }px Joti One`;
				ctx.fillText( 'Credits', canvasWidth / 2, canvasHeight * .1 );

				ctx.font = `${ canvasWidth * .07 }px Sedgwick Ave Display`;
				ctx.fillStyle = '#a00';
				ctx.fillText( 'Music By:', canvasWidth / 2, canvasHeight * .3 );

				ctx.font = `${ canvasWidth * .05 }px Joti One`;
				ctx.fillStyle = '#ddd';
				ctx.fillText( 'OBLIDVM', canvasWidth / 2, canvasHeight * .4 );
				ctx.fillText(
					'http://oblidivmmusic.blogspot.com.es/',
					canvasWidth / 2,
					canvasHeight * .45
				);

				ctx.font = `${ canvasWidth * .07 }px Sedgwick Ave Display`;
				ctx.fillStyle = '#a00';
				ctx.fillText( 'Sound Effects:', canvasWidth / 2, canvasHeight * .6 );

				ctx.font = `${ canvasWidth * .05 }px Joti One`;
				ctx.fillStyle = '#ddd';
				ctx.fillText( 'Kenney.nl', canvasWidth / 2, canvasHeight * .7 );
				ctx.fillText(
					'http://www.kenney.nl',
					canvasWidth / 2,
					canvasHeight * .75
				);

				ctx.restore();

			},

			drawHowTo() {

				ctx.save();

				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = '#fff';
				ctx.font = `${ canvasWidth * .12 }px Joti One`;
				ctx.fillText( 'How To Play', canvasWidth / 2, canvasHeight * .1 );

				ctx.fillStyle = '#ddd';
				ctx.font = `${ canvasWidth * .08 }px Joti One`;
				ctx.textAlign = 'left';
				ctx.fillText( 'Move with:', canvasWidth * .1, canvasHeight * .3 );
				ctx.fillStyle = '#a00';
				ctx.font = `${ canvasWidth * .06 }px Sedgwick Ave Display`;
				ctx.textAlign = 'right';
				ctx.fillText( 'A-S-W-D', canvasWidth * .9, canvasHeight * .3 );

				// Image for player ship

				const img = document.createElement( 'img' );
				img.src = gameObject.media.gameImages[4];

				ctx.drawImage(
					img,
					canvasWidth / 2 - 25,
					canvasHeight * .4,
					50, 50
				);

				// Drawing move effects as rectangles

				ctx.fillStyle = '#aaa';
				// First move effect
				ctx.fillRect(
					canvasWidth / 2 - 50,
					canvasHeight * .43,
					15, 2
				);
				// Second
				ctx.fillRect(
					canvasWidth / 2 - 45,
					canvasHeight * .45,
					10, 2
				);

				// Second part

				ctx.fillStyle = '#ddd';
				ctx.font = `${ canvasWidth * .08 }px Joti One`;
				ctx.textAlign = 'left';
				ctx.fillText( 'Shoot with:', canvasWidth * .1, canvasHeight * .55 );
				ctx.fillStyle = '#a00';
				ctx.font = `${ canvasWidth * .06 }px Sedgwick Ave Display`;
				ctx.textAlign = 'right';
				ctx.fillText( 'K or SPACE', canvasWidth * .9, canvasHeight * .55 );

				// Shoot ball for example

				// Gradient

				const shootGrad =
				ctx.createRadialGradient(
					canvasWidth / 2,
					canvasHeight * .65,
					2,
					canvasWidth / 2,
					canvasHeight * .65,
					5
				);

				shootGrad.addColorStop( 0, 'orange' );
				shootGrad.addColorStop( 1, '#a00');

				ctx.fillStyle = shootGrad;
				ctx.beginPath();
				ctx.arc( canvasWidth / 2, canvasHeight * .65, 5, 0, 2 * Math.PI);
				ctx.fill();

				ctx.drawImage(
					img,
					canvasWidth / 2 - 25,
					canvasHeight * .7,
					50, 50
				);

				ctx.restore();

			},

			// Drawing options screen

			drawOptions() {

				ctx.save();

				// Drawing options text

				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = '#fff';
				ctx.font = `${ canvasWidth * .15 }px Joti One`;
				ctx.fillText( 'Options', canvasWidth / 2, canvasHeight * .1 );

				ctx.fillStyle = '#ddd';
				ctx.font = `${ canvasWidth * .08 }px Joti One`;
				ctx.textAlign = 'left';
				ctx.fillText( 'Music:', canvasWidth * .1, canvasHeight * .3 );
				ctx.fillStyle = '#a00';
				ctx.font = `${ canvasWidth * .06 }px Sedgwick Ave Display`;
				ctx.textAlign = 'right';
				ctx.fillText(
					gameObject.audio.currentTrackGainValue * 100,
					canvasWidth * .9,
					canvasHeight * .3
				);

				ctx.fillStyle = '#ddd';
				ctx.font = `${ canvasWidth * .08 }px Joti One`;
				ctx.textAlign = 'left';
				ctx.fillText( 'Sound Effects:', canvasWidth * .1, canvasHeight * .6 );
				ctx.fillStyle = '#a00';
				ctx.font = `${ canvasWidth * .06 }px Sedgwick Ave Display`;
				ctx.textAlign = 'right';
				ctx.fillText(
					gameObject.audio.currentSEGainValue * 100,
					canvasWidth * .9,
					canvasHeight * .6
				);

				// Drawing buttons to turn up or down audio volume

				gameObject.interface.options.buttons.forEach(
					function drawButton(button, index) {

						if ( button.canDraw ) {

							let textColor,
								bgColor,	// At this point you know what these are about -.-
								textContent;

							// Alias

							const generalBtn = gameObject.interface.options.generalBtn;

							if ( button.isActive ) {
								textColor = generalBtn.textHoverColor;
								bgColor = generalBtn.bgHoverColor;
							}
							else {
								textColor = generalBtn.textColor;
								bgColor = generalBtn.bgColor;	
							}

							// Drawing background

							ctx.fillStyle = bgColor;
							ctx.fillRect(
								generalBtn.x,
								button.y,
								generalBtn.width,
								generalBtn.height
							);

							// Drawing plus or minus sign

							if ( index % 2 == 0 ) {
								textContent = '+';
							}
							else {
								textContent = '-';	
							}

							ctx.fillStyle = textColor;
							ctx.textAlign = 'center';
							ctx.textBaseline = 'middle';
							ctx.font = `${ generalBtn.textSize }px Sedgwick Ave Display`;

							ctx.fillText(
								textContent,
								generalBtn.x + generalBtn.width / 2,
								button.y + generalBtn.height / 2
							);

						}

					}
				);

				ctx.restore();

			},

			// Drawing screen transition

			drawTransition() {

				ctx.save();

				ctx.fillStyle = 
				`rgba( 17, 17, 17, ${ gameObject.screen.transitionAlphaColor } )`;
				ctx.fillRect( 0, 0, canvasWidth, canvasHeight );

				/* Drawing game over text, in this case will be a
				 * game over transition
				 */

				if ( gameObject.state.gameOver.inTransition ||
				     gameObject.state.gameOver.started ) {

					ctx.fillStyle = 
					`rgba( 170, 0, 0, ${ gameObject.screen.transitionAlphaColor })`;
					ctx.font = `${ canvasWidth * .12 }px Sedgwick Ave Display`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText( 'Game Over', canvasWidth / 2, canvasHeight / 2 );

				}

				ctx.restore();

			},

			drawBackBtn() {

				ctx.save();

				// Variables to hold colors

				let boxColor,
					textColor;

				// Back button alias

				const backBtn = gameObject.interface.backBtn;

				if ( backBtn.isActive ) {
					boxColor = backBtn.bgHoverColor;
					textColor = backBtn.textHoverColor;
				}
				else {
					boxColor = backBtn.bgColor;
					textColor = backBtn.textColor;
				}

				// Background

				ctx.fillStyle = boxColor;
				ctx.fillRect( backBtn.x, backBtn.y, backBtn.width, backBtn.height );

				// Text

				ctx.font = `${ backBtn.textSize }px Sedgwick Ave Display`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = textColor;
				ctx.fillText(
					backBtn.text,
					backBtn.x + ( backBtn.width / 2 ),
					backBtn.y + ( backBtn.height / 2 )
				);

				ctx.restore();

			},

			drawPlayer() {


				ctx.save();

				if ( gameObject.components.player.deathAnimationCanDraw ) {

					const img = document.createElement( 'img' );
					img.src = gameObject.media.gameImages[4];

					ctx.drawImage(
						img,
						gameObject.components.player.x,
						gameObject.components.player.y,
						gameObject.components.player.width,
						gameObject.components.player.height
					);

				ctx.restore();

				}

			},

			// Drawing game enemies

			drawEnemies() {

				ctx.save();

				const img = document.createElement( 'img' );

				// Drawing for commmon enemies and bosses

				[
					gameObject.components.enemies.list,
					gameObject.components.enemies.bosses
				].forEach( function accessEnemyList(enemyList) {

						enemyList.forEach(

							function drawEnemies(enemy) {

								if ( enemy.deathAnimationCanDraw ) {

									switch( enemy.type ) {

										case 1:
											img.src = gameObject.media.gameImages[2];
											break;
										case 2:
											img.src = gameObject.media.gameImages[3];
											break;
										case 3:
											img.src = gameObject.media.gameImages[7];
											break;
										case 4:
											img.src = gameObject.media.gameImages[8];
											break;
										case 5:
											img.src = gameObject.media.gameImages[1];
											break;
										case 6:
											img.src = gameObject.media.gameImages[6];
											break;
										default:
											console.log( 'Unknown enemy image type' );

									}

									ctx.save();
									ctx.translate(
										enemy.collisionCircle.x,
										enemy.collisionCircle.y
									);

									/* We add and extra angle to rotate the image down
									 * and keep it in sync with the canvas coordinate system.
									 * We could also rotate the images, but this is easier 
									 * for now.
									 */

									if ( enemy.type === 1 || enemy.type === 2 ||
									     enemy.type === 3 )
									{
										ctx.rotate( enemy.angle + Math.PI / 2 );	
									}
									else if ( enemy.type === 4 ) {
										ctx.rotate( enemy.angle - Math.PI / 2 );	
									}
									else {
										ctx.rotate( enemy.angle );
									}

									ctx.drawImage(
										img,
										-enemy.width / 2,
										-enemy.height / 2,
										enemy.width,
										enemy.height
									);

									ctx.restore();

								}

						} );

				}	);

				ctx.restore();

			},

			// Drawing all game shots

			drawShots() {

				ctx.save();

				// Player shots

				gameObject.components.player.shots.forEach(

					function drawPlayerShots(shot) {

						const shotGrad = ctx.createRadialGradient(
							shot.x, shot.y, 3,
							shot.x, shot.y, shot.radius
						);

						if ( shot.type === 1 ) {
							shotGrad.addColorStop( 0, 'orange' );
							shotGrad.addColorStop( 1, '#a00' );	
						}
						else if ( shot.type === 2 ) {
							shotGrad.addColorStop( 0, '#004' );
							shotGrad.addColorStop( 1, '#00c' );	
						}
						else {
							shotGrad.addColorStop( 0, '#fff' );
							shotGrad.addColorStop( .1, '#ccc' );
							shotGrad.addColorStop( .3, '#999' );
							shotGrad.addColorStop( 1, '#000');
						}

						ctx.beginPath();
						ctx.fillStyle = shotGrad;
						ctx.arc( shot.x, shot.y, shot.radius, 0, 2 * Math.PI );
						ctx.fill();

					}

				);

				// Enemy shots

				gameObject.components.enemies.shots.forEach(

					function drawEnemyShot(shot) {

						switch ( shot.type ) {

							case 1:
							case 3:
							case 5:
							case 6:
							case 7:

								let gradientRadius,
									shotGrad;

								if ( shot.type === 1 ) {
									gradientRadius = 3;
								}
								else if ( shot.type === 3 || shot.type === 6 ||
													shot.type == 7 ) {
									gradientRadius = ( shot.radius * 3 ) / 4;
								}
								else if ( shot.type === 5 ) {
									gradientRadius = shot.radius / 2;
								}

								shotGrad = ctx.createRadialGradient(
									shot.x, shot.y, gradientRadius,
									shot.x, shot.y, shot.radius
								);

								if ( shot.type === 1 ) {
									shotGrad.addColorStop( 0, '#040' );
									shotGrad.addColorStop( .5, '#070' );
									shotGrad.addColorStop( 1, '#0b0' );
								}
								else if ( shot.type === 3 ) {
									shotGrad.addColorStop( 0, '#fff' );
									shotGrad.addColorStop( .5, '#fcb' );
									shotGrad.addColorStop( 1, '#caa' );
								}
								else if ( shot.type === 5 ) {
									shotGrad.addColorStop( 0, '#ff0' );
									shotGrad.addColorStop( .5, '#ca0' );
									shotGrad.addColorStop( 1, '#a00' );
								}
								else if ( shot.type === 6 || shot.type === 7 ) {
									shotGrad.addColorStop( 0, '#fff' );
									shotGrad.addColorStop( .3, '#bcf' );
									shotGrad.addColorStop( .7, '#9ac' );
									shotGrad.addColorStop( 1, '#79a' );
								}

								ctx.beginPath();
								ctx.fillStyle = shotGrad;
								ctx.arc( shot.x, shot.y, shot.radius, 0, 2 * Math.PI );
								ctx.fill();

								break;

							case 2:
							case 4:

								// For colors and gradients

								let shotFill;
								
								ctx.save();
								ctx.translate(
									shot.x + shot.width / 2,
									shot.y + shot.height / 2
								);
								ctx.rotate( shot.angle + Math.PI / 2 );

								if ( shot.type === 2 ) {
									shotFill = '#33f';
								}
								else {
									shotFill = ctx.createLinearGradient(
										-shot.width, 0, shot.width / 2, 0
									);
									shotFill.addColorStop( 0, 'red' );
									shotFill.addColorStop( 1, 'blue' );
								}

								ctx.fillStyle = shotFill;

								ctx.fillRect(
									-shot.width / 2,
									-shot.height / 2,
									shot.width,
									shot.height
								);
								ctx.restore();

								break;

							default:
								console.log( 'Unknown shot type' );

						}

					}

				);

				ctx.restore();

			},

			// Drawing player power ups

			drawPowerUps() {

				ctx.save();

				gameObject.components.powerUps.list.forEach(

					function drawPowerUp(powerUp) {

						ctx.fillStyle = '#fff';
						ctx.fillRect(
							powerUp.x, powerUp.y,
							powerUp.width, powerUp.height
						);

						if ( powerUp.type === 1 || powerUp.type === 2 ||
								 powerUp.type === 3 )
						{

							const shotGrad = ctx.createRadialGradient(
								powerUp.x + powerUp.width / 2,
								powerUp.y + powerUp.height / 2,
								3,
								powerUp.x + powerUp.width / 2,
								powerUp.y + powerUp.height / 2,
								powerUp.width * .4,
							);

							if ( powerUp.type === 1 ) {
								shotGrad.addColorStop( 0, 'orange' );
								shotGrad.addColorStop( 1, '#a00' );	
							}
							else if ( powerUp.type === 2 ) {
								shotGrad.addColorStop( 0, '#004' );
								shotGrad.addColorStop( 1, '#00c' );	
							}
							else {
								shotGrad.addColorStop( 0, '#fff' );
								shotGrad.addColorStop( .1, '#ccc' );
								shotGrad.addColorStop( .3, '#999' );
								shotGrad.addColorStop( 1, '#000');
							}

							ctx.beginPath();
							ctx.fillStyle = shotGrad;
							ctx.arc(
								powerUp.x + powerUp.width / 2,
								powerUp.y + powerUp.height / 2,
								powerUp.width * .4,
								0, Math.PI * 2
							);
							ctx.fill();

						}
						else if ( powerUp.type === 4 ) {

							const img = document.createElement( 'img' );
							img.src = gameObject.media.gameImages[4];

							ctx.drawImage(
								img,
								powerUp.x + powerUp.width * .1,
								powerUp.y + powerUp.height * .1,
								powerUp.width * .8,
								powerUp.height * .8
							);

						}
						else {

							ctx.fillStyle = '#cc0';
							ctx.font = `${ powerUp.width * .8 }px Sedgwick Ave Display`;
							ctx.textAlign = 'center';
							ctx.textBaseline = 'middle';

							ctx.fillText(
								'S',
								powerUp.x + powerUp.width / 2,
								powerUp.y + powerUp.height / 2 + 3
							);

						}

					}

				);

				ctx.restore();

			},

			// This will draw player score and lives

			drawInfo() {

				ctx.save();

				// Image for player lives

				const img = document.createElement( 'img' );
				img.src = gameObject.media.gameImages[4];

				ctx.font = `${ canvasWidth * .06 }px Sedgwick Ave Display`;
				ctx.fillStyle = '#fff';
				ctx.textAlign = 'left';
				ctx.fillText( 'Lives:', canvasWidth * .1, canvasHeight * .1 );
				ctx.textAlign = 'right';
				ctx.fillText( 'Score:', canvasWidth * .9, canvasHeight * .1 );

				// Score

				ctx.fillText(
					gameObject.components.player.score,
					canvasWidth * .9,
					canvasHeight * .2
				);

				// Lives

				for ( let i = 0; i < gameObject.components.player.lives; i++ ) {
					ctx.drawImage(
						img,
						canvasWidth * .1 + i * canvasWidth * .08,
						canvasHeight * .15,
						30, 30
					);
				}

				ctx.restore();

			},

			drawGameOver() {

				ctx.save();

				ctx.fillStyle = '#111';
				ctx.fillRect( 0, 0, canvasWidth, canvasHeight );

				ctx.fillStyle = 
				`rgba( 170, 0, 0, ${ gameObject.screen.transitionAlphaColor })`;
				ctx.font = `${ canvasWidth * .12 }px Sedgwick Ave Display`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText( 'Game Over', canvasWidth / 2, canvasHeight / 2 );

				ctx.restore();

			}

		}

	}

	// *** Event listeners for game interaction

	// Listener to highlight buttons on hover ( mouse only )

	canvas.addEventListener( 'mousemove', function handleMouseMove(e) {

		// Screens to interact

		if ( gameObject.screen.onTitleScreen ) {
			// Request a frame for optimization
			window.requestAnimationFrame( function callHandler() {
				gameObject.interface.title.handleHover( e );
			} );
		}
		else if ( gameObject.screen.onCreditScreen ||
							gameObject.screen.onHowToScreen ||
							gameObject.screen.onOptionScreen )
		{
			window.requestAnimationFrame( function callHandler() {
				if ( gameObject.screen.onOptionScreen ) {

					/* Back btn interaction will be handled inside because of mouse
					 * pointer issues
					 */

					gameObject.interface.options.handleHover( e );
				}
				else {
					gameObject.interface.backBtn.handleHover( e );
				}
			} );	
		}

	} );

	// Listener to handle click throughout screens, mainly for navigation

	canvas.addEventListener( 'click', function handleClicks(e) {

		// Will behave differently according to active screen

		switch( true ) {  // Yep, switch hacks again

			case gameObject.screen.onIntroScreen:

				// Skipping intro

				gameObject.interface.scrollText.reset();
				gameObject.screen.changeScreen( 'onTitleScreen' );
				break;

			case gameObject.screen.onTitleScreen:

				gameObject.interface.title.handleTitleClick( e );
				break;

			case gameObject.screen.onCreditScreen ||
					 gameObject.screen.onHowToScreen ||
					 gameObject.screen.onOptionScreen:

				if ( gameObject.interface.backBtn.isOnBackBtn( e ) ) {
					gameObject.interface.backBtn.toTitle();
				}
				else if ( gameObject.screen.onOptionScreen ) {
					gameObject.interface.options.handleOptionsClick( e );
				}
				break;

			default:
				break;

		}

	} );

	// To skip intro through keyboard and pause/resume game

	window.addEventListener( 'keypress', function skipAndPause(e) {

		if ( gameObject.screen.onIntroScreen &&
			   !( e.key === 'p' || e.key === 'P' ) ) {
			gameObject.interface.scrollText.reset();
			gameObject.screen.changeScreen( 'onTitleScreen' );
		}
		else if ( e.key === 'p' || e.key === 'P' ) {


			if ( gameObject.state.running ) {
				gameObject.state.running = false;
				gameObject.state.wasPaused = true;
				gameManager.stopGame();
			}
			else {
				gameObject.state.running = true;
				gameManager.startGame();
			}

		}

	} );

	// These will take care of player control on keyboard

	window.addEventListener( 'keydown', function startControl(e) {

		// Just modifying states

		if ( gameObject.components.player.allowPlayer ) {

			if ( e.key === 'w' || e.key === 'W' ) {
				gameObject.components.player.movingUp = true;
			}

			if ( e.key === 'd' || e.key === 'D' ) {
				gameObject.components.player.movingRight = true;
			}

			if ( e.key === 'a' || e.key === 'A' ) {
				gameObject.components.player.movingLeft = true;
			}

			if ( e.key === 's' || e.key === 'S' ) {
				gameObject.components.player.movingDown = true;
			}

			if ( e.key === 'k' || e.key === 'K' || e.key === ' ') {
				gameObject.components.player.shooting = true;
			}

		}

	} );

	window.addEventListener( 'keyup', function endControl(e) {
		
		if ( gameObject.components.player.allowPlayer ) {

			if ( e.key === 'w' || e.key === 'W' ) {
				gameObject.components.player.movingUp = false;
			}

			if ( e.key === 'd' || e.key === 'D' ) {
				gameObject.components.player.movingRight = false;
			}

			if ( e.key === 'a' || e.key === 'A' ) {
				gameObject.components.player.movingLeft = false;
			}

			if ( e.key === 's' || e.key === 'S' ) {
				gameObject.components.player.movingDown = false;
			}

			if ( e.key === 'k' || e.key === 'K' || e.key === ' ') {
				gameObject.components.player.shooting = false;
			}

		}

	} );

	// This section will handle small viewports interaction

	// Getting DOM elements

	const smallMessageBox = 
			document.querySelector( '.small-message-container' ),
		smallControllerBox =
			document.querySelector( '.small-controller-container' ),
		leftBtn = document.querySelector( '#leftBtn' ),
		rightBtn = document.querySelector( '#rightBtn' ),
		shootBtn = document.querySelector( '#shootBtn' );

	smallMessageBox.style.display = 'block';
	smallMessageBox.style.animation = 'showMessageBox .4s ease-in forwards';

	// Hiding message after a time not to disturb player

	setTimeout( function hideMessage() {

		smallMessageBox.style.animation = 'hideMessageBox .4s ease-in forwards';

		setTimeout( function hideMessageDisplay() {
			smallMessageBox.style.display = 'none';
		}, 400 );

	}, 10000 );

	// Functions to show and hide small controller

	function showSmallController() {
		smallControllerBox.style.display = 'block';
		smallControllerBox.style.animation =
		'showSmallController .4s ease-in forwards';
	}

	function hideSmallController() {
		smallControllerBox.style.animation =
		'hideSmallController .4s ease-in forwards';
		setTimeout( function hideControllerDisplay() {
			smallControllerBox.style.display = 'none';
		}, 400 );
	}

	// Adding controls to small controller

	// Start actions

	leftBtn.addEventListener( 'touchstart', function moveLeft() {
		gameObject.components.player.movingLeft = true;
	} );

	rightBtn.addEventListener( 'touchstart', function moveRight() {
		gameObject.components.player.movingRight = true;
	} );

	shootBtn.addEventListener( 'touchstart', function shoot() {
		gameObject.components.player.shooting = true;
	} );

	// End actions

	leftBtn.addEventListener( 'touchend', function stopLeft() {
		gameObject.components.player.movingLeft = false;
	} );

	rightBtn.addEventListener( 'touchend', function stopRight() {
		gameObject.components.player.movingRight = false;
	} );

	shootBtn.addEventListener( 'touchend', function stopShooting() {
		gameObject.components.player.shooting = false;
	} );

	gameManager.startGame();

} );