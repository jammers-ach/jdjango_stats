google.load('visualization', '1', {'packages':['corechart']});


var ctypes = {};
var loaded =false;

/**
 * Make a list of chart types whenever possible
 */
function populateCtypes(){
    ctypes = {'ColumnChart':google.visualization.ColumnChart};
    loaded = true;
    $('.gchart').gchart('update_chart');
}
google.setOnLoadCallback(populateCtypes);


$.widget( "custom.gchart", {

    format:'YYYY-MM-DD',
    options:{
        start:moment().startOf('month'),
        end:moment().endOf('month'),
        title:'untitled chart',
    },


    _create:function(){


        this.chart_area = $('<div class="inner"></div>').appendTo(this.element);

        this.button_area = $('<div></div>').appendTo(this.element);
        this.element.addClass('gchart');
        this._add_buttons();

    },

    /*
     * Helper function to create and bind an individual button
     */
    _add_button:function(text,callback){
        var butt = $('<button></button>').html(text);
        this._on(butt,{'click':callback})
        return butt;
    },

    /**
     * Adds all the time changing buttons to this chart
     */
    _add_buttons:function(){
        var row1 = $('<div></div>').appendTo(this.button_area);
        var row2 = $('<div></div>').appendTo(this.button_area);

        row1.append(this._add_button('this week','view_this_week'));
        row1.append(this._add_button('this month','view_this_month'));
        row1.append(this._add_button('this year','view_this_year'));

        this.r1 = $('<input/>');
        this.r2 = $('<input/>');
        row2.append(this.r1).append(this.r2);
        row2.append(this._add_button('go','load_date_range'));
    },

    load_date_range:function(){
        this.options.start = moment(this.r1.val());
        this.options.end = moment(this.r2.val());
        this.update_chart();
    },

    view_this_week:function(){
        this.options.start = moment().startOf('week');
        this.options.end = moment().endOf('week');
        this.update_chart();
    },
    view_this_year:function(){
        this.options.start = moment().startOf('year');
        this.options.end = moment().endOf('year');
        this.update_chart();
    },

    view_this_month:function(){
        this.options.start = moment().startOf('month');
        this.options.end = moment().endOf('month');
        this.update_chart();
    },

    /**
     * subtitle just gives the date range
     */
    subtitle:function(){
        return  this._get_start() + ' to ' + this._get_end();
    },


    /**
     * End date in iso format
     */
    _get_end:function(){
        return this.options.end.format(this.format);
    },

    /**
     * Start date in iso format
     */
    _get_start:function(){
        return this.options.start.format(this.format);
    },

    update_chart:function(){
        var s = this._get_start();
        var e = this._get_end();
        var jsonData = $.ajax({
            url: this.options.url,
            dataType:"json",
            async: false,
            data:{s:s,e:e}
        }).responseText;

        options = {
            width:this.options.width,
            height:this.options.height,
            title:this.options.title +' - ' + this.subtitle(),
        };

        var data = new google.visualization.DataTable(jsonData);

        var chart = new ctypes[this.options.type](this.chart_area[0]);
        chart.draw(data,options);

    },

});

/**
 * Registers a new chart on the page
 *
 */
function register_chart(url,type,width,height,id){

    $('#' + id).gchart({url:url,type:type,width:width,height:height});

}

