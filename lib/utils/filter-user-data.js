const filterUserData = data => {
  const filteredData = {};
  const allowedFields = ['name', 'photo'];

  Object.keys(data).forEach(prop => {
    if (allowedFields.includes(prop)) {
      filteredData[prop] = data[prop]
    }
  })

  return filteredData;
}

export default filterUserData;
