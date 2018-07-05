// Test Flow - a multiple intent test script for Alexa Lambda code
// Launch from a Terminal Prompt.  Examples:
// node testflow
// node testflow staterequest

// Notice that slot values with spaces need to be encoded.
// Just insert %20 to replace any white spaces, such as in usstate=New%20York

// You can prompt the user to confirm, or type in, a slot value by adding
// a leading ? to your Intent

// Toggle on or off various debugging outputs
const options = {
  speechOutput: true,
  slots: true,
  attributes: true, // true, false, or a string with the name of an attribute
  stdout: false, // standard output  / console.log() in your code
  logRequestEvent: false, // show the full event JSON sent to your code
  logRequest: false, // show the request JSON sent to your code
  reprompt: false,
  delay: 1.0 // seconds between requests
};

var locale = 'en-GB';
var fs = require('fs');
var MyLambdaFunction = require('../index.js');
var appId = 'amzn1.ask.skill.4694b781-95b6-4dad-b5d8-003c9b6dd2a1';
var AWS = require('aws-sdk');
AWS.config.update({region:'eu-west-1'});

var MyDialog = './testing/default.txt';

if (process.argv[2]) {
  MyDialog = './testing/' + process.argv[2];
  if (!MyDialog.endsWith(".txt")) {
    MyDialog = MyDialog + ".txt";
  }
}

console.log();
console.log('================================================================================');
console.log('Running test sequence from dialog file : ', MyDialog);
console.log();

const OriginalConsoleLog = console.log;

var slotname = '';
var slotvalue = '';
var sa = {};
var current_line = 1;
var lineArray = [];
var Intent = '';
var prompt = false;

var context = {
  'succeed': function(data) {
    if (data.response.shouldEndSession) {
      sa = {};
    } else {
      sa = data.sessionAttributes;
    }
    if (typeof options.attributes == 'boolean') {
      if (options.attributes) {
        console.log = OriginalConsoleLog;
        console.log('\x1b[35m%s\x1b[0m ', JSON.stringify(sa, null, 2)); // for formatted JSON
      }
    } else { // you can define an attribute to display by setting options.attribute to a string, such as 'STATE'
      var printAttributeObject = {};
      console.log = OriginalConsoleLog;
      var printAttributeName = options.attributes.toString();
      var printAttribute = sa[printAttributeName];
      if (!printAttribute) {
        printAttribute = '';
      } else if (typeof printAttribute == 'object') {
        printAttributeObject = printAttribute;
      } else {
        printAttributeObject = JSON.parse('{"' + printAttributeName + '":"' + printAttribute + '"}');
      }
      console.log('\x1b[35m%s\x1b[0m ', JSON.stringify(printAttributeObject)); // , null, 2)); // for formatted JSON
    }

    var textToSay = data.response.outputSpeech.ssml;
    textToSay = textToSay.replace('<speak>', '    ');
    textToSay = textToSay.replace('</speak>', '');

    if (options.speechOutput) {
      console.log = OriginalConsoleLog;
      console.log('\x1b[36m%s\x1b[0m ', textToSay);
    }

    if (data.response.reprompt && data.response.reprompt.outputSpeech && data.response.reprompt.outputSpeech.ssml) {
      var textReprompt = data.response.reprompt.outputSpeech.ssml;
      textReprompt = textReprompt.replace('<speak>', '    ');
      textReprompt = textReprompt.replace('</speak>', '');
      if (options.reprompt) {
        console.log = OriginalConsoleLog;
        // console.log('%s \x1b[33m\x1b[1m%s\x1b[0m \x1b[2m%s\x1b[0m', currentLine+1, Intent, sdkState);
        console.log('\x1b[36m \x1b[2m%s\x1b[0m ', textReprompt);
      }
    }
    if (data.response.shouldEndSession) {
      // console.log('================ Session Ended');
    }
    // =====================
    if (current_line < lineArray.length) {
      // blocking pause
      var waitTill = new Date(new Date().getTime() + options.delay * 1000);
      while (waitTill > new Date()) {}
      console.log();
      runSingleTest(lineArray, current_line++, sa);
    } else {
      console.log('');
      process.exit();
    }
  },
  'fail': function(err) {
    console.log('context.fail occurred');
    console.log(JSON.stringify(err, null, '\t'));
  }
};

fs.readFile(MyDialog, function(err, data) { // open dialog sequence file and read Intents
  // var newSession = true;
  var request = {};
  lineArray = cleanArray(data.toString().split('\n')); // remove empty or comment lines (# or //)
  runSingleTest(lineArray, 0, {});
});

function runSingleTest(myLineArray, currentLine, sa) {
  // console.log('--------------------------------------------------------------------------------');
  // console.log('testing line ', currentLine);
  // console.log('testing line values ', myLineArray[currentLine]);

  prompt = false;
  var newSession = true;
  if (currentLine > 0) {
    newSession = false;
  }

  var tokenArray = myLineArray[currentLine].split(' ');

  if (tokenArray[0].replace('\r', '') == '?') { // pause and prompt the user to confirm
    prompt = true;
    // console.log(' ----------------- > prompt');
    tokenArray.shift(); // removes first item
  }

  var requestType = tokenArray[0].replace('\r', '');
  tokenArray.shift();

  if (requestType == 'stop') {
    console.log('');
    process.exit();
  }

  if (requestType == 'LaunchRequest') {
    request = {
      "type": requestType,
      "locale": locale
    };
    // console.log(' ========== %s. Request  \x1b[31m\x1b[1m%s\x1b[0m', currentLine+1, requestType);
    console.log('%s \x1b[31m\x1b[1m%s\x1b[0m', currentLine + 1, requestType);
    prepareTestRequest(sa, newSession, request);
  } else {
    Intent = requestType;
    slotArray = [];
    var sdkState = '';
    if (sa['STATE']) {
      sdkState = sa['STATE'];
    }
    console.log('%s \x1b[33m\x1b[1m%s\x1b[0m \x1b[2m%s\x1b[0m', currentLine + 1, Intent, sdkState);
    processArray(tokenArray, function(request) {
      prepareTestRequest(sa, newSession, request);
    });
  }
}

