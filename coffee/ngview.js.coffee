class ScriptToHTMLConverter
	html_config: {
		paragraph_start: "\t<span>",
		paragraph_end:   "</span><br>\n",
		page_start: '<div class="ngview_page font_white_with_pseudo_stroke page_bg_black">\n',  # TODO: ここのクラス指定を自由にできるようにする
		page_end:   "</div>",
	}

	convertSimpleFormat: (script) ->
		html_page_list = []
		script_per_page_list = script.split(/\n\n/)
		for script_per_page in script_per_page_list
			script_per_paragraph_list = script_per_page.split(/\n/)
			html_paragraph = @html_config.paragraph_start + script_per_paragraph_list.join(@html_config.paragraph_end + @html_config.paragraph_start) + @html_config.paragraph_end
			html_page = @html_config.page_start + html_paragraph + @html_config.page_end
			html_page_list.push(html_page)
		output_html = html_page_list.join("\n")
		console.log(output_html)
		return output_html

window.ScriptToHTMLConverter = ScriptToHTMLConverter  # これ必要なのだっけ？

class NovelGameView
    pageClassName: "page_"

    constructor: (viewId, layersId) ->
        @viewObj = $(viewId)
        @currentPage = 0
        @bgImage = new NovelGameView.BGImage(layersId)
        @sounds  = new NovelGameView.Sounds()
        @_addPageClass()
        @viewObj.click((=>@onClick()))

    playPage: ->
        console.log("playPage current_page:" + @currentPage)
        pageEl = $("." + @pageClassName + @currentPage)
        pageEl.show()
        @page = new NovelGameView.Page(pageEl, @currentPage)
        @page.play()
        if @page.isEndPage
            @onEndPage()

    refresh: ->
        deferred = $.Deferred()
        if @page
            @page.playEndAnimation().done =>
                @viewObj.empty()
                @currentPage = 0
                deferred.resolve()
        else
            deferred.resolve()
        return deferred.promise()

    loadScriptAndPlayPage: (script) ->
        converter = new ScriptToHTMLConverter
        html = converter.convertSimpleFormat(script)
        @loadAndPlayPage(html)

    loadAndPlayPage: (html) ->
        @viewObj.append($(html))
        @_addPageClass()
        @playPage()


    onClick: ->
        if @page.isStatusEnd()
            if @hasNextPage() && not @isStatusPageRefreshing()
                @_setStatusPageRefreshing()
                @page.playEndAnimation().done =>
                    @_playNextPage()
                    @_setStatusNormal()
            else
        else
            @page.play()
            if @page.isEndParagraph
                @onEndPageEndParagraph()

    hasNextPage: ->
        return @currentPage < @maxPage

    isEndPage: ->
        return @currentPage == @maxPage

    isStatusPageRefreshing: ->
        return @status == "refreshing"

    _setStatusPageRefreshing: ->
        @status = "refreshing"

    _setStatusNormal: ->
        @status = "normal"

    _addPageClass: ->
        cnt = 0
        for i in @viewObj.children()
            $(i).addClass(@pageClassName + cnt)
            $(i).hide()
            cnt += 1
        @maxPage = cnt-1

    _playNextPage: ->
        pageEl = $("." + @pageClassName + @currentPage)
        pageEl.hide()
        @currentPage++
        @playPage()

    onEndPage: ->

    onEndPageEndParagraph: ->

window.NovelGameView = NovelGameView







