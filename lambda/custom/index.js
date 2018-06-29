/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core')

const Launch = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
  },
  handle(handlerInput) {
    const speechText = 'I am the big boss. Hello Jez.'

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse()
  },
};

const Chatter = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'ChatterIntent'
  },
  handle(handlerInput) {
    console.log(JSON.stringify(handlerInput))

    const questions = [
      'What is the first thing you do when you hire a bike?',
      'And then what do you do?',
      '<speak> \
        Okay, so you walk down, find a rack, pick up a bike, and set off. \
        <say-as interpret-as="interjection">ta da!</say-as>. \
      </speak>',
      'But didn\'t you have to join the service in the first place?',
      'And how did you find out about it?',
      'Okay. Thank you Jez. That is all for now'
    ]

    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
    if (!sessionAttributes.questionNumber) {
      sessionAttributes.questionNumber = 0
    }

    console.log(`question ${sessionAttributes.questionNumber + 1} of ${questions.length}`)
    const speechText = questions[sessionAttributes.questionNumber]
    console.log(speechText)

    sessionAttributes.questionNumber += 1

    if (sessionAttributes.questionNumber === questions.length){
      console.log('That is all')
      return handlerInput.responseBuilder
        .speak(speechText)
//        .reprompt(speechText)  don't wait for a reply
        .withSimpleCard('Hello World', speechText)
        .getResponse()
    } else {
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .withSimpleCard('Hello World', speechText)
        .getResponse()
    }
  },
}

const TakeACompliment = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'ComplimentIntent'
  },
  handle(handlerInput) {
    const speechText = 'Why, thank you.'

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse()
  },
}

const Help = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent'
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!'

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse()
  },
}

const CancelAndStop = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent')
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!'

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Goodbye!', speechText)
      .getResponse()
  },
}

const EndTheSession = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest'
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse()
  },
};

const HandleAnError = {
  canHandle() {
    return true
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`)

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse()
  },
}

const skillBuilder = Alexa.SkillBuilders.custom()

exports.handler = skillBuilder
  .addRequestHandlers(
    Launch,
    Chatter,
    TakeACompliment,
    Help,
    CancelAndStop,
    EndTheSession
  )
  .addErrorHandlers(HandleAnError)
  .lambda()
