from django.shortcuts import render
from django.views.generic import View
import datetime
from django.http import HttpResponse,JsonResponse
from django.db.models import Count

strip_time = lambda x: datetime.datetime.strptime(x,'%Y-%m-%d').date()
format_day = lambda x: x.strftime('%Y-%m-%d')



class TimeSeriesView(View):
    '''Gets a simple time series query, override get_queries for your own TS queries'''


    def get_queries(self):
        ''' returns a list of all the queries that this stats will use for a graph
        [ (label1,ts_field,query1),(label2,ts_field,query2),(label3,ts_field,query3)]
        '''
        pass


    def get_ts_queries(self,start,end):
        '''adds the ts filtering and grouping onto the queries from get_queries'''
        queries = []

        #Set the column titles
        self.cols = []
        self.cols.append({'id': '', 'label': 'date', 'type': 'date'})
        for label,ts_field,base_query in self.get_queries():

            ts_filter = {ts_field+'__gte':start,
                         ts_field+'__lte':end}
            new_q = base_query.filter(**ts_filter).values(ts_field).annotate(count=Count('id')).order_by()

            self.cols.append({'id':'',
                              'label':label,
                              'type':'number',
                              })

            queries.append( (label,new_q) )


        return queries

    def create_rows(self,queries,s,e):
        '''Takes the set of queries and makes rows in the table based on the day'''
        results = []
        teachers = lambda queries: dict([ (t,0) for  t,q in queries])

        print teachers

        total_results = {}
        for t,q in queries:
            for r in q:
                date = r['date']
                if(date not in total_results):
                    total_results[date] = teachers(queries)
                total_results[date][t] = r['count']


        print total_results

        teachers = [t for t,q in queries]

        for d,counts in total_results.iteritems():
            v = []
            v.append( {'v':format_day(d),} )
            for t in teachers:
                v.append({'v':counts[t]})

            results.append( {'c': v})


        return results

    def queries_to_json(self,queries,s,e):
        ''' takes the executed TS queries and puts them into a format google can understand'''
        rows = self.create_rows(queries,s,e)
        return {
            "cols":self.cols,
            "rows":rows,
        }

    def get(self,request):

        s = strip_time(request.GET['s']) if 's' in request.GET else datetime.date.today()
        e = strip_time(request.GET['e']) if 'e' in request.GET else datetime.date.today()

        queries = self.get_ts_queries(s,e)
        results = self.queries_to_json(queries,s,e)

        return JsonResponse(results,safe=False)




