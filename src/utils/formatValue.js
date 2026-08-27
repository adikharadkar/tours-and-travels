const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return value;
};

export default formatValue;
