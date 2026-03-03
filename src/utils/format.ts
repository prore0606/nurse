export const formatPrice = (price: number) =>
  new Intl.NumberFormat("ko-KR").format(price) + "원";
