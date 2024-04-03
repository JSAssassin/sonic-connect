const filterData = ({data, allowedFields}) => {
  const filteredData = {};
  Object.keys(data).forEach(prop => {
    if (allowedFields.includes(prop)) {
      filteredData[prop] = data[prop]
    }
  })

  return filteredData;
}

export default filterData;
