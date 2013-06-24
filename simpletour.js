if (typeof console == 'undefined') {
    console = {};
    console.log = function () {
    };
}


main = (function () {

    var _resetHash = {};
    var _existingOnresize = null; // reference to onresize method of window/document

    /**
     * Enables keys: escape, left, right, space & return
     * @example _initKeyboard()
     */
    function _initKeyboard() {
        document.onkeyup = function (ev) {
            var e = window.event || ev;
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();

            switch (e.keyCode) {
                case 27: // esc
                    main.close();
                    window.location = "/";
                    break;
                case 37: // left
                case 75: // [K]
                    main.Control.prev();
                    break;
                case 13: // return
                case 39: // right
                case 74: //[J]
                    main.Control.next();
                    break;
            }
        };
    };

    /**
     * Returns the tourDef DOM element (or false)
     */
    function _getTourDef(tourId) {
        var tourDefElements = tour.getElementsByTagNameAndAttr('div', 'class', 'tourDef');
        for (var i = 0; i < tourDefElements.length; i++) {
            if (tourDefElements[i].getAttribute('id') == tourId) {
                return tourDefElements[i];
            }
        }

        tour.alert('DIV with CLASS "tourDef" and ID "' + tourId + '" is not defined');
        return false;
    };

    function _transformTourDefToSteps(tourDef) {
        var children = tourDef.childNodes;
        var steps = [];
        var stepIndex = 0;

        for (var i = 0; i < children.length; i++) {
            if (!children[i].tagName || children[i].tagName.toLowerCase() != 'div') {
                continue;
            }

            page = {};
            page.url = children[i].getAttribute('title');

            if (tour.urlMatch(page.url)) {
                main.__currentStep = stepIndex;
            }

            cn = children[i].childNodes;
            for (var j = 0; j < cn.length; j++) {
                if (!cn[j].tagName || cn[j].tagName.toLowerCase() != 'div') {
                    continue;
                }

                eval('steps[stepIndex] = {' + cn[j].title + '};');

                if (tour.getUrlParam(location.href, 'fromNext') && tour.urlMatch(page.url)) {
                    main.__currentStep = stepIndex;
                }

                ccn = cn[j].childNodes;
                for (var k = 0; k < ccn.length; k++) {
                    if (ccn[k].nodeName == "P") {
                        title = ccn[k].outerHTML;
                    } else if (ccn[k].nodeName == "#text" && $.trim(ccn[k].data) != '') {
                        body = ccn[k].data;
                    }
                }
                steps[stepIndex].body = body;
                steps[stepIndex].pageUrl = page.url;
                steps[stepIndex].title = title;
                stepIndex++;
            }
        }
        return steps;
    };

    function _saveResetValues() {
        _resetHash.colorScheme = main.colorScheme;
        _resetHash.coverOpacity = main.coverOpacity;
        _resetHash.coverColor = main.coverColor;
        _resetHash.textOf = main.textOf;
        _resetHash.textClose = main.textClose;
        _resetHash.textPrev = main.textPrev;
        _resetHash.textNext = main.textNext;
        _resetHash.onCloseClickStay = main.onCloseClickStay;
        _resetHash.doCoverBody = main.doCoverBody;
        _resetHash.mouseCanNavigate = main.mouseCanNavigate;
        _resetHash.urlPassTourParams = main.urlPassTourParams;
        _resetHash.currentStep = 0;
    };

    function _doResetValues() {
        main.colorScheme = _resetHash.colorScheme;
        main.coverOpacity = _resetHash.coverOpacity;
        main.coverColor = _resetHash.coverColor;
        main.textOf = _resetHash.textOf;
        main.textClose = _resetHash.textClose;
        main.textPrev = _resetHash.textPrev;
        main.textNext = _resetHash.textNext;
        main.onCloseClickStay = _resetHash.onCloseClickStay;
        main.doCoverBody = _resetHash.doCoverBody;
        main.mouseCanNavigate = _resetHash.mouseCanNavigate;
        main.urlPassTourParams = _resetHash.urlPassTourParams;
        main.__currentStep = _resetHash.currentStep;
    };

    return {
        // constants
        BASE_URL: '', // do not forget trailing slash!

        // public attributes

        // - set these through url (...&tourId=MyTour&skinId=Safari...)
        // - OR right before the call to main.open()
        tourId: null,  // mandatory: if not set, tour will not open
        skinId: null,  // optional: if not set, skin "travmik" will be used

        colorScheme: 'yellow',
        coverOpacity: 0.5,
        coverColor: '#000',

        // - set these right before the call to main.open()
        textOf: 'of',  // text of splitter between "2 of 3"
        textClose: 'x',   // text of close button
        textPrev: '',    // text of previous button (i.e. &laquo;)
        textNext: '',    // text of next button (i.e. &raquo;)

        onCloseClickStay: false, // set this to 'true', if you want the close button to close tour but remain on current page
        doCoverBody: false, // set this to 'true', if a click on the body cover should force it to close
        mouseCanNavigate: true,  // forward / backward on mouse click
        urlPassTourParams: true,  // set this to false, if you have hard coded the tourId and skinId in your tour
        //     template. the tourId and skindId params will not get passed on prev/next button click

        // protected attributes - don't touch (used by other main.* classes)
        __steps: [],
        __currentStep: 0,

        /**
         * Initializes tour, creates transparent layer and causes tour Control
         * to open the skin's template (control.tpl.js) into document. Call this
         * manually right after inclusion of this library. Don't forget to pass
         * tourId param through URL to show tour!
         *
         * Iterates child DIVs of DIV.tourDef, extracts tour pages
         *
         * @example main.open()
         * Note that a HEAD tag needs to be existent in the current document
         */

        open: function () {
            // set main.tourId
            main.tourId = main.tourId || tour.getUrlParam(location.href, 'tourId');
            if (!main.tourId) { // do nothing if no tourId is found
                return;
            }

            _saveResetValues();

            var tourDef = _getTourDef(main.tourId);
            main.__steps = _transformTourDefToSteps(tourDef);

            // set main.skinId
            main.skinId = main.skinId || tour.getUrlParam(location.href, 'skinId');
            main.skinId = main.skinId || 'travmik';

            // set main.closeUrl
            main.closeUrl = tourDef.getAttribute('title') || false;

            // get Style, Template and run main.Control.open
            tour.postFetch(main.BASE_URL + 'skin/' + main.skinId.toLowerCase() + '/style.css', 'style');
            tour.postFetch(main.BASE_URL + 'skin/' + main.skinId.toLowerCase() + '/control.tpl.js', 'script');

            var ref = document.onresize ? document : window;

            main._existingOnresize = ref.onresize;
            ref.onresize = function () {
                main.onResize();
                if (main._existingOnresize) {
                    main._existingOnresize();
                }
            };

            // call main.onResize initially once
            main.onResize();

            _initKeyboard();
        },

        onResize: function () {
            setTimeout(function () {
                main.redrawEverything();
            }, 100);
        },

        redrawEverything: function () {
            main.Control.applyColorScheme();

            tour.$('tourPrev').className = '';
            tour.$('tourNext').className = '';
            if (main.__currentStep == 0) {
                tour.$('tourPrev').className = 'disabled';
            }
            ;
            if (main.__currentStep == main.__steps.length - 1) {
                tour.$('tourNext').className = 'disabled';
            }
            ;

            var currStep = main.__steps[main.__currentStep];
            tour.$('tourControlTitle').innerHTML = currStep.title;
            tour.$('tourControlBody').childNodes[0].innerHTML = currStep.body;
            tour.$('tourCurrentStep').innerHTML = main.__currentStep + 1;
            main.Expose.expose(currStep.id, currStep.padding, currStep.position);
            main.Control.attachToExpose(currStep.trbl);
            main.Control.ensureVisibility();
        },

        /**
         * Gets called, whenever the user clicks on the close button of tour control
         *
         * @example main.close()
         */
        close: function () {
            //main.__currentStep = 0;

            var ref = document.onresize ? document : window;
            if (main._existingOnresize) {
                ref.onresize = main._existingOnresize;
            } else {
                ref.onresize = null;
            }
            ;

            if (main.mouseCanNavigate) {
                document.body.oncontextmenu = null;
            }
            ;

            _doResetValues();
            if (main.onCloseClickStay) {
                main.Control.close();
                main.Expose.unexpose();
                return null;
            }
            ;

            if (main.closeUrl) {
                window.location.href = main.closeUrl;
            }
            ;
            return null;
        }
    };
})();

