$(function() {
    
    doUpdate();
    doSetup();

});

function doUpdate() {
    $( "#accordion" ).accordion({
        heightStyle: "content",
        collapsible: true,
        active: ""
        });

    for (i=0; i<num_songs+2 ; i++) {
        $( "#"+i+"tabs" ).tabs({
            selected: -1,
            collapsible: true,
            active: ""
            });
        }
    $(".selector").hide();

    $( ".cancelchange" ).button();
    }

function doSetup() {
    $('#accordion').on("click", '.header .songtitleartist', function() { hideTitleArtist($(this).parent()) });
    $('#accordion').on("click", '.header .songentry form', function(e) {
        if (e.target === this) { showTitleArtist($(this).parents('.header')); }
        });
        
    $("#accordion").on("tabsbeforeactivate", ".panel .tabset", function(e, ui) {
        if (ui.newPanel.length) {
            panel = ui.newPanel;
            }
        else {
            panel = ui.oldPanel;
            }
        if ($(this).parent().prev().find('.songentry').is(":visible")) {
            songtitle = $(this).parent().prev().find('.titleentry').val();
            songartist = $(this).parent().prev().find('.artistentry').val();
            }
        else {
            songtitle = $(this).parent().prev().find('.currenttitle').val();
            songartist = $(this).parent().prev().find('.currentartist').val();
            }
        $.post('/get_selector/', {'songtitle': songtitle, 'songartist': songartist, 'provider': panel.attr("id").slice(-1)}, function(r) {
            panel.html(r)
            });
        });
        
    $("#accordion").on("change", ".panel .tabset .selector .songchoice .selectmenu", function() {
        var selection = $(this).val();
        var provider = parseInt($(this).parents(".selector").attr("id").slice(-1));
        var player = $(this).parents(".selector").find(".player");
        if (provider === 1) {
            var promise = scloudPlayer(selection);
            promise.success(function(result) {
                player.html(result.html);
                });
            }
        else {
            player.html(embedPlayer(selection, provider));                                
            }
        });
    }

function toggleTitleArtist(header) {
    header.children('.songtitleartist').toggle("slide", function() {
        $(this).siblings('.songentry').toggle("slide");
        });
    }
    
function showTitleArtist(header) {
    header.children('.songentry').hide("slide", function() {
        $(this).siblings('.songtitleartist').show("slide");
        });
    }
 
function hideTitleArtist(header) {
    header.children('.songtitleartist').hide("slide", function() {
        $(this).siblings('.songentry').show("slide");
        });
    }

function embedPlayer(l, provider) {
    switch(provider) {
        case 1:
            return 'Use <strong>scloudPlayer</strong> rather than <strong>embedPlayer</strong>';
        case 2:
            return '<iframe src="https://embed.spotify.com/?uri=' + l + '" width="290" height="200" frameborder="0" allowtransparency="true"></iframe>';
        case 3:
            return '<iframe class="youtube-player" type="text/html" width="290" height="200" src="http://www.youtube.com/embed/' + l + '" allowfullscreen frameborder="0"></iframe>';
        }
   }
        
function scloudPlayer(url) {
    return $.ajax({type: "GET",
        url: "http://soundcloud.com/oembed",
        data: {'url': url, 'format': 'json', maxwidth: 290, maxheight: 200, auto_play: true, show_comments: false},
        dataType: "json"
        });
    }    
    