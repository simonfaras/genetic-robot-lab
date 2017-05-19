window.GenLab = {};
window.GenLab.World = (function() {

	const green = '#62D2A2';
	const pink = '#ff0080';
	const size = 30;
	const speed = 0.07;

	let sceneWidth = 800;
	let sceneHeight = 800;


	/*////////////////////////////////////////*/


	let World = Matter.World,
		Bodies = Matter.Bodies,
		Body = Matter.Body,
		Composites = Matter.Composites,
		Composite = Matter.Composite,
		Common = Matter.Common,
		Constraint = Matter.Constraint,
		Bounds = Matter.Bounds,
		Engine = Matter.Engine,
		Render = Matter.Render,
		Events = Matter.Events;


	// create an engine
	let engine = Engine.create();
	engine.enableSleeping = true;

	let world = engine.world;
	Engine.run( engine );

	/*////////////////////////////////////////*/

	let canvas = document.createElement( 'canvas' );
	canvas.width = sceneWidth;
	canvas.height = sceneHeight;

	/*////////////////////////////////////////*/

	let MouseConstraint = Matter.MouseConstraint,
		Mouse = Matter.Mouse;

	let mouseConstraint = MouseConstraint.create( engine, {
		mouse: Mouse.create( canvas )
	} );

	let ground = Bodies.rectangle( sceneWidth / 2, sceneHeight + (sceneHeight / 2), Math.max( sceneWidth * 4, 2000 ), sceneHeight, {
		isStatic: true,
		render: {
			opacity: 1,
			fillStyle: '#000',
			strokeStyle: '#000'
		}
	} );

	World.add( world, [ mouseConstraint, ground ] );

	let walls = [
	  Bodies.rectangle(-(sceneWidth / 2), 0, 20, sceneHeight * 2, { isStatic: true }),
	  Bodies.rectangle(sceneWidth * 2, 0, 20, sceneHeight * 2, { isStatic: true }),
	];
	World.add(world, walls);


	/*////////////////////////////////////////*/

	function connect( c, bodyA, bodyB, constraintOptions ) {
		if ( bodyA && bodyB ) {
			Composite.addConstraint( c, Constraint.create(
				Common.extend( {
					bodyA: bodyA,
					bodyB: bodyB
				}, constraintOptions )
			) );
		}
	}


	function rect( x, y, w, h ) {
		return Bodies.rectangle( x, y, w, (h ? h : w), {
			render: {
				fillStyle: pink,
				strokeStyle: '#0000ff',
				lineWidth: 3
			}
		} )
	};

    function simpleBox(xx, yy, size) {

    }

	let color = green;
	let width = ( size * 5 );
	let height = ( size * 3);
	let startY = sceneHeight - ( 3 * size ) - 20;
	let startX =width;//(sceneWidth/2) - width; //-width/2;
	console.log( 'startX', startX );

	const jumpCharacter = createJumperCharacter(
		startX,
		startY,
		size
	);

	const characterList = [jumpCharacter];
	World.add( world, jumpCharacter );


	world.gravity.y = 0.30;


	/*////////////////////////////////////////*/
	// Controls

	function onKeyDown( e ) {

		let key = ( e.code || e.key || '' ).toLowerCase().replace( /^(key|digit|numpad)/, '' );

		let character = {
			leftlegA: {
				joint: jumpCharacter.bodies[ 2 ],
				force: 0.04
			},
			leftlegB: {
				joint: jumpCharacter.bodies[ 1 ],
				force: -0.04
			},
			rightlegA: {
				joint: jumpCharacter.bodies[ 4 ],
				force: 0.04
			},
			rightlegB: {
				joint: jumpCharacter.bodies[ 3 ],
				force: -0.04
			}
		};


		switch ( key ) {
			case 'arrowright':
				spring( character.leftlegA.joint, character.leftlegB.force );
				break;
			case 'arrowleft':
				spring( character.rightlegA.joint, character.rightlegB.force );
				break;
		}

	}

	function spring( target, force ) {
		Body.applyForce( target, target.position, {
			x: 0, y: force
		} );
	}


	document.body.addEventListener( 'keydown', onKeyDown );


	function bindKeyButton( el ) {

		let key = el.getAttribute( 'data-key' );

		function triggerKey( e ) {
			e.preventDefault();
			onKeyDown( { key: key } );
		}

		el.addEventListener( 'mousedown', triggerKey );
		el.addEventListener( 'touchstart', triggerKey );
	}

	let keys = document.querySelectorAll( '[data-key]' );
	for ( let i = 0; i < keys.length; i++ ) {
		bindKeyButton( keys[ i ] );
	}


	/*////////////////////////////////////////*/

	// Render

	let render = Render.create( {
		element: document.body,
		canvas: canvas,
		context: canvas.getContext( '2d' ),
		engine: engine,
		options: {
			hasBounds: true,
			width: sceneWidth,
			height: sceneHeight,
			//showAngleIndicator: true,
			wireframes: false,
			//wireframeBackground: '#ffffff',
		}
	} );
	Render.run( render );

	/*////////////////////////////////////////*/

	// Resizing

	let origBounds = render.bounds;
	let lastScale;
	// world.bounds.min.x = -width/2;
	// world.bounds.min.y = -height;
	// world.bounds.max.x = sceneWidth + width/2;
	// world.bounds.max.y = sceneHeight;


	let mouse = mouseConstraint.mouse;
	let boundsScale = 1;
	let initial = true;

	function ease( current, target, ease ) {
		return current + (target - current) * ( ease || 0.2 );
	};



	function findOuterCharactersValuesX() {

		const maxValueOfX = Math.max(...characterList.map(o => o.bodies[0].position.x));
		const minValueOfX = Math.min(...characterList.map(o => o.bodies[0].position.x));

		return [minValueOfX, maxValueOfX];
	}



	function renderLoop() {

		requestAnimationFrame( renderLoop );

		let outerValues = findOuterCharactersValuesX();

		// console.log( 'outerValues', outerValues );

		let distance = Math.abs( outerValues[0] - outerValues[1] ) + (sceneWidth*4);

		let boundsScaleTarget = (distance / sceneWidth);

		boundsScale = ease( boundsScale, boundsScaleTarget, (initial ? 1 : 0.01 ) ); //+= scaleFactor;

		// scale the render bounds
		render.bounds.min.x = ease( render.bounds.min.x, Math.min( outerValues[0] - outerValues[1] ), (initial ? 1 : 0.01) );
		render.bounds.max.x = render.bounds.min.x + render.options.width * boundsScale;

		render.bounds.min.y = (sceneHeight * -0.1 ) * boundsScale;
		//render.bounds.min.x - (sceneHeight * (1 - boundsScale) * 0.1 );
		render.bounds.max.y = (sceneHeight * 0.9 ) * boundsScale;
		//render.bounds.max.x - (sceneHeight * (1 - boundsScale) * 0.1 );

		// update mouse
		Mouse.setScale( mouse, { x: boundsScale, y: boundsScale } );//boundsScale - boundsScaleTarget);
		Mouse.setOffset( mouse, render.bounds.min );
		initial = false;

	}


	renderLoop();

	document.body.insertBefore( canvas, document.body.firstChild );

    const factory = {
        createWorld: populationSettings => {
            // Denna håller koll på vart saker placeras


            return {
                getPopulation: () => {
                    // 
                },
                run: () => new Promise(resolve => {
                    // Denna kör hela simuleringen och returnerar hur den ser ut efter
                })
            }
        }
    }

	return {
        factory,
        createRobot: settings => 
		addRobot: robot => World.add( world, robot ),
		reset: () => console.log( 'HUR GÖR VI EN RESET?' ),
		getResults: () => console.log( 'RETURNERA EN ARRAY MED RESULTAT KOPPLADE TILL ROBOTAR' )
	}

})();