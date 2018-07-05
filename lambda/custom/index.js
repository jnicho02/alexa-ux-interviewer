/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core')
const skillBuilder = Alexa.SkillBuilders.custom()

exports.handler = skillBuilder
  .addRequestHandlers(
    require('./launch'),
    require('./chatter'),
    require('./help'),
    require('./cancelAndStop'),
    require('./endTheSession')
  )
  .addErrorHandlers(require('./handleAnError'))
  .lambda()