class NovelGameView.Page
    paragraphClassName:  "paragraph"

    constructor: (pageEl, pageIdx) ->
        @pageEl  = pageEl
        @pageIdx = pageIdx
        @currentParagraph = -1  # 今描画中or描画し終わってwait状態なパラグラフ
        @status = "wait"  # wait, print, end くらい？
        @_addParagraphClass()

    play: ->
        if @isStatusWait()  # 前のパラグラフの描画が終わっている状態
            @currentParagraph++
            @_playParagraph(@currentParagraph)
        else if @isStatusBusy()  # 描画中
            # alert(@status)
            if @isStatusPrint()
                @_skipInAnimation(@currentParagraph)
            else
                console.log("busy and can not respond")
        else
            console.log("can not respond")


    playEndAnimation: ->
        deferred = $.Deferred()
        NovelGameView.Common.fadeOutByCssTransition(@pageEl.children(), 0.5)
        NovelGameView.Common.onTransitionEnd(@pageEl).done =>
            deferred.resolve()
        return deferred.promise()

    isEndParagraph: ->
        @currentParagraph is @maxParagraph

    clearPageASeconds: (duration, fadeDuration = 0.2)->
        console.log("clearing")
        NovelGameView.Common.fadeOutByCssTransition(@pageEl, fadeDuration)
        setTimeout =>
            console.log("clearing end")
            NovelGameView.Common.fadeInByCssTransition(@pageEl, fadeDuration)
        , duration * 1000

    clearPage: (fadeDuration = 0.2)->
        NovelGameView.Common.fadeOutByCssTransition(@pageEl, fadeDuration)

    showPage: (fadeDuration = 0.2)->
        NovelGameView.Common.fadeInByCssTransition(@pageEl, fadeDuration)


    _addParagraphClass: ->
        cnt = 0
        for i in @pageEl.children()
            continue if @_isNotParagraphTarget($(i))
            $(i).attr("id", @_getParagraphId(cnt))
            $(i).addClass(@paragraphClassName)
            $(i).css({
                opacity: 0,
                "-webkit-animation-play-state": "paused",
                "animation-play-state": "paused",
            } )
            cnt += 1
        @maxParagraph = cnt-1

    _getParagraphId: (paragraphIdx) ->
        @paragraphClassName + "#{@pageIdx}_#{paragraphIdx}"

    _playParagraph: (paragrahIdx) ->
        console.log("playParagraph current_paragraph:" + paragrahIdx)
        @pageEl.find(".next-paragraph-glif").remove()
        el = @pageEl.find("#" + @_getParagraphId(paragrahIdx))
        deferred = $.Deferred()
        @_triggerEventsWithPlayParagraph(el)
        noStopParagraph = false
        if @_isParagraphFunction(el)
            @_setStatusFunctionExecuting()
            @_execParagraphFunction(el, deferred)
            noStopParagraph = true unless el.data(NovelGameView.Conf.noStopParagraphDataName)
            deferred.promise().done =>
                @_setStatusWait()
        else if @_isTextillateTarget(el)
            @_setStatusPrint()
            el.css({opacity: 100} )
            el.on("inAnimationEnd.tlt", =>
                @_setStatusWait()
                deferred.resolve()
                if @isStatusEnd()
                    @_addNextPageGlif(el.children("span").children().last())
                else if @isStatusWait()
                    @_addNextParagraphGlif(el.children("span").children().last())

            )
            if el.is(":empty")
                @_setStatusWait()
                deferred.resolve()
            else
                el.textillate({
                    in: {
                        effect: 'fadeIn',
                        delay: 10,
                    }
                })
        else if @_isAnimationTarget(el)
            console.log("animation target")
            @_setStatusAnimating()
            el.css({
                opacity: 1,
                "-webkit-animation-play-state": "running",
                "animation-play-state": "running",
            } )
            el = @_recreateElement(el)  # 再度cssアニメーションさせるために、要素を一旦削除してから追加

            if el.data(NovelGameView.Conf.noStopParagraphAsyncDataName)
                @_setStatusWait()
                deferred.resolve()
            else
                el.on("webkitAnimationEnd", =>
                    @_setStatusWait()
                    deferred.resolve()
                    # NOTE:
                    # animation-iteration-countにinfiniteを指定したときの1ループ終了時のイベントはanimationendではなくanimationiteration
                    # 2つ以上のアニメーションは登録できないので、in以外のanimationを動かしたければ、このresolveのタイミングで新規アニメーションクラスを付与する
                    # ***-after-animation とかなってるelには、このタイミングで***というクラス付与する、とかいうロジックでどうだろ。
                )
            noStopParagraph = true unless el.data(NovelGameView.Conf.noStopParagraphDataName)

        else
            console.log("else target")
            fadeInByCssTransition(el, 0.5)
            @_setStatusWait()
            deferred.resolve()

        if noStopParagraph || el.data(NovelGameView.Conf.noStopParagraphDataName)
            deferred.promise().done =>
                @_setStatusWait()
                @play()
        else if el.data(NovelGameView.Conf.noStopParagraphAsyncDataName)
            @_setStatusWait()
            @play()

    _isParagraphFunction: (el) ->
        for functionName, dataName of NovelGameView.Conf.paragraphFunctions
            return true if el.data(dataName)
        return false

    _execParagraphFunction: (el, deferred) ->
        if el.data(NovelGameView.Conf.paragraphFunctions.wait)
            seconds = el.data(NovelGameView.Conf.paragraphFunctions.wait)
            setTimeout =>
                @_setStatusWait()
                deferred.resolve()
            , seconds * 1000



    _triggerEventsWithPlayParagraph: (el) ->
        for trigger in NovelGameView.Conf.triggerEventsWithPlayParagraph
            el.trigger(trigger)

    _addNextParagraphGlif: (el) ->
        el.append("<span class='next-paragraph-glif' style='visibility:visible'></span>")

    _addNextPageGlif: (el) ->
        el.append("<span class='next-page-glif' style='visibility:visible'></span>")

    _recreateElement: (el) ->
        newone = el.clone(true)
        el.before(newone)
        el.remove()
        return newone

    _isNotParagraphTarget: (el) ->
        return el.prop("tagName") in NovelGameView.Conf.notParagraphTargetTags

    _isTextillateTarget: (el) ->
        return el.prop("tagName") in NovelGameView.Conf.TextillateTargetTags

    _isAnimationTarget: (el) ->
        return el.prop("tagName") in NovelGameView.Conf.ParagraphAnimationTargetTags

    _skipInAnimation: (paragrahIdx) ->
        console.log("_skipInAnimation")
        @_setStatusSkipping()
        el = @pageEl.find("#" + @_getParagraphId(paragrahIdx))
        el.textillate("stop")

        el.textillate({
            in: {
                effect: 'none',
                delay: 0,
            }
        })
        el.textillate("start")

        # el.on("inAnimationEnd.tlt", =>  # TODO:なぜかワークしないので応急処置（startの前においてもダメだった）
        setTimeout =>
            console.log("skip animation end")
            @_setStatusWait()
            if @isStatusEnd()
                @_addNextPageGlif(el.children("span").children().last())
            else if @isStatusWait()
                @_addNextParagraphGlif(el.children("span").children().last())
            else
                console.log("skipping else status")
                console.log(@status)
        , 10


    isStatusPrint: ->
        return @status is "print"

    isStatusWait: ->
        return @status is "wait"

    isStatusEnd: ->
        return @status is "end"

    isStatusAnimating: ->
        return @status is "animating"

    isStatusExecuting: ->
        return @status is "executing"

    isStatusSkipping: ->
        return @status is "skipping"

    isStatusBusy: ->
        return @isStatusPrint() || @isStatusAnimating() || @isStatusExecuting() || @isStatusSkipping()

    _setStatusPrint: ->
        @status = "print"

    _setStatusWait: ->
        if @currentParagraph is @maxParagraph
            @_setStatusEnd()
        else
            @status = "wait"

    _setStatusEnd: ->
        @status = "end"

    _setStatusAnimating: ->
        @status = "animating"

    _setStatusFunctionExecuting: ->
        @status = "executing"

    _setStatusSkipping: ->
        @status = "skipping"

