const formatBirthday = (timestamp: number): string => {
  const date = new Date(timestamp);

  const year = date.getFullYear();

  let day = date.getDate().toString();
  let month = date.getMonth().toString();

  if (day.length === 1) {
    day = `0${day}`;
  }

  if (month.length === 1) {
    month = `0${month}`;
  }

  return `${day}.${month}.${year}`;
};

export default formatBirthday;
