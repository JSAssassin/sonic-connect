const asyncErrorHandller = (func) => (req, res, next) => {
  func(req, res, next).catch(e => next(e))
}

export default asyncErrorHandller;