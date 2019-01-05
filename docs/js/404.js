(function(win, doc) {

    "use strict";

    win.App = win.App || {};

})(this, document);
(function(win, doc, ns) {

    "use strict";

    function EventDispatcher() {
        this._events = {};
    }

    EventDispatcher.prototype.hasEventListener = function(eventName) {
        return !!this._events[eventName];
    };
   
    EventDispatcher.prototype.addEventListener = function(eventName, callback) {
        if (this.hasEventListener(eventName)) {
            var events = this._events[eventName],
                length = events.length,
                i = 0;

            for (; i < length; i++) {
                if (events[i] === callback) {
                    return;
                }
            }

            events.push(callback);
        } else {
            this._events[eventName] = [callback];
        }
    };

    EventDispatcher.prototype.removeEventListener = function(eventName, callback) {
        if (!this.hasEventListener(eventName)) {
            return;
        } else {
            var events = this._events[eventName],
                i = events.length,
                index;

            while (i--) {
                if (events[i] === callback) {
                    index = i;
                }
            }

            events.splice(index, 1);
        }
    };

    EventDispatcher.prototype.fireEvent = function(eventName, opt_this, opt_arg) {
        if (!this.hasEventListener(eventName)) {
            return;
        } else {
            var events     = this._events[eventName],
                copyEvents = _copyArray(events),
                arg        = _copyArray(arguments),
                length     = events.length,
                i = 0;

            arg.splice(0, 2);

            for (; i < length; i++) {
                copyEvents[i].apply(opt_this || this, arg);
            }
        }

        function _copyArray(array) {
            var newArray = [],
                i = 0;

            try {
                newArray = [].slice.call(array);
            } catch(e) {
                for (; i < array.length; i++) {
                    newArray.push(array[i]);
                }
            }

            return newArray;
        }
    };

    ns.EventDispatcher = EventDispatcher;

})(this, document, App);
(function(win, doc, $, ns) {

    "use strict";

    var instance, originalConstructor;

    function MassageList() {
        var that = this;

        _init();

        function _init() {
            ns.EventDispatcher.call(that);
        }

        this.him = [
            "お探しのページが見つかりません。"
        ];
    }

    originalConstructor   = MassageList.prototype.constructor;
    MassageList.prototype = new ns.EventDispatcher();
    MassageList.prototype.constructor = originalConstructor;
    originalConstructor   = null;

    MassageList.getInstance = function() {
        if (!instance) {
            instance = new MassageList();
        }

        return instance;
    };

    ns.MassageList = MassageList;

})(this, document, $, App);
(function(win, doc, $, ns) {

    "use strict";

    var instance;

    function MassageManager() {
        var massageList = ns.MassageList.getInstance();

        var that        = this,
            historyList = [],
            index       = 0,
            LOOP_INDEX  = 1;

        _init();

        function _init() {
            ns.EventDispatcher.call(that);
            receive();
        }

        function _handlePost(evt, txt) {
            var interval = 500 + Math.random() * 1000 | 0;

            that.fireEvent("POST", evt, txt);

            if (evt.target === "mine") {
                setTimeout(function() {
                    receive(txt);
                }, interval);
            }
        }

        function send(txt) {
            if (!txt) {
                return;
            }

            var msg = new ns.Massage(txt, true);

            msg.addEventListener("POST", _handlePost);
            historyList.push(msg);
        }

        function receive(txt) {
            var msg = txt ? new ns.Massage(txt + "。" + massageList.him[index], false)
                          : new ns.Massage(massageList.him[index], false);

            msg.addEventListener("POST", _handlePost);
            historyList.push(msg);
            that.fireEvent("receive", that, index);

            if (!!massageList.him[index + 1]) {
                ++index;
            } else {
                index = massageList.him.length - LOOP_INDEX;
            }
        }

        this.send        = send;
        this.massageList = massageList;
    }

    MassageManager.prototype = new ns.EventDispatcher();
    MassageManager.prototype.constructor = MassageManager;

    MassageManager.getInstance = function() {
        if (!instance) {
            instance = new MassageManager();
        }

        return instance;
    };

    ns.MassageManager = MassageManager;

})(this, document, $, App);
(function(win, doc, $, ns) {

    "use strict";

    var $stage = $("#global-stage"),
        $inner = $stage.find("#global-stage-inner");

    function Massage(txt, isMine) {
        if (!txt) {
            return;
        }

        var that  = this,
            klass = isMine ? "invisble msg mine" : "invisble msg",
            $msg  = $('<div class="' + klass + '"><p class="txt">' + txt + '</p></div>');

        _init();

        function _init() {
            ns.EventDispatcher.call(that);

            setTimeout(function() {
                that.fireEvent("POST", that, that, null);
            }, 100);

            setTimeout(function() {
                $msg.removeClass("invisble");
            }, 50);

            $inner.append($msg);
            $stage.animate({scrollTop: $inner.height()}, 200);
        }

        that.txt    = txt;
        that.target = isMine ? "mine" : "him";
    }

    Massage.prototype   = new ns.EventDispatcher();
    Massage.prototype.constructor = Massage;

    ns.Massage = Massage;

})(this, document, $, App);
(function(win, doc, $, ns) {

    "use strict";

    var messageManager = ns.MassageManager.getInstance(),
        $form = $("#global-footer-form"),
        $txt  = $("#global-footer-form-txt"),
        $btns = $("#sns-btns");;

    $form.on("submit", handleSubmit);
    $btns.on("click", handleClick);

    function handleSubmit() {
        messageManager.send($txt.val(), true);

        $txt.val("");

        return false;
    }

    function handleClick(evt) {
        var txt = messageManager.massageList.him[(Math.random() * messageManager.massageList.him.length) | 0];

        if ($(evt.target).hasClass("tw")) {
            win.open("https://twitter.com/share?text=" + txt + "&url=http%3A%2F%2Fnottoli%2Ekimizuka%2Efm");
        } else if ($(evt.target).hasClass("fb")) {
            FB.ui({
                method      : "feed",
                app_id      : "464784067039954",
                link        : "http://nottoli.kimizuka.fm",
                picture     : "http://nottoli.kimizuka.fm/img/ogp.png",
                name        : "NOTTOLI SIMULATOR",
                description : txt,
                caption     : "メッセージアプリののっとりを体験できます。"
            });
        }
    }

})(this, document, $, App);