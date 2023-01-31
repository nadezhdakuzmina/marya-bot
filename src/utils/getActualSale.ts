import type { Sale } from '@modules/users';

const getActualSale = (sales: Sale[]) => {
  const timestamp = Date.now();

  const newSales: Sale[] = [];
  let actual: Sale;

  sales.forEach((sale: Sale) => {
    if (
      !actual ||
      (sale.expires >= timestamp &&
        sale.value > actual.value &&
        sale.highPriority >= actual.highPriority)
    ) {
      sale.counter -= 1;
      actual = sale;
    }

    if (sale.expires > timestamp && sale.counter > 0) {
      newSales.push(sale);
    }
  });

  return {
    actual,
    sales: newSales,
  };
};

export default getActualSale;
