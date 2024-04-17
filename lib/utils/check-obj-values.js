const areAllObjValuesUndefined = obj =>
  Object.values(obj).every(value => value === undefined)

export default areAllObjValuesUndefined;
