export default (doc, req) => {
  if (doc && doc.title && doc.title.startsWith('C')) {
    return true
  }
  return false
}
