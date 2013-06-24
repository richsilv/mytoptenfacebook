$(function() {

    // Setup home button
    $('#home').on("click", function() {
        window.location = "/show_songs_mob/" + user_id;        
        });
            
    // Show friend's top ten on friend button click
    $(".friend").click(function() {
        window.location = "/show_songs_mob/" + $(this).next("input").val();
        });

});