slotArray = [];

function processArray(arr, cb) {
  if (arr.length > 0) {
    var equalsPosition = arr[0].indexOf('=');
    slotname = arr[0].substr(0, equalsPosition);
    slotvalue = decodeURI(arr[0].substr(equalsPosition + 1, 300)).replace('\r', '');
    promptForSlot(prompt, slotname, slotvalue, (newValue) => {
      // console.log('slotname, slotvalue, newValue');
      // console.log(slotname, slotvalue, newValue);
      var answer = newValue.toString().trim();
      // console.log('answer = ' + answer);
      if (answer == '') {
        answer = slotvalue;
      }
      if (answer != '') {
        slotArray.push('"' + slotname + '": {"name":"' + slotname + '","value":"' + answer + '"}');
      }
      arr.shift();
      processArray(arr, cb); // RECURSION
    });
  } else { // nothing left in slot array
    var slotArrayString = '{' + slotArray.toString() + '}';
    var slotObj = JSON.parse(slotArrayString);
    var req = {
      "type": "IntentRequest",
      "intent": {
        "name": Intent,
        "slots": slotObj
      },
      "locale": locale
    };
    cb(req);
    // process.exit();
  }
}

function prepareTestRequest(sa, newSession, request) {
  var eventJSON = {
    "session": {
      "new": newSession,
      "sessionId": "SessionId.f9e6dcbb-b7da-4b47-905c.etc.etc",
      "application": {
        "applicationId": appId
      },
      "attributes": sa,
      "user": {
        "userId": "amzn1.ask.account.VO3PVTGF563MOPBY.etc.etc"
      }
    },
    request,
    "context": {
      "AudioPlayer": {
        "playerActivity": "IDLE"
      },
      "System": {
        "application": {
          "applicationId": appId
        },
        "user": {
          "userId": "amzn1.ask.account.VO3PVTGF563MOPBY.etc.etc"
        },
        "device": {
          "supportedInterfaces": {}
        }
      }
    },
    "version": "1.0"
  };

  if (options.logRequestEvent) {
    console.log(JSON.stringify(eventJSON, null, 2));
  }
  if (options.logRequest) {
    console.log(JSON.stringify(request, null, 2));
  }

  // blocking pause
  var waitTill = new Date(new Date().getTime() + options.delay * 1000);
  while (waitTill > new Date()) {}

  // call the function
  if (options.stdout) {
    MyLambdaFunction['handler'](eventJSON, context, callback);
  } else {
    //console.log('setting log to {}');
    console.log = function() {};
    //console.log('set log to {}');
    MyLambdaFunction['handler'](eventJSON, context, callback);
    console.log = OriginalConsoleLog;
  }
}

function promptForSlot(prompt, slotname, slotvalue, callback) {
  if (prompt) {
    process.stdout.write('\x1b[34m' + slotname + ' \x1b[0m\x1b[32m [' + slotvalue + ']\x1b[0m: ');
    // console.log('\x1b[34m%s :\x1b[0m\x1b[32m %s\x1b[0m ', slotname,  slotvalue  );
    process.stdin.once('data', function(data) {
      var answer = data.toString().trim();
      // console.log(answer);
      if (answer == '') {
        if (slotvalue == '') {
          // no default, user must type something
          console.error('Error: No default slot value defined, user must type a slot value.');
          process.exit();
        } else {
          answer = slotvalue;
        }
      }
      callback(answer);
    });
  } else {
    if (options.slots) {
      console.log('\x1b[34m%s :\x1b[0m\x1b[32m %s\x1b[0m ', slotname, slotvalue);
    }
    callback(slotvalue);
  }
}

function callback(error, data) {
  if (error) {
    console.log('error: ' + error);
  } else {
    console.log(data);
  }
};

function cleanArray(myArray) {
  var cleanedArray = [];
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i] != '' && myArray[i].substring(0, 1) != '#' && myArray[i].substring(0, 2) != '//') {
      cleanedArray.push(myArray[i]);
    }
  }
  return cleanedArray;
}
//
// const fontcolor = {
//     Reset = "\x1b[0m",
//     Bright = "\x1b[1m",
//     Dim = "\x1b[2m",
//     Underscore = "\x1b[4m",
//     Blink = "\x1b[5m",
//     Reverse = "\x1b[7m",
//     Hidden = "\x1b[8m",
//
//     FgBlack = "\x1b[30m",
//     FgRed = "\x1b[31m",
//     FgGreen = "\x1b[32m",
//     FgYellow = "\x1b[33m",
//     FgBlue = "\x1b[34m",
//     FgMagenta = "\x1b[35m",
//     FgCyan = "\x1b[36m",
//     FgWhite = "\x1b[37m",
//
//     BgBlack = "\x1b[40m",
//     BgRed = "\x1b[41m",
//     BgGreen = "\x1b[42m",
//     BgYellow = "\x1b[43m",
//     BgBlue = "\x1b[44m",
//     BgMagenta = "\x1b[45m",
//     BgCyan = "\x1b[46m",
//     BgWhite = "\x1b[47m"
// };