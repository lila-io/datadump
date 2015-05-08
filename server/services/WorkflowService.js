'use strict';

var util = require('util');
var events = require('events');

/**
 * Taken from drywall
 * @type {exports}
 */
function Workflow(cb){

	this.outcome = {
		success: false,
		errors: [],
		errfor: {}
	};

	this.cb = function(){
		throw new Error('callback must be specified for workflow');
	};

	if('function' === typeof cb){
		this.cb = cb;
	}

	events.EventEmitter.call(this);
}

util.inherits(Workflow, events.EventEmitter);

Workflow.prototype.hasErrors = function(){
	return Object.keys(this.outcome.errfor).length !== 0 || this.outcome.errors.length !== 0;
};

module.exports = exports = function(callback) {

	var workflow = new Workflow(callback);

	workflow.on('exception', function(err) {
    console.log([
        'TIME: ' + (new Date()),
        'STACK: ' + err.stack
      ].join('; ')
    );
		workflow.outcome.errors.push('Exception: '+ err);
		return workflow.emit('response');
	});

	workflow.on('response', function() {
		workflow.outcome.success = !workflow.hasErrors();
		workflow.cb.apply(workflow.cb,[workflow.outcome]);
	});

	return workflow;

};
