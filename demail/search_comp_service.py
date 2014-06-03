import query_tool_backend as rq


def run(text="",fields='All'):

  try: 
    mapping = rq.search(text,fields)
    if mapping == None or len(mapping) < 1:
      return {}
    return mapping
  except Exception, e:
    print e
    return {}
  
  
