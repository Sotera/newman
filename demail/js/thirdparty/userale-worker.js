var logBuffer = [];
var loggingUrl = 'http://localhost:8080';
var intervalTime = 5000; //send every 5 seconds
var testing = false;
var echo = true;
var msg = 'USERALE: ';

// Register the interval timer to poll every intervalTime whether
// is data that is needed to be send to the server or not.
var timerId = setInterval(timerMethod, intervalTime);

/**
 * @brief Function which handles sending debug information to the web browser's
 * console.
 * @details Function which handles sending debug information to the web browser's
 * console. This allows for one line debugging which toggles between debugging or
 * not
 * 
 * @param msg Message to log to the console.
 */
function debug(user_msg)
{
    if(echo)
        console.log(msg + user_msg);
}

/**
 * @brief Timer Method to poll and check for new messages to send to the logging 
 * ELK server.
 * @details Timer Method to poll and check for new messages to send to the logging 
 * ELK server. The method will be fired after each intervalTime and attempts to send
 * any pending logs which may have been created by the user.
 */
function timerMethod() {
    // Check to see if there is anything within the global logBuffer. If there are any
    // new entries, attemp to send the data.
    if (logBuffer.length) {
        
        // If echo is enabled, echo debugging information to the console for developers
        // to debug their application and see if logs are being send to the logging 
        // server
        debug('Sent ' + logBuffer.length + ' logs to - ' + loggingUrl);
        
        // Check to see if the developer has set the module to be within testing mode. In
        // this mode, we are able to defer attempts at sending the logging request to 
        // the logging server and just drop the logs.
        if (testing)
            logBuffer = [];
        else
            XHR(loggingUrl + '/send_log', logBuffer, function(d) { logBuffer = []; });
    }  

    // If we don't have any logs to send to the server, just return 
    // back to the caller. There are no actions that need to be done
    // when it comes to logging.
    //else
    //{
    //    // If we have debugging enabled, send a debug message saying there
    //    // are no logs present to be sent to the logging server.
    //    debug('No log sent, buffer empty.');
    //}
}

/**
 * @brief Adding Event Listener for the Activity worker.
 * @details Adding event listener for the activity worker. This will allow
 * the activity logger to message the activity worker as it is running.
 */
self.addEventListener('message', 
    function(e) {
        var data = e.data;

        // Switch based on the command that was received by the message.
        switch (data.cmd) {
            // SetLoggingUrl: This allows the developer to change the location in which the 
            // logging is being stored to. This will allow for custom logging servers.
            case 'setLoggingUrl':
                loggingUrl = data.msg;
                break;

            // SendMsg command: This adds a new log to the log buffer which will be sent 
            // to the server. The worker pushes this log into the buffer and sits there until
            // the interval time, or a SendBuffer command forces the worker to send the logs.
            case 'sendMsg':
                logBuffer.push(data.msg);
                break;

            // SetTesting command: This sets the activity logger to a testing mode where
            // no logs are being send to the server. This will allow the developer to see
            // what is being logged without the attempt of sending the logs to the log 
            // server.
            case 'setTesting':
                if (data.msg) 
                    msg = 'USERALE: (TESTING) ';
                else 
                    msg = 'USERALE: ';
                
                testing = data.msg;
                break;

            // SetEcho command: This allows the developer to debug their application
            // by echoing debug messages of what is currently being logged by the
            // tool/application.
            case 'setEcho':
                echo = data.msg;
                break;
            
            // SendBuffer command forces the activity worker to send what is currently
            // in the log buffer. It is the same premise as a flush command where all 
            // the logs are getting flushed to the server.
            case 'sendBuffer':
                sendBuffer();
                break;
        }
    }, false);

/**
 * @brief Sends the logs to the logging server.
 * @details Sends the logs to the logging server. This is done by calling the
 * timerMethod() which is responsible for sending the logs to the server and 
 * updating the timer interval.
 */
function sendBuffer() {
    // method to force send the buffer
    timerMethod();
    if (echo) {
        console.log(msg + ' buffer sent');
    }
}

/**
 * @brief Connect and send logging information through XMLHttpRequest
 * @details Connect and send logging information through XMLHttpRequest. 
 * Function attempts to connect through different means of the 
 * XMLHttpRequest (xhr) object. Once the xhr object is created, the
 * logging data that has been buffered is sent to the server.
 * 
 * @param url The URL to connect and send the logging data to
 * @param log The logging information that is being sent to the server
 * @param callback Callback function to register when a response is 
 * received.
 */
function XHR(url, log, callback) {
    var xhr;

    if(typeof XMLHttpRequest !== 'undefined') 
        xhr = new XMLHttpRequest();
    else 
    {
        var versions = ["MSXML2.XmlHttp.5.0",
                        "MSXML2.XmlHttp.4.0",
                        "MSXML2.XmlHttp.3.0",
                        "MSXML2.XmlHttp.2.0",
                        "Microsoft.XmlHttp"];

         for(var i = 0, len = versions.length; i < len; i++) {
            try {
                xhr = new ActiveXObject(versions[i]);
                break;
            }
            catch(e){}
         } // end for
    }

    // Register the readiness function.
    xhr.onreadystatechange = ensureReadiness;

    // Create a readiness callback function to handle the changes within
    // the attempted request. Also, allows the program to handle the request,
    // if need be.
    function ensureReadiness() {
        // If we receive a response readiness that is not 
        // 4, then dismiss until we do.
        if(xhr.readyState < 4) {
            return;
        }

        // If we have a readiness of 4, but yet, we have an
        // invalid request, just return.
        // TODO: Log or handle this to inform the developer that
        // there are problems occurring?
        if(xhr.status !== 200) {
            return;
        }

        // If the readiness status is set to 4, and receieved
        // an "OK" from the server, call the register callback if one
        // exists
        // TODO: Check for null callback.
        if(xhr.readyState === 4) {
            callback(xhr);
        }
    }

    // Open and send the data to the logging server.
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(log));
}
