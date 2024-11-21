export function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);

  newDate.setMonth(newDate.getMonth() + months);

  // Обработка случаев, когда дни могут не существовать в новом месяце
  // например, прибавление 1 месяца к 31 января даст 3 марта, поэтому корректировка
  if (newDate.getDate() < date.getDate()) {
    newDate.setDate(0);
  }

  return newDate;
}
