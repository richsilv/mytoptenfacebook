# This is a work in progress. I use it in production and it works very well, but use at your own risk!

@initCJAX = () ->
  History = @History
  $ = @jQuery
  document = @document
  return false unless @History.enabled

  $ ->
    contentSelector = ".main"
    $content = $(contentSelector).filter(":first")
    contentNode = $content.get(0)
    $body = $(document.body)

    documentHtml = (html) ->
      result = String(html).replace(/<\!DOCTYPE[^>]*>/i, "").replace(/<(html|head|body|title|meta|script)([\s\>])/g, "<div class=\"document-$1\"$2").replace(/<\/(html|head|body|title|meta|script)\>/g, "</div>")
      result

    $.fn.ajaxify = ->
      if BrowserDetect? && (BrowserDetect.browser is "Explorer" && BrowserDetect.version <= 9) && Application.meta.appUrl?
        appUrl = Application.meta.appUrl
        appUrl = appUrl.replace(/\/$/, '')
        $(this).find('a.cjax, .cjax a').each (index, element) =>
          href = element.getAttribute('href')
          unless /https?\:\/\//.test(href)
            href = "/" + href unless /^\//.test(href)
            newHref = appUrl + href
            element.setAttribute 'href', newHref
            element.setAttribute 'target', '_top'
      else
        $(this).find("a.cjax, .cjax a").click (event) ->
          url = $(this).attr("href")
          title = $(this).attr("title") | console.log() | null
          return true  if event.which is 2 or event.metaKey
          History.pushState null, title, url
          event.preventDefault()
          false
        $(this)

    $body.ajaxify()

    $(window).bind "statechange", ->
      State       = History.getState()
      url         = State.url
      rootUrl     = History.getRootUrl()
      relativeUrl = url.replace(rootUrl, "")
      $body.addClass "loading"
      $content.animate {opacity: 0}, 200

      $.ajax
        url: url
        headers: { 'X-CJAX': true}
        success: (data, textStatus, jqXHR) ->
          $data = $(documentHtml(data))
          $dataBody = $data.find(".document-body:first")
          $dataContent = $dataBody.find(contentSelector).filter(":first")
          $scripts = $dataContent.find(".document-script")
          $scripts.detach()  if $scripts.length
          contentHtml = $dataContent.html() or $data.html()

          unless contentHtml
            # if something went wrong, fallback to regular redirect
            document.location.href = url
            return false

          $content.stop true, true
          $content.html(contentHtml).ajaxify().css("opacity", 100).show()
          document.title = $data.find(".document-title:first").text()

          try
            document.getElementsByTagName("title")[0].innerHTML = document.title.replace("<", "&lt;").replace(">", "&gt;").replace(" & ", " &amp; ")

          $scripts.each ->
            $script = $(this)
            scriptText = $script.text()
            scriptNode = document.createElement("script")
            scriptNode.text = scriptText
            contentNode.appendChild scriptNode

          if $body.scrollTo
            $body.scrollTo ".container", 400, easing: "swing"

          $body.removeClass "loading"

          # Google Analytics
          window.pageTracker._trackPageview relativeUrl  if window.pageTracker

          # Clicky
          window.clicky.log "/" + relativeUrl, document.title  if window.clicky

        error: (jqXHR, textStatus, errorThrown) ->
          # Fallback to a regular redirect
          document.location.href = url
          false
