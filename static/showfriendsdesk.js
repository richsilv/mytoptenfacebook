$(function() {
    
	// Facilitate Facebook integration  
    window.fbAsyncInit = function() {
        FB.Canvas.setAutoGrow();
        };

    // Setup bottom bar and buttons thereon
    $("#buttonbar").find("button").button();

    // DELETE THIS?
    $('#edit').on("click", function() {
        window.location = "/make_songs/" + facebook_id + '/False';        
        });
        
    $('#home').on("click", function() {
        window.location = "/show_songs/" + user_id;        
        });

    // DELETE THIS?
    $('#jukebox').on("click", function() {
        window.location = "/jukebox/" + user_id;        
        });
     
    // Setup formatting when mouse hovers over friend button
    $(".friend").mouseenter(function() {
        $(this).addClass("ui-state-hover");
        }).mouseleave(function() {
            $(this).removeClass("ui-state-hover");
            });
    
    // Show friend's top ten on friend button click
    $(".friend").click(function() {
        $(this).addClass("ui-state-focus");
        window.location = "/show_songs/" + $(this).next("input").val();
        });

});