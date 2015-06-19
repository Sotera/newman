ACTIVITIES = [
  'ADD',
  'REMOVE',
  'CREATE',
  'DELETE',
  'SELECT',
  'DESELECT',
  'ENTER',
  'LEAVE',
  'INSPECT',
  'ALTER',
  'HIDE',
  'SHOW',
  'OPEN',
  'CLOSE'
  'PERFORM'
]

ELEMENTS = [
  'BUTTON'
  'CANVAS'
  'CHECKBOX'
  'COMBOBOX'
  'DATAGRID'
  'DIALOG_BOX'
  'DROPDOWNLIST'
  'FRAME'
  'ICON'
  'INFOBAR'
  'LABEL'
  'LINK'
  'LISTBOX'
  'LISTITEM'
  'MAP'
  'MENU'
  'MODALWINDOW'
  'PALETTEWINDOW'
  'PANEL'
  'PROGRESSBAR'
  'RADIOBUTTON'
  'SLIDER'
  'SPINNER'
  'STATUSBAR'
  'TAB'
  'TABLE'
  'TAG'
  'TEXTBOX'
  'THROBBER'
  'TOAST'
  'TOOLBAR'
  'TOOLTIP'
  'TREEVIEW'
  'WINDOW'
  'WORKSPACE'
# Other is used in conjunction with softwareMetadata in order
# to provide a element in which is not currently listed within
# the element list.
  'OTHER'
]

extend = (objects...) ->
  out = {}
  for object in objects
    for key, value of object
      out[key] = value
  return out

getParameterByName = (name) ->
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]")
  regex = new RegExp("[\\?&]" + name + "=([^&#]*)")

  results = regex.exec(location.search)
  results = if results then decodeURIComponent(results[1].replace(/\+/g, " ")) else ""

defaults = {
  loggingUrl: ''
  toolName: 'UNK'
  toolVersion: 'UNK'
  workerUrl: 'userale-worker.js'
  debug: true
  sendLogs: true
  elementGroups: []
}

default_msg = {
  activity: '',
  action: '',
  elementId: '',
  elementType: '',
  elementGroup: '',
  elementSub: '',
  source: '',
  tags: []
  meta: {}
}

setCookie = (cname, cvalue, exdays) ->
  d = new Date()
  d.setTime(d.getTime() + (exdays*24*60*60*1000))
  expires = "expires="+d.toUTCString()
  document.cookie = cname + "=" + cvalue + "; " + expires

