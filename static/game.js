window.GenLab = {};
window.GenLab.World = (function() {

	const green = '#62D2A2';
	const pink = '#ff0080';
	const size = 30;
	const speed = 0.07;

	let sceneWidth = 800;
	let sceneHeight = 800;
	let measureJumpActive = false;

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

	const groundBounds = {
		width: Math.max( sceneWidth * 4, 2000 ),
		height: sceneHeight
	};
	let ground = Bodies.rectangle( groundBounds.width / 2, sceneHeight + (sceneHeight / 2), groundBounds.width, groundBounds.height, {
		isStatic: true,
		render: {
			opacity: 1,
			fillStyle: '#000',
			strokeStyle: '#000'
		}
	} );

	World.add( world, [ mouseConstraint, ground ] );

	let walls = [
		Bodies.rectangle( 0, 0, 20, sceneHeight * 2, { isStatic: true } ),
		Bodies.rectangle( groundBounds.width, 0, 20, sceneHeight * 2, { isStatic: true } ),
		Bodies.rectangle( groundBounds.width * .5, 100, groundBounds.width, 40, { isStatic: true } ),
	];
	World.add( world, walls );


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

	function createJumperCharacter( xx, yy, size ) {

		const c = Composite.create( { label: 'test' } );
		const stiffness = 0.05;
		const body = rect( xx + size, yy + size, size * 3, size );


		const leftLegA = rect( xx, yy + (size * 2), size );
		const leftLegB = rect( xx, yy + (size * 3), size );

		const rightLegA = rect( xx + (size * 2), yy + (size * 2), size );
		const rightLegB = rect( xx + (size * 2), yy + (size * 3), size );

		// Body.setMass(leftLegB, 0.4);
		// Body.setMass(rightLegB, 0.4);
		// Body.setMass(leftLegA, 0.4);
		// Body.setMass(rightLegA, 0.4);

		Composite.addBody( c, body );
		Composite.addBody( c, leftLegA );
		Composite.addBody( c, leftLegB );
		Composite.addBody( c, rightLegA );
		Composite.addBody( c, rightLegB );

		connect( c, leftLegA, leftLegB, {
			pointA: { x: 0, y: (size * 0.5) },
			pointB: { x: 0, y: -(size * 0.5) },
			stiffness: stiffness,
			render: { visible: true }
		} );
		connect( c, rightLegA, rightLegB, {
			pointA: { x: 0, y: (size * 0.5) },
			pointB: { x: 0, y: -(size * 0.5) },
			stiffness: stiffness,
			render: { visible: true }
		} );

		connect( c, body, leftLegA, {
			pointA: { x: -((size * 2) * 0.5), y: (size * 0.5) },
			pointB: { x: 0, y: -(size * 0.5) },
			stiffness: 1,
			render: { visible: true }
		} );
		connect( c, body, rightLegA, {
			pointA: { x: ((size * 2) * 0.5), y: (size * 0.5) },
			pointB: { x: 0, y: -(size * 0.5) },
			stiffness: 1,
			render: { visible: true }
		} );

		return c;
	}



	const characterList = [];

	function createCharacters(settings) {

		let color = green;
		let width = ( size * 5 );
		let height = ( size * 3);
		let startY = sceneHeight - ( 3 * size ) - 20;
		let startX = width;//(sceneWidth/2) - width; //-width/2;


		settings.map( o => {
			c = createJumperCharacter(
				startX,
				startY,
				size
			);
			characterList.push({ character: c,
				timing:[...o.timing],
				yy: c.bodies[ 0 ].position.y,
				jumpDistance: 0 }
			);
			startX = ( width * 2 ) * characterList.length;
			World.add( world, c );
		});
	}


	world.gravity.y = 0.30;


	/*////////////////////////////////////////*/
	// Controls

	function onKeyDown( e ) {

		//let key = ( e.code || e.key || '' ).toLowerCase().replace( /^(key|digit|numpad)/, '' );


		
		


	}

	const jump = () => new Promise(resolve => {
		characterList.map( o => {
			let c = o.character.bodies;
			let character = {
				leftlegA: {
					joint: c[ 2 ],
					force: 0.04
				},
				leftlegB: {
					joint: c[ 1 ],
					force: -0.04
				},
				rightlegA: {
					joint: c[ 4 ],
					force: 0.04
				},
				rightlegB: {
					joint: c[ 3 ],
					force: -0.04
				}
			};

			jumpAtTime(character.leftlegA.joint, character.leftlegB.force, o.timing[0]);
			jumpAtTime(character.rightlegA.joint, character.rightlegB.force, o.timing[1]);
		});

		const springTimeA = findMinMax(characterList, o => o.timing[0]);
		const springTimeB = findMinMax(characterList, o => o.timing[1]);

		const simulationTime = Math.max(springTimeA[1], springTimeB[1]);

		measureJumpActive = true;

		setTimeout(() => {
			World.clear(world, true),
			measureJumpActive = false,
			resolve();
		}, simulationTime);
	});


	function jumpAtTime( joint, force, timeMS ) {
		setTimeout(function() {
			spring( joint, force );
		}, timeMS);

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
	}


	function findMinMax( list, func) {

		const max = Math.max( ...list.map( func ));
		const min = Math.min( ...list.map( func ));

		return [ min, max ];
	}

	function measureJump() {
		if(measureJumpActive) {

			let yy;
			let y;
			let jd;
			characterList.map( o => {
				yy = o.yy;
				y = o.character.bodies[ 0 ].position.y;
				jd = o.jumpDistance;
				// console.log( 'yy', yy );
				// console.log( 'y', y );
				// o.character.jumpDistance = yy < y ? yy : y;
				let distance = Math.abs(yy - y);
				o.jumpDistance = Math.max(jd, distance);
				// o.character.jumpDistance = yy < y ? Math.abs(yy - y) : y;
				// console.log( 'o.jumpDistance', o.jumpDistance );
			} );
		}
	}

	function resize() {

		let outerValues = findMinMax(characterList, o => o.character.bodies[ 0 ].position.x);

		// console.log( 'outerValues', outerValues );

		let distance = Math.abs( outerValues[ 0 ] - outerValues[ 1 ] ) + ((width * 3) * 2);

		let boundsScaleTarget = (distance / sceneWidth);

		boundsScale = ease( boundsScale, boundsScaleTarget, (initial ? 1 : 0.01 ) ); //+= scaleFactor;

		// scale the render bounds
		render.bounds.min.x = ease( render.bounds.min.x, Math.min( outerValues[ 0 ] - outerValues[ 1 ] ), (initial ? 1 : 0.01) );
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

	render.bounds.min.x = 0;
	render.bounds.max.x = sceneWidth * 4;
	render.bounds.min.y = 0;
	render.bounds.max.y = sceneHeight * 4;

	function renderLoop() {
		requestAnimationFrame( renderLoop );
		//resize();
		measureJump();
	}
	renderLoop();


	function getCharactersJumpDistance() {
		return characterList.map(o => o.jumpDistance);
	}

	document.body.insertBefore( canvas, document.body.firstChild );

	return {
		run: (robots) => new Promise(resolve => {
			createCharacters(robots);

			jump().then(() => {
				const result = characterList.map(({timing, jumpDistance}) => ({
					timing,
					jumpDistance
				}));
				characterList.splice(0, characterList.length);
				resolve(result);
			});
		})
	}
})();