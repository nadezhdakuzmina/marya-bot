const renderList = (list: string[]): string => {
  return list.map((item, index) => `${index + 1}. ${item}`).join('\n');
};

export default renderList;