window.NovelGameView.Page = NovelGameView.Page





class NovelGameView.BGImage
    constructor: (layersId) ->
        @layers = $(layersId)
        @bgColor = "White"
        @windowHeight = @layers.css("height").slice(0,-2)
        @windowWidth = @layers.css("width").slice(0,-2)
        @scrollAnimationCount = 0  # CSSを動的に生成していく

        # レイヤを作成する
        @layerElementMap = {}
        for i in [0..10]
            layerId = "layer#{i}"
            layerObj = $("<div>")
            layerObj.attr("id", layerId)
            layerObj.addClass("ngview_layer")
            @layers.append(layerObj)
            @layerElementMap[layerId] = @layers.find("#" + layerId)

            #レイヤに紐づくサブレイヤを作成する
            for j in [1..3]
                subLayerId = layerId + "_sub#{j}"
                layerObj = $("<div>")
                layerObj.attr("id", subLayerId)
                layerObj.addClass("ngview_layer")
                @layers.append(layerObj)
                @layerElementMap[subLayerId] = @layers.find("#" + subLayerId)


    ## 基本処理
    clearLayer: (layer, param = {}, delay = 0)->
        el = @layerElementMap[layer]
        duration = param.duration || 0
        console.log(el)
        console.log($("#layer2"))
        targetImages = el.find("img")
        targetImages.addClass("removing")
        targetImages.css({opacity:0})

        setTimeout =>
            console.log("clear layer")
            NovelGameView.Common.fadeOutByCssTransition(targetImages, duration)
            # 十分に時間がたったら削除。本当はtransitionend使いたいが若干挙動怪しい
            console.log(duration * 1000 + delay + 5000)
            setTimeout =>
                console.log("remove")
                el.children(".removing").remove()
            , duration * 1000
        , delay

    addImage: (layer, imgFilePath, param = {}) ->
        el = @layerElementMap[layer]
        param.method ||= "fade"  # デフォルトではfadeする
        cssParam = param.css or {}
        cssParam.opacity  or= "0"  # トランジション効果用に最初は0でセット

        # 新規追加する背景を追加
        imgObj = $("<img>")
        imgObj.attr("src", imgFilePath)
        imgObj.addClass(param.className)
        imgObj.css(cssParam)
        el.append(imgObj)

        # デフォルトcss
        imgObj.css({"position", "absolute"}) unless imgObj.css({"position"})
        imgObj.css({"top",  "0px"}) unless imgObj.css({"top"})
        imgObj.css({"left", "0px"}) unless imgObj.css({"left"})

        # methodの種類に応じてトランジション
        duration = param.duration || 0
        if param.method == "fade"
            setTimeout =>  # 直後すぎるとアニメーションしないため(?)
                NovelGameView.Common.fadeInByCssTransition(imgObj, duration)
            , 10
        else
            imgObj.css({"opacity:1"})

    setBackgroundRGBA: (layer, param = {}) ->
        el = @layerElementMap[layer]
        param.method ||= "fade"  # デフォルトではfadeする
        r = param.rgba[0] || 0
        g = param.rgba[1] || 0
        b = param.rgba[2] || 0
        a = param.rgba[3] || 1
        duration = param.duration || 0
        el.css({
            "background-color": "rgba(#{r},#{g},#{b},0)"
            "transition-duration": "0s",
        })
        if param.method == "fade"
            el.css({
                "background-color": "rgba(#{r},#{g},#{b},#{a})"
                "transition-duration": duration + "s"
            })
        # else  # 今のところfade以外特になし

    fadeOutBgColor: (layer, param = {}) ->
        el = @layerElementMap[layer]
        rgba = @_getBackgroundRGBAFromElement(el)
        duration = param.duration || 0
        el.css({
            "background-color": "rgba(#{rgba[0]},#{rgba[1]},#{rgba[2]},0)"
            "transition-duration": duration + "s"
        })


    ## 基本処理をラップした関数群
    crossFadeImage: (layer, imgFilePath, param = {})->
        @clearLayer(layer, param, param.duration * 1000)  # delayは、addImageが完全に終わってからレイヤを削除するため設定
        @addImage(layer, imgFilePath, param)

    blackOut: (layer, param = {})->
        @clearLayer(layer)
        param.rgba = [0,0,0,1]
        @setBackgroundRGBA(layer, param)

    whiteOut: (layer, param = {})->
        @clearLayer(layer)
        param.rgba = [255,255,255,1]
        @setBackgroundRGBA(layer, param)


    ## スクロールアニメーション
    crossFadeWithScrollAnimation: (layer, imgFilePath, param = {})->
        @crossFadeImage(layer, imgFilePath, param)
        @_setFrame(layer, param)
        setTimeout =>
            @_scrollAnimation(layer, param)
        , 500

    _setFrame: (layer, param = {}) ->
        console.log("set Frame")
        frameSize = param["frameSize"]
        el     = @layerElementMap[layer]
        elSub1 = @layerElementMap[layer + "_sub1"]
        elSub2 = @layerElementMap[layer + "_sub2"]
        rgba = @_getBackgroundRGBAFromElement(el)
        rgba[3] = 1
        cssParam = {
            "position": "absolute",
            "top": "0px",
            "bottom": "0px",
            "right": "0px",
            "left": "0px",
            "background-color": @_getRGBAStr(rgba),
            # "-webkit-filter": "blur(10px)",  # 一方向だけにblurかける方法がわからないのでひとまず保留
        }
        if param.direction == "up" || param.direction == "down"
            elSub1.css(cssParam)
            elSub1.css({
                "bottom": "",
                "height": frameSize,
                "width": "100%",
            })
            elSub2.css(cssParam)
            elSub2.css({
                "top": "",
                "height": frameSize,
                "width": "100%",
            })
        else
            elSub1.css(cssParam)
            elSub1.css({
                "right": "",
                "width": frameSize,
                "height": "100%",
            })
            elSub2.css(cssParam)
            elSub2.css({
                "left": "",
                "width": frameSize,
                "height": "100%",
            })

    _scrollAnimation: (layer, param = {})->
        el = @layerElementMap[layer]

        frameSize = param["frameSize"]
        direction = param["direction"]
        scrollDuration  = param["scrollDuration"]
        imageHeight = el.find("img").last().css("height").slice(0,-2)
        imageWidth  = el.find("img").last().css("width").slice(0,-2)
        frameSizeHeight = @_getPxByPercentage(frameSize, @windowHeight)
        frameSizeWidth = @_getPxByPercentage(frameSize, @windowWidth)

        # 開始時の左上座標、終了時の左上座標をそれぞれ求める
        # 上へ流れるような移動であれば、開始時がフレーム左上(フレームサイズ)、終了時が  - 画像サイズ(縦) + フレームサイズ + フレームを除いた画像サイズ
        # 左へ流れるような移動であれば、開始時がフレーム左上(フレームサイズ)、終了時が　- 画像サイズ(横) + フレームサイズ + フレームを除いた画像サイズ
        # ※ フレームサイズ + フレームを除いた画像サイズ = 全体サイズ - フレームサイズ
        sx = 0; sy = 0; ex = 0; ey = 0
        if direction == "down"
            sy = frameSizeHeight
            ey = -imageHeight + (@windowHeight - frameSizeHeight)
        else if direction == "up"
            ey = frameSizeHeight
            sy = -imageHeight + (@windowHeight - frameSizeHeight)
        else if direction == "left"
            sx = frameSizeWidth
            ex = -imageWidth + (@windowWidth - frameSizeWidth)
        else if direction == "right"
            ex = frameSizeWidth
            sx = -imageWidth + (@windowWidth - frameSizeWidth)

        # TODO: vender-prefix, アニメーション名も本当は変える必要
        keyframes =
            "@-webkit-keyframes scrollAnimation#{@scrollAnimationCount} { \n" +
                "0%   {transform: translate(#{sx}px, #{sy}px);} \n" +
                "100% {transform: translate(#{ex}px, #{ey}px);} \n" +
            "} \n"
        console.log(keyframes)
        styleSheet = document.styleSheets[0];
        cssRulesLength = if styleSheet.cssRules then styleSheet.cssRules.length else 0;
        styleSheet.insertRule(keyframes, cssRulesLength);

        el.find("img").css({
            "-webkit-animation": "scrollAnimation#{@scrollAnimationCount} #{scrollDuration}s linear 0s 1",
        })
        @scrollAnimationCount++

        # かなりバッドノウハウな気がするが、、少し待ってからtransform要素を追加しないと、transformアニメーションが動作しない。
        setTimeout ->
            el.find("img").css({"transform": "translate(#{ex}px, #{ey}px)"})
        , 100

        return


    # もろもろ便利関数
    _getPxByPercentage:(percentage, size) ->
        percentage = percentage.slice(0,-1) if (typeof percentage is "string") || (percentage.slice(-1) is "%")  # %を削除
        console.log("percentage")
        console.log(percentage)
        percentage /= 100
        console.log(percentage)
        return size * percentage

    _getSecondNotation: (num) ->
        num += "s" if not (typeof num is "string") || not (num.slice(-1) is "s")
        return num

    _getBackgroundRGBAFromElement: (el) ->
        rgbaStr = el.css("background-color")
        rgba = rgbaStr.replace(/rgba\(/, "").replace(/rgb\(/, "").replace(/\)/,"").split(",")
        while rgba.length < 4
            rgba.push(0)
        console.log("get rgba")
        console.log(rgba)
        return rgba

    _getRGBAStr: (rgba) ->
        return "rgba(#{rgba[0]},#{rgba[1]},#{rgba[2]},#{rgba[3]})"



window.NovelGameView.BGImage = NovelGameView.BGImage


class NovelGameView.Sounds
    playBgm: (src, fadeDuration = 2.0)->
        @deferred = $.Deferred()
        if @mute
            @deferred.resolve()
        else
            bgmStartDelay = 0
            if @playingBgm
                if @playingBgm.urls()[0] == src
                    # 何もしない
                    @deferred.resolve()
                else
                    # 前の曲をfadeoutさせてから曲を流す # TODO: そもそもフェード中であれば、途中からfade
                    @playingBgm.fade(1.0, 0.0, fadeDuration * 1000)  # ミリセカンド
            sound = new Howl({
                urls: [src],
                buffer: true,
                loop: true,
            })
            setTimeout =>
                @playingBgm = sound
                @playingBgm.play()
            , fadeDuration * 1000

    stopBgm: (fadeDuration = 2.0)->
        if @playingBgm
            @playingBgm.fade(1.0, 0.0, fadeDuration * 1000)  # ミリセカンド
            setTimeout =>
                @playingBgm = null
            , fadeDuration * 1000

    playSe: (src)->
        console.log("playSe")
        @deferred = $.Deferred()
        if @mute
            console.log("playSe mute")
            @deferred.resolve()
        else
            console.log("playSe else")
            sound = new Howl({
                urls: [src],
                buffer: true,
                loop: false,
            })
            sound.play()
            @deferred.resolve()
            console.log("playSe end")

window.NovelGameView.Sounds = NovelGameView.Sounds





window.NovelGameView.Common = {
    fadeOutByCssTransition: (el, duration) ->
        console.log("fadeout ")
        console.log(el)
        console.log(el[0])
        console.log(duration)
        el.css({
            "opacity": "0",
            "transition-duration": duration + "s",
        })
        console.log(el)

    fadeInByCssTransition: (el, duration) ->
        el.css({
            "opacity": "1",
            "transition-duration": duration + "s",
        })

    onTransitionEnd: (el) ->
        deferred = $.Deferred()
        listenEvents = [
            'webkitTransitionEnd',
            'oTransitionEnd',
            'otransitionend',
            'transitionend'
        ]
        el.on(listenEvents.join(' '), =>
            deferred.resolve()
        )
        return deferred.promise()
}


window.NovelGameView.Conf = {
    # データ属性で以下の値を指定すると、所定の動作を行う
    "noStopParagraphDataName": "ngv-no-stop-paragraph",  # クリックを待たずに次のパラグラフへいく
    "noStopParagraphAsyncDataName": "ngv-no-stop-paragraph-async",  # アニメーションの終了もクリックも待たずに次のパラグラフへいく
    "triggerEventsWithPlayParagraph" : ["dblclick"],  # ここで指定したイベントがパラグラフの再生時に発火する
    "paragraphFunctions": {
        "wait": "ngv-wait-seconds",
    },
    "notParagraphTargetTags": ["BR"],
    "TextillateTargetTags": ["P", "SPAN"],
    "ParagraphAnimationTargetTags": ["IMG", "A"],
}