/**
 * Main Control class
 */

main.Control = (function () {
    var _trbl = null;

    function _fillTemplate(tplHtml) {
        var _tplHtml = null;
        _tplHtml = tplHtml.replace(/{skinId}/, main.skinId);
        _tplHtml = _tplHtml.replace(/{textOf}/, main.textOf);
        _tplHtml = _tplHtml.replace(/{textClose}/, main.textClose);
        _tplHtml = _tplHtml.replace(/{textPrev}/, main.textPrev);
        _tplHtml = _tplHtml.replace(/{textNext}/, main.textNext);
        _tplHtml = _tplHtml.replace(/{currentStep}/, main.__currentStep + 1);
        _tplHtml = _tplHtml.replace(/{stepCount}/, main.__steps.length);
        _tplHtml = _tplHtml.replace(/{title}/, main.__steps[main.__currentStep].title);
        _tplHtml = _tplHtml.replace(/{body}/, main.__steps[main.__currentStep].body);
        return _tplHtml;
    };

    function _domInsert(tplHtml) {
        var div = tour.$('SimT');
        if (!div) {
            div = document.createElement('div');
            div.id = 'SimT';
            document.body.appendChild(div);
        }
        div.innerHTML = tplHtml;
    };

    function _setCoords(coords, position) {
        var el = tour.$('tourControl');
        el.style.top = coords.top || 'auto';
        el.style.right = coords.right || 'auto';
        el.style.bottom = coords.bottom || 'auto';
        el.style.left = coords.left || 'auto';
        el.style.position = position || 'static';
    };

    function _drawArrow(topLeft, position, trbl) {
        var arrow;
        if (!(arrow = tour.$('tourArrow'))) {
            arrow = document.createElement('div');
            arrow.id = 'tourArrow';
            document.body.appendChild(arrow);
        }
        ;

        arrow.style.position = position;
        arrow.style.top = topLeft.top + 'px';
        arrow.style.left = topLeft.left + 'px';
        arrow.style.background = 'url(' + main.BASE_URL + 'skin/' + main.skinId.toLowerCase() + '/arr_' + trbl.charAt(0) + '.' + main.colorScheme + '.png)';
    };

    function _removeArrow() {
        var e = tour.$('tourArrow');
        if (e) {
            document.body.removeChild(e);
        }
    };

    return {
        /**
         * Callback handler for template files. Takes template HTML and fills placeholders
         *
         * @param tplHtml HTML code including tour placeholders
         *
         * @example main.Control.open('<div>{body}</div>')
         * Note that this method should be called directly through control.tpl.js files
         */

        open: function (tplHtml) {
            var tplHml = _fillTemplate(tplHtml);
            _domInsert(tplHml);

            // No URL was set AND no click-close-action was configured:
            if (!main.closeUrl && !main.onCloseClickStay) {
                tour.$('tourClose').style.display = 'none';
            }
            ;

            // post fetch a CSS file you can define by setting main.ADD_STYLE
            // right before the call to main.open();
            if (main.ADD_STYLE && !tour.$('style')) {
                tour.postFetch(main.ADD_STYLE, 'style', 'style');
            }
            ;

            // post fetch a script you can define by setting main.ADD_SCRIPT
            // right before the call to main.open();
            if (main.ADD_SCRIPT && !tour.$('script')) {
                tour.postFetch(main.ADD_SCRIPT, 'script', 'script');
            }
            ;

            if (callback = main.__steps[main.__currentStep].callback) {
                eval(callback + '()');
            }
            ;

            main.redrawEverything();
        },

        applyColorScheme: function () {
            tour.$('tourControl').className = main.colorScheme;
        },

        prev: function () {
            if (main.__currentStep == 0) {
                return;
            }
            ;

            // we will not change url
            if (main.__steps[main.__currentStep].pageUrl == main.__steps[main.__currentStep - 1].pageUrl) {
                if (callback = main.__steps[main.__currentStep].callback) {
                    eval(callback + '(true)');
                }
                ;

                main.__currentStep--;

                if (callback = main.__steps[main.__currentStep].callback) {
                    eval(callback + '()');
                }
                ;

                main.redrawEverything();
                return;
            }
            ;

            var prevUrl = main.__steps[main.__currentStep - 1].pageUrl;

            urlSplit = prevUrl.split('?');
            urlQuery = urlSplit[1] || false;
            if (main.urlPassTourParams) {
                prevUrl += (urlQuery ? '&' : '?') + 'tourId=' + main.tourId + (main.skinId ? '&skinId=' + main.skinId + '&fromNext=1' : '');
            }
            ;

            window.location.href = prevUrl;
        },

        next: function () {
            if (main.__currentStep == main.__steps.length - 1) {
                return;
            }
            ;

            if (main.__steps[main.__currentStep].pageUrl == main.__steps[main.__currentStep + 1].pageUrl) {
                if (callback = main.__steps[main.__currentStep].callback) {
                    eval(callback + '(true)');
                }
                ;

                main.__currentStep++;

                if (callback = main.__steps[main.__currentStep].callback) {
                    eval(callback + '()');
                }
                ;

                main.redrawEverything();
                return;
            }
            ;

            var nextUrl = main.__steps[main.__currentStep + 1].pageUrl;

            urlSplit = nextUrl.split('?');
            urlQuery = urlSplit[1] || false;
            if (main.urlPassTourParams) {
                nextUrl += (urlQuery ? '&' : '?') + 'tourId=' + main.tourId + (main.skinId ? '&skinId=' + main.skinId : '');
            }
            ;

            window.location.href = nextUrl;
        },

        /**
         * Removes tour Control div from DOM
         *
         * @example main.Control.close()
         */

        close: function () {
            _removeArrow();

            e = tour.$('SimT');
            if (e) e.parentNode.removeChild(e);
        },

        attachToExpose: function (trbl) {
            _trbl = trbl;
            var tourControl = tour.$('tourControl');
            var tourWidth = tour.getWidth(tourControl);
            var tourHeight = tour.getHeight(tourControl);
            var coords = main.Expose.getCoords();
            var position = main.Expose.getPosition();

            //console.log('h:' + tourHeight + ' t:' + coords.t + ' b:' + coords.b);

            var arrowTop = 0;
            var arrowLeft = 0;
            var controlTop = 0;
            var controlLeft = 0;

            switch (_trbl.charAt(0)) {
                case 't':
                    arrowTop = coords.t - 31;
                    controlTop = coords.t - 15 - tourHeight;
                    break;
                case 'b':
                    arrowTop = coords.b + 1;
                    controlTop = coords.b + 15;
                    break;
                case 'l':
                    arrowLeft = coords.l - 31;
                    controlLeft = coords.l - 15 - tourWidth;
                    break;
                case 'r':
                    arrowLeft = coords.r + 1;
                    controlLeft = coords.r + 15;
                    break;
            }
            ;

            switch (_trbl.charAt(1)) {
                case 't':
                    arrowTop = coords.t;
                    controlTop = coords.t;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 't') {
                        controlTop = coords.t - tourHeight + 30;
                    }
                    ;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 'm') {
                        controlTop = coords.t - tourHeight / 2 + 15;
                    }
                    ;
                    break;
                case 'm':
                    arrowTop = coords.t + coords.h / 2 - 15;
                    controlTop = coords.t + coords.h / 2 - tourHeight / 2;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 't') {
                        controlTop = arrowTop - tourHeight + 30;
                    }
                    ;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 'b') {
                        controlTop = arrowTop;
                    }
                    ;
                    break;
                case 'b':
                    arrowTop = coords.b - 30;
                    controlTop = coords.b - tourHeight;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 'b') {
                        controlTop = coords.b - 30;
                    }
                    ;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 'm') {
                        controlTop = coords.b - tourHeight / 2 - 15;
                    }
                    ;
                    break;
                case 'l':
                    arrowLeft = coords.l;
                    controlLeft = coords.l;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 'l') {
                        controlLeft = coords.l - tourWidth + 30;
                    }
                    ;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 'c') {
                        controlLeft = coords.l - tourWidth / 2 + 15;
                    }
                    ;
                    break;
                case 'c':
                    arrowLeft = coords.l + coords.w / 2 - 15;
                    controlLeft = coords.l + coords.w / 2 - tourWidth / 2;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 'l') {
                        controlLeft = arrowLeft - tourWidth + 30;
                    }
                    ;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 'r') {
                        controlLeft = arrowLeft;
                    }
                    ;
                    break;
                case 'r':
                    arrowLeft = coords.r - 30;
                    controlLeft = coords.r - tourWidth;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 'r') {
                        controlLeft = coords.r - 30;
                    }
                    ;
                    if (_trbl.charAt(2) && _trbl.charAt(2) == 'c') {
                        controlLeft = coords.r - tourWidth / 2 - 15;
                    }
                    ;
                    break;
            }

            _drawArrow({top: arrowTop, left: arrowLeft}, position, _trbl);
            _setCoords({
                top: controlTop + 'px',
                left: controlLeft + 'px'
            }, position);
        },

        ensureVisibility: function () {
            if ('fixed' == main.__steps[main.__currentStep].position) {
                return;
            }
            ;

            var tourControl = tour.$('tourControl');
            var tourTop = tour.getTop(tourControl);
            var tourHeight = tour.getHeight(tourControl);
            var tourBottom = tour.getBottom(tourControl);
            var vpScrollTop = tour.viewport().scrollTop;
            var vpHeight = tour.viewport().height;

            var coords = main.Expose.getCoords();
            var superTop = Math.min(coords.t, tourTop);
            var superBottom = Math.max(coords.b, tourBottom);

            var minScrollTop = tourTop - 20;
            var maxScrollTop = tourBottom + 20 - vpHeight;

            // everything is fitting, no need to jump
            if (superTop >= vpScrollTop && superBottom <= vpScrollTop + vpHeight) {
                return;
            }
            ;

            // Control heigher than viewport?
            if (tourHeight >= vpHeight) {
                window.scroll(0, tourTop - 20); // align to control top
                return;
            }
            ;

            var scrollTo = 0;
            // trbl = b
            if (tourBottom == superBottom) {
                scrollTo = superBottom - vpHeight + 20;
            } else {
                scrollTo = superTop - 20;
            }
            ;

            window.scroll(0, Math.max(maxScrollTop, Math.min(minScrollTop, scrollTo)));
        },

        refresh: function () {
            if (!_trbl) {
                return;
            }
            ;

            main.Control.attachToExpose(_trbl);
        }
    };
})();


