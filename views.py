from django.shortcuts import render
from django.views.generic import View
import datetime
from django.http import HttpResponse,JsonResponse
from django.db.models import Count,Sum

strip_time = lambda x: datetime.datetime.strptime(x,'%Y-%m-%d').date()
format_day = lambda x: "Date(%d,%d,%d,0,0,0)" %(x.year,x.month,x.day)

def unformat_date(d):
    d = d.replace('Date(','')
    d = d.split(',')
    return '%s-%s-%s' % (d[0],d[1],d[2])

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

            queries.append( (label,ts_field,new_q) )


        return queries

    def create_rows(self,queries,s,e):
        '''Takes the set of queries and makes rows in the table based on the day'''
        results = []
        teachers = lambda queries: dict([ (t,0) for  t,_,_ in queries])


        total_results = {}
        for t,ts_field,q in queries:
            for r in q:
                date = r[ts_field]
                if(date not in total_results):
                    total_results[date] = teachers(queries)
                total_results[date][t] = r['count']



        teachers = [t for t,_,_ in queries]

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

    def queries_to_excel(self,queries,s,e):
        rows = self.create_rows(queries,s,e)
        s = [ ','.join([col['label'] for col in self.cols]) ]
        make_date = lambda d: d if not d.startswith('Date') else unformat_date(d)
        for row in rows:
            s.append( ','.join([ make_date(unicode(x['v'])) for x in row['c']]))

        return '\n'.join(s)

    def get(self,request):

        s = strip_time(request.GET['s']) if 's' in request.GET else datetime.date.today() - datetime.timedelta(days=100)
        e = strip_time(request.GET['e']) if 'e' in request.GET else datetime.date.today()

        queries = self.get_ts_queries(s,e)

        if('xls' not in request.GET):
            results = self.queries_to_json(queries,s,e)
            return JsonResponse(results,safe=False)
        else:
            results = self.queries_to_excel(queries,s,e)
            response = HttpResponse(results,content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="stat.csv"'
            return response



class CountedDataView(TimeSeriesView):
    '''Like a time series view, but it counts all the fields into one'''

    def get_ts_queries(self,start,end):
        '''adds the ts filtering and grouping onto the queries from get_queries'''
        queries = []

        #Set the column titles
        self.cols = []
        self.cols.append({'id': '', 'label': 'date', 'type': 'date'})
        for label,ts_field,sum_field,base_query in self.get_queries():

            ts_filter = {ts_field+'__gte':start,
                         ts_field+'__lte':end}
            new_q = base_query.filter(**ts_filter).values(ts_field).annotate(count=Sum(sum_field)).order_by()

            self.cols.append({'id':'',
                              'label':label,
                              'type':'number',
                              })

            queries.append( (label,ts_field,new_q) )


        return queries

class SummedDataView(TimeSeriesView):
    '''Like a time series view, but it puts summs all the data for a peroid into a chart'''

    label = 'Objects'
    label2 = 'Count'

    def get_ts_queries(self,start,end):
        '''adds the ts filtering and grouping onto the queries from get_queries'''
        queries = []

        #Set the column titles
        self.cols = []
        self.cols.append({'id': '', 'label': self.label, 'type': 'string'})
        for label,ts_field,base_query in self.get_queries():

            ts_filter = {ts_field+'__gte':start,
                         ts_field+'__lte':end}
            new_q = base_query.filter(**ts_filter)

            queries.append( (label,ts_field,new_q) )

        self.cols.append({'id':'',
                          'label':self.label2,
                          'type':'number',
                          })

        return queries

    def create_rows(self,queries,s,e):
        '''Takes the set of queries and makes rows in the table based on the day'''
        results = []


        for t,ts_field,q in queries:
            row = []
            row.append({'v':t})
            row.append({'v':q.count()})
            results.append({'c':row})

        return results

