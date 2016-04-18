var socket = io();

$(document).ready(function(){

$('#quote-like').click(function () {
    //console.log(quoteId);
    //console.log(playlistId);
    socket.emit('likeQuote', $('#quote-id').text());
    $('#quote-like,#quote-unlike').toggle();
});

$('#quote-unlike').click(function () {
    socket.emit('unlikeQuote', $('#quote-id').text());
    $('#quote-like,#quote-unlike').toggle();
});

socket.on('updataQuoteLikesAmout', function(likes) {
    $('#quote-likes').text(likes);
});

$('#quote-next').click(function () {
    socket.emit('nextQuote', $('#quote-id').text());
});

$('#quote-read-unread').click(function () {
    $("#quote-read-unread").toggleClass('active');
    $('#content').removeClass('transparent');
    $('#read').toggle();
    $('#playlist').hide();

    var el = $("#quote-read-unread i");
    el.toggleClass("fa-play-circle-o");
    el.toggleClass("fa-ban");

});


socket.on('displayNewQuote', function(newQuote) {
    $('#quote-id').text(newQuote._id);
    $('#quote-author').text(newQuote.author);
    $('#quote-content').text(newQuote.content);
    $('#quote-likes').text(newQuote.likes);
    $('#quote-date').text(newQuote.date);

    if (newQuote.liked) {
        $('#quote-unlike').show();                        
        $('#quote-like').hide();                        
    } else {
        $('#quote-unlike').hide();                        
        $('#quote-like').show();                                                
    }
});

// login manager

    /*
var email,pass;
$("#submit").click(function(){
    email=$("#email").val();
    pass=$("#password").val();
    * Perform some validation here.
    
    $.post("http://localhost:8080/login",{email:email,pass:pass},function(data){       
        if(data==='done')          
        {
            window.location.href="/admin";
        }
    });
});
    */

});