module.exports = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'ChatterIntent'
  },
  handle(handlerInput) {
    // console.log(JSON.stringify(handlerInput))

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
