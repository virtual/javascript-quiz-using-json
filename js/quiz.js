/*
      Version: 0.1.0
       Author: Matthew D Webb
  Description: json quiz score calculator
 */

( function ( global, document ) {

	'use strict';

	const VERSION = '0.1.0';
	console.log('Quiz loaded', VERSION);

	let Quiz;
	let Test;

	// configuration for the plugin, these can be overwritten in the initialisation function:
	let config = {
		dataSource: '../examples/data/data.json',
		loadingGif: '../examples/img/loading.gif',
		id: 'quiz',
		randomise: false
	};

	let state = {
    question: {
      current: 0,
      count: 0
    },
		answers: [],
		data: {}
	};

	function extend( config, options ) {
		for ( let i in options ) {
			config[ i ] = options[ i ];
		}
	}

	function isValid( data ) {
		return true;
	}

	function getQuizData( url ) {
		return new Promise( ( resolve, reject ) => {
			const xhr = new XMLHttpRequest();
			xhr.open( 'GET', url );
			xhr.onload = function onload() {
				if ( this.status >= 200 && this.status < 300 ) {
					resolve( xhr.response );
				} else {
					reject( {
						status: this.status,
						statusText: xhr.statusText
					} );
				}
			};
			xhr.onerror = function onerror() {
				reject( {
					status: this.status,
					statusText: xhr.statusText
				} );
			};
			xhr.send();
		} );
	}

	function getScore( answers ) {
		let score = 0;

		answers.forEach( ( answer ) => {
			console.log( answer );
			score += parseInt( answer[ 0 ].value, 10 );
		} );
		return score;
	}

	function updateScore( userAnswer ) {
		// map data to friendlier data set.
		state.answers.push( userAnswer );
	}

	function getTemplate( data, currentQuestion ) {
		let question = data[ 0 ].questions[ currentQuestion ];
		if ( currentQuestion === state.question.count ) {
			return end();
		};
		return questionTemplate( question.question, question.options );
	}

	function randomiseQuestions( questions ) {
		let qs = questions.length,
			t, i;
		while ( qs ) {
			i = Math.floor( Math.random() * qs-- );
			t = questions[ qs ];
			questions[ qs ] = array[ i ];
			questions[ i ] = t;
		}
		return questions;
	}

	function start( data ) {

		if ( !isValid( data ) ) return;

		state.data = JSON.parse( data );

		if ( config.random ) {
			// TODO: need a better way to do this:
			state.data = randomiseQuestions( data );
		}

		questionCount = state.data[ 0 ].questions.length;

		// dynamic dom element needs a handler to the on click event:
		bindSubmit();

		return nextQuestion( data );
	}

	function nextQuestion( data ) {
		let template = getTemplate( state.data, state.question.count );
		if ( state.question.current ) {
			let userAnswer = $( data ).serializeArray()[ 0 ].value;
			updateScore( {
				answer: userAnswer
			} );
		}
		state.question.current += 1;
		renderTemplate( template );
	}

	function end() {
		let score = getScore( stata.answers );
		let message = resultMessage( score, state.data[ 1 ].results );

		return `<h3>Quiz Complete</h3>
								<h4>${message.title}</h4>
								<p>${message.description}</p>
								<p>Your score was: ${score}</p>
						 		<p>Total questions: ${questionCount}</p>`;
	}

	function resultMessage( score, result ) {
		let message = {};

		result.forEach( ( data ) => {
			if ( score >= data.minScore ) {
				message = data;
			}
		} );
		return message;
	}

	function informationTemplate( infoStr, isLast ) {
		return `<form id="quizForm">
									<p>${infoStr}</p>
									<button id="nextQuestion" type="submit" class="btn btn-default">${isLast ? "Final Quiz" : "Next Question" }</button>
								</form>`;
	}

	function questionTemplate( questionStr, options ) {

		let isLastQuestion = ( state.question.count === ( state.question.current + 1 ) );
		let template = `<form id="quizForm">
                          <div>PROGRESS BAR HERE</div>
													<p>${questionStr}</p>`;

		// html radio buttons.
		// NOTE: that the index value is the reference used to determine the score:
		options.forEach( ( option, index ) => {
			template += `<div class="radio">
														<label>
															<input type="radio" name="quizAnswer" required value="${index}">
															${option}
														</label>
													</div>`;
		} );

		template += `<button id="nextQuestion" type="submit" class="btn btn-default">
											${ isLastQuestion ? "Finish Quiz" : "Next" }
									</button>
								</form>`;

		return template;
	};

	// DOM interaction

	function renderTemplate( html ) {
		// $(`#${config.id}`).html(html);
		// document.createElement(html);
		document.getElementById( config.id ).innerHTML = html;
	}

	function bindSubmit() {
		document.addEventListener( 'submit', function ( event ) {
			event.preventDefault();
			if ( event.target.id === 'quizForm' ) {
				// callback();
				var data = new FormData( document.getElementById( 'quizForm' ) );
				console.log( data );
			}
		} );
	}

	// INITIALISE THE QUIZ:

	function init( options ) {

		// extend all default options:
		extend( config, options );

		// get json
		getQuizData( config.dataSource )
			.then( success, error );

		function success( data ) {
			start( data, 0 );
		}

		function error( err ) {
			return renderTemplate(
				`<p>Sorry, we are unable to retrieve the data for this quiz.</p>
																		<small>${err}</small>`
			);
		}
	};

	// --------------------------------------------------------------------//
	// ------------------------------- PRIVATE API ------------------------//
	// --------------------------------------------------------------------//

	TEST = {
		_init: init,
		_bindSubmit: bindSubmit,
		_renderTemplater: renderTemplater,
		_questionTemplate : _questionTemplate,
		_informationTemplate: informationTemplate,
		_resultMessage: resultMessage,
		_end: end,
		_start: start,
		_nextQuestion: nextQuestion,
		_randomiseQuestions: randomiseQuestions,
		_getTemplate: getTemplate,
		_updateScore: updateScore,
		_getScore: getScore,
		_getQuizData: getQuizData,
		_isValid: isValid,
		_extend: extend
	}

	// --------------------------------------------------------------------//
	// ------------------------------- PUBLIC API -------------------------//
	// --------------------------------------------------------------------//

	Quiz = global.Quiz = {
		VERSION,
		init
	};

	return {
		Quiz,
		TEST
	};

}( window, document ) );