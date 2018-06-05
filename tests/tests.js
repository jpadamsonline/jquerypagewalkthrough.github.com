'use strict';
/* global assert, QUnit */
function createWalkthrough(element, options) {
    options = $.extend(true, {
        name: 'test',
        onLoad: false,
        steps: [
            {
                autoScroll: false,
                popup: {
                    content: 'Hello, world!',
                    type: 'modal'
                }
            },
            {
                autoScroll: false,
                popup: {
                    content: 'Goodbye, world!',
                    type: 'modal'
                }
            }
        ]
    }, options);

    element.pagewalkthrough(options);
}

function clickPropagateFail() {
    assert.ok(false, 'click propagated');
}

var lifecycle = {
    setup: function() {
        this.fixture = $('#qunit-fixture');
    }, teardown: function() {
        if (this.fixture.pagewalkthrough('isActive')) {
            this.fixture.pagewalkthrough('close');
        }

        this.fixture.remove();
        this.fixture = null;
        this.fixture = $('<div>').attr('id', 'qunit-fixture').appendTo('body');

        // Turn off document click propagation fail handlers
        $(document).off('click', clickPropagateFail);
        // @todo destroy method for plugin to prevent memory leaks
    }
};

QUnit.module('pagewalkthrough', lifecycle);

QUnit.test('loads on the body element', 1, function(assert) {
    this.fixture.pagewalkthrough({
        name: 'test',
        onLoad: false
    });

    assert.strictEqual(this.fixture.data('jpw').name, 'test',
        'Attaches data to the element');
});

QUnit.test('loads on the first element of a collection', 2, function(assert) {
    var first = $('<div>').addClass('test');
    var second = first.clone();
    this.fixture.append(first, second);

    this.fixture.find('.test').pagewalkthrough({
        name: 'test',
        onLoad: false
    });

    assert.strictEqual(first.data('jpw').name, 'test',
        'Attaches data to the first element');
    assert.strictEqual(second.data('jpw'), undefined,
        'Does not attach data to subsequent elements');
});

QUnit.asyncTest('uses content as a string', 1, function(assert) {
    createWalkthrough(this.fixture, {
        onAfterShow: function() {
            assert.strictEqual($('#tooltipInner').html(),
                'Hello, world!',
                'Content used as string');
            QUnit.start();
        }
    });

    this.fixture.pagewalkthrough('show');
});

QUnit.asyncTest('uses content as a selector', 1, function(assert) {
    this.fixture.append(
        $('<div>').attr('id', 'step-1').html('Hello, selector!')
    );

    createWalkthrough(this.fixture, {
        steps: [
            {
                popup: {
                    content: '#step-1'
                }
            }
        ],
        onAfterShow: function() {
            assert.strictEqual($('#tooltipInner').html(),
                'Hello, selector!',
                'Content used as selector');
            QUnit.start();
        }
    });

    this.fixture.pagewalkthrough('show');
});

QUnit.module('next', lifecycle);

QUnit.test('increments step index when next is called', 1, function(assert) {
    createWalkthrough(this.fixture);

    this.fixture.pagewalkthrough('show');
    this.fixture.pagewalkthrough('next');

    var idx = this.fixture.pagewalkthrough('index');

    assert.strictEqual(idx, 1, 'Index is incremented');
});

QUnit.test('does not increment step index on final step', 2, function(assert) {
    createWalkthrough(this.fixture);

    this.fixture.pagewalkthrough('show');
    this.fixture.pagewalkthrough('next');

    assert.strictEqual(this.fixture.pagewalkthrough('index'), 1, 'Incremented');

    this.fixture.pagewalkthrough('next');

    assert.strictEqual(this.fixture.pagewalkthrough('index'), 1, 'Not incremented');
});

QUnit.module('prev', lifecycle);

QUnit.test('decrements step index when prev is called', 2, function(assert) {
    createWalkthrough(this.fixture);

    this.fixture.pagewalkthrough('show');
    this.fixture.pagewalkthrough('next');

    var idx = this.fixture.pagewalkthrough('index');

    assert.strictEqual(idx, 1, 'Index is incremented');

    this.fixture.pagewalkthrough('prev');

    idx = this.fixture.pagewalkthrough('index');
    assert.strictEqual(idx, 0, 'Index is decremented');
});

QUnit.test('does not decrement step index on first step', 1, function(assert) {
    createWalkthrough(this.fixture);

    this.fixture.pagewalkthrough('show');
    this.fixture.pagewalkthrough('prev');

    assert.strictEqual(this.fixture.pagewalkthrough('index'), 0, 'Not incremented');
});

QUnit.module('isActive', lifecycle);

QUnit.test('returns true when a walkthrough is active', function(assert) {
    createWalkthrough(this.fixture);

    this.fixture.pagewalkthrough('show');

    assert.strictEqual(this.fixture.pagewalkthrough('isActive'), true);
});

