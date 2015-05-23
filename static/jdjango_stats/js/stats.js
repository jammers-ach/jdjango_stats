google.load('visualization', '1', {'packages':['corechart']});


var ctypes = {};
var loaded =false;

/**
 * Make a list of chart types whenever possible
 */
function populateCtypes(){
    ctypes['ColumnChart'] = google.visualization.ColumnChart;
    ctypes['PieChart'] = google.visualization.PieChart;

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
        show_sum_options:true,
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
        var butt = $('<button class="btn btn-default"></button>').html(text);
        this._on(butt,{'click':callback})
        return butt;
    },

    /**
     * Adds all the time changing buttons to this chart
     */
    _add_buttons:function(){
        this.button_area.addClass('btn-toolbar').attr('role','toolbar')
        var row1 = $('<div class="btn-group" role="group"></div>').appendTo(this.button_area);
        var row2 = $('<div></div>').appendTo(this.button_area).addClass('input-group');
        var row3 = $('<div></div>').appendTo(this.button_area).addClass('input-group');

        this.week_view = this._add_button(gettext('this week'),'view_this_week');
        this.month_view = this._add_button(gettext('this month'),'view_this_month');
        this.year_view = this._add_button(gettext('this year'),'view_this_year');

        row1.append(this.week_view);
        row1.append(this.month_view);
        row1.append(this.year_view);

        this.r1 = $('<input type="text" class="form-control"/>').attr('placeholder',gettext('from')).css('width','100px');
        this.r2 = $('<input type="text" class="form-control"/>').attr('placeholder',gettext('to')).css('width','100px');

        this.r1.datetimepicker({pickTime:false,format:this.format});
        this.r2.datetimepicker({pickTime:false,format:this.format});

        row2.append(this.r1).append(this.r2);
        //row2.append(this._add_button('go','load_date_range'));


        this._on(this.r2,{'change':'load_date_range'})
        this._on(this.r1,{'change':'load_date_range'})

        this.week_view.removeClass('active');
        this.month_view.addClass('active');
        this.year_view.removeClass('active');

        this.excel_link = $('<a class="btn btn-default" href="" target="_blank">'+gettext('Download in excel')+'</a>').appendTo(row3);

        if(this.options.show_sum_options && this.options.type != 'PieChart'){
            var days  = $('<label><input type="radio" name="sumopt" value="d" checked="checked">'+gettext('days')+'</label>');
            var months  = $('<label><input type="radio" name="sumopt" value="m">'+gettext('months')+'</label>');
            var weeks  = $('<label><input type="radio" name="sumopt" value="w">'+gettext('weeks')+'</label>');
            var f = $('<form></form>').css('display','inline-block').append(days).append(weeks).append(months).appendTo(row3);
            //var d = $('<div></div>').addClass('input-group').append(f).appendTo(row3);

            this._on(days,{'change':'update_chart'});
            this._on(months,{'change':'update_chart'});
            this._on(weeks,{'change':'update_chart'});
         }
    },

    load_date_range:function(){
        this.options.start = moment(this.r1.val());
        this.options.end = moment(this.r2.val());
        this.update_chart();

        this.week_view.removeClass('active');
        this.month_view.removeClass('active');
        this.year_view.removeClass('active');

    },

    view_this_week:function(){
        this.options.start = moment().startOf('week');
        this.options.end = moment().endOf('week');
        this.update_chart();

        this.week_view.addClass('active');
        this.month_view.removeClass('active');
        this.year_view.removeClass('active');
    },
    view_this_year:function(){
        this.options.start = moment().startOf('year');
        this.options.end = moment().endOf('year');
        this.update_chart();

        this.week_view.removeClass('active');
        this.month_view.removeClass('active');
        this.year_view.addClass('active');
    },

    view_this_month:function(){
        this.options.start = moment().startOf('month');
        this.options.end = moment().endOf('month');
        this.update_chart();

        this.week_view.removeClass('active');
        this.month_view.addClass('active');
        this.year_view.removeClass('active');

    },

    /**
     * subtitle just gives the date range
     */
    subtitle:function(){
        return  this._get_start() + ' - ' + this._get_end();
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
        var data = {s:s,e:e};

        if(this.options.show_sum_options){
            var sumopt = this.element.find('input:radio[name=sumopt]:checked');
            data['sumopt'] = sumopt.val();
        }


        var jsonData = $.ajax({
            url: this.options.url,
            dataType:"json",
            async: false,
            data:data
        }).responseText;

        options = {
            width:this.options.width,
            height:this.options.height,
            title:this.options.title +' - ' + this.subtitle(),
        };

        var data = new google.visualization.DataTable(jsonData);

        var chart = new ctypes[this.options.type](this.chart_area[0]);
        chart.draw(data,options);


        this.excel_link.attr('href',this.options.url + '?s=' + s + '&e=' + e + '&xls');

    },

});

/**
 * Registers a new chart on the page
 *
 */
function register_chart(url,type,width,height,id,title){

    $('#' + id).gchart({url:url,type:type,width:width,height:height,title:title});

}

