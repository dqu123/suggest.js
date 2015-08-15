from django.db import models
from YourApp.models import *

def get_suggestion_dict(unallowed=['UndesiredModel'):
    """Creates a suggestion dictionary for suggest.js.

    Args
      unallowed -- List of unallowed models, can set default value.

    Return
      A suggestion dictionary in the form:
      {field.verbose_name: 
          {'value': field.name, 
           'help_text': field.help_text} ... }
    """
    # Models
    model_list= list( models.get_models(YourApp.models) )

    # remove Models from model_list that don't apply
    model_list = [x for x in model_list if x.__name__ not in unallowed ]
    
    suggest_dict = {}

    for model in model_list:
        for field in model._meta.local_fields:
            # Put whatever if condition is desired.
            if (model.pk != field.name and 
                field.get_internal_type() is not 'ForeignKey'):
                suggest_dict[field.verbose_name] = {'value': field.name,
                                            'help_text': field.help_text}
    
    return suggest_dict
