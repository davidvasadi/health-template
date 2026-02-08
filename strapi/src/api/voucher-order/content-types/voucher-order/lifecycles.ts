const PREFIX = "UTALVANY";

function pad(num: number, size = 6) {
  return String(num).padStart(size, "0");
}

export default {
  async afterCreate(event: any) {
    const { result } = event;

    // ha már van, ne írjuk felül
    if (result?.reference_code) return;

    const year = new Date().getFullYear();
    const code = `${PREFIX}-${year}-${pad(result.id, 6)}`;

    await strapi.entityService.update("api::voucher-order.voucher-order", result.id, {
      data: { reference_code: code },
    });
  },
};