main.Expose = (function () {
    var _id = null;
    var _padding = 0;
    var _coords = [];
    var _position = null;

    function _calcCoords() {
        var el = tour.$(_id);
        var coords = {};
        coords.t = tour.getTop(el) - _padding;
        coords.r = tour.getRight(el) + _padding;
        coords.b = tour.getBottom(el) + _padding;
        coords.l = tour.getLeft(el) - _padding;
        coords.w = tour.getWidth(el) + _padding * 2;
        coords.h = tour.getHeight(el) + _padding * 2;

        return coords;
    };

    function _drawTopCover() {
        if (!(cover = tour.$('tourCoverTop'))) {
            cover = document.createElement('div');
            cover.id = 'tourCoverTop';
            cover.className = 'tourCover';
            if (main.mouseCanNavigate) {
                cover.onclick = main.Control.next;
            }
            ;
            document.body.appendChild(cover);
        }
        ;

        var height = Math.max(0, _coords.t);
        cover.style.position = _position;
        cover.style.top = '0px';
        cover.style.height = height + 'px';
        cover.style.opacity = main.coverOpacity; // change opacity on every function call, so a redrawEverything works correctly
        cover.style.background = main.coverColor;
    };

    function _drawBottomCover() {
        var cover;
        if (!(cover = tour.$('tourCoverBottom'))) {
            cover = document.createElement('div');
            cover.id = 'tourCoverBottom';
            cover.className = 'tourCover';
            if (main.mouseCanNavigate) {
                cover.onclick = main.Control.next;
            }
            ;
            document.body.appendChild(cover);
        }
        ;

        var top = Math.max(0, _coords.b);
        if (_position == 'fixed') {
            cover.style.height = Math.max(0, tour.viewport().height - top) + 'px';
        } else {
            cover.style.height = (tour.getWindowInnerHeight() - top) + 'px';
        }
        ;
        cover.style.top = top + 'px';
        cover.style.position = _position;
        cover.style.opacity = main.coverOpacity; // change opacity on every function call, so a redrawEverything works correctly
        cover.style.background = main.coverColor;
    };

    function _drawLeftCover() {
        var cover;
        if (!(cover = tour.$('tourCoverLeft'))) {
            cover = document.createElement('div');
            cover.id = 'tourCoverLeft';
            cover.className = 'tourCover';
            if (main.mouseCanNavigate) {
                cover.onclick = main.Control.next;
            }
            ;
            document.body.appendChild(cover);
        }
        ;

        var width = Math.max(0, _coords.l);
        cover.style.position = _position;
        cover.style.top = _coords.t + 'px';
        cover.style.height = _coords.h + 'px';
        cover.style.width = width + 'px';
        cover.style.opacity = main.coverOpacity; // change opacity on every function call, so a redrawEverything works correctly
        cover.style.background = main.coverColor;
    };

    function _drawRightCover() {
        var cover;
        if (!(cover = tour.$('tourCoverRight'))) {
            cover = document.createElement('div');
            cover.id = 'tourCoverRight';
            cover.className = 'tourCover';
            if (main.mouseCanNavigate) {
                cover.onclick = main.Control.next;
            }
            ;
            document.body.appendChild(cover);
        }
        ;

        cover.style.position = _position;
        cover.style.top = _coords.t + 'px';
        cover.style.height = _coords.h + 'px';
        cover.style.left = _coords.r + 'px';
        cover.style.opacity = main.coverOpacity; // change opacity on every function call, so a redrawEverything works correctly
        cover.style.background = main.coverColor;
    };

    function _drawExposeCover() {
        var cover;
        if (!(cover = tour.$('tourExposeCover'))) {
            cover = document.createElement('div');
            cover.id = 'tourExposeCover';
            if (main.mouseCanNavigate) {
                cover.onclick = main.Control.next;
            }
            ;
            document.body.appendChild(cover);
        }
        ;
        cover.style.position = _position;
        cover.style.top = _coords.t + 'px';
        cover.style.left = _coords.l + 'px';
        cover.style.height = _coords.h + 'px';
        cover.style.width = _coords.w + 'px';
    }

    function _drawCover() {
        if (main.mouseCanNavigate) {
            document.body.oncontextmenu = function () {
                main.Control.prev();
                return false;
            };
        }
        ;
        _drawTopCover();
        _drawBottomCover();
        _drawLeftCover();
        _drawRightCover();
        _drawExposeCover();
    }

    return {
        expose: function (id, padding, position) {
            _id = id;
            _padding = padding;
            _coords = _calcCoords();
            _position = position || 'absolute';
            _drawCover();
        },

        unexpose: function () {
            var coverParts = tour.getElementsByTagNameAndAttr('div', 'class', 'tourCover');
            for (var i = 0; i < coverParts.length; i++) {
                document.body.removeChild(coverParts[i]);
            }
            ;
            e = tour.$('tourExposeCover');
            if (e) {
                document.body.removeChild(e);
            }
            ;
        },

        refresh: function () {
            _coords = _calcCoords();
            _drawCover();
        },

        getCoords: function () {
            return _coords;
        },

        getPosition: function () {
            return _position;
        }
    };
})();