QUnit.test('returns false when no walkthrough is active', function(assert) {
    createWalkthrough(this.fixture);

    assert.strictEqual(this.fixture.pagewalkthrough('isActive'), false);

    this.fixture.pagewalkthrough('show');
    this.fixture.pagewalkthrough('close');

    assert.strictEqual(this.fixture.pagewalkthrough('isActive'), false);
});

QUnit.module('close', lifecycle);

QUnit.asyncTest('onClose callback gets fired', function(assert) {
    var fired = false;

    createWalkthrough(this.fixture, {
        onClose: function() {
            fired = true;
        }
    });

    this.fixture.pagewalkthrough('show');
    this.fixture.pagewalkthrough('close');

    setTimeout(function() {
        assert.ok(fired, 'onClose was not called');
        QUnit.start();
    }, 1000);
});

QUnit.asyncTest('walkthrough fades out on close using close method', function(assert) {
    createWalkthrough(this.fixture, {
        onClose: $.noop
    });

    this.fixture.pagewalkthrough('show');
    this.fixture.pagewalkthrough('close');

    setTimeout(function() {
        assert.equal(
            $('#jpWalkthrough').is(':visible'),
            false,
            'walkthrough was not hidden'
        );
        QUnit.start();
    }, 1000);
});

QUnit.asyncTest('walkthrough fades out on close after clicking close button', function(assert) {
    createWalkthrough(this.fixture, {
        onClose: $.noop
    });

    this.fixture.pagewalkthrough('show');
    this.fixture.find('#jpwClose').trigger('click');

    setTimeout(function() {
        assert.equal(
            $('#jpWalkthrough').is(':visible'),
            false,
            'walkthrough was not hidden'
        );
        QUnit.start();
    }, 1000);
});

QUnit.module('getOptions', lifecycle);

QUnit.test('returns the options for all walkthroughs', function(assert) {
    createWalkthrough(this.fixture);

    this.fixture.pagewalkthrough('show');

    var opts = this.fixture.pagewalkthrough('getOptions');
    assert.strictEqual(opts.length, 1, 'Returns an array of walkthrough options');
});

QUnit.test('returns the options for the active walkthrough', function(assert) {
    createWalkthrough(this.fixture);

    this.fixture.pagewalkthrough('show');

    var opts = this.fixture.pagewalkthrough('getOptions', true);
    assert.strictEqual(opts.name, 'test', 'Returns correct walkthrough name');
});

QUnit.test('returns false if no walkthrough is active', function(assert) {
    createWalkthrough(this.fixture);

    var opts = this.fixture.pagewalkthrough('getOptions', true);
    assert.strictEqual(opts, false, 'Returns false with no active walkthrough');
});

QUnit.test('returns options for a walkthrough element', function(assert) {
    createWalkthrough(this.fixture);

    var opts = this.fixture.pagewalkthrough('getOptions');
    assert.strictEqual(opts[0].name, 'test', 'Returns correct walkthrough name');
});

QUnit.module('index', lifecycle);

QUnit.test('returns zero on the first step', function(assert) {
    createWalkthrough(this.fixture);



    assert.strictEqual(this.fixture.pagewalkthrough('index'), 0);
});

QUnit.test('returns one on the second step', function(assert) {
    createWalkthrough(this.fixture);

    this.fixture.pagewalkthrough('show');
    this.fixture.pagewalkthrough('next');

    assert.strictEqual(this.fixture.pagewalkthrough('index'), 1);
});

QUnit.module('Errors', lifecycle);

QUnit.test('name is required', 1, function(assert) {
    assert.throws(function() {
        $('#qunit-fixture').pagewalkthrough();
    }, Error, 'missing name property throws an Error');
});

QUnit.module('Click propagation', lifecycle);

QUnit.asyncTest('clicks on the overlay do not propagate', 0, function(assert) {
    createWalkthrough(this.fixture);

    $(document).on('click', clickPropagateFail);

    this.fixture.pagewalkthrough('show');
    setTimeout(function() {
        $('#jpwOverlay').click();

        QUnit.start();
    }, 1000);
});

QUnit.asyncTest('clicks on the tooltip content/arrow do not propagate', 0, function(assert) {
    createWalkthrough(this.fixture);

    $(document).on('click', clickPropagateFail);

    this.fixture.pagewalkthrough('show');

    setTimeout(function() {
        $('#tooltipInner:visible').click();
        $('#tooltipBottom:visible').click();
        $('#tooltipTop:visible').click();
        $('#tooltipWrapper:visible + span').click();

        QUnit.start();
    }, 1000);
});

QUnit.asyncTest('onLeave called with true if tour skipped', 1, function(assert) {
    createWalkthrough(this.fixture, {
        steps: [
            {
                autoScroll: false,
                popup: {
                    content: 'Hello, world!',
                    type: 'modal'
                },
                onLeave: function(skipped) {
                    assert.equal(skipped, true, 'skipped flag was true');
                    QUnit.start();
                }
            },
            {
                autoScroll: false,
                popup: {
                    content: 'My second step',
                    type: 'modal'
                }
            }
        ]
    });

    this.fixture.pagewalkthrough('show');

    $('#jpwClose').click();
});
