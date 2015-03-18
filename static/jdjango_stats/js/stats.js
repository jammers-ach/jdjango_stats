google.load('visualization', '1', {'packages':['corechart']});

var ctypes = {};
var loaded =false;
google.setOnLoadCallback(populateCtypes);


function populateCtypes(){
    ctypes = {'ColumnChart':google.visualization.ColumnChart};
    loaded = true;
}



function make_chart(url,type,width,height,id){

    if(!loaded){
        setTimeout(function(){ make_chart(url,type,width,height,id); }, 300);
    }else{

        var jsonData = $.ajax({
            url: url,
            dataType:"json",
            async: false
        }).responseText;

        options = {width:width,height:height};

        var data = new google.visualization.DataTable(jsonData);

        var chart = new ctypes[type](document.getElementById(id));
        chart.draw(data,options);

    }
}