getCookie = (name) ->
  nameEQ = name + "="
  ca = document.cookie.split(";")
  i = 0
  while i < ca.length
    c = ca[i]
    c = c.substring(1, c.length)  while c.charAt(0) is " "
    return c.substring(nameEQ.length, c.length).replace(/"/g, '')  if c.indexOf(nameEQ) is 0
    i++
  ""

class userale
  constructor: (options)->
    @options = extend(defaults, options)

    if @options.elementGroups.constructor is not Array
      @options.elementGroups = [@options.elementGroups]

    @options.version = '3.0.1'

    @worker = new Worker(@options.workerUrl)

    @worker.postMessage({
      cmd: 'setLoggingUrl',
      msg: @options.loggingUrl
    });

    @debug(@options.debug)
    @sendLogs(@options.sendLogs)

  register: () ->
    if getParameterByName('USID')
      @options.sessionID = getParameterByName('USID')
      setCookie('USID', @options.sessionID, 2)
      console.info('USERALE: SESSION ID FOUND IN URL - ' + @options.sessionID)
    else if getCookie('USID')
      @options.sessionID = getCookie('USID')
      console.info('USERALE: SESSION ID FOUND IN COOKIE - ' + @options.sessionID)
    else
      @options.sessionID = @options.toolName[0..2].toUpperCase() + new Date().getTime()
      setCookie('USID', @options.sessionID, 2)
      console.warn('USERALE: NO SESSION ID, MAKING ONE UP.  You can pass one in as url parameter (127.0.0.1?USID=12345)')

    if getParameterByName('client')
      @options.client = getParameterByName('client')
      setCookie('USERALECLIENT', @options.client, 2)
      console.info('USERALE: CLIENT FOUND IN URL - ' + @options.client)
    else if getCookie('USERALECLIENT')
      @options.client = getCookie('USERALECLIENT')
      console.info('USERALE: CLIENT FOUND IN COOKIE - ' + @options.client)
    else
      @options.client = 'UNK'
      setCookie('USERALECLIENT', @options.client, 2)
      console.warn('USERALE: NO CLIENT, MAKING ONE UP.   You can pass one in as url parameter (127.0.0.1?client=roger)')


    @worker.postMessage({cmd: 'sendBuffer', msg: ''})

    window.onload = =>
      msg = {
        activity: 'show'
        action: 'onload'
        elementId: 'window'
        elementType: 'window'
        elementGroup: 'top'
        source: 'user',
      }
      @log(msg)

    window.onbeforeunload = =>
      msg = {
        activity: 'hide'
        action: 'onbeforeunload'
        elementId: 'window'
        elementType: 'window'
        elementGroup: 'top'
        source: 'user',
      }
      @log(msg)

    window.onfocus = =>
      msg = {
        activity: 'show'
        action: 'onfocus'
        elementId: 'window'
        elementType: 'window'
        elementGroup: 'top'
        source: 'user',
      }
      @log(msg)

    window.onblur = =>
      msg = {
        activity: 'hide'
        action: 'onblur'
        elementId: 'window'
        elementType: 'window'
        elementGroup: 'top'
        source: 'user',
      }
      @log(msg)


  log: (msg) ->
    msg = extend(default_msg, msg)
    for key, value of msg
      if key is 'elementType'
        value = value.toUpperCase()
        if value not in ELEMENTS
          console.warn("USERALE: Unrecognized element - #{ value }")
        else if (value is 'OTHER') and !msg.meta.element?
          console.warn("USERALE: Element type set to 'other', but 'element' not set in meta object ")
        msg.elementType = msg.elementType.toUpperCase()

      if key is 'elementGroup'
        if (value is not 'top') and (value not in @options.elementGroups)
          console.warn("#{ value } is NOT in element groups")

      if key is 'activity'
        activities = (x.toUpperCase() for x in value.split('_'))
        for activity in activities
          if activity not in ACTIVITIES
            console.warn("USERALE: Unrecognized activity - #{ activity }")

        msg[key] = activities

      if key is 'source'
        value = value.toUpperCase()
        if value not in ['USER', 'SYSTEM', 'UNK']
          console.warn("USERALE: Unrecognized source - #{ value }")
          msg[key] = null
        else
          msg[key] = value.toUpperCase()

    msg.timestamp = new Date().toJSON()
    msg.client = @options.client
    msg.toolName = @options.toolName
    msg.toolVersion = @options.toolVersion
    msg.sessionID = @options.sessionID
    msg.language = 'JavaScript'
    msg.useraleVersion = @options.version

    @.worker.postMessage({
      cmd: 'sendMsg',
      msg: msg
    })

  debug: (onOff) ->
    @options.debug = onOff
    @worker.postMessage({
      cmd: 'setEcho',
      msg: onOff
    });

  sendLogs: (onOff) ->
    @options.sendLogs = onOff
    @worker.postMessage({
      cmd: 'setTesting',
      msg: !onOff
    });

#  // Log the activity when the user gains focus on the web browser
#  // window. In order to do this, we register an onFocus callback function
#  // which will log the gained focus of the element.
#window.onfocus = function() {
#draperLog.logUserActivity(
#  'window gained focus',
#  'window_focus',
#  draperLog.WF_OTHER
#);
#  };
#
#  // Log the activity when the user leaves focus on the web browser
#  // window. In order to do this, we register an onBlur callback function
#  // which will log the lost focus
#  window.onblur = function() {
#  draperLog.logUserActivity(
#    'window lost focus',
#    'window_blur',
#    draperLog.WF_OTHER
#  );
#  };
this.userale = userale
