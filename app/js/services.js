

angular.service('Referral', function ($resource) {
	return $resource('/api/referrals/:referralCode', {referralCode: '@referral_code'});
});

angular.service('Card', function ($resource) {
    return $resource('/api/cards/:card_id', {card_id: '@card_id'}, {
    	addCard: {method: 'POST'}
    });
});

angular.service('MultiplayerGame', function ($resource) {
    return $resource('/api/multiplayergame/:id', {id: '@id'}, {
    });
});

angular.service('ABBuildQuestion', function ($resource) {
    return $resource('/api/ABTest/:page_id', {page_id: '@page_id'}, {
    });
});


angular.service('Player', function ($resource) {
    var playerClass = $resource('/api/player/:facebook_id', {facebook_id: '@facebook_id'});
    playerClass.prototype.addCard = function addCard(cardId) {
    	if ($.inArray(cardId.toString(), this.cards_owned) == -1) {
			this.cards_owned.push(cardId.toString());
			this.$save();

		} else {
			console.log('player already has card');
		}
    };

    return playerClass;
});

angular.service('MCQEngine', function($window, $document) {
	return {
		'scrambleChoices': function scrambleChoices(o) {
			for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        	return o;	
		},
		'renderQuestion': function renderQuestion(questionData) {
			
		},
		'checkAnswer': function checkAnswer(questionData, playerAnswer, correctAnswerCallback, wrongAnswerCallback) {
			//increment the question attempt for this game
			if (!questionData.attempts) {
				questionData.attempts = 1;
			}

			else {
				questionData.attempts = questionData.attempts + 1;
			}

			if (playerAnswer == questionData.mcq_answers[0]) {
				questionData.num_correct_attempts = questionData.num_correct_attempts + 1;
				questionData.$save();
				correctAnswerCallback();
			}

			else {
				// only record down wrong answer for first attempt
				if (!questionData.attempts) {
					questionData.num_wrong_attempts = questionData.num_wrong_attempts + 1;
					questionData.$save();
				}

				wrongAnswerCallback();
			}
		}
	};
});

angular.service('Grapher', function($window, $document) {
	return {
		'resetGraph': function(questionData, scaleFactor) {
			var theDiv = $document[0].getElementById('graph-canvas');
			theDiv.innerHTML = "";
			this.renderGraph(questionData, scaleFactor);
		},
		'renderGraph': function(questionData, scaleFactor) {
			var theDiv = $document[0].getElementById('graph-canvas');
			var paper = Raphael(theDiv, 500, 500, {
				fill: "#000"
			});

			// create the y-axis
			yAxisLinePath = 'M0 ' + (questionData.axes.y.max * scaleFactor) + 'L0 0';
			var yAxis = paper.path(yAxisLinePath);
			yAxis.attr({
				'stroke-width': 3
			});

			xAxisLinePath = 'M0 ' + (questionData.axes.y.max * scaleFactor) + 'L' + (questionData.axes.x.max * scaleFactor) + ' '
			+ (questionData.axes.y.max * scaleFactor);
			var xAxis = paper.path(xAxisLinePath);
			xAxis.attr({
				'stroke-width': 3
			});

			// loop through the equations in questionData
			questionData.lines.forEach(function(line) {
				// need to deal with the conversion between cartesian and screen coordinates here
				var linePath = 'M' + (line.points.min[0] * scaleFactor) + ' ' 
				+ ((questionData.axes.y.max - line.points.min[1]) * scaleFactor)
				+ 'L' + (line.points.max[0] * scaleFactor) + ' ' + ((questionData.axes.y.max - line.points.max[1]) * scaleFactor)

				var lineRender = paper.path(linePath);
				lineRender.attr({
					'stroke-width': 5,
					'fill': '#cccccc',
					'fill-opacity': 1.0
				});

				this.lineMovementMetadata[line.title] = {
					'originalX': null,
					'deviationX': 0
				}

				// create the text label
				var textLabel = paper.text((line.points.max[0] * scaleFactor) + 40, ((questionData.axes.y.max - line.points.max[1]) * scaleFactor), line.title);

				//group them together
				//var lineSet = paper.set().push(lineRender, textLabel);

				var self = this;

				// attach drag event handlers to the line
				lineRender.drag(
					function onDragMove(dx, dy) {
						var transX = dx - self.lineMovementMetadata[line.title]['ox'];
						self.lineMovementMetadata[line.title]['deviationX'] += transX;
						
						//var trans_y = dy-this.oy;
						this.translate(transX, 0);
						textLabel.translate(transX, 0);
						self.lineMovementMetadata[line.title]['ox'] = dx;
						//this.oy = dy;

					}, function onDragStart(originalX) {
						if (!self.lineMovementMetadata[line.title]['originalX']) {
							self.lineMovementMetadata[line.title]['originalX'] = originalX;
						}
						
						self.lineMovementMetadata[line.title]['ox'] = 0;
									
					}, function onDragEnd() {
						//console.log('you have moved ' + (self.lineMovementMetadata[line.title]['deviationX'] / scaleFactor) + ' from the original position.');
						//console.log(self.lineMovementMetadata);
					}
				);
			}, this);
		},

		'checkAnswer': function(referenceQuestionData, correctAnswerCallback, wrongAnswerCallback) {
			var referenceSolution = referenceQuestionData.solution;

			for (line in referenceSolution) {
				//handle negative values first
				if (referenceSolution[line].deviation < 0) {
						// handle wrong values
					if (this.lineMovementMetadata[line]['deviationX'] > referenceSolution[line].deviation) {
						//wrong
						wrongAnswerCallback();
						return;
					}
				}

				else if (referenceSolution[line].deviation > 0) {
					// handle wrong values
					if (this.lineMovementMetadata[line].deviationX < referenceSolution[line].deviation) {
						//wrong
						wrongAnswerCallback();
						return;
					}
				}

				else {
					// when deviation is 0
					if (this.lineMovementMetadata[line].deviationX != referenceSolution[line].deviation) {
						wrongAnswerCallback();
						return;
					}
				}
			}

			correctAnswerCallback();
		},

		'lineMovementMetadata': {}
	};

	
});
