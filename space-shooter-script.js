
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

		// Declared this way to allow recursion (easier than binding gameManager)

		updateGame: function updater(time) {

			// Update game status by handling game object methods and properties

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
						gameObject.audio.playSound(  // Default track 3, but is boring
							gameObject.media.gameTracks[5], true, true
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

					// Drawing intro story

					gameObject.components.intro.move();
					gameObject.components.intro.update();
					gameObject.graphics.clear();
					gameObject.graphics.drawBackground();
					gameObject.graphics.drawIntro();

					if ( gameObject.components.intro.finished ) {
						gameObject.screen.changeScreen( 'onTitleScreen' );
					}

					break;

				case gameObject.screen.onTitleScreen:

					gameObject.components.title.update();
					gameObject.graphics.clear();
					gameObject.graphics.drawBackground();
					gameObject.graphics.drawTitle();

					break;

				case gameObject.screen.onCreditScreen ||
						 gameObject.screen.onHowToScreen ||
						 gameObject.screen.onOptionScreen:

				  gameObject.components.backBtn.update();
					gameObject.graphics.clear();
					gameObject.graphics.drawBackground();

					if ( gameObject.screen.onCreditScreen ) {
						gameObject.graphics.drawCredits();
					}
					else if ( gameObject.screen.onHowToScreen ) {
						gameObject.graphics.drawHowTo();
					}
					else {
						gameObject.components.options.update();
						gameObject.graphics.drawOptions();
					}

					gameObject.graphics.drawBackBtn();

					break;

				default:
					gameObject.graphics.drawBackground();

			}

			gameObject.id = requestAnimationFrame( updater );

		},

		stopGame() {
			cancelAnimationFrame( gameObject.id );
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

		// Screen object to handle screen transitions and conditions

		screen: {
			onLoadingScreen: true,
			onIntroScreen: false,
			onTitleScreen: false,
			onPlayingScreen: false,
			onOptionScreen: false,
			onHowToScreen: false,
			onCreditScreen: false,

			// Method to change screen booleans easily

			changeScreen(newScreen) {

				for ( let i in gameObject.screen ) {

					if ( typeof gameObject.screen[i] === 'boolean' ) {
						gameObject.screen[i] = false;
					}

				}

				gameObject.screen[newScreen] = true;

			}

		},

		// Loader object to handle loading

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
					'./media/images/background-level-2.png',
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

		// Media resources

		media: {
			gameTracks: [], // game-over | victory | boss | title | level-1 | level-2

			gameSE: [],     // power-up | p-shot-2 | enemy-shot | p-shot-3 -->
											// p-shot-1

			gameImages: [], // bg-1 | boss-1 | enemy-1 | enemy-2 | player | bg-2 -->
										  // boss-2 | enemy-3 | enemy-4
		},

		// Audio related

		audio: {
			currentTrack: null,
			currentGain: null,
			currentStereo: null,
			currentTrackGainValue: .5,
			currentSEGainValue: .5,
			currentStereoValue: 0,

			// Method to start playing a track or effect

			playSound(buffer, loop, isTrack) {

				// Yes, I'm using the WebAudio API in case you haven't noticed

				// Building audio graph

				const audioSource = audioCtx.createBufferSource();
				audioSource.buffer = buffer;
				audioSource.loop = loop;

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

			}
		},

		// Game components such as player, enemies, intro text, etc.

		components: {

			// Intro object to show game story

			intro: {

				x: canvasWidth * .1,
				y: canvasHeight,
				textSize: 22,
				speedY: - 1 / 3,
				width: canvasWidth * .8,
				height: 22,								// Will be updated with method, see later
				text: [
					'In a long distant galaxy, a lonely warrior was born to be a hero. ' +
					'He trained hard every day to protect his people and became one of ' +
					'the greatest warriors of the galaxy. Everything was peaceful. ' +
					'However, a mad scientist named Jorhan made secret experiments with ' +
					'the army, transforming them into crazy pilots that went shooting ' +
					'everything they saw. Chaos, destruction and madness are ruining ' +
					'the galaxy. Now it\'s up to you, space shooter, to save the ' +
					'universe. Good luck !!'
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

				// Update for resizes, new lines set on rearrange, etc

				update() {
					this.x = canvasWidth * .1;
					// Text here means array with text lines, not text itself -.-
					this.height = this.textSize * this.text.length;
				},

				arrangeText() {
					
					/* Arranging text in canvas responsively is pain, but the idea here
					 * is to split text recursively until it fits onscreen
					 */

					// This array will hold all lines of text

					const arrayOfLines = [

						/* First element is all the text words. We do this to join all
						 * lines to a single text, then retrieve each word of it
						 */
						
						this.text.join( ' ' ).split( ' ' )

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

					this.text = Array.from( arrayOfLines );

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

					const mousePos = gameObject.components.mouse.getMousePosition( e ),
						box = gameObject.components.title;

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
						
						if ( gameObject.components.title.isOptionActive( option, e ) &&
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
						gameObject.components.mouse.toPointer();
					}
					else {
						gameObject.components.mouse.toDefault();
					}

				},

				// Handling click navigation on title screen

				handleTitleClick(e) {

					this.containers.forEach( function changeToScreen(option) {

						if ( gameObject.components.title.isOptionActive( option, e ) ) {
							gameObject.screen.changeScreen( option.path );
							gameObject.components.mouse.toDefault();
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

								gameObject.audio.currentTrackGainValue += .1;
								gameObject.audio.currentTrackGainValue =
								Math.round(	gameObject.audio.currentTrackGainValue * 10 ) / 10;
								gameObject.audio.currentGain.gain.value =
								gameObject.audio.currentTrackGainValue;
								gameObject.components.options.buttons[1].canDraw = true;

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

								gameObject.audio.currentTrackGainValue -= .1;
								gameObject.audio.currentTrackGainValue =
								Math.round(	gameObject.audio.currentTrackGainValue * 10 ) / 10;
								gameObject.audio.currentGain.gain.value =
								gameObject.audio.currentTrackGainValue;
								gameObject.components.options.buttons[0].canDraw = true;

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

								gameObject.audio.currentSEGainValue += .1;
								gameObject.audio.currentSEGainValue =
								Math.round( gameObject.audio.currentSEGainValue * 10 ) / 10;
								gameObject.components.options.buttons[3].canDraw = true;

								if ( gameObject.audio.currentSEGainValue >= 1 ) {
									this.canDraw = false;
								}

							}

						}
					}, {
						y: canvasHeight * .65,
						isActive: false,
						canDraw: true,
						action: function turnDownSE() {

							if ( gameObject.audio.currentSEGainValue > 0 ) {

								gameObject.audio.currentSEGainValue -= .1;
								gameObject.audio.currentSEGainValue =
								Math.round( gameObject.audio.currentSEGainValue * 10 ) / 10;
								gameObject.components.options.buttons[2].canDraw = true;

								if ( gameObject.audio.currentSEGainValue <= 0 ) {
									this.canDraw = false;
								}

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

					const mousePos = gameObject.components.mouse.getMousePosition( e );

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

						if ( gameObject.components.options.isButtonActive( button, e ) &&
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
						gameObject.components.backBtn.handleHover( e );
						result = gameObject.components.backBtn.isActive;
					}

					if ( result ) {
						gameObject.components.mouse.toPointer();
					}
					else {
						gameObject.components.mouse.toDefault();	
					}

				},

				// Handling click events

				handleOptionsClick(e) {

					/* This will execute actions in each button, such as
					 * turning up the volume of music or sound effects
					 */

					this.buttons.forEach( function checkButtonState(button) {

						if ( gameObject.components.options.isButtonActive( button, e ) ) {
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
					const mousePos = gameObject.components.mouse.getMousePosition( e );

					return mousePos.x >= this.x && 
								 mousePos.x <= this.x + this.width &&
								 mousePos.y >= this.y &&
								 mousePos.y <= this.y + this.height;

				},

				handleHover(e) {

					if ( this.isOnBackBtn( e ) && window.innerWidth > 768 ) {
						this.isActive = true;
						gameObject.components.mouse.toPointer();
					}
					else {
						this.isActive = false;
						gameObject.components.mouse.toDefault();
					}

				},

				// This will get users back to title screen

				toTitle() {

					this.isActive = false;
					gameObject.components.mouse.toDefault();
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
					// Do Playing code here...
				}

				ctx.restore();

			},

			// Drawing sliding intro text

			drawIntro() {

				ctx.save();

				ctx.font =
				`${ gameObject.components.intro.textSize }px Sedgwick Ave Display`;
				ctx.fillStyle = '#fff';
				

				// This will rearrange the text on screen if any of them overflow

				gameObject.components.intro.arrangeText();

				gameObject.components.intro.text.forEach(
					function fillText(txt, index) {
						ctx.fillText(
							txt,
							gameObject.components.intro.x,
							gameObject.components.intro.y +
							gameObject.components.intro.textSize * index
						);
					}
				);

				ctx.restore();

			},

			// Drawing title screen

			drawTitle() {

				// We'll draw the title and then the options

				ctx.save();

				ctx.textAlign = 'center';
				ctx.font =
				`${ gameObject.components.title.titleSize }px Sedgwick Ave Display`;
				ctx.fillStyle = '#fff';
				ctx.fillText(
					'SPACE',
					gameObject.components.title.x,
					gameObject.components.title.y
				);
				ctx.fillStyle = '#a00';
				ctx.fillText(
					'SHOOTER',
					gameObject.components.title.x,
					gameObject.components.title.y * 2
				);


				// Drawing containers

				gameObject.components.title.containers.forEach(
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
							gameObject.components.title.containersX,
							container.textY - gameObject.components.title.containersOffsetY,
							gameObject.components.title.containersWidth,
							gameObject.components.title.containersHeight
						);

						ctx.fillStyle = textColor;
						ctx.font =
						`${ gameObject.components.title.optionsSize }px Joti One`;

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

				gameObject.components.options.buttons.forEach(
					function drawButton(button, index) {

						if ( button.canDraw ) {

							let textColor,
								bgColor,	// At this point you know what these are about -.-
								textContent;

							// Alias

							const generalBtn = gameObject.components.options.generalBtn;

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

			drawBackBtn() {

				ctx.save();

				// Variables to hold colors

				let boxColor,
					textColor;

				// Back button alias

				const backBtn = gameObject.components.backBtn;

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
				gameObject.components.title.handleHover( e );
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

					gameObject.components.options.handleHover( e );
				}
				else {
					gameObject.components.backBtn.handleHover( e );
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
				gameObject.screen.changeScreen( 'onTitleScreen' );
				break;

			case gameObject.screen.onTitleScreen:

				gameObject.components.title.handleTitleClick( e );
				break;

			case gameObject.screen.onCreditScreen ||
					 gameObject.screen.onHowToScreen ||
					 gameObject.screen.onOptionScreen:

				if ( gameObject.components.backBtn.isOnBackBtn( e ) ) {
					gameObject.components.backBtn.toTitle();
				}
				else if ( gameObject.screen.onOptionScreen ) {
					gameObject.components.options.handleOptionsClick( e );
				}
				break;

			default:
				console.log( 'No screen!!' );

		}

	} );

	// To skip intro through keyboard

	window.addEventListener( 'keypress', function skipIntro() {

		if ( gameObject.screen.onIntroScreen ) {
			gameObject.screen.changeScreen( 'onTitleScreen' );
		}

	} );

	gameManager.startGame();

} );