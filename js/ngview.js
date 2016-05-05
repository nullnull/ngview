(function() {
  var NovelGameView,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  NovelGameView = (function() {
    NovelGameView.prototype.pageClassName = "page_";

    function NovelGameView(viewId, layersId) {
      this.viewObj = $(viewId);
      this.currentPage = 0;
      this.bgImage = new NovelGameView.BGImage(layersId);
      this.sounds = new NovelGameView.Sounds();
      this._addPageClass();
      this.viewObj.click(((function(_this) {
        return function() {
          return _this.onClick();
        };
      })(this)));
    }

    NovelGameView.prototype.playPage = function() {
      var pageEl;
      console.log("playPage current_page:" + this.currentPage);
      pageEl = $("." + this.pageClassName + this.currentPage);
      pageEl.show();
      this.page = new NovelGameView.Page(pageEl, this.currentPage);
      this.page.play();
      if (this.page.isEndPage) {
        return this.onEndPage();
      }
    };

    NovelGameView.prototype.refresh = function() {
      var deferred;
      deferred = $.Deferred();
      if (this.page) {
        this.page.playEndAnimation().done((function(_this) {
          return function() {
            _this.viewObj.empty();
            _this.currentPage = 0;
            return deferred.resolve();
          };
        })(this));
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    };

    NovelGameView.prototype.loadAndPlayPage = function(data) {
      this.viewObj.append($(data));
      this._addPageClass();
      return this.playPage();
    };

    NovelGameView.prototype.onClick = function() {
      if (this.page.isStatusEnd()) {
        if (this.hasNextPage() && !this.isStatusPageRefreshing()) {
          this._setStatusPageRefreshing();
          return this.page.playEndAnimation().done((function(_this) {
            return function() {
              _this._playNextPage();
              return _this._setStatusNormal();
            };
          })(this));
        } else {

        }
      } else {
        this.page.play();
        if (this.page.isEndParagraph) {
          return this.onEndPageEndParagraph();
        }
      }
    };

    NovelGameView.prototype.hasNextPage = function() {
      return this.currentPage < this.maxPage;
    };

    NovelGameView.prototype.isEndPage = function() {
      return this.currentPage === this.maxPage;
    };

    NovelGameView.prototype.isStatusPageRefreshing = function() {
      return this.status === "refreshing";
    };

    NovelGameView.prototype._setStatusPageRefreshing = function() {
      return this.status = "refreshing";
    };

    NovelGameView.prototype._setStatusNormal = function() {
      return this.status = "normal";
    };

    NovelGameView.prototype._addPageClass = function() {
      var cnt, i, _i, _len, _ref;
      cnt = 0;
      _ref = this.viewObj.children();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        $(i).addClass(this.pageClassName + cnt);
        $(i).hide();
        cnt += 1;
      }
      return this.maxPage = cnt - 1;
    };

    NovelGameView.prototype._playNextPage = function() {
      var pageEl;
      pageEl = $("." + this.pageClassName + this.currentPage);
      pageEl.hide();
      this.currentPage++;
      return this.playPage();
    };

    NovelGameView.prototype.onEndPage = function() {};

    NovelGameView.prototype.onEndPageEndParagraph = function() {};

    return NovelGameView;

  })();

  window.NovelGameView = NovelGameView;

  NovelGameView.Page = (function() {
    Page.prototype.paragraphClassName = "paragraph";

    function Page(pageEl, pageIdx) {
      this.pageEl = pageEl;
      this.pageIdx = pageIdx;
      this.currentParagraph = -1;
      this.status = "wait";
      this._addParagraphClass();
    }

    Page.prototype.play = function() {
      if (this.isStatusWait()) {
        this.currentParagraph++;
        return this._playParagraph(this.currentParagraph);
      } else if (this.isStatusBusy()) {
        alert(this.status);
        if (this.isStatusPrint()) {
          return this._skipInAnimation(this.currentParagraph);
        } else {
          return console.log("busy and can not respond");
        }
      } else {
        return console.log("can not respond");
      }
    };

    Page.prototype.playEndAnimation = function() {
      var deferred;
      deferred = $.Deferred();
      NovelGameView.Common.fadeOutByCssTransition(this.pageEl.children(), 0.5);
      NovelGameView.Common.onTransitionEnd(this.pageEl).done((function(_this) {
        return function() {
          return deferred.resolve();
        };
      })(this));
      return deferred.promise();
    };

    Page.prototype.isEndParagraph = function() {
      return this.currentParagraph === this.maxParagraph;
    };

    Page.prototype.clearPageASeconds = function(duration, fadeDuration) {
      if (fadeDuration == null) {
        fadeDuration = 0.2;
      }
      console.log("clearing");
      NovelGameView.Common.fadeOutByCssTransition(this.pageEl, fadeDuration);
      return setTimeout((function(_this) {
        return function() {
          console.log("clearing end");
          return NovelGameView.Common.fadeInByCssTransition(_this.pageEl, fadeDuration);
        };
      })(this), duration * 1000);
    };

    Page.prototype.clearPage = function(fadeDuration) {
      if (fadeDuration == null) {
        fadeDuration = 0.2;
      }
      return NovelGameView.Common.fadeOutByCssTransition(this.pageEl, fadeDuration);
    };

    Page.prototype.showPage = function(fadeDuration) {
      if (fadeDuration == null) {
        fadeDuration = 0.2;
      }
      return NovelGameView.Common.fadeInByCssTransition(this.pageEl, fadeDuration);
    };

    Page.prototype._addParagraphClass = function() {
      var cnt, i, _i, _len, _ref;
      cnt = 0;
      _ref = this.pageEl.children();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        if (this._isNotParagraphTarget($(i))) {
          continue;
        }
        $(i).attr("id", this._getParagraphId(cnt));
        $(i).addClass(this.paragraphClassName);
        $(i).css({
          opacity: 0,
          "-webkit-animation-play-state": "paused",
          "animation-play-state": "paused"
        });
        cnt += 1;
      }
      return this.maxParagraph = cnt - 1;
    };

    Page.prototype._getParagraphId = function(paragraphIdx) {
      return this.paragraphClassName + (this.pageIdx + "_" + paragraphIdx);
    };

    Page.prototype._playParagraph = function(paragrahIdx) {
      var deferred, el, noStopParagraph;
      console.log("playParagraph current_paragraph:" + paragrahIdx);
      this.pageEl.find(".next-paragraph-glif").remove();
      el = this.pageEl.find("#" + this._getParagraphId(paragrahIdx));
      deferred = $.Deferred();
      this._triggerEventsWithPlayParagraph(el);
      noStopParagraph = false;
      if (this._isParagraphFunction(el)) {
        this._setStatusFunctionExecuting();
        this._execParagraphFunction(el, deferred);
        if (!el.data(NovelGameView.Conf.noStopParagraphDataName)) {
          noStopParagraph = true;
        }
        deferred.promise().done((function(_this) {
          return function() {
            return _this._setStatusWait();
          };
        })(this));
      } else if (this._isTextillateTarget(el)) {
        this._setStatusPrint();
        el.css({
          opacity: 100
        });
        el.on("inAnimationEnd.tlt", (function(_this) {
          return function() {
            _this._setStatusWait();
            deferred.resolve();
            if (_this.isStatusEnd()) {
              return _this._addNextPageGlif(el.children("span").children().last());
            } else if (_this.isStatusWait()) {
              return _this._addNextParagraphGlif(el.children("span").children().last());
            }
          };
        })(this));
        if (el.is(":empty")) {
          this._setStatusWait();
          deferred.resolve();
        } else {
          el.textillate({
            "in": {
              effect: 'fadeIn',
              delay: 10
            }
          });
        }
      } else if (this._isAnimationTarget(el)) {
        console.log("animation target");
        this._setStatusAnimating();
        el.css({
          opacity: 1,
          "-webkit-animation-play-state": "running",
          "animation-play-state": "running"
        });
        el = this._recreateElement(el);
        if (el.data(NovelGameView.Conf.noStopParagraphAsyncDataName)) {
          this._setStatusWait();
          deferred.resolve();
        } else {
          el.on("webkitAnimationEnd", (function(_this) {
            return function() {
              _this._setStatusWait();
              return deferred.resolve();
            };
          })(this));
        }
        if (!el.data(NovelGameView.Conf.noStopParagraphDataName)) {
          noStopParagraph = true;
        }
      } else {
        console.log("else target");
        fadeInByCssTransition(el, 0.5);
        this._setStatusWait();
        deferred.resolve();
      }
      if (noStopParagraph || el.data(NovelGameView.Conf.noStopParagraphDataName)) {
        return deferred.promise().done((function(_this) {
          return function() {
            _this._setStatusWait();
            return _this.play();
          };
        })(this));
      } else if (el.data(NovelGameView.Conf.noStopParagraphAsyncDataName)) {
        this._setStatusWait();
        return this.play();
      }
    };

    Page.prototype._isParagraphFunction = function(el) {
      var dataName, functionName, _ref;
      _ref = NovelGameView.Conf.paragraphFunctions;
      for (functionName in _ref) {
        dataName = _ref[functionName];
        if (el.data(dataName)) {
          return true;
        }
      }
      return false;
    };

    Page.prototype._execParagraphFunction = function(el, deferred) {
      var seconds;
      if (el.data(NovelGameView.Conf.paragraphFunctions.wait)) {
        seconds = el.data(NovelGameView.Conf.paragraphFunctions.wait);
        return setTimeout((function(_this) {
          return function() {
            _this._setStatusWait();
            return deferred.resolve();
          };
        })(this), seconds * 1000);
      }
    };

    Page.prototype._triggerEventsWithPlayParagraph = function(el) {
      var trigger, _i, _len, _ref, _results;
      _ref = NovelGameView.Conf.triggerEventsWithPlayParagraph;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        trigger = _ref[_i];
        _results.push(el.trigger(trigger));
      }
      return _results;
    };

    Page.prototype._addNextParagraphGlif = function(el) {
      return el.append("<span class='next-paragraph-glif' style='visibility:visible'></span>");
    };

    Page.prototype._addNextPageGlif = function(el) {
      return el.append("<span class='next-page-glif' style='visibility:visible'></span>");
    };

    Page.prototype._recreateElement = function(el) {
      var newone;
      newone = el.clone(true);
      el.before(newone);
      el.remove();
      return newone;
    };

    Page.prototype._isNotParagraphTarget = function(el) {
      var _ref;
      return _ref = el.prop("tagName"), __indexOf.call(NovelGameView.Conf.notParagraphTargetTags, _ref) >= 0;
    };

    Page.prototype._isTextillateTarget = function(el) {
      var _ref;
      return _ref = el.prop("tagName"), __indexOf.call(NovelGameView.Conf.TextillateTargetTags, _ref) >= 0;
    };

    Page.prototype._isAnimationTarget = function(el) {
      var _ref;
      return _ref = el.prop("tagName"), __indexOf.call(NovelGameView.Conf.ParagraphAnimationTargetTags, _ref) >= 0;
    };

    Page.prototype._skipInAnimation = function(paragrahIdx) {
      var el;
      console.log("_skipInAnimation");
      this._setStatusSkipping();
      el = this.pageEl.find("#" + this._getParagraphId(paragrahIdx));
      el.textillate("stop");
      el.textillate({
        "in": {
          effect: 'none',
          delay: 0
        }
      });
      el.textillate("start");
      return setTimeout((function(_this) {
        return function() {
          console.log("skip animation end");
          _this._setStatusWait();
          if (_this.isStatusEnd()) {
            return _this._addNextPageGlif(el.children("span").children().last());
          } else if (_this.isStatusWait()) {
            return _this._addNextParagraphGlif(el.children("span").children().last());
          } else {
            console.log("skipping else status");
            return console.log(_this.status);
          }
        };
      })(this), 10);
    };

    Page.prototype.isStatusPrint = function() {
      return this.status === "print";
    };

    Page.prototype.isStatusWait = function() {
      return this.status === "wait";
    };

    Page.prototype.isStatusEnd = function() {
      return this.status === "end";
    };

    Page.prototype.isStatusAnimating = function() {
      return this.status === "animating";
    };

    Page.prototype.isStatusExecuting = function() {
      return this.status === "executing";
    };

    Page.prototype.isStatusSkipping = function() {
      return this.status === "skipping";
    };

    Page.prototype.isStatusBusy = function() {
      return this.isStatusPrint() || this.isStatusAnimating() || this.isStatusExecuting() || this.isStatusSkipping();
    };

    Page.prototype._setStatusPrint = function() {
      return this.status = "print";
    };

    Page.prototype._setStatusWait = function() {
      if (this.currentParagraph === this.maxParagraph) {
        return this._setStatusEnd();
      } else {
        return this.status = "wait";
      }
    };

    Page.prototype._setStatusEnd = function() {
      return this.status = "end";
    };

    Page.prototype._setStatusAnimating = function() {
      return this.status = "animating";
    };

    Page.prototype._setStatusFunctionExecuting = function() {
      return this.status = "executing";
    };

    Page.prototype._setStatusSkipping = function() {
      return this.status = "skipping";
    };

    return Page;

  })();

  window.NovelGameView.Page = NovelGameView.Page;

  NovelGameView.BGImage = (function() {
    function BGImage(layersId) {
      var i, j, layerId, layerObj, subLayerId, _i, _j;
      this.layers = $(layersId);
      this.bgColor = "White";
      this.windowHeight = this.layers.css("height").slice(0, -2);
      this.windowWidth = this.layers.css("width").slice(0, -2);
      this.scrollAnimationCount = 0;
      this.layerElementMap = {};
      for (i = _i = 0; _i <= 10; i = ++_i) {
        layerId = "layer" + i;
        layerObj = $("<div>");
        layerObj.attr("id", layerId);
        layerObj.addClass("ngview_layer");
        this.layers.append(layerObj);
        this.layerElementMap[layerId] = this.layers.find("#" + layerId);
        for (j = _j = 1; _j <= 3; j = ++_j) {
          subLayerId = layerId + ("_sub" + j);
          layerObj = $("<div>");
          layerObj.attr("id", subLayerId);
          layerObj.addClass("ngview_layer");
          this.layers.append(layerObj);
          this.layerElementMap[subLayerId] = this.layers.find("#" + subLayerId);
        }
      }
    }

    BGImage.prototype.clearLayer = function(layer, param, delay) {
      var duration, el, targetImages;
      if (param == null) {
        param = {};
      }
      if (delay == null) {
        delay = 0;
      }
      el = this.layerElementMap[layer];
      duration = param.duration || 0;
      console.log(el);
      console.log($("#layer2"));
      targetImages = el.find("img");
      targetImages.addClass("removing");
      targetImages.css({
        opacity: 0
      });
      return setTimeout((function(_this) {
        return function() {
          console.log("clear layer");
          NovelGameView.Common.fadeOutByCssTransition(targetImages, duration);
          console.log(duration * 1000 + delay + 5000);
          return setTimeout(function() {
            console.log("remove");
            return el.children(".removing").remove();
          }, duration * 1000);
        };
      })(this), delay);
    };

    BGImage.prototype.addImage = function(layer, imgFilePath, param) {
      var cssParam, duration, el, imgObj;
      if (param == null) {
        param = {};
      }
      el = this.layerElementMap[layer];
      param.method || (param.method = "fade");
      cssParam = param.css || {};
      cssParam.opacity || (cssParam.opacity = "0");
      imgObj = $("<img>");
      imgObj.attr("src", imgFilePath);
      imgObj.addClass(param.className);
      imgObj.css(cssParam);
      el.append(imgObj);
      if (!imgObj.css({
        "position": "position"
      })) {
        imgObj.css({
          "position": "position",
          "absolute": "absolute"
        });
      }
      if (!imgObj.css({
        "top": "top"
      })) {
        imgObj.css({
          "top": "top",
          "0px": "0px"
        });
      }
      if (!imgObj.css({
        "left": "left"
      })) {
        imgObj.css({
          "left": "left",
          "0px": "0px"
        });
      }
      duration = param.duration || 0;
      if (param.method === "fade") {
        return setTimeout((function(_this) {
          return function() {
            return NovelGameView.Common.fadeInByCssTransition(imgObj, duration);
          };
        })(this), 10);
      } else {
        return imgObj.css({
          "opacity:1": "opacity:1"
        });
      }
    };

    BGImage.prototype.setBackgroundRGBA = function(layer, param) {
      var a, b, duration, el, g, r;
      if (param == null) {
        param = {};
      }
      el = this.layerElementMap[layer];
      param.method || (param.method = "fade");
      r = param.rgba[0] || 0;
      g = param.rgba[1] || 0;
      b = param.rgba[2] || 0;
      a = param.rgba[3] || 1;
      duration = param.duration || 0;
      el.css({
        "background-color": "rgba(" + r + "," + g + "," + b + ",0)",
        "transition-duration": "0s"
      });
      if (param.method === "fade") {
        return el.css({
          "background-color": "rgba(" + r + "," + g + "," + b + "," + a + ")",
          "transition-duration": duration + "s"
        });
      }
    };

    BGImage.prototype.fadeOutBgColor = function(layer, param) {
      var duration, el, rgba;
      if (param == null) {
        param = {};
      }
      el = this.layerElementMap[layer];
      rgba = this._getBackgroundRGBAFromElement(el);
      duration = param.duration || 0;
      return el.css({
        "background-color": "rgba(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + ",0)",
        "transition-duration": duration + "s"
      });
    };

    BGImage.prototype.crossFadeImage = function(layer, imgFilePath, param) {
      if (param == null) {
        param = {};
      }
      this.clearLayer(layer, param, param.duration * 1000);
      return this.addImage(layer, imgFilePath, param);
    };

    BGImage.prototype.blackOut = function(layer, param) {
      if (param == null) {
        param = {};
      }
      this.clearLayer(layer);
      param.rgba = [0, 0, 0, 1];
      return this.setBackgroundRGBA(layer, param);
    };

    BGImage.prototype.whiteOut = function(layer, param) {
      if (param == null) {
        param = {};
      }
      this.clearLayer(layer);
      param.rgba = [255, 255, 255, 1];
      return this.setBackgroundRGBA(layer, param);
    };

    BGImage.prototype.crossFadeWithScrollAnimation = function(layer, imgFilePath, param) {
      if (param == null) {
        param = {};
      }
      this.crossFadeImage(layer, imgFilePath, param);
      this._setFrame(layer, param);
      return setTimeout((function(_this) {
        return function() {
          return _this._scrollAnimation(layer, param);
        };
      })(this), 500);
    };

    BGImage.prototype._setFrame = function(layer, param) {
      var cssParam, el, elSub1, elSub2, frameSize, rgba;
      if (param == null) {
        param = {};
      }
      console.log("set Frame");
      frameSize = param["frameSize"];
      el = this.layerElementMap[layer];
      elSub1 = this.layerElementMap[layer + "_sub1"];
      elSub2 = this.layerElementMap[layer + "_sub2"];
      rgba = this._getBackgroundRGBAFromElement(el);
      rgba[3] = 1;
      cssParam = {
        "position": "absolute",
        "top": "0px",
        "bottom": "0px",
        "right": "0px",
        "left": "0px",
        "background-color": this._getRGBAStr(rgba)
      };
      if (param.direction === "up" || param.direction === "down") {
        elSub1.css(cssParam);
        elSub1.css({
          "bottom": "",
          "height": frameSize,
          "width": "100%"
        });
        elSub2.css(cssParam);
        return elSub2.css({
          "top": "",
          "height": frameSize,
          "width": "100%"
        });
      } else {
        elSub1.css(cssParam);
        elSub1.css({
          "right": "",
          "width": frameSize,
          "height": "100%"
        });
        elSub2.css(cssParam);
        return elSub2.css({
          "left": "",
          "width": frameSize,
          "height": "100%"
        });
      }
    };

    BGImage.prototype._scrollAnimation = function(layer, param) {
      var cssRulesLength, direction, el, ex, ey, frameSize, frameSizeHeight, frameSizeWidth, imageHeight, imageWidth, keyframes, scrollDuration, styleSheet, sx, sy;
      if (param == null) {
        param = {};
      }
      el = this.layerElementMap[layer];
      frameSize = param["frameSize"];
      direction = param["direction"];
      scrollDuration = param["scrollDuration"];
      imageHeight = el.find("img").last().css("height").slice(0, -2);
      imageWidth = el.find("img").last().css("width").slice(0, -2);
      frameSizeHeight = this._getPxByPercentage(frameSize, this.windowHeight);
      frameSizeWidth = this._getPxByPercentage(frameSize, this.windowWidth);
      sx = 0;
      sy = 0;
      ex = 0;
      ey = 0;
      if (direction === "down") {
        sy = frameSizeHeight;
        ey = -imageHeight + (this.windowHeight - frameSizeHeight);
      } else if (direction === "up") {
        ey = frameSizeHeight;
        sy = -imageHeight + (this.windowHeight - frameSizeHeight);
      } else if (direction === "left") {
        sx = frameSizeWidth;
        ex = -imageWidth + (this.windowWidth - frameSizeWidth);
      } else if (direction === "right") {
        ex = frameSizeWidth;
        sx = -imageWidth + (this.windowWidth - frameSizeWidth);
      }
      keyframes = ("@-webkit-keyframes scrollAnimation" + this.scrollAnimationCount + " { \n") + ("0%   {transform: translate(" + sx + "px, " + sy + "px);} \n") + ("100% {transform: translate(" + ex + "px, " + ey + "px);} \n") + "} \n";
      console.log(keyframes);
      styleSheet = document.styleSheets[0];
      cssRulesLength = styleSheet.cssRules ? styleSheet.cssRules.length : 0;
      styleSheet.insertRule(keyframes, cssRulesLength);
      el.find("img").css({
        "-webkit-animation": "scrollAnimation" + this.scrollAnimationCount + " " + scrollDuration + "s linear 0s 1"
      });
      this.scrollAnimationCount++;
      setTimeout(function() {
        return el.find("img").css({
          "transform": "translate(" + ex + "px, " + ey + "px)"
        });
      }, 100);
    };

    BGImage.prototype._getPxByPercentage = function(percentage, size) {
      if ((typeof percentage === "string") || (percentage.slice(-1) === "%")) {
        percentage = percentage.slice(0, -1);
      }
      console.log("percentage");
      console.log(percentage);
      percentage /= 100;
      console.log(percentage);
      return size * percentage;
    };

    BGImage.prototype._getSecondNotation = function(num) {
      if (!(typeof num === "string") || !(num.slice(-1) === "s")) {
        num += "s";
      }
      return num;
    };

    BGImage.prototype._getBackgroundRGBAFromElement = function(el) {
      var rgba, rgbaStr;
      rgbaStr = el.css("background-color");
      rgba = rgbaStr.replace(/rgba\(/, "").replace(/rgb\(/, "").replace(/\)/, "").split(",");
      while (rgba.length < 4) {
        rgba.push(0);
      }
      console.log("get rgba");
      console.log(rgba);
      return rgba;
    };

    BGImage.prototype._getRGBAStr = function(rgba) {
      return "rgba(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + "," + rgba[3] + ")";
    };

    return BGImage;

  })();

  window.NovelGameView.BGImage = NovelGameView.BGImage;

  NovelGameView.Sounds = (function() {
    function Sounds() {}

    Sounds.prototype.playBgm = function(src, fadeDuration) {
      var bgmStartDelay, sound;
      if (fadeDuration == null) {
        fadeDuration = 2.0;
      }
      this.deferred = $.Deferred();
      if (this.mute) {
        return this.deferred.resolve();
      } else {
        bgmStartDelay = 0;
        if (this.playingBgm) {
          if (this.playingBgm.urls()[0] === src) {
            this.deferred.resolve();
          } else {
            this.playingBgm.fade(1.0, 0.0, fadeDuration * 1000);
          }
        }
        sound = new Howl({
          urls: [src],
          buffer: true,
          loop: true
        });
        return setTimeout((function(_this) {
          return function() {
            _this.playingBgm = sound;
            return _this.playingBgm.play();
          };
        })(this), fadeDuration * 1000);
      }
    };

    Sounds.prototype.stopBgm = function(fadeDuration) {
      if (fadeDuration == null) {
        fadeDuration = 2.0;
      }
      if (this.playingBgm) {
        this.playingBgm.fade(1.0, 0.0, fadeDuration * 1000);
        return setTimeout((function(_this) {
          return function() {
            return _this.playingBgm = null;
          };
        })(this), fadeDuration * 1000);
      }
    };

    Sounds.prototype.playSe = function(src) {
      var sound;
      console.log("playSe");
      this.deferred = $.Deferred();
      if (this.mute) {
        console.log("playSe mute");
        return this.deferred.resolve();
      } else {
        console.log("playSe else");
        sound = new Howl({
          urls: [src],
          buffer: true,
          loop: false
        });
        sound.play();
        this.deferred.resolve();
        return console.log("playSe end");
      }
    };

    return Sounds;

  })();

  window.NovelGameView.Sounds = NovelGameView.Sounds;

  window.NovelGameView.Common = {
    fadeOutByCssTransition: function(el, duration) {
      console.log("fadeout ");
      console.log(el);
      console.log(el[0]);
      console.log(duration);
      el.css({
        "opacity": "0",
        "transition-duration": duration + "s"
      });
      return console.log(el);
    },
    fadeInByCssTransition: function(el, duration) {
      return el.css({
        "opacity": "1",
        "transition-duration": duration + "s"
      });
    },
    onTransitionEnd: function(el) {
      var deferred, listenEvents;
      deferred = $.Deferred();
      listenEvents = ['webkitTransitionEnd', 'oTransitionEnd', 'otransitionend', 'transitionend'];
      el.on(listenEvents.join(' '), (function(_this) {
        return function() {
          return deferred.resolve();
        };
      })(this));
      return deferred.promise();
    }
  };

  window.NovelGameView.Conf = {
    "noStopParagraphDataName": "ngv-no-stop-paragraph",
    "noStopParagraphAsyncDataName": "ngv-no-stop-paragraph-async",
    "triggerEventsWithPlayParagraph": ["dblclick"],
    "paragraphFunctions": {
      "wait": "ngv-wait-seconds"
    },
    "notParagraphTargetTags": ["BR"],
    "TextillateTargetTags": ["P", "SPAN"],
    "ParagraphAnimationTargetTags": ["IMG", "A"]
  };

}).call(this);