/**
 * Tools
 *
 * Capsulates static helper functions
 */

tour = {

    /**
     * Wrapper method for document.getElementById.
     */
    $: function (id) {
        return document.getElementById(id);
    },

    alert: function (str) {
        alert('Alert: ' + str);
    },

    getWidth: function (el) {
        return el.offsetWidth;
    },

    getHeight: function (el) {
        return el.offsetHeight;
    },

    getLeft: function (el) {
        if (el.offsetParent)
            return el.offsetLeft + tour.getLeft(el.offsetParent);

        return el.offsetLeft;
    },

    getTop: function (el) {
        if (el.offsetParent)
            return el.offsetTop + tour.getTop(el.offsetParent);

        return el.offsetTop;
    },

    getRight: function (el) {
        return tour.getLeft(el) + tour.getWidth(el);
    },

    getBottom: function (el) {
        return tour.getTop(el) + tour.getHeight(el);
    },

    viewport: function () {
        var e = window, a = 'inner';
        if (!('innerWidth' in window)) {
            a = 'client';
            e = document.documentElement || document.body;
        }

        var y = 0;
        if (window.pageYOffset) {
            y = window.pageYOffset;
        } else if (document.compatMode && document.compatMode != 'BackCompat') {
            y = document.documentElement.scrollTop;
        } else if (document.body) {
            y = document.body.scrollTop;
        }
        ;

        return {
            scrollTop: y,
            width: e[a + 'Width'],
            height: e[a + 'Height']
        };
    },

    /**
     * Returns FIRST matching element by tagname
     *
     * @param tagName name of tags to filter
     * @return first matching dom node or false if none exists
     *
     * @example getByTagName('div') => domNode
     * @example getByTagName('notexistent') => false
     */

    getByTagName: function (tagName) {
        var els = document.getElementsByTagName(tagName);
        if (els.length > 0) {
            return els[0];
        }
        ;

        return false;
    },

    /**
     * Returns an array of matching DOM nodes
     *
     * @param tagName name of tags to filter
     * @param attrName name of attribute, matching tags must contain
     * @param attrValue value of attribute, matching tags must contain
     * @param domNode optional: dom node to start filtering from
     * @return Array of matching dom nodes
     *
     * @example getElementsByTagNameAndAttr('div', 'class', 'highlight') => [domNode1, domNode2, ...]
     */
    getElementsByTagNameAndAttr: function (tagName, attrName, attrValue, domNode) {
        if (domNode) {
            els = domNode.getElementsByTagName(tagName);
        } else {
            els = document.getElementsByTagName(tagName);
        }
        ;

        if (els.length === 0) {
            return [];
        }
        ;

        var _els = [];
        for (var i = 0; i < els.length; i++) {
            if (attrName == 'class') {
                classNames = '';
                if (els[i].getAttribute('class')) {
                    classNames = els[i].getAttribute('class');
                } else {
                    if (els[i].getAttribute('className')) {
                        classNames = els[i].getAttribute('className');
                    }
                }
                ;

                var reg = new RegExp('(^| )' + attrValue + '($| )');
                if (reg.test(classNames)) {
                    _els.push(els[i]);
                }
                ;
            } else {
                if (els[i].getAttribute(attrName) == attrValue) {
                    _els.push(els[i]);
                }
                ;
            }
            ;
        }
        ;

        return _els;
    },

    /**
     * Return height of inner window
     * Copied and modified:
     * http://www.dynamicdrive.com/forums/archive/index.php/t-10373.html
     *
     * @example tour.getWindowInnerHeight()
     */
    getWindowInnerHeight: function () {
        // shortcuts
        var db = document.body;
        var dde = document.documentElement;

        if (window.innerHeight && window.scrollMaxY) {
            inner = window.innerHeight + window.scrollMaxY;
        } else if (db.scrollHeight > db.offsetHeight) { // all but Explorer Mac
            inner = db.scrollHeight;
        } else if (dde && dde.scrollHeight > dde.offsetHeight) { // Explorer 6 strict mode
            inner = dde.scrollHeight;
        } else { // Explorer Mac...would also work in Mozilla and Safari
            inner = db.offsetHeight;
        }
        ;

        var height = 0;
        if (self.innerHeight) { // all except Explorer
            height = self.innerHeight;
        } else if (dde && dde.clientHeight) { // Explorer 6 Strict Mode
            height = dde.clientHeight;
        } else if (document.body) { // other Explorers
            height = db.clientHeight;
        }
        ;

        // for small pages with total height less then height of the viewport
        return (inner >= height) ? inner : height;
    },

    /**
     * Checks if passed href is *included* in current location's href
     *
     * @param href URL to be matched against
     *
     * @example tour.urlMatch('http://mysite.com/domains/')
     */
    urlMatch: function (href) {
        return (
            location.href == href ||
                location.href.indexOf(href + '&') != -1 ||
                location.href.indexOf(href + '?') != -1
            );
    },


    /**
     * Returns url param value
     *
     * @param url The url to be queried
     * @param paramName The params name
     * @return paramName's value or false if param does not exist or is empty
     *
     * @example getUrlParam('http://localhost/?a=123', 'a') => 123
     * @example getUrlParam('http://localhost/?a=123', 'b') => false
     * @example getUrlParam('http://localhost/?a=',    'a') => false
     */

    getUrlParam: function (url, paramName) {
        var urlSplit = url.split('?');
        if (!urlSplit[1]) { // no query
            return false;
        }
        ;

        var paramsSplit = urlSplit[1].split('&');
        for (var i = 0; i < paramsSplit.length; i++) {
            paramSplit = paramsSplit[i].split('=');
            if (paramSplit[0] == paramName) {
                return paramSplit[1] || false;
            }
        }
        ;

        return false;
    },

    /**
     * Injects javascript or css file into document
     *
     * @param url The JavaScript/CSS file's url
     * @param type Either 'script' OR 'style'
     * @param onerror Optional: callback handler if loading did not work
     *
     * @example loadScript('http://localhost/js/dummy.js', function(){alert('could not load')})
     * Note that a HEAD tag needs to be existent in the current document
     */

    postFetch: function (url, type, id, onerror) {
        if (type === 'script') {
            scriptOrStyle = document.createElement('script');
            scriptOrStyle.type = 'text/javascript';
            scriptOrStyle.src = url;
        } else {
            scriptOrStyle = document.createElement('link');
            scriptOrStyle.type = 'text/css';
            scriptOrStyle.rel = 'stylesheet';
            scriptOrStyle.href = url;
        }
        ;

        if (id) {
            scriptOrStyle.id = id;
        }
        ;
        if (onerror) {
            scriptOrStyle.onerror = onerror;
        }
        ;

        var head = tour.getByTagName('head');
        if (head) {
            head.appendChild(scriptOrStyle);
            return;
        }
        ;

        tour.alert('head tag is missing');
    }
};


setTimeout(function () {
    main.open(); // call main.open() to catch possibly set url params
}, 500);
