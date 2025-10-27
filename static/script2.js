$(document).ready(function(){
    $.getJSON('/get-scores', {'nitems': 25}, function(data) {
        console.log(data);

        for(let i = 0; i < data.length; i++){
            console.log(data[i]);
            if(i >= 3){
                //this is everyone not in top 3
            }
            line = "<li>" + data[i][1] + "<span id=\'scoreTextAlign\'>" + data[i][0] + "</span></li>";
            $('#leaderboardNAMES').append(line);
        }
        //to put medals next to first place etc....
        //https://jsfiddle.net/5fd9c2pq/



    });
});