'use strict';

/*
      Version: 0.5.1-alpha
       Author: Matthew D Webb
  Description: javascript quiz using json
 */
(function (global, document) {

	'use strict';

	var VERSION = '0.5.1-alpha';

	var Quiz = void 0;
	var TEST = void 0;
	var config = void 0;

	// configuration for the plugin, these can be overwritten in the initialisation function:
	var defaultOptions = {
		dataSource: null,
		loadingGif: null,
		seedData: './data/data.json',
		id: 'quiz',
		randomise: false,
		seed: false
	};

	// keeps track of the current state
	var state = {
		question: {
			current: 0,
			count: 0
		},
		answers: [],
		data: {}
	};

	function extend(defaults, options) {
		return Object.assign({}, defaults, options);
	}

	function isValid(data) {
		try {
			JSON.parse(data);
		} catch (e) {
			return false;
		}
		return true;
	}
	// TODO:
	// [1] convert to async / await
	// [2] make function testable (removing annoynmous functions)
	function getQuizData(url) {
		return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest();

			xhr.open('GET', url);
			xhr.onload = function onload(data) {
				if (this.status >= 200 && this.status < 300) {
					resolve(xhr.response);
				} else {
					reject({
						status: this.status,
						statusText: xhr.statusText
					});
				}
			};
			xhr.onerror = function onerror() {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			};
			xhr.send();
		});
	}
	// FIXME: error prone.
	function getScore(answers) {
		if (answers && answers.length > -1) {
			return answers.reduce(function (acc, val) {
				return acc + val;
			});
		} else {
			return 0;
		}
	}
	// TODO: refactor out.
	function updateScore(userAnswer) {
		state.answers.push(userAnswer);
	}

	function getTemplate(questions, currentQuestion) {
		// End of Quiz?
		if (state.question.count === currentQuestion) {
			return end(state);
			// Next Question
		} else {
			var question = questions[currentQuestion];
			return questionTemplate(question.question, question.options);
		}
	}

	function randomiseQuestions(questions) {
		var qs = questions.length;
		var item = void 0,
		    temp = void 0;
		while (qs) {
			item = Math.floor(Math.random() * qs--);
			temp = questions[qs];
			questions[qs] = questions[item];
			questions[item] = temp;
		}
		return questions;
	}

	function nextQuestion(state, config) {
		var questions = state.data[0].questions;
		var currentQ = state.question.current;
		var template = getTemplate(questions, currentQ);
		// increment current question:
		state.question.current += 1;
		renderTemplate(template, config.id);
	}

	function start(data, config, state) {

		if (isValid(data) === false) {
			renderTemplate('<p>The JSON data provided is not valid! Please check this and retry</p>', config.id);
			return;
		}
		// should be moved.
		state.data = JSON.parse(data);
		state.question.count = state.data[0].questions.length;

		if (config.random === true) {
			state.data = randomiseQuestions(state.data);
		}

		bindSubmit(document);
		nextQuestion(state, config);
	}

	function end(state) {
		var score = getScore(state.answers);
		var message = resultMessage(score, state.data[1].results);
		return '<h3>Quiz Complete</h3><h4>' + message.title + '</h4><p>' + message.description + '</p>\n\t\t  <p>Your score was: ' + score + ' questions: ' + state.question.count + '</p>';
	}

	function resultMessage(score, result) {
		var message = {};
		result.forEach(function (data) {
			if (score >= data.minScore) {
				message = data;
			}
		});
		return message;
	}

	function informationTemplate(infoStr, isLast) {
		return '<form id="quizForm"><p>' + infoStr + '</p>\n\t\t\t\t<button id="nextQuestion" type="submit" class="btn btn-default">' + (isLast ? "Finish Quiz" : "Next Question") + '</button>\n\t\t\t</form>';
	}

	function questionTemplate(questionStr, options) {

		var isLastQuestion = state.question.count === state.question.current + 1;
		var template = '<div id="quizForm">\n                <div>PROGRESS BAR HERE</div>\n\t\t\t\t\t\t\t\t<p>' + questionStr + '</p>';

		options ? options.forEach(function (option, index) {
			template += '<div class="radio">\n\t\t\t\t\t<label>\n\t\t\t\t\t\t<input type="radio" name="quizAnswer" required value="' + (index + 1) + '">\n\t\t\t\t\t\t' + option + '\n\t\t\t\t\t</label>\n\t\t\t\t</div>';
		}) : template += '<div>Error! No options provided!</div>';

		template += '<button id="nextQuestion" type="submit" class="btn btn-default">\n\t\t\t\t' + (isLastQuestion ? "Finish Quiz" : "Next") + '\n\t\t\t\t</button>\n\t\t\t</div>';

		return template;
	}

	// DOM interaction

	function renderTemplate(html, id) {
		var existing = document.getElementById(id);
		if (existing) {
			existing.remove();
		}
		var form = document.createElement('form');
		form.setAttribute('id', id);
		form.innerHTML = html;
		document.getElementById('myQuiz').appendChild(form);
	}

	function bindSubmit(document) {
		document.addEventListener('submit', function (event) {
			event.preventDefault();
			if (event.target.id === config.id) {
				var radios = document.getElementsByName('quizAnswer');
				var answer = parseInt(Array.from(radios).find(function (r, i) {
					return radios[i].checked;
				}).value);
				updateScore(answer);
				nextQuestion(state, config);
			}
		});
	}

	// INITIALISE THE QUIZ:

	function init(options) {

		// extend all default options, (config is internally accessible):
		config = extend(defaultOptions, options);

		// will allow the quiz to be run with seed example data:
		if (config.seed === true) {
			config.dataSource = config.seedData;
		}

		// get json
		getQuizData(config.dataSource).then(success, error);

		function success(data) {
			start(data, config, state);
		}

		function error(err) {
			return renderTemplate('<p>Sorry, we are unable to retrieve the data for this quiz.</p>\n\t\t\t\t\t<small>Try checking the dateSource provided: ' + config.dataSource + '</small>', config.id);
		}
	}

	// --------------------------------------------------------------------//
	// ----------------- PRIVATE API (TESTING ONLY) -----------------------//
	// --------------------------------------------------------------------//
	TEST = {
		VERSION: VERSION,
		state: state,
		init: init,
		bindSubmit: bindSubmit,
		renderTemplate: renderTemplate,
		questionTemplate: questionTemplate,
		informationTemplate: informationTemplate,
		resultMessage: resultMessage,
		end: end,
		start: start,
		nextQuestion: nextQuestion,
		randomiseQuestions: randomiseQuestions,
		getTemplate: getTemplate,
		updateScore: updateScore,
		getScore: getScore,
		getQuizData: getQuizData,
		isValid: isValid,
		extend: extend
	};

	// --------------------------------------------------------------------//
	// ------------------------------- PUBLIC API -------------------------//
	// --------------------------------------------------------------------//
	Quiz = global.Quiz = {
		VERSION: VERSION,
		init: init
	};

	Quiz.__TEST__ = TEST;

	return Quiz;
})(window, document);