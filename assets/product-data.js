window.ActiveInventoryProducts = window.ActiveInventoryProducts || [];
window.ActiveInventoryProductBySlug = window.ActiveInventoryProducts.reduce(function (map, product) {
  if (product && product.slug) map[product.slug] = product;
  return map;
}, {});
window.ActiveInventoryAvailabilityStatus = {
  available: {
    productStatusTitle: 'Currently available',
    formIntent: 'Price Request',
    inventoryStatusTag: 'Inventory Status - Available',
    formButton: 'Get Today\'s Price',
    bannerClass: 'available'
  },
  pending: {
    productStatusTitle: 'Pending pickup - ask about similar models',
    formIntent: 'Backup Availability Request',
    inventoryStatusTag: 'Inventory Status - Pending',
    formButton: 'Ask About Similar Models',
    bannerClass: 'pending'
  },
  sold: {
    productStatusTitle: 'Recently sold - join the restock list',
    formIntent: 'Next Available Unit Request',
    inventoryStatusTag: 'Inventory Status - Sold',
    formButton: 'Join Restock List',
    bannerClass: 'sold'
  }
};
