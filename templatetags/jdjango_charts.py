'''
 jdjango_charts.py -
 @author jammers
 @date 2015-03-18
'''

import logging
logger = logging.getLogger(__name__)

from django.core.urlresolvers import reverse
from django import template
import random

register = template.Library()

@register.tag(name="jdjango_chart")
def do_jdjango_chart(parser, token):
    #try:
        ## split_contents() knows not to split quoted strings.
    ts = token.split_contents()
    return GoogleChartNode(ts[1::])



class GoogleChartNode(template.Node):
    def __init__(self,params):
        print params
        self.url = reverse(params[0])
        self.ctype = params[1]
        self.width = int(params[2])
        self.height= int(params[3])
        self.id = random.randint(1000,9999) #TODO some kind of unique ID please james :p

    def render(self,context):
        node = "<div id='%d'></div>" % self.id
        node += "<script>$(function(){make_chart('%s','%s',%d,%d,'%s');});</script>" % (self.url,self.ctype,self.width,self.height,self.id)
        return node
