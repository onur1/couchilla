/* global log */

export default (newDoc, oldDoc, userCtx, secObj) => {
  log(newDoc)
  log(oldDoc)
  log(userCtx)
  log(secObj)
  throw { forbidden: 'not able now!' }
}
